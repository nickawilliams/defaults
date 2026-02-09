#!/usr/bin/env bun

import ejs from 'ejs'
import fs from 'fs'
import path from 'path'

// Get command line arguments
const configDir = process.argv[2]
const inputDir = process.argv[3] || './template'
const outputDir = process.argv[4] || './output'

// Validate arguments
if (!configDir) {
  console.error('Error: Please provide a directory containing config.json')
  console.error('Usage: ./generate.ts <config_dir> <input_dir> <output_dir>')
  process.exit(1)
}

// Construct the path to config.json
const configFilePath = path.join(configDir, 'config.json')

// Load data from config.json file
let data: Record<string, unknown>
try {
  if (!fs.existsSync(configFilePath)) {
    console.error(`Error: config.json not found in ${configDir}`)
    process.exit(1)
  }
  data = JSON.parse(fs.readFileSync(configFilePath, 'utf8'))
} catch (error) {
  if (error instanceof Error) {
    console.error(`Error reading or parsing data file: ${error.message}`)
  } else {
    console.error('Error reading or parsing data file')
  }
  process.exit(1)
}

fs.mkdirSync(outputDir, { recursive: true })

// Function to process all files in a directory recursively
function processDirectory(
  dirPath: string,
  baseInputDir: string,
  baseOutputDir: string,
) {
  // Check if directory exists, if not create it or return
  if (!fs.existsSync(dirPath)) {
    console.log(`Creating directory: ${dirPath}`)
    fs.mkdirSync(dirPath, { recursive: true })
    return // No files to process in a newly created directory
  }

  const items = fs.readdirSync(dirPath)

  items.forEach(item => {
    const inputPath = path.join(dirPath, item)
    const stats = fs.statSync(inputPath)

    // Get relative path from input base directory
    const relativePath = path.relative(baseInputDir, inputPath)

    if (stats.isDirectory()) {
      // Process subdirectory recursively
      const outputSubDir = path.join(baseOutputDir, relativePath)
      fs.mkdirSync(outputSubDir, { recursive: true })
      processDirectory(inputPath, baseInputDir, baseOutputDir)
    } else if (stats.isFile()) {
      // Determine output path - remove .ejs extension if present
      const outputPath = path.join(
        baseOutputDir,
        item.endsWith('.ejs') ? relativePath.slice(0, -4) : relativePath,
      )

      // Process file based on extension
      if (item.endsWith('.ejs')) {
        // Process EJS template
        ejs.renderFile(
          inputPath,
          data,
          {
            escape: function (text) {
              return text
            },
          },
          (err, str) => {
            if (err) {
              console.error(`Error rendering ${relativePath}:`, err)
            } else {
              // Ensure output directory exists
              const outputDir = path.dirname(outputPath)
              fs.mkdirSync(outputDir, { recursive: true })

              // Write rendered content
              fs.writeFileSync(outputPath, str)
              console.log(`Rendered ${relativePath} → ${outputPath}`)
            }
          },
        )
      } else {
        // Copy file directly
        // Ensure output directory exists
        const outputDir = path.dirname(outputPath)
        fs.mkdirSync(outputDir, { recursive: true })

        // Copy the file
        fs.copyFileSync(inputPath, outputPath)
        console.log(`Copied ${relativePath} → ${outputPath}`)
      }
    }
  })
}

// Start processing from the input directory
processDirectory(inputDir, inputDir, outputDir)

// Generate icon using icon.ts script
import { spawn } from 'child_process'
const iconScript = path.join(__dirname, 'icon.ts')

// Check if icon data is available in the config
if (
  data &&
  typeof data === 'object' &&
  'icon' in data &&
  typeof data['icon'] === 'object' &&
  data['icon'] &&
  'background' in data['icon'] &&
  Array.isArray(data['icon']['background']) &&
  data['icon']['background'].length >= 2
) {
  const iconBackground = data['icon']['background']
  const glyphPath = path.join(configDir, 'glyph.svg')
  const iconOutputPath = path.join(outputDir, 'icon.png')

  // Check if glyph.svg exists
  if (fs.existsSync(glyphPath)) {
    console.log('Generating icon...')

    // Construct the command to run icon.ts with Bun instead of Node
    const iconProcess = spawn('bun', [
      iconScript,
      iconBackground[0],
      iconBackground[1],
      glyphPath,
      iconOutputPath,
    ])

    // Handle process output
    iconProcess.stdout.on('data', (data: Buffer) => {
      console.log(`icon.ts: ${data.toString().trim()}`)
    })

    iconProcess.stderr.on('data', (data: Buffer) => {
      console.error(`icon.ts error: ${data.toString().trim()}`)
    })

    iconProcess.on('close', (code: number) => {
      if (code === 0) {
        console.log(`Icon generated successfully: ${iconOutputPath}`)
      } else {
        console.error(`Icon generation failed with code ${code}`)
      }
    })
  } else {
    console.log(`Skipping icon generation: glyph.svg not found in ${configDir}`)
  }
} else {
  console.log(
    'Skipping icon generation: icon background colors not found in config.json',
  )
}

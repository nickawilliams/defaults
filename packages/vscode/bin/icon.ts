#!/usr/bin/env bun

import { createCanvas, loadImage } from 'canvas'
import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

/**
 * Run a sharp operation in a separate process
 * @param operation - The operation to run
 * @param args - The arguments for the operation
 * @returns A promise that resolves when the operation is complete
 */
async function runSharpOperation(
  operation: string,
  ...args: string[]
): Promise<void> {
  return new Promise((resolve, reject) => {
    // Get the path to the sharp.ts script
    const sharpScript = path.join(__dirname, 'sharp.ts')

    // Spawn a new process to run the sharp operation
    const childProcess = spawn('bun', [sharpScript, operation, ...args])

    let stderrData = ''

    childProcess.stdout.on('data', data => {
      // Log stdout for debugging
      console.log(data.toString().trim())
    })

    childProcess.stderr.on('data', data => {
      stderrData += data.toString()
    })

    childProcess.on('close', code => {
      if (code === 0) {
        resolve()
      } else {
        reject(
          new Error(`Sharp operation failed with code ${code}: ${stderrData}`),
        )
      }
    })
  })
}

// Define the size of the icon
const SIZE = 512

/**
 * Generate a gradient icon with the specified colors
 *
 * @param startColor - Hex color for gradient start (top-left)
 * @param endColor - Hex color for gradient end (bottom-right)
 * @param svgPath - Optional path to an SVG file to use as a glyph
 * @param outputPath - Path to save the generated icon
 * @param text - Optional text to display in the white bar
 */
async function generateGradientIcon(
  startColor: string,
  endColor: string,
  svgPath: string | null = null,
  outputPath: string = 'icon.png',
  text: string | null = null,
): Promise<void> {
  // Create a canvas with alpha channel support
  const canvas = createCanvas(SIZE, SIZE)
  const ctx = canvas.getContext('2d')

  // Clear the canvas to transparent
  ctx.clearRect(0, 0, SIZE, SIZE)

  // Define corner radius for the entire icon
  const cornerRadius = Math.round(SIZE / 32) // 32px corner radius

  // Draw rounded rectangle path for the gradient background
  ctx.beginPath()
  ctx.moveTo(cornerRadius, 0)
  ctx.lineTo(SIZE - cornerRadius, 0)
  ctx.quadraticCurveTo(SIZE, 0, SIZE, cornerRadius)
  ctx.lineTo(SIZE, SIZE - cornerRadius)
  ctx.quadraticCurveTo(SIZE, SIZE, SIZE - cornerRadius, SIZE)
  ctx.lineTo(cornerRadius, SIZE)
  ctx.quadraticCurveTo(0, SIZE, 0, SIZE - cornerRadius)
  ctx.lineTo(0, cornerRadius)
  ctx.quadraticCurveTo(0, 0, cornerRadius, 0)
  ctx.closePath()

  // Create a gradient (45 degrees - top left to bottom right)
  const gradient = ctx.createLinearGradient(0, 0, SIZE, SIZE)
  gradient.addColorStop(0, startColor)
  gradient.addColorStop(1, endColor)

  // Fill the rounded rectangle with the gradient
  ctx.fillStyle = gradient
  ctx.fill()

  // Add white bar at the bottom (107 pixels height)
  const whiteBarHeight = 107
  ctx.fillStyle = '#FFFFFF'

  // Draw the white bar with rounded corners at the bottom
  ctx.beginPath()
  // Start at the left edge of the white bar
  ctx.moveTo(0, SIZE - whiteBarHeight)
  // Draw top line to right edge
  ctx.lineTo(SIZE, SIZE - whiteBarHeight)
  // Draw right line down to bottom-right corner radius start
  ctx.lineTo(SIZE, SIZE - cornerRadius)
  // Draw bottom-right rounded corner
  ctx.quadraticCurveTo(SIZE, SIZE, SIZE - cornerRadius, SIZE)
  // Draw bottom line to bottom-left corner
  ctx.lineTo(cornerRadius, SIZE)
  // Draw bottom-left rounded corner
  ctx.quadraticCurveTo(0, SIZE, 0, SIZE - cornerRadius)
  // Draw left line back up to starting point
  ctx.lineTo(0, SIZE - whiteBarHeight)
  ctx.closePath()
  ctx.fill()

  // Add drop shadow at the top edge of the white bar
  const shadowHeight = 10
  const shadowY = SIZE - whiteBarHeight
  const shadowGradient = ctx.createLinearGradient(
    0,
    shadowY - shadowHeight,
    0,
    shadowY,
  )
  shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
  shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)')

  ctx.fillStyle = shadowGradient

  // Draw shadow across the full width of the image
  ctx.beginPath()
  ctx.moveTo(0, shadowY - shadowHeight)
  ctx.lineTo(SIZE, shadowY - shadowHeight)
  ctx.lineTo(SIZE, shadowY)
  ctx.lineTo(0, shadowY)
  ctx.closePath()
  ctx.fill()

  // Add text to the white bar (default to "DEFAULTS" if none provided)
  const displayText = text || 'DEFAULTS'

  // Add letter spacing by inserting spaces between characters
  const spacedText = displayText.split('').join(' ')

  // Set font properties for the text
  const fontSize = Math.floor(whiteBarHeight * 0.5) // 50% of white bar height (increased from 40%)
  ctx.font = `bold ${fontSize}px sans-serif`
  ctx.fillStyle = '#333333' // Dark gray text
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // Position text in the center of the white bar
  const textX = SIZE / 2
  const textY = SIZE - whiteBarHeight / 2

  // Draw the text
  ctx.fillText(spacedText, textX, textY)

  // Ensure output directory exists (equivalent to mkdir -p)
  const outputDir = path.dirname(outputPath)
  try {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }
  } catch (error) {
    console.error(
      `Error creating output directory: ${error instanceof Error ? error.message : String(error)}`,
    )
  }

  // Create temp directory if it doesn't exist
  const tempDir = path.join(outputDir, 'temp')
  try {
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }
  } catch (error) {
    console.error(
      `Error creating temp directory: ${error instanceof Error ? error.message : String(error)}`,
    )
  }

  // Add SVG glyph if provided
  if (svgPath) {
    try {
      // Calculate gradient area (total height minus white bar)
      const gradientHeight = SIZE - whiteBarHeight

      // Calculate padding (10% of gradient area)
      const padding = Math.floor(gradientHeight * 0.1)

      // Calculate available area for the glyph
      const availableWidth = SIZE - padding * 2
      const availableHeight = gradientHeight - padding * 2

      // Read the SVG file
      const svgContent = fs.readFileSync(svgPath, 'utf8')

      // Create a modified SVG with forced white fill and stroke
      const whiteSvgContent = svgContent
        .replace(/<svg/i, '<svg fill="white" stroke="white"')
        .replace(/fill="[^"]*"/gi, 'fill="white"')
        .replace(/stroke="[^"]*"/gi, 'stroke="white"')

      // Write the modified SVG to a temporary file
      const tempSvgPath = path.join(tempDir, '_temp_white.svg')
      fs.writeFileSync(tempSvgPath, whiteSvgContent)

      // Convert the white SVG to PNG using the sharp module
      const tempPngPath = path.join(tempDir, '_temp_white.png')
      await runSharpOperation(
        'processSvg',
        tempSvgPath,
        tempPngPath,
        String(availableWidth),
        String(availableHeight),
      )

      // Read the processed image back as a buffer
      const whiteSvgBuffer = fs.readFileSync(tempPngPath)

      // Clean up the temporary white SVG file
      try {
        fs.unlinkSync(tempSvgPath)
      } catch {
        // Ignore cleanup errors
      }

      // Get dimensions of the processed SVG by loading it as an image
      const tempImg = await loadImage(tempPngPath)
      const svgWidth = tempImg.width || 1
      const svgHeight = tempImg.height || 1

      // Scale down if height exceeds available height
      let finalWidth = svgWidth
      let finalHeight = svgHeight
      if (svgHeight > availableHeight) {
        const scale = availableHeight / svgHeight
        finalWidth = Math.floor(svgWidth * scale)
        finalHeight = availableHeight
      }

      // Calculate position to center the glyph in the gradient area
      const x = Math.floor((SIZE - finalWidth) / 2)
      const y = Math.floor((gradientHeight - finalHeight) / 2)

      // Create a temporary file for the white SVG
      const tempWhiteSvgPath = path.join(tempDir, '_temp_white_glyph.png')
      const tempBufferPath = path.join(tempDir, '_temp_buffer.png')
      fs.writeFileSync(tempBufferPath, whiteSvgBuffer)

      // Use sharp module to resize the image
      await runSharpOperation(
        'resize',
        tempBufferPath,
        tempWhiteSvgPath,
        String(finalWidth),
        String(finalHeight),
        'contain',
      )

      // Create a new canvas for the glyph with drop shadow
      const glyphCanvas = createCanvas(SIZE, SIZE)
      const glyphCtx = glyphCanvas.getContext('2d')

      // Set shadow properties for drop shadow effect
      glyphCtx.shadowColor = 'rgba(0, 0, 0, 1)'
      glyphCtx.shadowBlur = 20
      glyphCtx.shadowOffsetX = 0
      glyphCtx.shadowOffsetY = 0

      // Load and draw the white SVG with shadow
      const whiteSvgImg = await loadImage(tempWhiteSvgPath)
      glyphCtx.drawImage(whiteSvgImg, x, y, finalWidth, finalHeight)

      // Clean up the temporary file
      try {
        fs.unlinkSync(tempWhiteSvgPath)
      } catch {
        // Ignore cleanup errors
      }

      // Composite the glyph onto the main canvas
      const glyphBuffer = glyphCanvas.toBuffer('image/png')
      const mainBuffer = canvas.toBuffer('image/png')

      // Use sharp module to composite the images
      const mainBufferPath = path.join(tempDir, '_temp_main.png')
      const glyphBufferPath = path.join(tempDir, '_temp_glyph.png')

      // Save buffers to temporary files
      fs.writeFileSync(mainBufferPath, mainBuffer)
      fs.writeFileSync(glyphBufferPath, glyphBuffer)

      // Use sharp module to composite the images
      await runSharpOperation(
        'composite',
        mainBufferPath,
        glyphBufferPath,
        outputPath,
      )
    } catch (error) {
      console.error(
        `Error processing SVG: ${error instanceof Error ? error.message : String(error)}`,
      )
      // If SVG processing fails, save the image without the glyph
      const buffer = canvas.toBuffer('image/png')
      const tempOutputPath = path.join(tempDir, '_temp_output.png')
      fs.writeFileSync(tempOutputPath, buffer)
      await runSharpOperation('save', tempOutputPath, outputPath)
    }
  } else {
    // No SVG provided, just save the gradient image
    const buffer = canvas.toBuffer('image/png')
    const tempOutputPath = path.join(tempDir, '_temp_output.png')
    fs.writeFileSync(tempOutputPath, buffer)
    await runSharpOperation('save', tempOutputPath, outputPath)
  }

  // Clean up the temp directory
  try {
    if (fs.existsSync(tempDir)) {
      // Read all files in the temp directory
      const tempFiles = fs.readdirSync(tempDir)

      // Delete each file
      for (const file of tempFiles) {
        const filePath = path.join(tempDir, file)
        fs.unlinkSync(filePath)
      }

      // Remove the directory itself
      fs.rmdirSync(tempDir)
      console.log(`Cleaned up temporary directory: ${tempDir}`)
    }
  } catch (error) {
    console.error(
      `Error cleaning up temp directory: ${error instanceof Error ? error.message : String(error)}`,
    )
  }

  console.log(`Icon generated successfully at ${path.resolve(outputPath)}`)
}

// Parse command line arguments
function parseArgs(): {
  startColor: string
  endColor: string
  svgPath?: string | null
  outputPath?: string
  text?: string | null
} {
  const args = process.argv.slice(2)

  if (args.length < 2) {
    console.error('Error: Please provide start and end colors as hex values')
    console.error(
      'Usage: bun icon.ts #startColor #endColor [svgPath] [outputPath] [text]',
    )
    process.exit(1)
  }

  // Validate hex colors
  const startColor = args[0]
  const endColor = args[1]
  const svgPath = args.length >= 3 ? args[2] : null
  const outputPath = args.length >= 4 ? args[3] : undefined
  const text = args.length >= 5 ? args[4] : null

  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/

  if (!hexRegex.test(startColor) || !hexRegex.test(endColor)) {
    console.error(
      'Error: Colors must be valid hex values (e.g., #FF5500 or #F50)',
    )
    process.exit(1)
  }

  // Validate SVG path if provided
  if (svgPath && !svgPath.startsWith('#')) {
    if (!fs.existsSync(svgPath)) {
      console.error(`Error: SVG file not found: ${svgPath}`)
      process.exit(1)
    }

    if (!svgPath.toLowerCase().endsWith('.svg')) {
      console.error(`Error: File is not an SVG: ${svgPath}`)
      process.exit(1)
    }
  } else if (svgPath && svgPath.startsWith('#')) {
    // If the third argument is a hex color, it's not an SVG path
    return { startColor, endColor, outputPath: svgPath }
  }

  return {
    startColor,
    endColor,
    svgPath: svgPath || undefined,
    outputPath,
    text,
  }
}

// Main execution
;(async () => {
  try {
    const { startColor, endColor, svgPath, outputPath, text } = parseArgs()
    await generateGradientIcon(
      startColor,
      endColor,
      svgPath,
      outputPath,
      text === undefined ? null : text,
    )
  } catch (error) {
    console.error('Error generating icon:', error)
    process.exit(1)
  }
})().catch(error => {
  console.error('Unhandled error:', error)
  process.exit(1)
})

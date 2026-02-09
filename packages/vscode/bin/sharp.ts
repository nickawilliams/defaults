#!/usr/bin/env bun

import sharp from 'sharp'

/**
 * This script performs Sharp operations in a separate process
 * to avoid conflicts with the canvas library.
 *
 * @see https://github.com/Automattic/node-canvas/issues/1386
 */

// Get the operation type and parameters from command line arguments
const args = process.argv.slice(2)

if (args.length === 0) {
  console.error('Error: No operation specified')
  console.error('Usage: bun sharp.ts <operation> [args...]')
  console.error('Operations: composite, resize, tint, save, processSvg')
  process.exit(1)
}

const operation = args[0]
const operationArgs = args.slice(1)

// Main function to execute operations
async function main() {
  try {
    switch (operation) {
      case 'composite':
        // Format: composite <baseImagePath> <overlayImagePath> <outputPath>
        if (operationArgs.length !== 3) {
          throw new Error(
            'composite operation requires 3 arguments: baseImagePath, overlayImagePath, outputPath',
          )
        }
        await sharp(operationArgs[0])
          .composite([{ input: operationArgs[1], blend: 'over' }])
          .png()
          .toFile(operationArgs[2])
        console.log(`Composite complete: ${operationArgs[2]}`)
        break

      case 'resize':
        // Format: resize <inputPath> <outputPath> <width> <height> <fit>
        if (operationArgs.length !== 5) {
          throw new Error(
            'resize operation requires 5 arguments: inputPath, outputPath, width, height, fit',
          )
        }
        await sharp(operationArgs[0])
          .resize({
            width: parseInt(operationArgs[2]),
            height: parseInt(operationArgs[3]),
            fit: operationArgs[4] as
              | 'cover'
              | 'contain'
              | 'fill'
              | 'inside'
              | 'outside',
          })
          .png()
          .toFile(operationArgs[1])
        console.log(`Resize complete: ${operationArgs[1]}`)
        break

      case 'tint':
        // Format: tint <inputPath> <outputPath>
        if (operationArgs.length !== 2) {
          throw new Error(
            'tint operation requires 2 arguments: inputPath, outputPath',
          )
        }
        await sharp(operationArgs[0])
          .ensureAlpha()
          .tint({ r: 255, g: 255, b: 255 })
          .png()
          .toFile(operationArgs[1])
        console.log(`Tint complete: ${operationArgs[1]}`)
        break

      case 'save':
        // Format: save <inputPath> <outputPath>
        if (operationArgs.length !== 2) {
          throw new Error(
            'save operation requires 2 arguments: inputPath, outputPath',
          )
        }
        await sharp(operationArgs[0]).png().toFile(operationArgs[1])
        console.log(`Save complete: ${operationArgs[1]}`)
        break

      case 'processSvg':
        // Format: processSvg <svgPath> <outputPath> <width> <height>
        if (operationArgs.length !== 4) {
          throw new Error(
            'processSvg operation requires 4 arguments: svgPath, outputPath, width, height',
          )
        }
        await sharp(operationArgs[0], { density: 300 })
          .resize({
            width: parseInt(operationArgs[2]),
            height: parseInt(operationArgs[3]),
            fit: 'inside',
            withoutEnlargement: true,
          })
          .ensureAlpha()
          .tint({ r: 255, g: 255, b: 255 })
          .png()
          .toFile(operationArgs[1])
        console.log(`Process SVG complete: ${operationArgs[1]}`)
        break

      default:
        throw new Error(`Unknown operation: ${operation}`)
    }
  } catch (error) {
    console.error(
      `Error in sharp operation: ${error instanceof Error ? error.message : String(error)}`,
    )
    process.exit(1)
  }
}

// Run the main function
main().catch(error => {
  console.error(
    `Unhandled error: ${error instanceof Error ? error.message : String(error)}`,
  )
  process.exit(1)
})

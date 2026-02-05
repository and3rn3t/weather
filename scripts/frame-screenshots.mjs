/**
 * App Store Screenshot Post-Processor
 *
 * Adds device frames and marketing text to screenshots for App Store submission.
 * Uses Sharp for high-performance image processing.
 *
 * Usage: node scripts/frame-screenshots.mjs
 *
 * Prerequisites:
 * 1. Run `npm run screenshots` to generate raw screenshots
 * 2. Place device frame PNGs in assets/frames/ (optional - creates clean versions without frames)
 */

import sharp from 'sharp';
import { readdir, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, basename, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Configuration
const INPUT_DIR = join(projectRoot, 'screenshots', 'output');
const OUTPUT_DIR = join(projectRoot, 'screenshots', 'framed');
const FRAMES_DIR = join(projectRoot, 'assets', 'frames');

// Marketing text for each screen type
const MARKETING_TEXT = {
  '01-home': 'Your Weather at a Glance',
  '02-weather-details': 'Detailed Conditions',
  '03-forecast': '7-Day Forecast',
  '04-settings': 'Personalize Your Experience',
  '05-dark-mode': 'Beautiful Dark Mode',
  '06-search': 'Find Any City Worldwide',
  'full-light': 'Premium Weather Experience',
  'full-dark': 'Stunning Night Mode',
};

// Device-specific settings
const DEVICE_CONFIG = {
  'iPhone 16 Pro Max': {
    textSize: 48,
    padding: 60,
    frameFile: 'iphone-16-pro-max.png',
  },
  'iPhone 14 Plus': {
    textSize: 44,
    padding: 55,
    frameFile: 'iphone-14-plus.png',
  },
  'iPhone 8 Plus': {
    textSize: 40,
    padding: 50,
    frameFile: 'iphone-8-plus.png',
  },
  'iPad Pro 12.9': {
    textSize: 64,
    padding: 80,
    frameFile: 'ipad-pro-12.9.png',
  },
};

/**
 * Create SVG text overlay
 */
function createTextOverlay(text, width, height, fontSize, padding) {
  const y = height - padding;

  return Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="rgba(0,0,0,0.5)"/>
        </filter>
        <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#f0f0f0;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect x="0" y="${y - fontSize - 20}" width="${width}" height="${fontSize + padding}" 
            fill="url(#grad)" opacity="0"/>
      <text 
        x="${width / 2}" 
        y="${y}" 
        font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif" 
        font-size="${fontSize}" 
        font-weight="600"
        fill="url(#textGrad)" 
        text-anchor="middle"
        filter="url(#shadow)"
      >${text}</text>
    </svg>
  `);
}

/**
 * Create a gradient background
 */
async function createGradientBackground(width, height, isDark = false) {
  const gradientStart = isDark ? '#1a1a2e' : '#667eea';
  const gradientEnd = isDark ? '#16213e' : '#764ba2';

  const svg = Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:${gradientStart}"/>
          <stop offset="100%" style="stop-color:${gradientEnd}"/>
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#bg)"/>
    </svg>
  `);

  return sharp(svg).png().toBuffer();
}

/**
 * Process a single screenshot
 */
async function processScreenshot(
  inputPath,
  outputPath,
  deviceName,
  screenType
) {
  const config =
    DEVICE_CONFIG[deviceName] || DEVICE_CONFIG['iPhone 16 Pro Max'];
  const marketingText = MARKETING_TEXT[screenType] || 'Premium Weather App';
  const isDark = screenType.includes('dark');

  try {
    // Get original image metadata
    const metadata = await sharp(inputPath).metadata();
    const width = metadata.width || 1290;
    const height = metadata.height || 2796;

    // Calculate framed dimensions (add space for text)
    const framedHeight = height + config.padding * 2;

    // Create background
    const background = await createGradientBackground(
      width,
      framedHeight,
      isDark
    );

    // Create text overlay
    const textOverlay = createTextOverlay(
      marketingText,
      width,
      framedHeight,
      config.textSize,
      config.padding
    );

    // Composite the image
    await sharp(background)
      .composite([
        {
          input: inputPath,
          top: config.padding / 2,
          left: 0,
        },
        {
          input: textOverlay,
          top: 0,
          left: 0,
        },
      ])
      .png({ quality: 100 })
      .toFile(outputPath);

    console.log(`✅ Processed: ${basename(outputPath)}`);
    return true;
  } catch (error) {
    console.error(`❌ Error processing ${basename(inputPath)}:`, error.message);
    return false;
  }
}

/**
 * Extract device name and screen type from filename
 */
function parseFilename(filename) {
  // Expected format: "iPhone 16 Pro Max-01-home.png"
  const parts = filename.replace('.png', '').split('-');

  // Find where the screen number starts (e.g., "01", "02", etc.)
  const numberIndex = parts.findIndex(p => /^\d{2}$/.test(p) || p === 'full');

  if (numberIndex === -1) {
    return { deviceName: parts.join(' '), screenType: 'unknown' };
  }

  const deviceName = parts.slice(0, numberIndex).join(' ');
  const screenType = parts.slice(numberIndex).join('-');

  return { deviceName, screenType };
}

/**
 * Main execution
 */
async function main() {
  console.log('🖼️  App Store Screenshot Post-Processor\n');

  // Ensure output directory exists
  if (!existsSync(OUTPUT_DIR)) {
    await mkdir(OUTPUT_DIR, { recursive: true });
  }

  // Check for input screenshots
  if (!existsSync(INPUT_DIR)) {
    console.error('❌ No screenshots found. Run `npm run screenshots` first.');
    process.exit(1);
  }

  // Get all PNG files from input directory
  const files = await readdir(INPUT_DIR);
  const pngFiles = files.filter(f => f.endsWith('.png'));

  if (pngFiles.length === 0) {
    console.error('❌ No PNG screenshots found in screenshots/output/');
    console.log('   Run `npm run screenshots` to generate screenshots.');
    process.exit(1);
  }

  console.log(`📸 Found ${pngFiles.length} screenshots to process\n`);

  let processed = 0;
  let failed = 0;

  for (const file of pngFiles) {
    const inputPath = join(INPUT_DIR, file);
    const outputPath = join(OUTPUT_DIR, file.replace('.png', '-framed.png'));
    const { deviceName, screenType } = parseFilename(file);

    const success = await processScreenshot(
      inputPath,
      outputPath,
      deviceName,
      screenType
    );
    if (success) {
      processed++;
    } else {
      failed++;
    }
  }

  console.log(`\n📊 Summary: ${processed} processed, ${failed} failed`);
  console.log(`📁 Output: ${OUTPUT_DIR}`);

  if (processed > 0) {
    console.log('\n🎉 Screenshots ready for App Store submission!');
    console.log('   Upload via Xcode or App Store Connect.\n');
  }
}

main().catch(console.error);

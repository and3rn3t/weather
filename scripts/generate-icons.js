/**
 * Icon Generator Script
 * Converts SVG to multiple PNG sizes for PWA manifest
 * Run with: node scripts/generate-icons.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple Canvas-based PNG generation for different sizes
function generateIconsHTML() {
  const sizes = [72, 96, 128, 144, 152, 192, 256, 384, 512];
  const svgContent = fs.readFileSync(
    path.join(__dirname, '../public/icons/weather-icon.svg'),
    'utf8'
  );

  // Create HTML file that can generate PNGs
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Icon Generator</title>
    <style>
        body { font-family: system-ui; padding: 20px; background: #f5f5f5; }
        .icon-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
        .icon-item { background: white; padding: 15px; border-radius: 8px; text-align: center; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        canvas { border: 1px solid #ddd; border-radius: 4px; }
        button { background: #667eea; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-top: 10px; }
        button:hover { background: #5a6fd8; }
        .download-all { background: #16a34a; padding: 12px 24px; font-size: 16px; margin-bottom: 20px; }
    </style>
</head>
<body>
    <h1>🌤️ Weather App Icon Generator</h1>
    <p>Click "Download All Icons" to generate all PNG sizes, or download individual sizes below.</p>

    <button class="download-all" onclick="downloadAllIcons()">📦 Download All Icons as ZIP</button>

    <div class="icon-grid">
        ${sizes
          .map(
            size => `
            <div class="icon-item">
                <h3>${size}x${size}px</h3>
                <canvas id="canvas${size}" width="${size}" height="${size}"></canvas>
                <br>
                <button onclick="downloadIcon(${size})">Download PNG</button>
            </div>
        `
          )
          .join('')}
    </div>

    <script>
        const svgContent = \`${svgContent}\`;
        const sizes = [${sizes.join(', ')}];

        // Convert SVG to Canvas and then to PNG
        function svgToCanvas(svgString, size, canvasId) {
            const canvas = document.getElementById(canvasId);
            const ctx = canvas.getContext('2d');

            const img = new Image();
            const svgBlob = new Blob([svgString], {type: 'image/svg+xml;charset=utf-8'});
            const url = URL.createObjectURL(svgBlob);

            img.onload = function() {
                ctx.clearRect(0, 0, size, size);
                ctx.drawImage(img, 0, 0, size, size);
                URL.revokeObjectURL(url);
            };

            img.src = url;
        }

        // Generate all canvases
        sizes.forEach(size => {
            svgToCanvas(svgContent, size, \`canvas\${size}\`);
        });

        // Download individual icon
        function downloadIcon(size) {
            const canvas = document.getElementById(\`canvas\${size}\`);
            canvas.toBlob(function(blob) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = \`icon-\${size}x\${size}.png\`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            });
        }

        // Download all icons
        async function downloadAllIcons() {
            const zip = new JSZip();

            for (const size of sizes) {
                const canvas = document.getElementById(\`canvas\${size}\`);
                const blob = await new Promise(resolve => canvas.toBlob(resolve));
                zip.file(\`icon-\${size}x\${size}.png\`, blob);
            }

            const zipBlob = await zip.generateAsync({type: 'blob'});
            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'weather-app-icons.zip';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    </script>

    <!-- JSZip library for creating ZIP files -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
</body>
</html>`;

  fs.writeFileSync(
    path.join(__dirname, '../public/icon-generator.html'),
    htmlContent
  );
  console.log('✅ Icon generator created at /public/icon-generator.html');
  console.log(
    '📝 Open http://localhost:5173/icon-generator.html in your browser to generate PNG icons'
  );
}

// Alternative: Create simple colored PNG files as placeholders
function createPlaceholderIcons() {
  const sizes = [72, 96, 128, 144, 152, 192, 256, 384, 512];

  console.log('🎨 Creating placeholder icon files...');

  sizes.forEach(size => {
    // Create a simple data URL for a colored square as placeholder
    const canvas = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" fill="url(#grad)" rx="${
        size * 0.1
      }"/>
      <circle cx="${size * 0.3}" cy="${size * 0.35}" r="${
        size * 0.08
      }" fill="#ffd700"/>
      <ellipse cx="${size * 0.6}" cy="${size * 0.5}" rx="${size * 0.15}" ry="${
        size * 0.08
      }" fill="white"/>
      <text x="${size / 2}" y="${
        size * 0.8
      }" font-family="sans-serif" font-size="${
        size * 0.1
      }" font-weight="bold" text-anchor="middle" fill="white">W</text>
    </svg>`;

    fs.writeFileSync(
      path.join(__dirname, `../public/icons/icon-${size}x${size}.svg`),
      canvas
    );
    console.log(`✅ Created icon-${size}x${size}.svg`);
  });
}

// Run both generators
generateIconsHTML();
createPlaceholderIcons();

console.log('\\n🚀 Icon generation complete!');
console.log('📋 Next steps:');
console.log('1. Open http://localhost:5173/icon-generator.html');
console.log('2. Download the PNG icons');
console.log('3. Place them in /public/icons/');
console.log('4. Update manifest.json');

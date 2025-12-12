const fs = require('fs');
const path = require('path');

// Create a simple canvas implementation using node
const { createCanvas } = require('canvas');

const OUTPUT_DIR = path.join(__dirname, '../assets/images');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Helper function to draw rounded rectangle
function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
}

// Generate App Icon (1024x1024)
function generateAppIcon() {
  const canvas = createCanvas(1024, 1024);
  const ctx = canvas.getContext('2d');
  const size = 1024;

  // Background with cyan color
  ctx.fillStyle = '#00D4FF';
  ctx.fillRect(0, 0, size, size);

  // Draw "B" letter
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 720px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('B', size / 2, size / 2 + 20);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(OUTPUT_DIR, 'icon.png'), buffer);
  console.log('✓ Generated icon.png');
}

// Generate Splash Icon (800x800)
function generateSplashIcon() {
  const canvas = createCanvas(800, 800);
  const ctx = canvas.getContext('2d');
  const size = 800;

  // Transparent background
  ctx.clearRect(0, 0, size, size);

  // Draw square with "B"
  const squareSize = 280;
  const squareX = (size - squareSize) / 2;
  const squareY = 180;

  ctx.fillStyle = '#00D4FF';
  roundRect(ctx, squareX, squareY, squareSize, squareSize, 40);

  ctx.fillStyle = '#000000';
  ctx.font = 'bold 200px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('B', size / 2, squareY + squareSize / 2 + 10);

  // Draw "BAZZANI" text
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 72px Arial';
  ctx.fillText('BAZZANI', size / 2, 520);

  // Draw "ARCADE" text
  ctx.fillStyle = '#FF6600';
  ctx.font = 'bold 36px Arial';
  ctx.fillText('ARCADE', size / 2, 580);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(OUTPUT_DIR, 'splash-icon.png'), buffer);
  console.log('✓ Generated splash-icon.png');
}

// Generate Android Foreground (1024x1024)
function generateAndroidForeground() {
  const canvas = createCanvas(1024, 1024);
  const ctx = canvas.getContext('2d');
  const size = 1024;

  // Transparent background
  ctx.clearRect(0, 0, size, size);

  // Safe zone: center with logo
  const logoSize = 520;
  const logoX = (size - logoSize) / 2;
  const logoY = (size - logoSize) / 2;

  // Draw square with "B"
  ctx.fillStyle = '#00D4FF';
  roundRect(ctx, logoX, logoY, logoSize, logoSize, 80);

  ctx.fillStyle = '#000000';
  ctx.font = 'bold 380px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('B', size / 2, size / 2 + 12);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(OUTPUT_DIR, 'android-icon-foreground.png'), buffer);
  console.log('✓ Generated android-icon-foreground.png');
}

// Generate Android Background (1024x1024)
function generateAndroidBackground() {
  const canvas = createCanvas(1024, 1024);
  const ctx = canvas.getContext('2d');
  const size = 1024;

  // Black background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, size, size);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(OUTPUT_DIR, 'android-icon-background.png'), buffer);
  console.log('✓ Generated android-icon-background.png');
}

// Generate Android Monochrome (1024x1024)
function generateAndroidMonochrome() {
  const canvas = createCanvas(1024, 1024);
  const ctx = canvas.getContext('2d');
  const size = 1024;

  // Transparent background
  ctx.clearRect(0, 0, size, size);

  // Draw "B" in white
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 720px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('B', size / 2, size / 2 + 20);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(OUTPUT_DIR, 'android-icon-monochrome.png'), buffer);
  console.log('✓ Generated android-icon-monochrome.png');
}

// Generate Favicon (48x48)
function generateFavicon() {
  const canvas = createCanvas(48, 48);
  const ctx = canvas.getContext('2d');
  const size = 48;

  // Background
  ctx.fillStyle = '#00D4FF';
  roundRect(ctx, 0, 0, size, size, 8);

  // Draw "B"
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 36px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('B', size / 2, size / 2 + 1);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(OUTPUT_DIR, 'favicon.png'), buffer);
  console.log('✓ Generated favicon.png');
}

// Generate all icons
console.log('Generating Bazzani Arcade icons...\n');

try {
  generateAppIcon();
  generateSplashIcon();
  generateAndroidForeground();
  generateAndroidBackground();
  generateAndroidMonochrome();
  generateFavicon();

  console.log('\n✅ All icons generated successfully!');
  console.log(`📁 Icons saved to: ${OUTPUT_DIR}`);
} catch (error) {
  console.error('❌ Error generating icons:', error);
  process.exit(1);
}

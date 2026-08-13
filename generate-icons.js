const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const SOURCE = path.join(
  "C:\\Users\\swaya\\.gemini\\antigravity-ide\\brain\\10abfab2-b4ed-4f13-9e34-d7248e2f6ea7",
  "aurafy_icon_1786641658485.png"
);
const DEST = path.join(__dirname, "public", "icons");

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

async function generate() {
  if (!fs.existsSync(DEST)) fs.mkdirSync(DEST, { recursive: true });

  for (const size of SIZES) {
    const out = path.join(DEST, `icon-${size}x${size}.png`);
    await sharp(SOURCE).resize(size, size).png().toFile(out);
    console.log(`✓ Generated ${out}`);
  }

  // Also generate apple-touch-icon (180x180)
  const apple = path.join(__dirname, "public", "apple-touch-icon.png");
  await sharp(SOURCE).resize(180, 180).png().toFile(apple);
  console.log(`✓ Generated apple-touch-icon.png`);

  // favicon.ico equivalent (32x32)
  const favicon = path.join(__dirname, "public", "favicon-32x32.png");
  await sharp(SOURCE).resize(32, 32).png().toFile(favicon);
  console.log(`✓ Generated favicon-32x32.png`);

  console.log("\n✅ All PWA icons generated successfully!");
}

generate().catch(console.error);

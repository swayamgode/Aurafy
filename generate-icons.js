const sharp = require('sharp');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 180, 192, 384, 512];
const src = path.join(__dirname, 'public', 'icons', 'AURAFY.png');

Promise.all(
  sizes.map((s) =>
    sharp(src)
      .resize(s, s, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toFile(path.join(__dirname, 'public', 'icons', `icon-${s}x${s}.png`))
      .then(() => console.log(`icon-${s}x${s}.png done`))
  )
)
  .then(() => {
    // Also generate favicon-32x32 and apple-touch-icon
    return Promise.all([
      sharp(src)
        .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .png()
        .toFile(path.join(__dirname, 'public', 'favicon-32x32.png'))
        .then(() => console.log('favicon-32x32.png done')),
      sharp(src)
        .resize(180, 180, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .png()
        .toFile(path.join(__dirname, 'public', 'apple-touch-icon.png'))
        .then(() => console.log('apple-touch-icon.png done')),
    ]);
  })
  .then(() => console.log('\nAll icons generated from AURAFY.png!'))
  .catch((e) => console.error('Error:', e));

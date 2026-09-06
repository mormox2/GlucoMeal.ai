import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const publicDir = path.resolve('public');

// Master SVG Icon (512x512)
const masterSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Background Gradient: Deep Midnight Clinical Emerald -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#044736" />
      <stop offset="45%" stop-color="#022d22" />
      <stop offset="100%" stop-color="#00140f" />
    </linearGradient>

    <!-- Droplet Body: Bioluminescent Vibrant Emerald-Teal -->
    <linearGradient id="dropGrad" x1="15%" y1="0%" x2="85%" y2="100%">
      <stop offset="0%" stop-color="#34d399" />
      <stop offset="35%" stop-color="#10b981" />
      <stop offset="75%" stop-color="#059669" />
      <stop offset="100%" stop-color="#0284c7" />
    </linearGradient>

    <!-- Glycemic Pulse: Electric Cyan to Neon Mint -->
    <linearGradient id="pulseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="50%" stop-color="#67e8f9" />
      <stop offset="100%" stop-color="#34d399" />
    </linearGradient>

    <!-- Edge Rim Metallic Light -->
    <linearGradient id="rimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6ee7b7" stop-opacity="0.65" />
      <stop offset="50%" stop-color="#10b981" stop-opacity="0.18" />
      <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.45" />
    </linearGradient>

    <!-- Glass Specular Highlight -->
    <linearGradient id="specularGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.45" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
    </linearGradient>

    <!-- Ambient Center Sunburst -->
    <radialGradient id="sunburstGrad" cx="50%" cy="52%" r="46%">
      <stop offset="0%" stop-color="#10b981" stop-opacity="0.35" />
      <stop offset="60%" stop-color="#044736" stop-opacity="0.08" />
      <stop offset="100%" stop-color="#044736" stop-opacity="0" />
    </radialGradient>

    <!-- Deep Tile Drop Shadow -->
    <filter id="tileShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#000e0a" flood-opacity="0.85" />
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#059669" flood-opacity="0.35" />
    </filter>

    <!-- Contact Shadow for Foreground Fork -->
    <filter id="forkShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="5" stdDeviation="6" flood-color="#01241a" flood-opacity="0.45" />
    </filter>

    <!-- Soft Glow for Glycemic Wave Aura -->
    <filter id="waveAura" x="-25%" y="-25%" width="150%" height="150%">
      <feGaussianBlur stdDeviation="7" />
    </filter>

    <!-- Star Glow -->
    <filter id="aiGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Squircle Base Tile -->
  <rect width="512" height="512" rx="120" fill="url(#bgGrad)" />
  <rect x="3" y="3" width="506" height="506" rx="117" fill="none" stroke="url(#rimGrad)" stroke-width="2.5" />
  <circle cx="256" cy="275" r="220" fill="url(#sunburstGrad)" />

  <!-- Master Glucose Teardrop -->
  <g filter="url(#tileShadow)">
    <!-- Droplet Body -->
    <path d="M 256,58 C 256,58 128,212 128,320 C 128,394 186,448 256,448 C 326,448 384,394 384,320 C 384,212 256,58 256,58 Z" fill="url(#dropGrad)" />

    <!-- Glass Specular Reflection Arc -->
    <path d="M 256,80 C 238,110 166,226 160,306 C 152,230 210,124 256,80 Z" fill="url(#specularGrad)" />

    <!-- Bottom Light Floor -->
    <ellipse cx="256" cy="396" rx="78" ry="24" fill="#ffffff" opacity="0.12" />

    <!-- 1. GLYCEMIC PULSE WAVE (Electric Cyan Bioluminescent Rhythm) -->
    <!-- Soft Background Aura -->
    <path d="M 158,332 L 200,332 L 214,332 L 228,298 L 244,364 L 256,268 L 268,354 L 282,316 L 296,332 L 310,332 L 354,332"
          stroke="#38bdf8" stroke-width="20" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.3" filter="url(#waveAura)" />

    <!-- Crisp Sharp Vector Stroke -->
    <path d="M 158,332 L 200,332 L 214,332 L 228,298 L 244,364 L 256,268 L 268,354 L 282,316 L 296,332 L 310,332 L 354,332"
          stroke="url(#pulseGrad)" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" fill="none" />
    <circle cx="158" cy="332" r="7" fill="#38bdf8" />
    <circle cx="354" cy="332" r="7" fill="#34d399" />

    <!-- 2. SCULPTED CULINARY FORK (Pure White in Foreground with contact depth) -->
    <g filter="url(#forkShadow)">
      <!-- Master Fork Body with wide, ultra-legible slots -->
      <path d="M 214,170 C 214,164 219,160 225,160 C 231,160 236,164 236,170 L 236,220 L 246,220 L 246,152 C 246,146 251,142 257,142 C 263,142 268,146 268,152 L 268,220 L 278,220 L 278,170 C 278,164 283,160 289,160 C 295,160 300,164 300,170 L 300,218 C 300,252 266,262 266,274 L 266,376 C 266,381 262,386 257,386 C 252,386 248,381 248,376 L 248,274 C 248,262 214,252 214,218 Z" fill="#ffffff" />
    </g>
  </g>

  <!-- 3. AI BRILLIANT DIAMOND STAR (Precision & Intelligence) -->
  <g transform="translate(324, 114)" filter="url(#aiGlow)">
    <path d="M 0,-30 Q 0,0 30,0 Q 0,0 0,30 Q 0,0 -30,0 Q 0,0 0,-30 Z" fill="#ffffff" />
    <circle cx="0" cy="0" r="5" fill="#38bdf8" />
  </g>

  <!-- Micro Satellite Star -->
  <g transform="translate(368, 164)">
    <path d="M 0,-13 Q 0,0 13,0 Q 0,0 0,13 Q 0,0 -13,0 Q 0,0 0,-13 Z" fill="#a7f3d0" />
  </g>
</svg>`;

// Maskable Icon SVG (with safe margin 80% scale on full-bleed background)
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Full-bleed background gradient -->
    <linearGradient id="bgMaskable" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#044736" />
      <stop offset="45%" stop-color="#022d22" />
      <stop offset="100%" stop-color="#00140f" />
    </linearGradient>

    <!-- Droplet Body -->
    <linearGradient id="dropGradM" x1="15%" y1="0%" x2="85%" y2="100%">
      <stop offset="0%" stop-color="#34d399" />
      <stop offset="35%" stop-color="#10b981" />
      <stop offset="75%" stop-color="#059669" />
      <stop offset="100%" stop-color="#0284c7" />
    </linearGradient>

    <!-- Glycemic Pulse -->
    <linearGradient id="pulseGradM" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="50%" stop-color="#67e8f9" />
      <stop offset="100%" stop-color="#34d399" />
    </linearGradient>

    <!-- Glass Specular Highlight -->
    <linearGradient id="specularGradM" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.45" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
    </linearGradient>

    <!-- Center Sunburst -->
    <radialGradient id="sunburstGradM" cx="50%" cy="52%" r="46%">
      <stop offset="0%" stop-color="#10b981" stop-opacity="0.35" />
      <stop offset="100%" stop-color="#044736" stop-opacity="0" />
    </radialGradient>

    <filter id="tileShadowM" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#000e0a" flood-opacity="0.8" />
    </filter>

    <filter id="forkShadowM" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="5" stdDeviation="6" flood-color="#01241a" flood-opacity="0.45" />
    </filter>

    <filter id="aiGlowM" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Full-bleed background filling 100% of canvas -->
  <rect width="512" height="512" fill="url(#bgMaskable)" />
  <circle cx="256" cy="275" r="220" fill="url(#sunburstGradM)" />

  <!-- Inner Content Scaled 82% to fit comfortably in the 80% circle safe zone -->
  <g transform="translate(256, 256) scale(0.82) translate(-256, -256)">
    <g filter="url(#tileShadowM)">
      <!-- Droplet Body -->
      <path d="M 256,58 C 256,58 128,212 128,320 C 128,394 186,448 256,448 C 326,448 384,394 384,320 C 384,212 256,58 256,58 Z" fill="url(#dropGradM)" />
      <path d="M 256,80 C 238,110 166,226 160,306 C 152,230 210,124 256,80 Z" fill="url(#specularGradM)" />
      <ellipse cx="256" cy="396" rx="78" ry="24" fill="#ffffff" opacity="0.12" />

      <!-- Glycemic Pulse Wave -->
      <path d="M 158,332 L 200,332 L 214,332 L 228,298 L 244,364 L 256,268 L 268,354 L 282,316 L 296,332 L 310,332 L 354,332"
            stroke="url(#pulseGradM)" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <circle cx="158" cy="332" r="7" fill="#38bdf8" />
      <circle cx="354" cy="332" r="7" fill="#34d399" />

      <!-- Sculpted Culinary Fork -->
      <g filter="url(#forkShadowM)">
        <path d="M 214,170 C 214,164 219,160 225,160 C 231,160 236,164 236,170 L 236,220 L 246,220 L 246,152 C 246,146 251,142 257,142 C 263,142 268,146 268,152 L 268,220 L 278,220 L 278,170 C 278,164 283,160 289,160 C 295,160 300,164 300,170 L 300,218 C 300,252 266,262 266,274 L 266,376 C 266,381 262,386 257,386 C 252,386 248,381 248,376 L 248,274 C 248,262 214,252 214,218 Z" fill="#ffffff" />
      </g>
    </g>

    <!-- AI Diamond Star -->
    <g transform="translate(324, 114)" filter="url(#aiGlowM)">
      <path d="M 0,-30 Q 0,0 30,0 Q 0,0 0,30 Q 0,0 -30,0 Q 0,0 0,-30 Z" fill="#ffffff" />
      <circle cx="0" cy="0" r="5" fill="#38bdf8" />
    </g>
    <g transform="translate(368, 164)">
      <path d="M 0,-13 Q 0,0 13,0 Q 0,0 0,13 Q 0,0 -13,0 Q 0,0 0,-13 Z" fill="#a7f3d0" />
    </g>
  </g>
</svg>`;

// Helper: Build ICO container from multiple PNG buffers
function buildIcoFile(pngImages) {
  const count = pngImages.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // 1 = ICO format
  header.writeUInt16LE(count, 4);

  let offset = 6 + count * 16;
  const dirEntries = [];

  for (const img of pngImages) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.width === 256 ? 0 : img.width, 0);
    entry.writeUInt8(img.height === 256 ? 0 : img.height, 1);
    entry.writeUInt8(0, 2); // color count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // planes
    entry.writeUInt16LE(32, 6); // bpp
    entry.writeUInt32LE(img.buffer.length, 8); // size
    entry.writeUInt32LE(offset, 12); // offset
    dirEntries.push(entry);
    offset += img.buffer.length;
  }

  return Buffer.concat([header, ...dirEntries, ...pngImages.map(img => img.buffer)]);
}

async function buildAll() {
  console.log('Building all favicon & app icon assets...');

  // 1. Write public/icon.svg
  const iconSvgPath = path.join(publicDir, 'icon.svg');
  fs.writeFileSync(iconSvgPath, masterSvg.trim());
  console.log('✓ Wrote public/icon.svg');

  const masterBuf = Buffer.from(masterSvg);

  // 2. High-res PWA 512x512
  const pwa512Path = path.join(publicDir, 'pwa-512x512.png');
  await sharp(masterBuf).resize(512, 512).png({ quality: 100 }).toFile(pwa512Path);
  console.log('✓ Wrote public/pwa-512x512.png');

  // 3. Android PWA 192x192
  const pwa192Path = path.join(publicDir, 'pwa-192x192.png');
  await sharp(masterBuf).resize(192, 192).png({ quality: 100 }).toFile(pwa192Path);
  console.log('✓ Wrote public/pwa-192x192.png');

  // 4. Apple Touch Icon 180x180
  const appleTouchPath = path.join(publicDir, 'apple-touch-icon.png');
  await sharp(masterBuf).resize(180, 180).png({ quality: 100 }).toFile(appleTouchPath);
  console.log('✓ Wrote public/apple-touch-icon.png');

  // 5. PWA Maskable 512x512
  const maskableBuf = Buffer.from(maskableSvg);
  const maskablePath = path.join(publicDir, 'pwa-maskable-512x512.png');
  await sharp(maskableBuf).resize(512, 512).png({ quality: 100 }).toFile(maskablePath);
  console.log('✓ Wrote public/pwa-maskable-512x512.png');

  // 6. Multi-resolution favicon.ico (16x16, 32x32, 48x48)
  const icoBuf16 = await sharp(masterBuf).resize(16, 16).png().toBuffer();
  const icoBuf32 = await sharp(masterBuf).resize(32, 32).png().toBuffer();
  const icoBuf48 = await sharp(masterBuf).resize(48, 48).png().toBuffer();

  const icoFile = buildIcoFile([
    { width: 16, height: 16, buffer: icoBuf16 },
    { width: 32, height: 32, buffer: icoBuf32 },
    { width: 48, height: 48, buffer: icoBuf48 }
  ]);

  const faviconIcoPath = path.join(publicDir, 'favicon.ico');
  fs.writeFileSync(faviconIcoPath, icoFile);
  console.log('✓ Wrote public/favicon.ico (multi-resolution: 16px, 32px, 48px)');

  console.log('All icons built successfully!');
}

buildAll().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});

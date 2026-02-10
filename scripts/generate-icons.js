#!/usr/bin/env node

/**
 * Script para generar iconos PWA desde SVG
 * 
 * Uso: node scripts/generate-icons.js
 * 
 * Requiere: sharp (npm install sharp)
 */

const fs = require('fs');
const path = require('path');

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const INPUT_SVG = path.join(__dirname, '../public/icons/icon.svg');
const OUTPUT_DIR = path.join(__dirname, '../public/icons');

async function generateIcons() {
  try {
    // Verificar si existe sharp
    let sharp;
    try {
      sharp = require('sharp');
    } catch (e) {
      console.log('⚠️  Sharp no está instalado.');
      console.log('Instálalo con: npm install sharp --save-dev');
      console.log('\nO genera los iconos manualmente desde:');
      console.log('https://www.pwabuilder.com/imageGenerator');
      return;
    }

    console.log('🎨 Generando iconos PWA...\n');

    // Leer SVG
    const svgBuffer = fs.readFileSync(INPUT_SVG);

    for (const size of SIZES) {
      const outputFile = path.join(OUTPUT_DIR, `icon-${size}x${size}.png`);
      
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputFile);
      
      console.log(`✅ ${size}x${size}`);
    }

    console.log('\n🎉 Iconos generados correctamente!');
    console.log(`📁 Ubicación: ${OUTPUT_DIR}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Si se ejecuta directamente
if (require.main === module) {
  generateIcons();
}

module.exports = { generateIcons };

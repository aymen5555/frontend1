const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const family = process.argv[2] || 'Inter';
const weightsArg = process.argv[3] || '400;500;600;700;800;900';
const display = 'swap';
const outDir = path.resolve(__dirname, '..', 'src', 'assets', 'fonts');

function fetchUrl(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, { headers }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // follow redirect
        resolve(fetchUrl(res.headers.location, headers));
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    req.on('error', reject);
  });
}

(async function main(){
  try {
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weightsArg}&display=${display}`;
    console.log('Fetching CSS from', cssUrl);
    const cssBuf = await fetchUrl(cssUrl, { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' });
    const css = cssBuf.toString('utf8');

    const blocks = css.split('@font-face');
    let count = 0;
    for (const b of blocks) {
      const weightMatch = b.match(/font-weight\s*:\s*(\d+)/i);
      const urlMatch = b.match(/url\((https?:\/\/[^)]+\.woff2)\)/i);
      if (weightMatch && urlMatch) {
        const weight = weightMatch[1];
        const url = urlMatch[1].replace(/\\"/g, '');
        const filename = `Inter-${weight}.woff2`;
        const outPath = path.join(outDir, filename);
        console.log(`Downloading weight ${weight} -> ${filename}`);
        const data = await fetchUrl(url, { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' });
        fs.writeFileSync(outPath, data);
        count++;
      }
    }
    if (count === 0) {
      console.error('No woff2 URLs found in CSS. CSS content length:', css.length);
      process.exit(2);
    }
    console.log(`Downloaded ${count} font files to ${outDir}`);
  } catch (err) {
    console.error('Error:', err.message || err);
    process.exit(1);
  }
})();

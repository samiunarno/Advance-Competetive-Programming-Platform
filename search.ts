import fs from 'fs';
import path from 'path';

function search(dir: string) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      search(fullPath);
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.mjs')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('window.fetch =') || content.includes('globalThis.fetch =') || content.includes('global.fetch =')) {
        console.log(fullPath);
      }
    }
  }
}

search('node_modules');

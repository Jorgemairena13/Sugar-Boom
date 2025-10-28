#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = process.cwd();

function isExternal(link) {
  return /^(https?:)?\/\//i.test(link) || /^mailto:/i.test(link) || /^tel:/i.test(link);
}

function cleanLink(link) {
  // Remove fragment and query string
  return link.split('#')[0].split('?')[0];
}

function resolveLink(fromFile, link) {
  const cleaned = cleanLink(link).trim();
  if (!cleaned) return null;
  if (cleaned.startsWith('/')) {
    // root-relative -> resolve from project root
    return path.join(root, cleaned.replace(/^\//, ''));
  }
  return path.resolve(path.dirname(fromFile), cleaned);
}

function findHtmlFiles(dir) {
  const results = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const it of items) {
    const p = path.join(dir, it.name);
    if (it.isDirectory()) {
      // skip node_modules or .git just in case
      if (it.name === 'node_modules' || it.name === '.git') continue;
      results.push(...findHtmlFiles(p));
    } else if (it.isFile() && /\.html?$/i.test(it.name)) {
      results.push(p);
    }
  }
  return results;
}

function extractLinks(html) {
  const re = /(?:href|src)\s*=\s*(["'])(.*?)\1/gi;
  const links = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    links.push(m[2]);
  }
  return links;
}

function check() {
  console.log('Comprobando enlaces locales en HTML...\n');
  const htmlFiles = findHtmlFiles(root);
  const broken = [];
  let totalLinks = 0;

  for (const file of htmlFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const links = extractLinks(content);
    for (const link of links) {
      totalLinks++;
      if (!link) continue;
      if (isExternal(link)) continue; // external URL - skip
      if (link.startsWith('#')) continue; // anchor in same page - skip

      const resolved = resolveLink(file, link);
      if (!resolved) continue;

      // If the link originally ended with a slash, try index.html
      const possiblePaths = [resolved];
      if (link.endsWith('/')) possiblePaths.push(path.join(resolved, 'index.html'));
      // If no extension, try adding .html
      if (!path.extname(resolved)) possiblePaths.push(resolved + '.html');

      const exists = possiblePaths.some(p => fs.existsSync(p));
      if (!exists) {
        broken.push({ from: path.relative(root, file), link, resolved, tried: possiblePaths.map(p => path.relative(root, p)) });
      }
    }
  }

  console.log(`Archivos HTML analizados: ${htmlFiles.length}`);
  console.log(`Total enlaces (incluidos externos/anchors): ${totalLinks}`);
  console.log(`Enlaces rotos detectados: ${broken.length}\n`);

  if (broken.length > 0) {
    console.log('Lista de enlaces rotos (origen -> link)');
    for (const b of broken) {
      console.log('-'.repeat(60));
      console.log(`Desde: ${b.from}`);
      console.log(`  Link: ${b.link}`);
      console.log(`  Resuelto a: ${b.resolved}`);
      console.log(`  Rutas comprobadas: ${b.tried.join(', ')}`);
    }
    console.log('-'.repeat(60));
    process.exitCode = 2;
  } else {
    console.log('No se detectaron enlaces rotos locales.');
    process.exitCode = 0;
  }
}

check();

/**
 * @file 把 dist/ 掛在 /pazeh-kaxabu/ 底下提供（模擬 GitHub Pages 的專案網址），
 * 用來確認網站在子路徑下的資源、資料與錄音網址都正確。只給端對端測試使用。
 */

import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize } from 'node:path'

const ROOT = join(import.meta.dirname, '..', 'dist')
const BASE = '/pazeh-kaxabu/'
const PORT = Number(process.argv[2] ?? 4174)
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.woff2': 'font/woff2',
}

createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname)
  if (!path.startsWith(BASE)) {
    res.writeHead(404).end()
    return
  }
  let file = normalize(join(ROOT, path.slice(BASE.length)))
  if (!file.startsWith(ROOT)) {
    res.writeHead(403).end()
    return
  }
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html')
  if (!existsSync(file)) {
    res.writeHead(404).end()
    return
  }
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' })
  createReadStream(file).pipe(res)
}).listen(PORT, () => console.log(`http://localhost:${PORT}${BASE}`))

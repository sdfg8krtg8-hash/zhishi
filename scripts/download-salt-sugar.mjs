import { writeFileSync, statSync, renameSync, unlinkSync, existsSync } from 'fs'
import { join } from 'path'
import sharp from 'sharp'
import { ProxyAgent, fetch } from 'undici'

const ROOT = process.cwd()
const PROXY = 'http://127.0.0.1:7897'
const OUTPUT_DIR = join(ROOT, 'public', 'images', 'ingredients')
const DELAY_MS = 4000
const TIMEOUT_MS = 20000

const dispatcher = new ProxyAgent({ uri: PROXY, requestTls: { rejectUnauthorized: false } })

async function wikiFetch(url, options = {}) {
  const signal = options.signal || AbortSignal.timeout(TIMEOUT_MS)
  return fetch(url, { ...options, dispatcher, signal })
}

const ITEMS = [
  { name: '盐', query: 'table salt white granulated food' },
  { name: '糖', query: 'white granulated sugar crystals food' },
]

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function searchWiki(query) {
  const params = new URLSearchParams({
    action: 'query', list: 'search', srsearch: query,
    srnamespace: '6', srlimit: '15', format: 'json', origin: '*',
  })
  const url = `https://commons.wikimedia.org/w/api.php?${params}`
  const res = await wikiFetch(url)
  const data = await res.json()
  return data.query?.search || []
}

async function getImageUrls(titles) {
  const params = new URLSearchParams({
    action: 'query', titles: titles.join('|'),
    prop: 'imageinfo', iiprop: 'url|size|mime', iiurlwidth: '400',
    format: 'json', origin: '*',
  })
  const url = `https://commons.wikimedia.org/w/api.php?${params}`
  const res = await wikiFetch(url)
  const data = await res.json()
  const results = []
  for (const page of Object.values(data.query?.pages || {})) {
    const ii = page.imageinfo?.[0]
    if (ii && ii.mime?.startsWith('image/') && !ii.mime?.includes('svg')) {
      results.push({
        title: page.title,
        url: ii.thumburl || ii.url,
        originalUrl: ii.url,
        width: ii.width, height: ii.height,
      })
    }
  }
  return results
}

function scoreImage(img, name) {
  let score = 0
  if (img.width >= 1200 && img.height >= 900) score += 4
  else if (img.width >= 800 && img.height >= 600) score += 3
  else if (img.width >= 400 && img.height >= 300) score += 2

  const t = img.title.toLowerCase()
  const bad = ['diagram', 'map', 'chart', 'icon', 'logo', 'flag', 'drawing', 'illustration',
    'painting', 'stamp', 'sketch', 'cartoon', 'engraving', 'flower', 'bloom', 'blossom',
    'botanical', 'herbarium', 'specimen', 'seedling', 'museum', 'monument', 'portrait',
    'line art', 'black and white', 'b&w', 'dessert', 'candy', 'chocolate', 'donut',
    'cake', 'cookie', 'pastry', 'sweet', 'caramel', 'confectionery', 'dish', 'cuisine',
    'meal', 'cooked', 'fried', 'roasted', 'baked', 'grilled', 'recipe', 'plate', 'bowl',
    'sauce', 'salad', 'soup', 'pink salt', 'himalayan', 'rose salt', 'rock salt',
    'brown sugar', 'cane sugar', 'raw sugar', 'sugar cane', 'sugarcane']
  for (const w of bad) {
    if (t.includes(w)) score -= 10
  }

  if (name === '盐') {
    const good = ['salt', 'table salt', 'sea salt', 'white salt', 'granulated', 'cooking salt',
      'sodium chloride', 'fine salt', 'salt shaker', 'salt cellar', 'pile', 'mound', 'heap',
      'spoon', 'wooden spoon', 'scoop', 'pouring', 'scattered']
    for (const w of good) {
      if (t.includes(w)) score += 3
    }
  }
  if (name === '糖') {
    const good = ['sugar', 'white sugar', 'granulated sugar', 'table sugar', 'refined sugar',
      'sucrose', 'sugar crystals', 'sugar cube', 'pile', 'mound', 'heap', 'spoon',
      'wooden spoon', 'scoop', 'pouring', 'scattered', 'sugar bowl']
    for (const w of good) {
      if (t.includes(w)) score += 3
    }
  }

  if (img.width < 300 || img.height < 300) score -= 5
  return score
}

async function downloadImage(url, filepath) {
  const res = await wikiFetch(url, { signal: AbortSignal.timeout(60000) })
  if (!res.ok) throw new Error(`Download ${res.status}`)
  const buffer = await res.arrayBuffer()
  writeFileSync(filepath, Buffer.from(buffer))
}

async function compressImage(filepath) {
  const before = statSync(filepath).size
  const tmpPath = filepath + '.tmp'
  await sharp(filepath)
    .resize(400, undefined, { withoutEnlargement: true })
    .jpeg({ quality: 80, progressive: true })
    .toFile(tmpPath)
  unlinkSync(filepath)
  renameSync(tmpPath, filepath)
  const after = statSync(filepath).size
  return { before, after }
}

async function main() {
  console.log('=== 下载 盐 和 糖 ===\n')

  for (let i = 0; i < ITEMS.length; i++) {
    const item = ITEMS[i]
    console.log(`[${i + 1}/${ITEMS.length}] 搜索: ${item.name} (${item.query})`)

    try {
      const photos = await searchWiki(item.query)
      console.log(`  找到 ${photos.length} 个结果`)
      if (photos.length === 0) continue

      const titles = photos.slice(0, 15).map(p => p.title)
      let images = await getImageUrls(titles)

      // Filter and score
      const scored = images.map(img => ({ ...img, score: scoreImage(img, item.name) }))
      scored.sort((a, b) => b.score - a.score)

      console.log(`  Top 5:`)
      for (const s of scored.slice(0, 5)) {
        console.log(`    score:${s.score} ${s.title.replace('File:', '').substring(0, 60)}`)
      }

      // Download top 3 that have positive score
      let downloaded = 0
      for (const best of scored) {
        if (best.score < 0 || downloaded >= 3) break

        const suffix = downloaded === 0 ? '' : `_v${downloaded + 1}`
        const filename = `${item.name}${suffix}.jpg`
        const filepath = join(OUTPUT_DIR, filename)

        try {
          await downloadImage(best.url, filepath)
          const { before, after } = await compressImage(filepath)
          const pct = ((1 - after / before) * 100).toFixed(0)
          console.log(`  → ${filename} (${(before/1024).toFixed(0)}KB → ${(after/1024).toFixed(0)}KB -${pct}%)`)
          downloaded++
        } catch(e) {
          if (best.url !== best.originalUrl) {
            try {
              await downloadImage(best.originalUrl, filepath)
              const { before, after } = await compressImage(filepath)
              console.log(`  → ${filename} (full res)`)
              downloaded++
            } catch {}
          }
        }
      }

      if (downloaded === 0) {
        console.log(`  ✗ 无合适图片`)
      }

    } catch(e) {
      console.error(`  ✗ ${e.message}`)
    }

    await sleep(DELAY_MS)
  }

  console.log('\n完成!')
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1) })

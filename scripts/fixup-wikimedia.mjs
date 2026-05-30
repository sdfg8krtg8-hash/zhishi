import { writeFileSync, statSync, renameSync, unlinkSync } from 'fs'
import { join } from 'path'
import sharp from 'sharp'
import { ProxyAgent, fetch } from 'undici'

const ROOT = process.cwd()
const OUTPUT_DIR = join(ROOT, 'public', 'images', 'ingredients')
const DELAY_MS = 6000
const dispatcher = new ProxyAgent({ uri: 'http://127.0.0.1:7897', requestTls: { rejectUnauthorized: false } })

const FIXES = [
  // Still failed from retry
  { name: '韭菜', query: 'Chinese chives allium tuberosum vegetable' },
  { name: '洋葱', query: 'onion allium cepa whole bulb vegetable' },
  { name: '牛腩', query: 'beef brisket meat raw' },
  { name: '牛排', query: 'beef ribeye steak raw meat' },
  { name: '羊排', query: 'lamb rack chops raw meat bone' },
  { name: '草莓', query: 'strawberry fragaria fruit ripe' },
  { name: '葡萄', query: 'grape vitis vinifera bunch fruit' },
  // Bad matches from first batch
  { name: '青椒', query: 'green bell pepper capsicum annuum vegetable' },
  { name: '番茄', query: 'ripe red tomato solanum lycopersicum fruit' },
  { name: '鸡腿', query: 'raw chicken drumstick leg poultry meat' },
  { name: '鸡胸', query: 'raw chicken breast fillet meat poultry' },
  { name: '猪里脊', query: 'raw pork tenderloin fillet meat' },
  { name: '豆角', query: 'yardlong bean asparagus bean vegetable fresh' },
]

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function wikiFetch(url) {
  const res = await fetch(url, { dispatcher, signal: AbortSignal.timeout(20000) })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`HTTP ${res.status}: ${text.substring(0, 80)}`)
  }
  return res.json()
}

async function searchWiki(query) {
  const p = new URLSearchParams({ action: 'query', list: 'search', srsearch: query, srnamespace: '6', srlimit: '10', format: 'json', origin: '*' })
  const data = await wikiFetch('https://commons.wikimedia.org/w/api.php?' + p)
  return data.query?.search || []
}

async function getImageUrls(titles) {
  const p = new URLSearchParams({ action: 'query', titles: titles.join('|'), prop: 'imageinfo', iiprop: 'url|size|mime', iiurlwidth: '400', format: 'json', origin: '*' })
  const data = await wikiFetch('https://commons.wikimedia.org/w/api.php?' + p)
  const results = []
  for (const page of Object.values(data.query?.pages || {})) {
    const ii = page.imageinfo?.[0]
    if (ii && (ii.mime === 'image/jpeg' || ii.mime === 'image/png')) {
      results.push({
        title: page.title,
        url: ii.thumburl || ii.url,
        originalUrl: ii.url,
        width: ii.width || ii.thumbwidth || 0,
        height: ii.height || ii.thumbheight || 0,
      })
    }
  }
  return results
}

function scoreImage(img) {
  let score = 0
  if (img.width >= 800 && img.height >= 600) score += 3
  else if (img.width >= 400 && img.height >= 300) score += 2
  else score += 0
  const t = img.title.toLowerCase()
  const bad = ['diagram', 'map', 'chart', 'icon', 'logo', 'flag', 'drawing', 'illustration', 'painting', 'stamp', 'engraving', 'sketch', 'cartoon', 'manuscript', 'blueprint', 'portrait', 'museum', 'banknote', 'coin', 'medal', 'traffic', 'monument', 'flower', 'bloom', 'blossom', 'floral', 'botanical', 'herbarium', 'seedling', 'line art', 'black and white']
  for (const w of bad) { if (t.includes(w)) score -= 10 }
  const good = ['food', 'market', 'cooking', 'cuisine', 'meal', 'dish', 'fresh', 'grocery', 'produce', 'vegetable', 'fruit', 'meat', 'seafood', 'ingredient', 'raw', 'organic', 'farm', 'harvest', 'ripe', 'whole', 'cut', 'sliced']
  for (const w of good) { if (t.includes(w)) score += 2 }
  if (img.width < 300 || img.height < 300) score -= 5
  return score
}

async function downloadImage(url, filepath) {
  const res = await fetch(url, { dispatcher, signal: AbortSignal.timeout(60000) })
  if (!res.ok) throw new Error(`DL ${res.status}`)
  writeFileSync(filepath, Buffer.from(await res.arrayBuffer()))
}

async function main() {
  console.log(`=== 最终修复: ${FIXES.length} 个 ===\n`)
  let ok = 0, failed = []

  for (let i = 0; i < FIXES.length; i++) {
    const ing = FIXES[i]
    const p = `[${i + 1}/${FIXES.length}]`
    try {
      console.log(`${p} ${ing.name} → "${ing.query}"`)
      let photos = await searchWiki(ing.query)
      if (photos.length < 3) {
        try {
          const cn = await searchWiki(ing.name)
          const existing = new Set(photos.map(r => r.title))
          for (const r of cn) { if (!existing.has(r.title)) { photos.push(r); existing.add(r.title) } }
        } catch {}
        await sleep(1000)
      }
      if (!photos.length) { console.log(`  无结果`); failed.push(ing.name); continue }

      const images = await getImageUrls(photos.slice(0, 10).map(r => r.title))
      if (!images.length) { console.log(`  无可下载`); failed.push(ing.name); continue }

      const scored = images.map(img => ({ ...img, score: scoreImage(img) }))
      scored.sort((a, b) => b.score - a.score)
      const best = scored[0]
      if (best.score < 0) { console.log(`  低分 (${best.score}): ${best.title.replace('File:','').substring(0,50)}`); failed.push(ing.name); continue }

      const fp = join(OUTPUT_DIR, ing.name + '.jpg')
      console.log(`  → ${best.title.replace('File:','').substring(0,55)} (s:${best.score})`)
      await downloadImage(best.url, fp)
      const { before } = { before: statSync(fp).size }
      const tmp = fp + '.tmp'
      await sharp(fp).resize(400, undefined, { withoutEnlargement: true }).jpeg({ quality: 80, progressive: true }).toFile(tmp)
      unlinkSync(fp)
      renameSync(tmp, fp)
      const after = statSync(fp).size
      console.log(`  ${(before/1024).toFixed(0)}K→${(after/1024).toFixed(0)}K`)

      ok++
      await sleep(DELAY_MS)
    } catch (err) {
      console.error(`  错误: ${err.message}`)
      failed.push(ing.name)
      await sleep(10000)
    }
  }

  console.log(`\n===== 最终修复完成 =====`)
  console.log(`成功: ${ok}/${FIXES.length}`)
  if (failed.length) console.log(`失败: ${failed.join(', ')}`)
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1) })

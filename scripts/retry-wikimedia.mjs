import { writeFileSync, statSync, renameSync, unlinkSync } from 'fs'
import { join } from 'path'
import sharp from 'sharp'
import { ProxyAgent, fetch } from 'undici'

const ROOT = process.cwd()
const OUTPUT_DIR = join(ROOT, 'public', 'images', 'ingredients')
const DELAY_MS = 5000 // Longer delay to avoid rate limit
const dispatcher = new ProxyAgent({ uri: 'http://127.0.0.1:7897', requestTls: { rejectUnauthorized: false } })

const RETRY = [
  { name: '辣椒', query: 'chili pepper capsicum frutescens fruit' },
  { name: '西兰花', query: 'broccoli brassica oleracea vegetable' },
  { name: '菜花', query: 'cauliflower brassica oleracea botrytis' },
  { name: '菠菜', query: 'spinach spinacia oleracea leaves' },
  { name: '生菜', query: 'lettuce lactuca sativa head' },
  { name: '芹菜', query: 'celery apium graveolens stalks' },
  { name: '韭菜', query: 'garlic chives allium tuberosum' },
  { name: '洋葱', query: 'onion allium cepa bulb' },
  { name: '大蒜', query: 'garlic allium sativum bulb' },
  { name: '生姜', query: 'ginger zingiber officinale root' },
  { name: '丝瓜', query: 'luffa sponge gourd ridged gourd' },
  { name: '苦瓜', query: 'bitter melon bitter gourd momordica' },
  { name: '西葫芦', query: 'zucchini courgette cucurbita pepo' },
  { name: '四季豆', query: 'green beans phaseolus vulgaris' },
  { name: '豆芽', query: 'bean sprouts mung bean sprouts' },
  { name: '牛肉', query: 'beef meat raw cut' },
  { name: '五花肉', query: 'pork belly meat' },
  { name: '排骨', query: 'pork ribs spare ribs' },
  { name: '牛腩', query: 'beef brisket meat' },
  { name: '牛排', query: 'beef steak meat' },
  { name: '羊排', query: 'lamb chops rack ribs meat' },
  { name: '苹果', query: 'apple fruit malus domestica red' },
  { name: '香蕉', query: 'banana fruit musa ripe' },
  { name: '橙子', query: 'orange fruit citrus sinensis' },
  { name: '柠檬', query: 'lemon fruit citrus limon' },
  { name: '草莓', query: 'strawberry fruit fragaria' },
  { name: '葡萄', query: 'grape fruit vitis bunch' },
  { name: '西瓜', query: 'watermelon fruit citrullus' },
  { name: '芒果', query: 'mango fruit mangifera' },
  { name: '梨', query: 'pear fruit pyrus' },
  { name: '菠萝', query: 'pineapple fruit ananas comosus' },
]

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function wikiFetch(url, extraTimeout = 0) {
  const timeout = 20000 + extraTimeout
  const res = await fetch(url, { dispatcher, signal: AbortSignal.timeout(timeout) })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`HTTP ${res.status}: ${text.substring(0, 100)}`)
  }
  return res.json()
}

async function searchWiki(query) {
  const p = new URLSearchParams({ action: 'query', list: 'search', srsearch: query, srnamespace: '6', srlimit: '10', format: 'json', origin: '*' })
  const url = 'https://commons.wikimedia.org/w/api.php?' + p
  const data = await wikiFetch(url)
  return data.query?.search || []
}

async function getImageUrls(titles) {
  const p = new URLSearchParams({ action: 'query', titles: titles.join('|'), prop: 'imageinfo', iiprop: 'url|size|mime', iiurlwidth: '400', format: 'json', origin: '*' })
  const url = 'https://commons.wikimedia.org/w/api.php?' + p
  const data = await wikiFetch(url)
  const results = []
  for (const page of Object.values(data.query?.pages || {})) {
    const ii = page.imageinfo?.[0]
    // Only accept JPEG and PNG images — exclude SVG, PDF, DjVu, GIF, etc.
    const okMime = ii?.mime === 'image/jpeg' || ii?.mime === 'image/png'
    if (ii && okMime) {
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
  if (img.width >= 1200 && img.height >= 900) score += 4
  else if (img.width >= 800 && img.height >= 600) score += 3
  else if (img.width >= 400 && img.height >= 300) score += 2
  else score += 0

  const t = img.title.toLowerCase()
  const bad = ['diagram', 'map', 'chart', 'icon', 'logo', 'flag', 'coat', 'arms',
    'drawing', 'illustration', 'painting', 'stamp', 'engraving', 'sketch',
    'cartoon', 'manuscript', 'blueprint', 'portrait', 'museum', 'signature',
    'banknote', 'coin', 'medal', 'button', 'traffic', 'monument',
    'flower', 'bloom', 'blossom', 'floral', 'botanical', 'herbarium',
    'specimen', 'seedling', 'line art', 'black and white']
  for (const w of bad) {
    if (t.includes(w)) score -= 10
  }

  const good = ['food', 'market', 'cooking', 'cuisine', 'meal', 'dish', 'fresh',
    'grocery', 'produce', 'vegetable', 'fruit', 'meat', 'seafood', 'ingredient',
    'raw', 'organic', 'farm', 'harvest', 'ripe', 'whole', 'cut', 'sliced']
  for (const w of good) {
    if (t.includes(w)) score += 2
  }

  if (img.width < 300 || img.height < 300) score -= 5
  if (img.width < 200 || img.height < 200) score -= 10
  return score
}

async function downloadImage(url, filepath) {
  const res = await fetch(url, { dispatcher, signal: AbortSignal.timeout(60000) })
  if (!res.ok) throw new Error(`DL ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  writeFileSync(filepath, buf)
}

async function compress(filepath) {
  const before = statSync(filepath).size
  const tmp = filepath + '.tmp'
  await sharp(filepath).resize(400, undefined, { withoutEnlargement: true }).jpeg({ quality: 80, progressive: true }).toFile(tmp)
  unlinkSync(filepath)
  renameSync(tmp, filepath)
  return { before, after: statSync(filepath).size }
}

async function main() {
  console.log(`=== Wikimedia 重试: ${RETRY.length} 个 ===\n`)
  let ok = 0, failed = []

  for (let i = 0; i < RETRY.length; i++) {
    const ing = RETRY[i]
    const p = `[${i + 1}/${RETRY.length}]`
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
      const t = best.title.replace('File:', '').substring(0, 50)
      console.log(`  → ${t} (s:${best.score})`)
      await downloadImage(best.url, fp)
      const { before, after } = await compress(fp)
      console.log(`  ${(before/1024).toFixed(0)}K→${(after/1024).toFixed(0)}K`)

      ok++
      await sleep(DELAY_MS)
    } catch (err) {
      console.error(`  错误: ${err.message}`)
      failed.push(ing.name)
      await sleep(8000) // Extra wait after error
    }
  }

  console.log(`\n===== 完成 =====`)
  console.log(`成功: ${ok}/${RETRY.length}`)
  if (failed.length) console.log(`失败: ${failed.join(', ')}`)
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1) })

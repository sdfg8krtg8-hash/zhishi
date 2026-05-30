import { writeFileSync, statSync, renameSync, unlinkSync } from 'fs'
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

// 55 common ingredients with optimized Wikimedia search queries
const INGREDIENTS = [
  { name: '土豆', query: 'Solanum tuberosum potato tuber' },
  { name: '番茄', query: 'Solanum lycopersicum tomato fruit' },
  { name: '鸡蛋', query: 'chicken egg white background' },
  { name: '猪肉', query: 'pork meat butcher raw' },
  { name: '豆腐', query: 'tofu soybean curd food' },
  { name: '大米', query: 'Oryza sativa rice grain uncooked' },
  { name: '虾', query: 'shrimp seafood raw unpeeled' },
  { name: '白菜', query: 'Brassica rapa napa cabbage vegetable' },
  { name: '黄瓜', query: 'Cucumis sativus cucumber vegetable' },
  { name: '胡萝卜', query: 'Daucus carota carrot root vegetable' },
  { name: '茄子', query: 'Solanum melongena eggplant aubergine' },
  { name: '豆角', query: 'Vigna unguiculata yardlong bean vegetable' },
  { name: '青椒', query: 'Capsicum annuum bell pepper green' },
  { name: '辣椒', query: 'Capsicum chili pepper red hot' },
  { name: '西兰花', query: 'Brassica oleracea broccoli vegetable' },
  { name: '菜花', query: 'Brassica oleracea cauliflower white' },
  { name: '菠菜', query: 'Spinacia oleracea spinach leaves vegetable' },
  { name: '生菜', query: 'Lactuca sativa lettuce head vegetable' },
  { name: '芹菜', query: 'Apium graveolens celery stalks vegetable' },
  { name: '韭菜', query: 'Allium tuberosum garlic chives vegetable' },
  { name: '洋葱', query: 'Allium cepa onion bulb whole' },
  { name: '大蒜', query: 'Allium sativum garlic bulb cloves' },
  { name: '生姜', query: 'Zingiber officinale ginger root rhizome' },
  { name: '大葱', query: 'Allium fistulosum scallion green onion' },
  { name: '莲藕', query: 'Nelumbo nucifera lotus root rhizome sliced' },
  { name: '山药', query: 'Dioscorea polystachya chinese yam nagaimo' },
  { name: '冬瓜', query: 'Benincasa hispida winter melon wax gourd' },
  { name: '南瓜', query: 'Cucurbita moschata pumpkin squash fruit' },
  { name: '丝瓜', query: 'Luffa acutangula ridged gourd sponge gourd' },
  { name: '苦瓜', query: 'Momordica charantia bitter melon karela' },
  { name: '西葫芦', query: 'Cucurbita pepo zucchini courgette squash' },
  { name: '四季豆', query: 'Phaseolus vulgaris green beans haricot' },
  { name: '豆芽', query: 'mung bean sprouts germinated vegetable' },
  { name: '牛肉', query: 'beef meat raw steak butcher' },
  { name: '五花肉', query: 'pork belly meat raw slab' },
  { name: '排骨', query: 'pork spare ribs meat bone raw' },
  { name: '鸡腿', query: 'chicken drumstick raw leg poultry' },
  { name: '鸡胸', query: 'chicken breast fillet raw poultry' },
  { name: '鸡翅', query: 'chicken wings raw drumette poultry' },
  { name: '猪里脊', query: 'pork tenderloin meat fillet raw' },
  { name: '牛腩', query: 'beef brisket meat cut raw' },
  { name: '牛排', query: 'beef ribeye steak raw meat' },
  { name: '羊排', query: 'lamb rack chops ribs raw meat' },
  { name: '苹果', query: 'Malus domestica apple fruit red' },
  { name: '香蕉', query: 'Musa acuminata banana fruit ripe' },
  { name: '橙子', query: 'Citrus sinensis orange fruit whole' },
  { name: '柠檬', query: 'Citrus limon lemon fruit yellow' },
  { name: '草莓', query: 'Fragaria ananassa strawberry fruit ripe' },
  { name: '葡萄', query: 'Vitis vinifera grape bunch fruit' },
  { name: '西瓜', query: 'Citrullus lanatus watermelon fruit whole' },
  { name: '芒果', query: 'Mangifera indica mango fruit ripe' },
  { name: '梨', query: 'Pyrus communis pear fruit fresh' },
  { name: '菠萝', query: 'Ananas comosus pineapple fruit whole' },
  { name: '草鱼', query: 'Ctenopharyngodon idella grass carp fish' },
  { name: '鲈鱼', query: 'Dicentrarchus labrax sea bass fish perch' },
]

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function searchWiki(query) {
  const params = new URLSearchParams({
    action: 'query',
    list: 'search',
    srsearch: query,
    srnamespace: '6',
    srlimit: '15',
    format: 'json',
    origin: '*',
  })
  const url = `https://commons.wikimedia.org/w/api.php?${params}`
  const res = await wikiFetch(url)
  const data = await res.json()
  return data.query?.search || []
}

async function getImageUrls(titles) {
  const params = new URLSearchParams({
    action: 'query',
    titles: titles.join('|'),
    prop: 'imageinfo',
    iiprop: 'url|size|mime',
    iiurlwidth: '400',
    format: 'json',
    origin: '*',
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
        url: ii.thumburl || ii.url, // Use thumbnail if available for faster download
        originalUrl: ii.url,
        width: ii.width,
        height: ii.height,
      })
    }
  }
  return results
}

function scoreImage(img) {
  let score = 0

  // Prefer good-sized photos
  if (img.width >= 1200 && img.height >= 900) score += 4
  else if (img.width >= 800 && img.height >= 600) score += 3
  else if (img.width >= 400 && img.height >= 300) score += 2
  else score += 0

  const t = img.title.toLowerCase()

  // Heavily penalize non-photo content
  const bad = [
    'diagram', 'map', 'chart', 'icon', 'logo', 'flag', 'coat of arms', 'arms',
    'drawing', 'illustration', 'painting', 'stamp', 'postage', 'engraving',
    'sketch', 'cartoon', 'comic', 'manuscript', 'blueprint', 'schema',
    'portrait', 'museum', 'signature', 'banknote', 'coin', 'medal', 'button',
    'road sign', 'traffic', 'gravestone', 'monument',
    // Not useful for food
    'flower', 'bloom', 'blossom', 'floral', 'botanical illustration', 'botanical drawing',
    'herbarium', 'specimen', 'seed', 'seedling', 'sprout',
    'line art', 'lineart', 'black and white', 'b&w', 'bw.',
  ]
  for (const w of bad) {
    if (t.includes(w)) score -= 10
  }

  // Bonus for food-related keywords
  const good = ['food', 'market', 'cooking', 'cuisine', 'meal', 'dish', 'fresh',
    'grocery', 'produce', 'vegetable', 'fruit', 'meat', 'seafood', 'ingredient',
    'raw', 'organic', 'farm', 'harvest', 'ripe', 'whole', 'cut', 'sliced']
  for (const w of good) {
    if (t.includes(w)) score += 2
  }

  // Penalize very small images
  if (img.width < 300 || img.height < 300) score -= 5
  if (img.width < 200 || img.height < 200) score -= 10

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
  console.log(`=== Wikimedia Commons 图片下载: ${INGREDIENTS.length} 个食材 ===\n`)

  let downloaded = 0
  let failed = []

  for (let i = 0; i < INGREDIENTS.length; i++) {
    const ing = INGREDIENTS[i]
    const progress = `[${i + 1}/${INGREDIENTS.length}]`

    try {
      // Try English query first
      let photos = await searchWiki(ing.query)

      // If < 3 results, also try Chinese name
      if (photos.length < 3) {
        try {
          const cnPhotos = await searchWiki(ing.name)
          // Merge and deduplicate by title
          const existing = new Set(photos.map(p => p.title))
          for (const p of cnPhotos) {
            if (!existing.has(p.title)) {
              photos.push(p)
              existing.add(p.title)
            }
          }
        } catch {}
      }

      if (photos.length === 0) {
        console.log(`${progress} ${ing.name} — 无结果`)
        failed.push(ing.name)
        continue
      }

      // Get actual image URLs
      const titles = photos.slice(0, 15).map(p => p.title)
      let images = []
      try {
        images = await getImageUrls(titles)
      } catch (e) {
        console.log(`${progress} ${ing.name} — 获取图片URL失败: ${e.message}`)
        failed.push(ing.name)
        continue
      }

      if (images.length === 0) {
        console.log(`${progress} ${ing.name} — 无可下载图片`)
        failed.push(ing.name)
        continue
      }

      // Score and pick best
      const scored = images.map(img => ({ ...img, score: scoreImage(img) }))
      scored.sort((a, b) => b.score - a.score)
      const best = scored[0]

      // If best score is negative, all images are bad
      if (best.score < 0) {
        console.log(`${progress} ${ing.name} — 无合适图片 (best score: ${best.score})`)
        failed.push(ing.name)
        continue
      }

      const filename = `${ing.name}.jpg`
      const filepath = join(OUTPUT_DIR, filename)

      const shortTitle = best.title.replace(/^File:/, '').substring(0, 55)
      console.log(`${progress} ${ing.name} → ${shortTitle} (score:${best.score})`)

      // Try thumbnail first, fallback to original
      try {
        await downloadImage(best.url, filepath)
      } catch (e) {
        if (best.url !== best.originalUrl) {
          console.log(`  缩略图失败，尝试原图...`)
          await downloadImage(best.originalUrl, filepath)
        } else {
          throw e
        }
      }

      const { before, after } = await compressImage(filepath)
      const pct = ((1 - after / before) * 100).toFixed(0)
      console.log(`  ${(before/1024).toFixed(0)}KB → ${(after/1024).toFixed(0)}KB (-${pct}%)`)

      downloaded++
      await sleep(DELAY_MS)
    } catch (err) {
      console.error(`${progress} ${ing.name} — 错误: ${err.message}`)
      failed.push(ing.name)
      await sleep(3000)
    }
  }

  console.log(`\n===== Wikimedia 下载完成 =====`)
  console.log(`成功: ${downloaded}/${INGREDIENTS.length}`)
  if (failed.length > 0) {
    console.log(`失败 (${failed.length}): ${failed.join(', ')}`)
  }
}

main().catch(err => {
  console.error('Fatal:', err.message)
  process.exit(1)
})

import { existsSync, writeFileSync, statSync, renameSync, unlinkSync } from 'fs'
import { join } from 'path'
import sharp from 'sharp'

const ROOT = process.cwd()
const API_KEY = 'o9PrRJ8CCFLfCIOwNT2xeDIvbSCnRa96QqXTUEllmbdGP5lh0QpX6LuF'
const OUTPUT_DIR = join(ROOT, 'public', 'images', 'ingredients')
const DELAY_MS = 12000 // ~5 req/min, well under 200/hr limit
const TIMEOUT_MS = 30000

// Batch 1: 55 most common/visible ingredients with accurate English search queries
const BATCH1 = [
  { name: '土豆', query: 'raw potato fresh whole' },
  { name: '番茄', query: 'fresh red tomato' },
  { name: '鸡蛋', query: 'fresh eggs brown' },
  { name: '猪肉', query: 'raw pork meat fresh' },
  { name: '豆腐', query: 'tofu block white' },
  { name: '大米', query: 'raw rice grains uncooked' },
  { name: '青菜', query: 'bok choy vegetable green' },
  { name: '虾', query: 'raw shrimp fresh uncooked' },
  { name: '白菜', query: 'napa cabbage whole' },
  { name: '黄瓜', query: 'fresh cucumber green' },
  { name: '胡萝卜', query: 'fresh carrot orange' },
  { name: '茄子', query: 'fresh eggplant purple' },
  { name: '豆角', query: 'green beans fresh long' },
  { name: '青椒', query: 'green bell pepper fresh' },
  { name: '辣椒', query: 'red chili pepper fresh' },
  { name: '西兰花', query: 'fresh broccoli green' },
  { name: '菜花', query: 'cauliflower white fresh' },
  { name: '菠菜', query: 'fresh spinach leaves' },
  { name: '生菜', query: 'fresh lettuce green leaf' },
  { name: '芹菜', query: 'fresh celery stalks' },
  { name: '韭菜', query: 'chinese chives green' },
  { name: '洋葱', query: 'fresh onion whole' },
  { name: '大蒜', query: 'garlic bulbs fresh' },
  { name: '生姜', query: 'fresh ginger root' },
  { name: '大葱', query: 'green onion scallion fresh' },
  { name: '莲藕', query: 'lotus root fresh sliced' },
  { name: '山药', query: 'chinese yam nagaimo fresh' },
  { name: '冬瓜', query: 'winter melon whole' },
  { name: '南瓜', query: 'pumpkin whole fresh' },
  { name: '丝瓜', query: 'luffa gourd green' },
  { name: '苦瓜', query: 'bitter gourd melon' },
  { name: '西葫芦', query: 'zucchini fresh green' },
  { name: '毛豆', query: 'edamame soybeans fresh' },
  { name: '四季豆', query: 'green beans french beans' },
  { name: '豆芽', query: 'bean sprouts fresh' },
  { name: '牛肉', query: 'raw beef meat fresh' },
  { name: '五花肉', query: 'raw pork belly meat' },
  { name: '排骨', query: 'raw pork ribs meat' },
  { name: '鸡腿', query: 'raw chicken drumsticks' },
  { name: '鸡胸', query: 'raw chicken breast meat' },
  { name: '鸡翅', query: 'raw chicken wings' },
  { name: '猪里脊', query: 'raw pork tenderloin' },
  { name: '牛腩', query: 'raw beef brisket' },
  { name: '牛排', query: 'raw beef steak meat' },
  { name: '羊排', query: 'raw lamb rack meat' },
  { name: '苹果', query: 'fresh red apple fruit' },
  { name: '香蕉', query: 'fresh banana yellow' },
  { name: '橙子', query: 'fresh orange fruit' },
  { name: '柠檬', query: 'fresh lemon yellow' },
  { name: '草莓', query: 'fresh strawberries' },
  { name: '葡萄', query: 'fresh grapes purple' },
  { name: '西瓜', query: 'watermelon whole fresh' },
  { name: '芒果', query: 'fresh mango fruit' },
  { name: '梨', query: 'fresh pear fruit' },
  { name: '菠萝', query: 'fresh pineapple whole' },
]

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function searchPexels(query) {
  const params = new URLSearchParams({
    query,
    per_page: 5,
    orientation: 'square',
    size: 'medium',
    locale: 'en-US',
  })

  const res = await fetch(`https://api.pexels.com/v1/search?${params}`, {
    headers: { Authorization: API_KEY },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })

  if (res.status === 429) {
    const retryAfter = res.headers.get('Retry-After') || 60
    console.log(`  Rate limited, waiting ${retryAfter}s...`)
    await sleep(Number(retryAfter) * 1000 + 1000)
    return searchPexels(query)
  }

  if (!res.ok) {
    throw new Error(`Pexels API ${res.status}: ${res.statusText}`)
  }

  const data = await res.json()
  return data.photos || []
}

function cleanImageUrl(url) {
  try {
    const u = new URL(url)
    return u.origin + u.pathname
  } catch {
    return url
  }
}

async function downloadImage(url, filepath, retries = 2) {
  const cleanUrl = cleanImageUrl(url)
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(cleanUrl, { signal: AbortSignal.timeout(TIMEOUT_MS) })
      if (!res.ok) throw new Error(`Download ${res.status}`)
      const buffer = await res.arrayBuffer()
      writeFileSync(filepath, Buffer.from(buffer))
      return
    } catch (err) {
      if (attempt === retries) throw err
      console.log(`    下载重试 ${attempt + 1}/${retries}...`)
      await sleep(3000)
    }
  }
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
  console.log(`=== 重新下载 Batch 1: ${BATCH1.length} 个常见食材 ===\n`)

  let downloaded = 0
  let failed = []

  for (let i = 0; i < BATCH1.length; i++) {
    const ing = BATCH1[i]
    const filename = `${ing.name}.jpg`
    const filepath = join(OUTPUT_DIR, filename)
    const progress = `[${i + 1}/${BATCH1.length}]`

    // Check if existing image needs update (check if it's from old Chinese-name search)
    const oldExists = existsSync(filepath)

    try {
      console.log(`${progress} 搜索: ${ing.name} → "${ing.query}"`)

      // Try with the English query first
      let photos = await searchPexels(ing.query)

      // If no results with English, try Chinese name
      if (photos.length === 0) {
        console.log(`  → 英文搜索无结果，尝试中文...`)
        photos = await searchPexels(ing.name)
      }

      if (photos.length === 0) {
        console.log(`  → 无结果，跳过`)
        failed.push(ing.name)
        continue
      }

      const photo = photos[0]
      console.log(`  → 下载: ${photo.photographer} — ${photo.alt}`)
      await downloadImage(photo.src.medium, filepath)

      // Compress
      const { before, after } = await compressImage(filepath)
      const pct = ((1 - after / before) * 100).toFixed(0)
      console.log(`  → 已保存: ${filename} (${(before/1024).toFixed(0)}KB → ${(after/1024).toFixed(0)}KB, -${pct}%)`)

      downloaded++

      // Rate limit
      if (i < BATCH1.length - 1) {
        const wait = DELAY_MS / 1000
        console.log(`  → 等待 ${wait}s...`)
        await sleep(DELAY_MS)
      }
    } catch (err) {
      console.error(`  → 错误: ${err.message}`)
      failed.push(ing.name)
      await sleep(5000)
    }
  }

  console.log(`\n===== Batch 1 完成 =====`)
  console.log(`下载成功: ${downloaded}/${BATCH1.length}`)
  if (failed.length > 0) {
    console.log(`失败 (${failed.length}): ${failed.join(', ')}`)
  }
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})

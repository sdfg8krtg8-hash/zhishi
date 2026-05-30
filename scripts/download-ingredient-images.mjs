import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

// Always resolve from cwd since script is run from project root
const ROOT = process.cwd()
const API_KEY = 'o9PrRJ8CCFLfCIOwNT2xeDIvbSCnRa96QqXTUEllmbdGP5lh0QpX6LuF'
const PEXELS_URL = 'https://api.pexels.com/v1/search'
const OUTPUT_DIR = join(ROOT, 'public', 'images', 'ingredients')
const DATA_FILE = join(ROOT, 'src', 'data', 'ingredients.ts')
const DELAY_MS = 19000 // ~3 req/min, well under 200/hr limit
const TIMEOUT_MS = 30000

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function parseIngredients(content) {
  const ingredients = []
  // Split by ingredient blocks: each starts with "id: 'ing-N'"
  const blocks = content.split(/\{\s*\n\s*id:/).slice(1)

  for (const block of blocks) {
    const idMatch = block.match(/'([^']+)'/)
    const nameMatch = block.match(/name:\s*'([^']+)'/)
    const imageMatch = block.match(/image:\s*(?:PLACEHOLDER|'([^']+)')/)

    if (nameMatch) {
      ingredients.push({
        id: idMatch?.[1] || '',
        name: nameMatch[1],
        image: imageMatch?.[1] || 'PLACEHOLDER',
      })
    }
  }
  return ingredients
}

function updateImagePath(content, name, newPath) {
  const regex = new RegExp(
    `(name:\\s*'${escapeRegex(name)}'[\\s\\S]*?image:\\s*)PLACEHOLDER`,
  )
  const updated = content.replace(regex, `$1'${newPath}'`)
  if (updated === content) {
    console.warn(`  Warning: could not update image path for ${name}`)
  }
  return updated
}

async function searchPexels(query) {
  const params = new URLSearchParams({
    query,
    per_page: 5,
    orientation: 'square',
    size: 'medium',
    locale: 'zh-CN',
  })

  const res = await fetch(`${PEXELS_URL}?${params}`, {
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
  // Strip query params — Pexels CDN with query params may be blocked in some regions
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

async function main() {
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  const content = readFileSync(DATA_FILE, 'utf-8')
  const ingredients = parseIngredients(content)
  const toDownload = ingredients.filter(i => i.image === 'PLACEHOLDER')

  console.log(`共有 ${ingredients.length} 个食材，${toDownload.length} 个需要下载图片\n`)
  console.log(`速率限制: 每 ${DELAY_MS / 1000}s 一个请求 (约 ${Math.round(3600 / DELAY_MS * 1000)} 次/小时)\n`)

  let currentContent = content
  let downloaded = 0
  let skipped = 0
  let failed = []

  for (let i = 0; i < toDownload.length; i++) {
    const ing = toDownload[i]
    const filename = `${ing.name}.jpg`
    const filepath = join(OUTPUT_DIR, filename)
    const progress = `[${i + 1}/${toDownload.length}]`

    if (existsSync(filepath)) {
      console.log(`${progress} ${ing.name} — 已存在，跳过`)
      skipped++
      // Still update the TS file in case it wasn't done
      if (currentContent.includes(`name: '${ing.name}'`)) {
        currentContent = updateImagePath(currentContent, ing.name, `/images/ingredients/${filename}`)
      }
      continue
    }

    try {
      console.log(`${progress} 搜索: ${ing.name}...`)
      const photos = await searchPexels(ing.name)

      if (photos.length === 0) {
        console.log(`  → 无结果，加入失败列表`)
        failed.push(ing.name)
        // Save progress even on failure
        writeFileSync(join(ROOT, 'scripts', '.download-progress.json'), JSON.stringify({ failed, lastIndex: i }, null, 2))
        continue
      }

      const photo = photos[0]
      console.log(`  → 下载: ${photo.photographer}`)
      await downloadImage(photo.src.medium, filepath)

      // Update TS data file
      currentContent = updateImagePath(currentContent, ing.name, `/images/ingredients/${filename}`)
      writeFileSync(DATA_FILE, currentContent, 'utf-8')

      downloaded++
      console.log(`  → 已保存: ${filename}`)

      // Rate limit
      if (i < toDownload.length - 1) {
        await sleep(DELAY_MS)
      }
    } catch (err) {
      console.error(`  → 错误: ${err.message}`)
      failed.push(ing.name)
      // Save progress
      writeFileSync(join(ROOT, 'scripts', '.download-progress.json'), JSON.stringify({ failed, lastIndex: i }, null, 2))
      await sleep(5000)
    }
  }

  // Final write
  writeFileSync(DATA_FILE, currentContent, 'utf-8')

  console.log(`\n===== 完成 =====`)
  console.log(`下载成功: ${downloaded}`)
  console.log(`已存在跳过: ${skipped}`)
  console.log(`失败: ${failed.length}`)
  if (failed.length > 0) {
    console.log(`失败列表: ${failed.join(', ')}`)
    console.log(`\n失败项已保存到 scripts/.download-progress.json，可稍后重试`)
  }

  // Clean up progress file on full success
  if (failed.length === 0) {
    try {
      const progressFile = join(ROOT, 'scripts', '.download-progress.json')
      if (existsSync(progressFile)) {
        const { unlinkSync } = await import('fs')
        unlinkSync(progressFile)
      }
    } catch {}
  }
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})

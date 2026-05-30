import { writeFileSync } from 'fs'
import { join } from 'path'

const ROOT = process.cwd()
const API_KEY = 'o9PrRJ8CCFLfCIOwNT2xeDIvbSCnRa96QqXTUEllmbdGP5lh0QpX6LuF'
const OUTPUT_DIR = join(ROOT, 'public', 'images', 'ingredients')

const MISSING = [
  { id: 'ing-19', name: '生菜', query: 'lettuce vegetable fresh' },
  { id: 'ing-103', name: '羊腿', query: 'lamb leg meat' },
  { id: 'ing-158', name: '鳗鱼', query: 'eel fish fresh' },
  { id: 'ing-183', name: '银耳', query: 'white fungus tremella food' },
]

async function downloadImage(name, query) {
  const searchUrl = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=3&orientation=landscape`
  const res = await fetch(searchUrl, { headers: { Authorization: API_KEY } })
  const data = await res.json()

  if (!data.photos?.length) {
    console.log(`  ✗ No results for ${name}`)
    return false
  }

  for (const photo of data.photos) {
    const url = photo.src.large2x || photo.src.large || photo.src.original
    try {
      const imgRes = await fetch(url, { signal: AbortSignal.timeout(30000) })
      if (!imgRes.ok) continue
      const buffer = Buffer.from(await imgRes.arrayBuffer())
      const filePath = join(OUTPUT_DIR, `${name}.jpg`)
      writeFileSync(filePath, buffer)
      console.log(`  ✓ ${name} — ${(buffer.length / 1024).toFixed(0)}KB`)
      return true
    } catch (e) {
      console.log(`  ⚠ retry for ${name}: ${e.message}`)
    }
  }
  console.log(`  ✗ All sources failed for ${name}`)
  return false
}

async function main() {
  console.log('Downloading 4 missing ingredient images...\n')
  for (const item of MISSING) {
    console.log(`${item.name} (${item.query})`)
    await downloadImage(item.name, item.query)
    await new Promise(r => setTimeout(r, 2000))
  }
  console.log('\nDone.')
}

main()

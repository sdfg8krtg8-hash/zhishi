import { readdirSync, statSync, renameSync, unlinkSync } from 'fs'
import { join } from 'path'
import sharp from 'sharp'

const ROOT = process.cwd()
const DIR = join(ROOT, 'public', 'images', 'ingredients')

const files = readdirSync(DIR).filter(f => /\.(jpg|jpeg|png)$/i.test(f))

console.log(`Found ${files.length} images to compress\n`)

let totalBefore = 0
let totalAfter = 0

for (const file of files) {
  const filePath = join(DIR, file)
  const before = statSync(filePath).size
  totalBefore += before

  try {
    const tmpPath = filePath + '.tmp'
    await sharp(filePath)
      .resize(400, undefined, { withoutEnlargement: true })
      .jpeg({ quality: 80, progressive: true })
      .toFile(tmpPath)

    unlinkSync(filePath)
    renameSync(tmpPath, filePath)
    const after = statSync(filePath).size
    totalAfter += after

    const pct = ((1 - after / before) * 100).toFixed(0)
    console.log(`  ${file}: ${(before/1024).toFixed(0)}KB → ${(after/1024).toFixed(0)}KB (-${pct}%)`)
  } catch (e) {
    console.log(`  ✗ ${file}: ${e.message}`)
  }
}

const totalPct = ((1 - totalAfter / totalBefore) * 100).toFixed(0)
console.log(`\nTotal: ${(totalBefore/1024/1024).toFixed(1)}MB → ${(totalAfter/1024/1024).toFixed(1)}MB (-${totalPct}%)`)

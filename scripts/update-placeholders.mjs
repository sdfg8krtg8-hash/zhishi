import { readFileSync, writeFileSync } from 'fs'

const DELETED = [
  '土豆','番茄','猪肉','豆腐','大米','青菜','虾','白菜','黄瓜',
  '胡萝卜','茄子','豆角','青椒','西兰花','菜花','菠菜','芹菜',
  '大蒜','牛肉','五花肉','鸡腿','鸡胸','猪里脊','香蕉','丝瓜',
  '梨','鸡翅',
]

let content = readFileSync('src/data/ingredients.ts', 'utf-8')
let count = 0

for (const name of DELETED) {
  // Each ingredient block has: name: 'NAME', ... image: 'path'
  // Match from name to the image field
  const pattern = new RegExp(
    `(name:\\s*'${escapeRegex(name)}'[\\s\\S]*?image:\\s*)'[^']+'`,
    'g'
  )
  const newContent = content.replace(pattern, `$1PLACEHOLDER`)
  if (newContent !== content) {
    count++
    content = newContent
    console.log(`  ✓ ${name} → PLACEHOLDER`)
  } else {
    console.log(`  ✗ ${name} — not found`)
  }
}

writeFileSync('src/data/ingredients.ts', content)
console.log(`\nUpdated ${count} ingredients to PLACEHOLDER`)

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

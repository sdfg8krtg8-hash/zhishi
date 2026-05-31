import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'fs'
import { join } from 'path'
import { createHash } from 'crypto'

const ING_TS = join(process.cwd(), 'src/data/ingredients.ts')

async function main() {
  const ingMod = await import('file:///C:/Users/23371/Desktop/sp/sp/src/data/ingredients.ts?t=' + Date.now())
  const ingredients = ingMod.ingredients

  // Count corrupted entries
  let corruptions = 0
  let missingFiles = 0

  for (const ing of ingredients) {
    // Reset ALL known duplicate groups to PLACEHOLDER
    const dupGroups = [
      ['土豆', '豆腐'], ['青菜', '虾'], ['韭菜', '山药'],
      ['鲫鱼', '鳕鱼'], ['干辣椒', '麻椒'], ['香菜', '包菜'],
      ['青蒜', '冬笋'], ['枸杞', '牛蛙'], ['鱼头', '海参'],
      ['蛋清', '米饭'],
      ['白菜', '剁椒'], // from earlier fix
    ]
    const dupNames = new Set(dupGroups.flat())
    if (dupNames.has(ing.name)) {
      // Delete the duplicate file from disk
      const fp = join(process.cwd(), 'public', 'images', 'ingredients', ing.name + '.jpg')
      try { unlinkSync(fp) } catch {}
      ing.image = 'PLACEHOLDER'
      corruptions++
    }

    // Check if image file actually exists
    if (ing.image !== 'PLACEHOLDER') {
      const fp = join(process.cwd(), 'public', ing.image)
      if (!existsSync(fp)) {
        console.log('图片缺失: ' + ing.name + ' → ' + ing.image)
        ing.image = 'PLACEHOLDER'
        missingFiles++
      }
    }
  }

  console.log('修复: ' + corruptions + ' 个, 缺失文件: ' + missingFiles)

  // Rebuild file
  let ts = `import type { Ingredient } from '@/types/ingredient'

export const PLACEHOLDER = '/images/placeholders/placeholder.svg'

export const ingredients: Ingredient[] = [
`
  for (const ing of ingredients) {
    ts += `  {
    id: '${ing.id}',
    name: '${ing.name}',
    alias: ${JSON.stringify(ing.alias)},
    category: '${ing.category}',
    description: '${ing.description}',
    tips: '${ing.tips}',
    storage: '${ing.storage}',
    pairings: ${JSON.stringify(ing.pairings)},
    relatedRecipeIds: ${JSON.stringify(ing.relatedRecipeIds)},
    image: '${ing.image}'
  },
`
  }
  ts += ']\n'
  writeFileSync(ING_TS, ts)

  // Verify no duplicates
  const ingMod2 = await import('file:///C:/Users/23371/Desktop/sp/sp/src/data/ingredients.ts?t=' + Date.now() + 99)
  const ings = ingMod2.ingredients
  const hashMap = {}

  for (const ing of ings) {
    if (ing.image === 'PLACEHOLDER') continue
    const fp = join(process.cwd(), 'public', ing.image)
    if (existsSync(fp)) {
      const hash = createHash('md5').update(readFileSync(fp)).digest('hex')
      if (!hashMap[hash]) hashMap[hash] = []
      hashMap[hash].push(ing.name)
    }
  }

  const dups = Object.entries(hashMap).filter(([, names]) => names.length > 1)
  console.log('\n重复图片: ' + dups.length + ' 组')
  if (dups.length > 0) dups.forEach(([, names]) => console.log('  ✗ ' + names.join(' = ')))

  const withImg = ings.filter(i => i.image !== 'PLACEHOLDER').length
  const ph = ings.filter(i => i.image === 'PLACEHOLDER').length
  const used = ings.filter(i => i.relatedRecipeIds && i.relatedRecipeIds.length > 0).length
  console.log('总数: ' + ings.length + ', 有图: ' + withImg + ', 缺图: ' + ph + ', 使用中: ' + used)
  console.log('唯一图片hash: ' + Object.keys(hashMap).length)
}

main().catch(err => { console.error(err.message); process.exit(1) })

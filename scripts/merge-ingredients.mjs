import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const ING_TS = join(process.cwd(), 'src', 'data', 'ingredients.ts')
const REC_TS = join(process.cwd(), 'src', 'data', 'recipes.ts')
const PLACEHOLDER_FILE = join(process.cwd(), 'scripts', 'placeholder-list.json')
const PROGRESS_FILE = join(process.cwd(), 'scripts', 'batch-progress.json')

// Merge plan: { keep: '主要名', merge: ['细分1', ...], addNew: bool }
// If addNew is true and keep doesn't exist, create it
const MERGE_PLAN = [
  { keep: '牛肉', merge: ['牛肉末', '牛腩', '牛里脊', '牛骨', '牛舌', '牛肚'] },
  { keep: '猪肉', merge: ['五花肉', '猪里脊', '排骨', '猪蹄', '猪肘', '猪肝', '猪心', '猪肚', '猪大肠', '猪腰', '猪血丸子', '咸肉', '午餐肉'] },
  { keep: '鸡肉', merge: ['鸡腿', '鸡胸', '鸡翅', '鸡爪', '鸡架', '整鸡', '三黄鸡', '鸡胗', '鸡心', '鸡肝', '鸡胸肉'] },
  { keep: '鸭肉', merge: ['鸭腿', '鸭脖', '鸭翅', '鸭掌', '整鸭', '鸭血', '鹅肉'], addNew: true },
  { keep: '羊肉', merge: ['羊腿', '羊蝎子', '羊肉卷'], addNew: true },
  { keep: '虾', merge: ['基围虾', '明虾', '河虾', '小龙虾', '皮皮虾'] },
  { keep: '螃蟹', merge: ['大闸蟹', '梭子蟹', '面包蟹'], addNew: true },
  { keep: '贝类', merge: ['花甲', '蛏子', '蛤蜊', '蚬子', '扇贝', '海蚌', '香螺', '鲍鱼', '干贝'], addNew: true },
  { keep: '豆腐', merge: ['嫩豆腐', '老豆腐', '北豆腐', '南豆腐', '千页豆腐', '豆腐脑', '毛豆腐'] },
  { keep: '豆干', merge: ['香干', '豆腐干'] },
  { keep: '豆皮', merge: ['豆油皮', '豆腐皮'] },
  { keep: '油豆腐', merge: ['豆泡'] },
]

// New ingredient definitions
const NEW_INGREDIENTS = {
  '鸭肉': { category: '肉类', alias: ['鸭子'], description: '鸭肉是常见的禽肉类食材，肉质紧实，适合烤、炖、卤等多种烹饪方式。', tips: '挑选皮色乳白、肉质结实、无异味的鸭肉为佳。', storage: '冷冻保存，可保存3-6个月。', pairings: ['姜', '酱油', '八角', '桂皮'] },
  '羊肉': { category: '肉类', alias: ['羊羔肉'], description: '羊肉是常见的红肉食材，肉质鲜美，适合炖、涮、烤等多种烹饪方式。', tips: '挑选色泽鲜红、脂肪洁白、无膻臭味过重的羊肉。', storage: '冷冻保存，可保存3-6个月。', pairings: ['孜然', '洋葱', '胡萝卜', '姜'] },
  '螃蟹': { category: '水产', alias: ['蟹'], description: '螃蟹是常见的甲壳类水产食材，肉质鲜美，富含蛋白质。', tips: '挑选活力强、蟹壳硬实、腹部洁白的活蟹。', storage: '冷藏保存活蟹，烹饪后尽快食用。', pairings: ['姜', '醋', '蒜'] },
  '贝类': { category: '水产', alias: ['贝', '贝壳'], description: '贝类水产食材种类丰富，肉质鲜嫩，适合蒸、煮、炒、烤。', tips: '挑选贝壳闭合紧密、触之能闭合的活贝为佳。', storage: '冷藏保存，吐沙后烹饪。', pairings: ['蒜', '姜', '粉丝', '葱'] },
}

async function main() {
  const ingMod = await import('file:///C:/Users/23371/Desktop/sp/sp/src/data/ingredients.ts?t=' + Date.now())
  const ingredients = ingMod.ingredients

  // Build merge map: sub-name → main-name
  const mergeMap = {}
  const allMergeTargets = new Set()
  for (const g of MERGE_PLAN) {
    allMergeTargets.add(g.keep)
    for (const m of g.merge) mergeMap[m] = g.keep
  }

  const namesToRemove = new Set(Object.keys(mergeMap))
  const namesToAdd = new Set()
  for (const g of MERGE_PLAN) {
    if (g.addNew && !ingredients.find(i => i.name === g.keep)) {
      namesToAdd.add(g.keep)
    }
  }

  console.log('删除 ' + namesToRemove.size + ' 个细分食材')
  console.log('新增 ' + namesToAdd.size + ' 个主类食材')
  console.log('')

  // === Step 1: Update recipes.ts ===
  let recTxt = readFileSync(REC_TS, 'utf-8')
  let recipeChanges = 0
  for (const [sub, main] of Object.entries(mergeMap)) {
    const regex = new RegExp(`(name:\\s*)'${sub.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`, 'g')
    const count = (recTxt.match(regex) || []).length
    if (count > 0) {
      recTxt = recTxt.replace(regex, `$1'${main}'`)
      recipeChanges += count
      console.log(`  食谱: '${sub}' → '${main}' (${count}处)`)
    }
  }
  writeFileSync(REC_TS, recTxt)
  console.log(`食谱更新完成，共 ${recipeChanges} 处修改\n`)

  // === Step 2: Build new ingredients list ===
  // Keep ingredients not in removal set, then add new ones
  const kept = ingredients.filter(i => !namesToRemove.has(i.name))
  const maxId = Math.max(...ingredients.map(i => parseInt(i.id.replace('ing-', ''))))
  let nextId = maxId + 1

  console.log('保留 ' + kept.length + ' 个食材，新增 ' + namesToAdd.size + ' 个')

  // Generate new ingredient entries as TS text
  let newEntries = ''
  for (const name of namesToAdd) {
    const info = NEW_INGREDIENTS[name]
    newEntries += `  {
    id: 'ing-${nextId}',
    name: '${name}',
    alias: ${JSON.stringify(info.alias)},
    category: '${info.category}',
    description: '${info.description}',
    tips: '${info.tips}',
    storage: '${info.storage}',
    pairings: ${JSON.stringify(info.pairings)},
    relatedRecipeIds: [],
    image: 'PLACEHOLDER'
  },
`
    nextId++
  }

  // Rebuild ingredients.ts
  // Strategy: export the entire array as TS
  let ts = `import type { Ingredient } from '@/types/ingredient'

export const PLACEHOLDER = '/images/placeholders/placeholder.svg'

export const ingredients: Ingredient[] = [
`
  for (const ing of kept) {
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
  ts += newEntries
  ts += ']\n'

  writeFileSync(ING_TS, ts)
  console.log(`ingredients.ts 更新: ${kept.length + namesToAdd.size} 个食材 (${kept.length} 保留 + ${namesToAdd.size} 新增)\n`)

  // === Step 3: Update placeholder-list.json ===
  const placeholderList = JSON.parse(readFileSync(PLACEHOLDER_FILE, 'utf-8'))
  // Remove merged items, add new ones
  const newPlaceholders = placeholderList.filter(p => !namesToRemove.has(p.name))
  for (const name of namesToAdd) {
    if (!newPlaceholders.find(p => p.name === name)) {
      newPlaceholders.push({ name, category: NEW_INGREDIENTS[name].category })
    }
  }
  writeFileSync(PLACEHOLDER_FILE, JSON.stringify(newPlaceholders, null, 2))
  console.log(`placeholder-list.json: ${newPlaceholders.length} 项 (删除 ${placeholderList.length - newPlaceholders.length + namesToAdd.size} 项)\n`)

  // === Step 4: Clean progress file ===
  if (require('fs').existsSync(PROGRESS_FILE)) {
    const progress = JSON.parse(readFileSync(PROGRESS_FILE, 'utf-8'))
    for (const name of namesToRemove) delete progress[name]
    writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2))
    console.log(`progress file cleaned: ${Object.keys(progress).length} entries\n`)
  }

  // === Summary ===
  console.log('===== 合并完成 =====')
  console.log('删除: ' + namesToRemove.size + ' 个细分食材')
  console.log('新增: ' + namesToAdd.size + ' 个主类食材')
  console.log('食谱修改: ' + recipeChanges + ' 处')
  const newIngMod = await import('file:///C:/Users/23371/Desktop/sp/sp/src/data/ingredients.ts?t=' + Date.now() + 1)
  console.log('最终食材总数: ' + newIngMod.ingredients.length)
}

main().catch(e => { console.error(e.message); process.exit(1) })

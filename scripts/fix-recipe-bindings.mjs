import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const ING_TS = join(process.cwd(), 'src', 'data', 'ingredients.ts')
const REC_TS = join(process.cwd(), 'src', 'data', 'recipes.ts')

// Map recipe ingredient names → correct ingredient list names
const NAME_FIX = {
  '姜': '生姜',
  '蒜': '大蒜',
  '葱': '大葱',
  '隔夜米饭': '米饭',
  '猪肉末': '猪肉',
  '青蒜苗': '青蒜',
  '花生米': '花生',
  '花椒粉': '花椒',
  '花生碎': '花生',
  '高汤': '鸡汤',
  '大虾': '虾',
  '鸭': '鸭肉',
  '麦芽糖': '糖',
  '白醋': '醋',
  '虾仁': '虾',
  '柠檬叶': '柠檬',
  '桂鱼': '鳜鱼',
  '冰糖': '糖',
  '桂花糖': '糖',
  '红糖': '糖',
  '鸡': '鸡肉',
  '猪前腿肉': '猪肉',
  '鸡杂（鸡胗/鸡心/鸡肝）': '鸡肉',
  '海蛎（牡蛎）': '贝类',
  '淀粉（地瓜粉最佳）': '淀粉',
  '白胡椒粉': '胡椒粉',
  '老姜': '生姜',
  '麻油': '香油',
  // 火腿 is a real ingredient different from 素火腿, add it
  '火腿': '火腿',
}

async function main() {
  const ingMod = await import('file:///C:/Users/23371/Desktop/sp/sp/src/data/ingredients.ts?t=' + Date.now())
  const ingredients = ingMod.ingredients
  const ingNames = new Set(ingredients.map(i => i.name))

  console.log('=== Step 1: Fix recipe ingredient names ===')
  let recTxt = readFileSync(REC_TS, 'utf-8')
  let totalFixes = 0

  // Check if 火腿 exists, if not we need to add it
  const hasHam = ingredients.find(i => i.name === '火腿')

  for (const [oldName, newName] of Object.entries(NAME_FIX)) {
    // Skip if new name doesn't exist in ingredients (handle 火腿 separately)
    if (newName === '火腿' && !hasHam) {
      console.log('  火腿: 食材列表中不存在，需要新增')
      continue
    }
    if (!ingNames.has(newName)) {
      console.log('  ' + newName + ': 目标食材不存在，跳过')
      continue
    }

    // Count and replace
    const regex = new RegExp(`(name:\\s*)'${oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`, 'g')
    const count = (recTxt.match(regex) || []).length
    if (count > 0) {
      recTxt = recTxt.replace(regex, `$1'${newName}'`)
      totalFixes += count
      console.log(`  '${oldName}' → '${newName}' (${count}处)`)
    }
  }

  writeFileSync(REC_TS, recTxt)
  console.log(`食谱修正: ${totalFixes} 处\n`)

  // === Step 2: Add 火腿 if needed ===
  if (!hasHam && NAME_FIX['火腿']) {
    console.log('=== Step 2: 新增 火腿 ===')
    // Import current ingredients, add 火腿
    const ingTxt = readFileSync(ING_TS, 'utf-8')
    const maxId = Math.max(...[...ingTxt.matchAll(/id:\s*'ing-(\d+)'/g)].map(m => parseInt(m[1])))
    const newId = maxId + 1

    const hamEntry = `  {
    id: 'ing-${newId}',
    name: '火腿',
    alias: ['金华火腿', '宣威火腿'],
    category: '肉类',
    description: '火腿是经过腌制发酵的猪腿，风味浓郁，是中餐烹饪中重要的提鲜食材。',
    tips: '挑选肉质紧实、色泽红润、有发酵香味的火腿。',
    storage: '整腿悬挂阴凉通风处；切片后密封冷藏或冷冻。',
    pairings: ['冬瓜', '白菜', '豆腐', '笋'],
    relatedRecipeIds: [],
    image: 'PLACEHOLDER'
  },
`
    // Insert before the closing ]
    const closeIdx = ingTxt.lastIndexOf('\n]')
    const newIngTxt = ingTxt.slice(0, closeIdx) + '\n' + hamEntry + ingTxt.slice(closeIdx)
    writeFileSync(ING_TS, newIngTxt)
    console.log(`  ing-${newId} 火腿 已添加\n`)
  }

  // === Step 3: Build recipe ingredient usage ===
  console.log('=== Step 3: 绑定 relatedRecipeIds ===')
  const recTxt2 = readFileSync(REC_TS, 'utf-8')
  const recipeBlocks = recTxt2.split(/(?=\s+\{[\s\n]*id:)/)

  // Build usage map: ingredientName → [recipeIds]
  const usage = {}
  recipeBlocks.forEach(block => {
    const idMatch = block.match(/id:\s*'([^']+)'/)
    const nameMatch = block.match(/name:\s*'([^']+)'/)
    if (!idMatch || !nameMatch) return
    const rid = idMatch[1]
    const rname = nameMatch[1]

    // Extract ingredients from this recipe
    const ingSection = block.match(/ingredients:\s*\[([\s\S]*?)\]/)
    if (ingSection) {
      const ingRegex = /name:\s*'([^']+)'/g
      let m
      while ((m = ingRegex.exec(ingSection[1])) !== null) {
        const name = m[1]
        if (!usage[name]) usage[name] = []
        if (!usage[name].includes(rid)) usage[name].push(rid)
      }
    }
  })

  // Update ingredients.ts with relatedRecipeIds
  let ingTxt2 = readFileSync(ING_TS, 'utf-8')
  let bindCount = 0

  for (const [name, recipeIds] of Object.entries(usage)) {
    if (recipeIds.length === 0) continue

    // Find the ingredient block and update relatedRecipeIds
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    // Match from the ingredient's name to its relatedRecipeIds
    const pattern = new RegExp(
      `(name:\\s*'${escapedName}'[\\s\\S]*?relatedRecipeIds:\\s*)\\[[^\\]]*\\]`,
      'm'
    )

    const newIds = JSON.stringify(recipeIds)
    const replaced = ingTxt2.replace(pattern, `$1${newIds}`)

    if (replaced !== ingTxt2) {
      ingTxt2 = replaced
      bindCount++
      if (recipeIds.length >= 3) {
        console.log(`  ${name} → [${recipeIds.slice(0,3).join(', ')}...] (${recipeIds.length}个)`)
      }
    }
  }

  writeFileSync(ING_TS, ingTxt2)
  console.log(`绑定完成: ${bindCount} 个食材\n`)

  // === Step 4: Final stats ===
  const ingMod2 = await import('file:///C:/Users/23371/Desktop/sp/sp/src/data/ingredients.ts?t=' + Date.now() + 2)
  const ings = ingMod2.ingredients
  const total = ings.length
  const withImg = ings.filter(i => i.image !== 'PLACEHOLDER').length
  const placeholder = ings.filter(i => i.image === 'PLACEHOLDER').length
  const used = ings.filter(i => i.relatedRecipeIds && i.relatedRecipeIds.length > 0).length
  const unused = total - used

  // Top priority: used ingredients without images
  const priority = ings
    .filter(i => i.image === 'PLACEHOLDER' && i.relatedRecipeIds && i.relatedRecipeIds.length > 0)
    .sort((a, b) => b.relatedRecipeIds.length - a.relatedRecipeIds.length)

  console.log('===== 最终统计 =====')
  console.log('食材总数:', total)
  console.log('有图:', withImg)
  console.log('缺图:', placeholder)
  console.log('食谱使用中:', used)
  console.log('未在食谱中:', unused)
  console.log('')
  console.log('=== 优先下载清单(食谱使用+缺图) Top 30 ===')
  priority.slice(0, 30).forEach((ing, i) => {
    console.log(`${i+1}. ${ing.name} (${ing.category}, ${ing.relatedRecipeIds.length}个食谱)`)
  })
}

main().catch(e => { console.error(e.message); process.exit(1) })

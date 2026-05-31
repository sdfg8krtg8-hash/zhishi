import { writeFileSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'

const ING_TS = join(process.cwd(), 'src', 'data', 'ingredients.ts')
const REC_TS = join(process.cwd(), 'src', 'data', 'recipes.ts')
const PLACEHOLDER_FILE = join(process.cwd(), 'scripts', 'placeholder-list.json')
const PROGRESS_FILES = [
  join(process.cwd(), 'scripts', 'batch-progress.json'),
  join(process.cwd(), 'scripts', 'priority-progress.json'),
  join(process.cwd(), 'scripts', 'pexels-progress.json'),
]

// ===== MERGE PLAN: sub-name → main-name =====
const MERGE_MAP = {
  '彩椒': '青椒',
  '上海青': '青菜',
  '油菜': '青菜',
  '八爪鱼': '章鱼',
  '凤尾菇': '平菇',
  '芸豆': '豆角',
  '荸荠': '马蹄',
  '紫薯': '红薯',
  '蒸鱼豉油': '酱油',
  '小米辣': '辣椒',
  '挂面': '面条',
  '方便面': '面条',
  '意大利面': '面条',
  '通心粉': '面条',
  '荞麦面': '面条',
  '花椒油': '花椒',
}

// ===== DELETE LIST =====
const DELETE_SET = new Set([
  // 蔬菜 (9)
  '茭白', '芦笋', '香椿', '毛豆', '四季豆', '荷兰豆', '豌豆', '海带', '紫菜',
  // 禽蛋 (2)
  '鹅蛋', '鹌鹑蛋',
  // 肉类 (3)
  '兔肉', '驴肉', '鹿肉',
  // 豆制品 (3)
  '素鸡', '素火腿', '纳豆',
  // 主食 (18)
  '小米', '黑米', '糙米', '玉米面', '饺子皮', '馄饨皮', '包子皮',
  '馒头', '花卷', '饼', '油条', '包子', '饺子', '馄饨', '烧麦',
  '藜麦', '红豆', '绿豆',
  // 水产 (6)
  '巴沙鱼', '龙利鱼', '鲶鱼', '黑鱼', '鳗鱼', '泥鳅',
  // 水果 (25)
  '橘子', '柚子', '蓝莓', '哈密瓜', '李子', '梨', '樱桃',
  '火龙果', '凤梨', '木瓜', '榴莲', '山竹', '荔枝', '龙眼',
  '杨梅', '枇杷', '柿子', '无花果', '牛油果', '百香果', '西柚',
  '蔓越莓', '树莓', '桑葚', '甘蔗',
  // 菌菇 (13)
  '口蘑', '蟹味菇', '白玉菇', '茶树菇', '猴头菇', '竹荪',
  '牛肝菌', '羊肚菌', '鸡枞菌', '松茸', '松露', '鸡腿菇', '草菇',
  // 调味品 (11)
  '鸡精', '味精', '香叶', '十三香', '黄豆酱', '辣椒酱', '沙拉酱',
  '花生酱', '火锅底料', '咖喱块', '葛粉',
])

function escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }

async function main() {
  const ingMod = await import('file:///C:/Users/23371/Desktop/sp/sp/src/data/ingredients.ts?t=' + Date.now())
  const ingredients = ingMod.ingredients

  const allMergeTargets = new Set(Object.values(MERGE_MAP))
  const namesToRemove = new Set([...Object.keys(MERGE_MAP), ...DELETE_SET])

  // Validate
  const ingNames = new Set(ingredients.map(i => i.name))
  for (const name of Object.keys(MERGE_MAP)) {
    if (!ingNames.has(name)) console.log(`WARN: 合并源 "${name}" 不在食材列表中`)
    if (!ingNames.has(MERGE_MAP[name])) console.log(`WARN: 合并目标 "${MERGE_MAP[name]}" 不在食材列表中`)
  }
  for (const name of DELETE_SET) {
    if (!ingNames.has(name)) console.log(`WARN: 删除 "${name}" 不在食材列表中`)
  }

  // ===== Step 1: Update recipes.ts =====
  console.log('=== Step 1: 更新食谱引用 ===')
  let recTxt = readFileSync(REC_TS, 'utf-8')
  let recipeChanges = 0

  for (const [sub, main] of Object.entries(MERGE_MAP)) {
    const regex = new RegExp(`(name:\\s*)'${escapeRegex(sub)}'`, 'g')
    const count = (recTxt.match(regex) || []).length
    if (count > 0) {
      recTxt = recTxt.replace(regex, `$1'${main}'`)
      recipeChanges += count
      console.log(`  食谱: '${sub}' → '${main}' (${count}处)`)
    }
  }
  writeFileSync(REC_TS, recTxt)
  console.log(`食谱更新: ${recipeChanges} 处\n`)

  // ===== Step 2: Rebuild ingredients.ts =====
  console.log('=== Step 2: 重建食材列表 ===')
  const beforeCount = ingredients.length
  const kept = ingredients.filter(i => !namesToRemove.has(i.name))
  const removedMerge = ingredients.filter(i => Object.keys(MERGE_MAP).includes(i.name))
  const removedDelete = ingredients.filter(i => DELETE_SET.has(i.name))

  console.log(`删除合并项: ${removedMerge.length}`)
  removedMerge.forEach(i => console.log(`  - ${i.name} → ${MERGE_MAP[i.name]}`))
  console.log(`删除冷门项: ${removedDelete.length}`)
  removedDelete.forEach(i => console.log(`  - ${i.name} [${i.category}]`))
  console.log(`保留: ${kept.length}`)

  // Rebuild TS file
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
  ts += ']\n'
  writeFileSync(ING_TS, ts)
  console.log(`食材: ${beforeCount} → ${kept.length} (-${beforeCount - kept.length})\n`)

  // ===== Step 3: Update placeholder-list.json =====
  console.log('=== Step 3: 更新 placeholder-list.json ===')
  if (existsSync(PLACEHOLDER_FILE)) {
    const phList = JSON.parse(readFileSync(PLACEHOLDER_FILE, 'utf-8'))
    const before = phList.length
    const newPh = phList.filter(p => !namesToRemove.has(p.name))
    writeFileSync(PLACEHOLDER_FILE, JSON.stringify(newPh, null, 2))
    console.log(`placeholder: ${before} → ${newPh.length}\n`)
  }

  // ===== Step 4: Clean progress files =====
  console.log('=== Step 4: 清理 progress 文件 ===')
  for (const pf of PROGRESS_FILES) {
    if (existsSync(pf)) {
      const data = JSON.parse(readFileSync(pf, 'utf-8'))
      let cleaned = 0
      for (const name of namesToRemove) {
        if (data[name]) { delete data[name]; cleaned++ }
      }
      writeFileSync(pf, JSON.stringify(data, null, 2))
      console.log(`  ${pf.replace(/.*[\\/]/, '')}: 清理 ${cleaned} 项, 剩余 ${Object.keys(data).length}`)
    }
  }

  // ===== Step 5: Final stats =====
  console.log('\n===== 清理完成 =====')
  const ingMod2 = await import('file:///C:/Users/23371/Desktop/sp/sp/src/data/ingredients.ts?t=' + Date.now() + 99)
  const ings = ingMod2.ingredients
  const total = ings.length
  const withImg = ings.filter(i => i.image !== 'PLACEHOLDER').length
  const ph = ings.filter(i => i.image === 'PLACEHOLDER').length
  const used = ings.filter(i => i.relatedRecipeIds && i.relatedRecipeIds.length > 0).length
  const unused = total - used

  // By category
  const byCat = {}
  ings.forEach(i => {
    if (!byCat[i.category]) byCat[i.category] = 0
    byCat[i.category]++
  })

  console.log(`总数: ${total}, 有图: ${withImg}, 缺图: ${ph}, 使用中: ${used}, 未用: ${unused}`)
  console.log('\n分类统计:')
  for (const [cat, count] of Object.entries(byCat).sort((a,b) => b[1] - a[1])) {
    console.log(`  ${cat}: ${count}`)
  }

  console.log('\n未用食材:')
  ings.filter(i => !i.relatedRecipeIds || i.relatedRecipeIds.length === 0)
    .forEach(i => console.log(`  ${i.name} [${i.category}]`))
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1) })

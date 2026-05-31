import { existsSync, writeFileSync, readFileSync, statSync, renameSync, unlinkSync } from 'fs'
import { join } from 'path'
import { request } from 'https'
import sharp from 'sharp'
import { ProxyAgent, fetch } from 'undici'

const PROXY = 'http://127.0.0.1:7897'
const dispatcher = new ProxyAgent({ uri: PROXY, requestTls: { rejectUnauthorized: false } })
const wikiFetch = (url, opts = {}) => fetch(url, { ...opts, dispatcher, signal: opts.signal || AbortSignal.timeout(20000) })

const OUT = join(process.cwd(), 'public', 'images', 'ingredients')
const ING_TS = join(process.cwd(), 'src', 'data', 'ingredients.ts')
const PROGRESS_FILE = join(process.cwd(), 'scripts', 'priority-progress.json')

const PEXELS_KEY = process.env.PEXELS_KEY || ''
const DOUBAO_KEY = process.env.DOUBAO_KEY || ''
const DOUBAO_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions'
const MODEL = 'doubao-seed-1-6-vision-250815'
const sleep = ms => new Promise(r => setTimeout(r, ms))

// Pexels search queries optimized for Chinese ingredients
function pexelsQuery(item) {
  const n = item.name
  const cat = item.category
  const queries = {
    // Condiments - use English terms Pexels can find
    '生抽': 'soy sauce bottle condiment', '老抽': 'dark soy sauce cooking', '酱油': 'soy sauce glass bottle',
    '蚝油': 'oyster sauce cooking condiment', '淀粉': 'cornstarch white powder baking',
    '干辣椒': 'dried red chili pepper', '花椒': 'sichuan peppercorn spice',
    '八角': 'star anise spice dried', '胡椒粉': 'white pepper powder ground spice',
    '辣椒油': 'chili oil red cooking', '香油': 'sesame oil bottle',
    '蒸鱼豉油': 'soy sauce bottle cooking', '芥末': 'wasabi green paste condiment',
    '沙姜': 'galangal ginger root spice', '蒸肉粉': 'rice powder coating cooking',
    '红糟': 'red yeast rice wine cooking', '蜂蜜': 'honey jar glass golden',
    '白芝麻': 'white sesame seeds raw', '葛粉': 'arrowroot powder starch white',
    '鸡汤': 'chicken broth stock cooking', '荷叶': 'lotus leaf green dried',
    '五香粉': 'five spice powder chinese', '豆豉': 'fermented black beans douchi',
    // Vegetables
    '大蒜': 'garlic bulb fresh cloves', '香菇': 'shiitake mushroom fresh brown',
    '青菜': 'bok choy green vegetable', '木耳': 'wood ear black fungus mushroom',
    '香菜': 'cilantro fresh herb green', '泡椒': 'pickled chili pepper jar',
    '剁椒': 'chopped chili pepper condiment', '土豆': 'potato fresh raw whole',
    '马蹄': 'water chestnut fresh brown', '青蒜': 'green garlic leek vegetable',
    '白菜': 'napa cabbage whole vegetable', '茄子': 'eggplant purple fresh vegetable',
    '包菜': 'cabbage whole green round', '菜心': 'choy sum green vegetable',
    '蒜苔': 'garlic scape green stem', '酸萝卜': 'pickled radish white jar',
    '冬笋': 'bamboo shoot winter fresh', '蒲菜': 'cattail shoot vegetable stem',
    '梅干菜': 'dried mustard green preserved', '枸杞': 'goji berry dried red',
    // Tofu
    '豆腐': 'tofu white block soybean', '豆干': 'dried tofu pressed firm',
    // Meat
    '火腿': 'chinese ham cured meat', '腊肉': 'chinese bacon cured pork',
    '牛蛙': 'bullfrog frog meat food', '腊鱼': 'dried cured fish preserved',
    '鸽子': 'pigeon squab meat', '甲鱼': 'softshell turtle food',
    '毛肚': 'beef tripe stomach food', '黄喉': 'pork aorta food ingredient',
    '蛋饺': 'egg dumpling golden food',
    // Seafood
    '虾': 'shrimp raw fresh unpeeled', '贝类': 'shellfish clam oyster raw',
    '鲈鱼': 'sea bass fish fresh whole', '黄鳝': 'eel fish freshwater raw',
    '鳜鱼': 'mandarin fish fresh whole', '鱼头': 'salmon fish head fresh raw',
    '海参': 'sea cucumber dried beche de mer', '银鱼': 'whitebait small fish fresh',
    // Other
    '蛋清': 'egg white separated raw', '面条': 'noodle wheat fresh raw',
    '米饭': 'cooked rice steamed white', '粉丝': 'glass noodle vermicelli dried',
    '大米': 'rice grain raw uncooked white', '红薯': 'sweet potato fresh raw tuber',
    // Meat categories
    '鲤鱼': 'carp fish freshwater raw', '鲫鱼': 'crucian carp fish fresh',
  }
  if (queries[n]) return queries[n]
  // Default: use name + category context
  if (cat === '调味品') return `${n} condiment cooking ingredient`
  if (cat === '肉类') return `${n} raw meat food`
  if (cat === '水产') return `${n} seafood fresh raw`
  if (cat === '蔬菜') return `${n} fresh vegetable produce`
  if (cat === '菌菇') return `${n} mushroom fungus fresh`
  if (cat === '豆制品') return `${n} tofu soy food`
  if (cat === '主食') return `${n} food grain staple`
  return `${n} food ingredient`
}

// Doubao prompt
function makePrompt(name, cat) {
  if (cat === '调味品') {
    return `审核调味品"${name}"的图片。必须是该调味品本身的形态（粉末/颗粒/液体/酱料/完整香料），不能是含该调味品的菜肴/食物，不能混入其他食材。只回答"符合"或"不符合"，简要说明理由。`
  }
  if (cat === '肉类') {
    return `审核生鲜肉类"${name}"的图片。必须是未经烹饪的生肉（该部位本身），清晰可辨认。不能是活体动物，不能是烹饪后的熟肉/菜品，不能混入其他食材。只回答"符合"或"不符合"，简要说明理由。`
  }
  if (cat === '水产') {
    return `审核水产"${name}"的图片。必须是未经烹饪的生鲜状态（该品种本身），清晰可辨认。不能是活体观赏状态，不能是烹饪后的菜品，不能混入其他食材。只回答"符合"或"不符合"，简要说明理由。`
  }
  if (cat === '豆制品') {
    return `审核豆制品"${name}"的图片。必须是该豆制品本身的可食用状态。不能是烹饪后的菜品，不能混入其他食材。只回答"符合"或"不符合"，简要说明理由。`
  }
  if (cat === '主食') {
    return `审核主食/粮食类"${name}"的图片。必须是该食材的原始干燥/未烹饪状态。不能是烹饪后的菜品/熟食。只回答"符合"或"不符合"，简要说明理由。`
  }
  if (cat === '菌菇') {
    return `审核菌菇"${name}"的图片。必须是该菌菇的可食用状态（新鲜或干燥均可），不能与其他菌菇混淆。不能是长在野外的状态（采摘后的可以）。只回答"符合"或"不符合"，简要说明理由。`
  }
  if (cat === '禽蛋') {
    return `审核禽蛋"${name}"的图片。必须是该蛋类本身。生蛋/熟蛋/加工蛋均可。不能混入其他食材。只回答"符合"或"不符合"，简要说明理由。`
  }
  return `审核"${name}"的图片。必须是采摘后的新鲜${cat === '水果' ? '水果' : '蔬菜'}本身，不能长在植株/田地/藤蔓上，不能混入其他食材/物品，不能是花朵/植株/幼苗，不能是菜肴/烹饪过的。只回答"符合"或"不符合"，简要说明理由。`
}

// ====== Pexels API ======
async function searchPexels(query) {
  const params = new URLSearchParams({ query, per_page: 8, orientation: 'square', size: 'medium', locale: 'en-US' })
  try {
    const res = await fetch(`https://api.pexels.com/v1/search?${params}`, {
      headers: { Authorization: PEXELS_KEY },
      signal: AbortSignal.timeout(15000),
      dispatcher,
    })
    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get('Retry-After') || '30')
      console.log(`  Pexels限流, 等待${retryAfter}s...`)
      await sleep(retryAfter * 1000 + 1000)
      return searchPexels(query)
    }
    if (!res.ok) return []
    const data = await res.json()
    return (data.photos || []).map(p => ({
      url: p.src?.large || p.src?.medium || p.src?.original,
      w: p.width, h: p.height,
      source: 'pexels',
      title: p.alt || '',
    }))
  } catch (e) { console.log(`  Pexels err: ${e.message}`); return [] }
}

// ====== Wikimedia API ======
async function searchWiki(query) {
  const params = new URLSearchParams({ action: 'query', list: 'search', srsearch: query, srnamespace: '6', srlimit: '10', format: 'json', origin: '*' })
  try {
    const res = await wikiFetch('https://commons.wikimedia.org/w/api.php?' + params)
    const d = JSON.parse(await res.text())
    return d.query?.search || []
  } catch { return [] }
}

async function getWikiImageUrls(titles) {
  const params = new URLSearchParams({ action: 'query', titles: titles.join('|'), prop: 'imageinfo', iiprop: 'url|size|mime', iiurlwidth: '400', format: 'json', origin: '*' })
  try {
    const res = await wikiFetch('https://commons.wikimedia.org/w/api.php?' + params)
    const d = JSON.parse(await res.text())
    const results = []
    for (const page of Object.values(d.query?.pages || {})) {
      const ii = page.imageinfo?.[0]
      if (ii && ii.mime?.startsWith('image/') && !ii.mime?.includes('svg')) {
        results.push({ url: ii.thumburl || ii.url, orig: ii.url, w: ii.width, h: ii.height, source: 'wiki', title: page.title })
      }
    }
    return results
  } catch { return [] }
}

// ====== Download & Compress ======
async function downloadImage(url, fp, isWiki = false) {
  if (isWiki) {
    const res = await wikiFetch(url, { signal: AbortSignal.timeout(60000) })
    if (!res.ok) throw new Error('DL ' + res.status)
    writeFileSync(fp, Buffer.from(await res.arrayBuffer()))
  } else {
    const res = await fetch(url, { signal: AbortSignal.timeout(30000), dispatcher })
    if (!res.ok) throw new Error('DL ' + res.status)
    writeFileSync(fp, Buffer.from(await res.arrayBuffer()))
  }
}

async function compressImage(fp) {
  const before = statSync(fp).size
  const tmp = fp + '.tmp'
  await sharp(fp).resize(400, undefined, { withoutEnlargement: true }).jpeg({ quality: 80, progressive: true }).toFile(tmp)
  unlinkSync(fp); renameSync(tmp, fp)
  return statSync(fp).size
}

// ====== Doubao ======
function imageToBase64(path) { return 'data:image/jpeg;base64,' + readFileSync(path).toString('base64') }

function callDoubao(imageUri, prompt) {
  return new Promise((resolve) => {
    const url = new URL(DOUBAO_URL)
    const payload = JSON.stringify({ model: MODEL, messages: [{ role: 'user', content: [{ type: 'image_url', image_url: { url: imageUri } }, { type: 'text', text: prompt }] }], max_tokens: 256 })
    const opts = { hostname: url.hostname, port: 443, path: url.pathname + url.search, method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + DOUBAO_KEY, 'Content-Length': Buffer.byteLength(payload) }, timeout: 60000 }
    const req = request(opts, res => { let b = ''; res.on('data', c => b += c); res.on('end', () => { try { const d = JSON.parse(b); resolve(d.choices?.[0]?.message?.content?.trim() || 'ERR') } catch { resolve('ERR') } }) })
    req.on('error', e => resolve('NET: ' + e.message)); req.on('timeout', () => { req.destroy(); resolve('TIMEOUT') })
    req.write(payload); req.end()
  })
}

function parseVerdict(answer) {
  if (answer.startsWith('符合') || (answer.includes('符合') && !answer.includes('不符合'))) return { v: '符合', r: answer.replace(/^(符合|不符合)\s*[,，。.]?\s*/, '').substring(0, 80) }
  if (answer.includes('不符合')) return { v: '不符合', r: answer.replace(/^(符合|不符合)\s*[,，。.]?\s*/, '').substring(0, 80) }
  return { v: '未知', r: answer.substring(0, 80) }
}

function isProbablyBad(img) {
  if (img.w < 100 || img.h < 100) return true
  if (img.source === 'wiki') {
    const t = img.title.toLowerCase()
    const bad = ['diagram', 'map', 'chart', 'icon', 'logo', 'flag', 'drawing', 'illustration', 'painting', 'stamp', 'sketch', 'cartoon', 'engraving', 'museum', 'coin', 'medal', 'banknote', 'book', 'manuscript', 'document', 'cover', 'signature', 'coat of arms']
    if (bad.some(w => t.includes(w))) return true
  }
  return false
}

// ====== Update ingredients.ts ======
function updateIngredientTs(name) {
  let txt = readFileSync(ING_TS, 'utf-8')
  const regex = new RegExp(`(name:\\s*'${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'[\\s\\S]*?image:\\s*)'PLACEHOLDER'`, 'g')
  const updated = txt.replace(regex, `$1'/images/ingredients/${name}.jpg'`)
  if (updated !== txt) { writeFileSync(ING_TS, updated); return true }
  return false
}

// ====== Main ======
async function processItem(item, index, total) {
  const progress = `[${index + 1}/${total}]`
  console.log(`${progress} ${item.name} [${item.category}]`)

  const fp = join(OUT, item.name + '.jpg')
  const prompt = makePrompt(item.name, item.category)
  let candidates = []

  // Step 1: Try Pexels
  const pexQuery = pexelsQuery(item)
  console.log(`  Pexels: "${pexQuery}"`)
  const pexelsImgs = await searchPexels(pexQuery)
  console.log(`  Pexels → ${pexelsImgs.length} results`)

  const pexGood = pexelsImgs.filter(img => !isProbablyBad(img))
  if (pexGood.length > 0) candidates = pexGood.slice(0, 5)

  // Step 2: Fallback to Wikimedia if Pexels has no results
  if (candidates.length === 0) {
    const wikiQuery = pexQuery
    console.log(`  Wiki fallback: "${wikiQuery}"`)
    const wikiResults = await searchWiki(wikiQuery)
    console.log(`  Wiki → ${wikiResults.length} search results`)
    if (wikiResults.length > 0) {
      await sleep(2000)
      const wikiTitles = wikiResults.filter(p => /\.(jpg|jpeg|png|webp)$/i.test(p.title)).slice(0, 8)
      if (wikiTitles.length > 0) {
        const wikiImgs = await getWikiImageUrls(wikiTitles.map(p => p.title))
        const wikiGood = wikiImgs.filter(img => !isProbablyBad(img))
        console.log(`  Wiki → ${wikiGood.length} good candidates`)
        candidates = wikiGood.slice(0, 5)
      }
    }
  }

  if (candidates.length === 0) return { name: item.name, status: 'no_images' }

  // Step 3: Try each candidate with Doubao verification
  for (let j = 0; j < Math.min(candidates.length, 5); j++) {
    const img = candidates[j]
    try {
      const isWiki = img.source === 'wiki'
      await downloadImage(img.url, fp, isWiki)
      const size = await compressImage(fp)

      const answer = await callDoubao(imageToBase64(fp), prompt)
      const { v, r } = parseVerdict(answer)
      console.log(`  [${j + 1}] ${v === '符合' ? '✓' : '✗'} ${r.substring(0, 70)}`)

      if (v === '符合') {
        updateIngredientTs(item.name)
        return { name: item.name, status: 'passed', reason: r }
      }
      await sleep(800)
    } catch (e) { console.log(`  err: ${e.message}`) }
  }

  try { unlinkSync(fp) } catch {}
  return { name: item.name, status: 'all_failed' }
}

async function main() {
  // Get the 68 used PLACEHOLDER ingredients sorted by recipe count
  const ingMod = await import('file:///C:/Users/23371/Desktop/sp/sp/src/data/ingredients.ts?t=' + Date.now())
  const ingredients = ingMod.ingredients
  const items = ingredients
    .filter(i => i.image === 'PLACEHOLDER' && i.relatedRecipeIds && i.relatedRecipeIds.length > 0)
    .sort((a, b) => b.relatedRecipeIds.length - a.relatedRecipeIds.length)
    .map(i => ({ name: i.name, category: i.category, recipeCount: i.relatedRecipeIds.length }))

  console.log(`Total priority items: ${items.length}`)

  // Load progress
  let progress = {}
  if (existsSync(PROGRESS_FILE)) {
    progress = JSON.parse(readFileSync(PROGRESS_FILE, 'utf-8'))
    console.log(`Resuming: ${Object.keys(progress).length} already processed\n`)
  }

  const pending = items.filter(p => !progress[p.name])
  console.log(`Pending: ${pending.length}\n`)

  let stats = { passed: 0, no_images: 0, all_failed: 0 }

  for (let i = 0; i < pending.length; i++) {
    const result = await processItem(pending[i], i, pending.length)
    progress[result.name] = { ...result, recipeCount: pending[i].recipeCount }

    if (result.status === 'passed') stats.passed++
    else if (result.status === 'no_images') stats.no_images++
    else if (result.status === 'all_failed') stats.all_failed++

    if ((i + 1) % 5 === 0 || i === pending.length - 1) {
      writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2))
      console.log(`  [SAVED] passed=${stats.passed} failed=${stats.no_images + stats.all_failed}\n`)
    }

    await sleep(3000) // Rate limit
  }

  console.log('\n===== BATCH COMPLETE =====')
  console.log(`Passed: ${stats.passed}`)
  console.log(`No images: ${stats.no_images}`)
  console.log(`All failed Doubao: ${stats.all_failed}`)
  console.log(`Total: ${pending.length}`)

  // Final stats
  const ingMod2 = await import('file:///C:/Users/23371/Desktop/sp/sp/src/data/ingredients.ts?t=' + Date.now() + 99)
  const ings = ingMod2.ingredients
  const withImg = ings.filter(i => i.image !== 'PLACEHOLDER').length
  const placeholder = ings.filter(i => i.image === 'PLACEHOLDER').length
  console.log(`\n食材: ${ings.length} 总数, ${withImg} 有图, ${placeholder} 缺图`)
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1) })

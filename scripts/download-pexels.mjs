import { writeFileSync, readFileSync, statSync, renameSync, unlinkSync, existsSync } from 'fs'
import { join } from 'path'
import sharp from 'sharp'
import { ProxyAgent, fetch } from 'undici'

const PROXY = 'http://127.0.0.1:7897'
const dispatcher = new ProxyAgent({ uri: PROXY, requestTls: { rejectUnauthorized: false } })

const OUT = join(process.cwd(), 'public', 'images', 'ingredients')
const ING_TS = join(process.cwd(), 'src', 'data', 'ingredients.ts')
const PROGRESS_FILE = join(process.cwd(), 'scripts', 'pexels-progress.json')

const PEXELS_KEY = 'o9PrRJ8CCFLfCIOwNT2xeDIvbSCnRa96QqXTUEllmbdGP5lh0QpX6LuF'
const sleep = ms => new Promise(r => setTimeout(r, ms))

// Query mapping (same as before)
function pexelsQuery(item) {
  const n = item.name
  const queries = {
    '生抽': 'soy sauce glass bottle', '老抽': 'dark soy sauce bottle', '酱油': 'soy sauce bottle',
    '蚝油': 'oyster sauce bottle', '淀粉': 'cornstarch white powder',
    '干辣椒': 'dried red chili pepper', '花椒': 'sichuan peppercorn spice',
    '八角': 'star anise spice isolated', '胡椒粉': 'white pepper powder',
    '辣椒油': 'chili oil jar', '香油': 'sesame oil bottle',
    '蒸鱼豉油': 'soy sauce bottle', '芥末': 'wasabi paste',
    '沙姜': 'galangal ginger root', '蒸肉粉': 'rice flour powder',
    '红糟': 'red fermented rice', '蜂蜜': 'honey jar',
    '白芝麻': 'white sesame seeds', '葛粉': 'arrowroot starch powder',
    '鸡汤': 'chicken broth carton', '荷叶': 'lotus leaf dried',
    '大蒜': 'garlic bulb fresh', '香菇': 'shiitake mushroom fresh',
    '青菜': 'bok choy green', '木耳': 'wood ear black fungus',
    '香菜': 'cilantro fresh herb', '泡椒': 'pickled chili jar',
    '剁椒': 'chopped chili jar', '土豆': 'potato fresh whole',
    '马蹄': 'water chestnut fresh', '青蒜': 'green garlic leek',
    '白菜': 'napa cabbage whole', '茄子': 'eggplant purple',
    '包菜': 'cabbage whole green', '菜心': 'choy sum vegetable',
    '蒜苔': 'garlic scape stem', '酸萝卜': 'pickled radish jar',
    '冬笋': 'bamboo shoot fresh', '蒲菜': 'cattail shoot',
    '梅干菜': 'dried mustard green', '枸杞': 'goji berry dried',
    '豆腐': 'tofu white block', '豆干': 'dried tofu pressed',
    '火腿': 'chinese ham cured', '腊肉': 'chinese cured bacon',
    '牛蛙': 'bullfrog frog meat', '腊鱼': 'dried cured fish',
    '鸽子': 'pigeon meat', '甲鱼': 'turtle food',
    '毛肚': 'beef tripe', '黄喉': 'pork aorta',
    '蛋饺': 'egg dumpling', '虾': 'shrimp raw fresh',
    '贝类': 'oyster shellfish raw', '鲈鱼': 'sea bass fish fresh',
    '黄鳝': 'eel fish fresh', '鳜鱼': 'mandarin fish',
    '鱼头': 'fish head salmon fresh', '海参': 'sea cucumber dried',
    '银鱼': 'whitebait fish', '蛋清': 'egg white separated',
    '面条': 'pasta noodle dried', '米饭': 'cooked rice white',
    '粉丝': 'glass noodle dried', '大米': 'rice grain raw',
    '红薯': 'sweet potato fresh', '鲤鱼': 'carp fish raw',
    '鲫鱼': 'crucian carp fish',
  }
  if (queries[n]) return queries[n]
  const cat = item.category
  if (cat === '调味品') return `${n} food ingredient`
  if (cat === '肉类') return `${n} raw meat`
  if (cat === '水产') return `${n} seafood fresh`
  if (cat === '蔬菜') return `${n} fresh vegetable`
  if (cat === '菌菇') return `${n} mushroom fresh`
  if (cat === '豆制品') return `${n} tofu soy food`
  if (cat === '主食') return `${n} food staple`
  return `${n} food ingredient`
}

async function searchPexels(query) {
  const params = new URLSearchParams({ query, per_page: 5, orientation: 'square', size: 'medium', locale: 'en-US' })
  try {
    const res = await fetch(`https://api.pexels.com/v1/search?${params}`, {
      headers: { Authorization: PEXELS_KEY },
      signal: AbortSignal.timeout(15000),
      dispatcher,
    })
    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get('Retry-After') || '30')
      console.log(`  限流, 等待${retryAfter}s...`)
      await sleep(retryAfter * 1000 + 1000)
      return searchPexels(query)
    }
    if (!res.ok) return []
    const data = await res.json()
    return (data.photos || []).map(p => ({
      url: p.src?.large || p.src?.medium || p.src?.original,
      w: p.width, h: p.height,
    }))
  } catch (e) { console.log(`  Pexels err: ${e.message}`); return [] }
}

async function wikiFetch(url, opts = {}) {
  return fetch(url, { ...opts, dispatcher, signal: opts.signal || AbortSignal.timeout(20000) })
}

async function searchWiki(query) {
  const params = new URLSearchParams({ action: 'query', list: 'search', srsearch: query, srnamespace: '6', srlimit: '5', format: 'json', origin: '*' })
  try {
    const res = await wikiFetch('https://commons.wikimedia.org/w/api.php?' + params)
    const d = JSON.parse(await res.text())
    return d.query?.search || []
  } catch { return [] }
}

async function getWikiUrls(titles) {
  const params = new URLSearchParams({ action: 'query', titles: titles.join('|'), prop: 'imageinfo', iiprop: 'url|size|mime', iiurlwidth: '400', format: 'json', origin: '*' })
  try {
    const res = await wikiFetch('https://commons.wikimedia.org/w/api.php?' + params)
    const d = JSON.parse(await res.text())
    const results = []
    for (const page of Object.values(d.query?.pages || {})) {
      const ii = page.imageinfo?.[0]
      if (ii && ii.mime?.startsWith('image/') && !ii.mime?.includes('svg')) {
        const t = page.title.toLowerCase()
        const bad = ['diagram', 'map', 'chart', 'icon', 'logo', 'flag', 'drawing', 'illustration', 'painting', 'stamp', 'sketch', 'cartoon', 'engraving', 'museum', 'coin', 'medal', 'banknote', 'book', 'manuscript', 'document', 'cover', 'signature', 'coat of arms']
        if (!bad.some(w => t.includes(w)) && ii.width >= 100 && ii.height >= 100) {
          results.push({ url: ii.thumburl || ii.url, orig: ii.url })
        }
      }
    }
    return results
  } catch { return [] }
}

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
  const tmp = fp + '.tmp'
  await sharp(fp).resize(400, undefined, { withoutEnlargement: true }).jpeg({ quality: 80, progressive: true }).toFile(tmp)
  unlinkSync(fp); renameSync(tmp, fp)
  return statSync(fp).size
}

function updateIngredientTs(name) {
  let txt = readFileSync(ING_TS, 'utf-8')
  const regex = new RegExp(`(name:\\s*'${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'[\\s\\S]*?image:\\s*)'PLACEHOLDER'`, 'g')
  const updated = txt.replace(regex, `$1'/images/ingredients/${name}.jpg'`)
  if (updated !== txt) { writeFileSync(ING_TS, updated); return true }
  return false
}

async function processItem(item, index, total) {
  const n = item.name
  console.log(`[${index + 1}/${total}] ${n} [${item.category}]`)

  const fp = join(OUT, n + '.jpg')
  const query = pexelsQuery(item)
  console.log(`  "${query}"`)

  // Try Pexels
  let candidates = await searchPexels(query)
  console.log(`  Pexels: ${candidates.length}`)

  // Fallback to Wiki
  if (candidates.length === 0) {
    const wikiResults = await searchWiki(query)
    if (wikiResults.length > 0) {
      await sleep(2000)
      const titles = wikiResults.filter(p => /\.(jpg|jpeg|png|webp)$/i.test(p.title)).slice(0, 5)
      if (titles.length > 0) {
        candidates = await getWikiUrls(titles.map(p => p.title))
        console.log(`  Wiki: ${candidates.length}`)
      }
    }
  }

  if (candidates.length === 0) return 'no_images'

  // Try up to 3 candidates
  for (let j = 0; j < Math.min(candidates.length, 3); j++) {
    try {
      const img = candidates[j]
      await downloadImage(img.url, fp, img.orig ? true : false)
      const size = await compressImage(fp)
      updateIngredientTs(n)
      console.log(`  ✓ ${(size / 1024).toFixed(1)}KB`)
      return 'ok'
    } catch (e) { console.log(`  [${j + 1}] err: ${e.message}`) }
  }

  try { unlinkSync(fp) } catch {}
  return 'failed'
}

async function main() {
  const ingMod = await import('file:///C:/Users/23371/Desktop/sp/sp/src/data/ingredients.ts?t=' + Date.now())
  const ingredients = ingMod.ingredients

  // Get all PLACEHOLDER items, sort by recipe usage
  const items = ingredients
    .filter(i => i.image === 'PLACEHOLDER')
    .map(i => ({
      name: i.name,
      category: i.category,
      recipeCount: (i.relatedRecipeIds || []).length,
    }))
    .sort((a, b) => b.recipeCount - a.recipeCount)

  console.log(`PLACEHOLDER: ${items.length} (${items.filter(i => i.recipeCount > 0).length} 食谱使用中)\n`)

  let progress = {}
  if (existsSync(PROGRESS_FILE)) {
    progress = JSON.parse(readFileSync(PROGRESS_FILE, 'utf-8'))
    console.log(`Resuming: ${Object.keys(progress).length} done\n`)
  }

  const pending = items.filter(p => !progress[p.name])
  console.log(`Pending: ${pending.length}\n`)

  let ok = 0, fail = 0
  for (let i = 0; i < pending.length; i++) {
    const result = await processItem(pending[i], i, pending.length)
    progress[pending[i].name] = { status: result, category: pending[i].category, recipeCount: pending[i].recipeCount }
    if (result === 'ok') ok++; else fail++

    if ((i + 1) % 5 === 0 || i === pending.length - 1) {
      writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2))
      console.log(`  [SAVED] ok=${ok} fail=${fail}\n`)
    }
    await sleep(2000)
  }

  const ingMod2 = await import('file:///C:/Users/23371/Desktop/sp/sp/src/data/ingredients.ts?t=' + Date.now() + 99)
  const ings = ingMod2.ingredients
  const withImg = ings.filter(i => i.image !== 'PLACEHOLDER').length
  const ph = ings.filter(i => i.image === 'PLACEHOLDER').length
  console.log(`\nDone. 有图: ${withImg}, 缺图: ${ph}`)
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1) })

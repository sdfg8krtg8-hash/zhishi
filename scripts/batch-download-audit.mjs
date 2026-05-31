import { existsSync, writeFileSync, readFileSync, statSync, renameSync, unlinkSync } from 'fs'
import { join } from 'path'
import { request } from 'https'
import sharp from 'sharp'
import { ProxyAgent, fetch } from 'undici'

const PROXY = 'http://127.0.0.1:7897'
const dispatcher = new ProxyAgent({ uri: PROXY, requestTls: { rejectUnauthorized: false } })
async function wikiFetch(url, opts = {}) { const s = opts.signal || AbortSignal.timeout(20000); return fetch(url, { ...opts, dispatcher, signal: s }) }

const OUT = join(process.cwd(), 'public', 'images', 'ingredients')
const ING_TS = join(process.cwd(), 'src', 'data', 'ingredients.ts')
const PROGRESS_FILE = join(process.cwd(), 'scripts', 'batch-progress.json')
const DOUBAO_KEY = process.env.DOUBAO_KEY || ''
const DOUBAO_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions'
const MODEL = 'doubao-seed-1-6-vision-250815'
const sleep = ms => new Promise(r => setTimeout(r, ms))

// Load placeholder list
const PLACEHOLDERS = JSON.parse(readFileSync(join(process.cwd(), 'scripts', 'placeholder-list.json'), 'utf-8'))

// Generate search queries per ingredient
function makeQuery(item) {
  const n = item.name
  const cat = item.category
  const queries = {
    '土豆': 'potato fresh raw whole tuber', '番茄': 'tomato fresh red fruit', '青菜': 'bok choy pak choi vegetable green',
    '白菜': 'napa cabbage whole Chinese cabbage', '黄瓜': 'cucumber fresh green vegetable',
    '胡萝卜': 'carrot fresh orange root vegetable', '茄子': 'eggplant aubergine fresh purple',
    '豆角': 'green beans yardlong bean fresh', '青椒': 'green bell pepper capsicum fresh',
    '西兰花': 'broccoli fresh green vegetable', '菜花': 'cauliflower white fresh vegetable',
    '菠菜': 'spinach fresh leaves green', '油麦菜': 'lettuce leaf vegetable green',
    '芹菜': 'celery fresh stalks green', '韭菜': 'chinese chives garlic chives green',
    '大蒜': 'garlic bulb fresh cloves', '山药': 'chinese yam nagaimo fresh',
    '芋头': 'taro root fresh tuber', '丝瓜': 'luffa gourd angled loofah vegetable',
    '空心菜': 'water spinach morning glory kangkong', '茼蒿': 'chrysanthemum greens garland vegetable',
    '娃娃菜': 'baby cabbage mini napa vegetable', '上海青': 'shanghai bok choy green vegetable',
    '油菜': 'rapeseed greens choy sum vegetable', '莴笋': 'celtuce stem lettuce asparagus lettuce',
    '茭白': 'wild rice stem water bamboo vegetable', '芦笋': 'asparagus fresh green spears',
    '香椿': 'chinese toon leaves vegetable', '毛豆': 'edamame soybean fresh green',
    '荷兰豆': 'snow pea mangetout fresh green', '豌豆': 'pea fresh green pod',
    '海带': 'kelp kombu seaweed dried', '紫菜': 'nori laver seaweed dried sheet',
    '猪肉': 'pork meat raw fresh', '五花肉': 'pork belly meat raw slab',
    '猪里脊': 'pork tenderloin raw meat', '排骨': 'pork ribs spare ribs raw',
    '猪蹄': 'pork trotter feet raw', '猪肘': 'pork hock knuckle raw',
    '猪肝': 'pork liver raw meat', '猪心': 'pork heart raw meat',
    '猪肚': 'pork stomach tripe raw', '猪大肠': 'pork intestine chitterlings raw',
    '牛腩': 'beef brisket raw meat', '牛里脊': 'beef tenderloin raw fillet',
    '牛骨': 'beef bone marrow raw', '羊腿': 'lamb leg raw meat',
    '羊蝎子': 'lamb spine bone raw', '羊肉卷': 'lamb roll sliced meat',
    '鸡腿': 'chicken drumstick raw leg', '鸡胸': 'chicken breast raw fillet',
    '鸡翅': 'chicken wing raw drumette', '鸡爪': 'chicken feet raw paws',
    '鸡架': 'chicken carcass frame raw', '整鸡': 'whole chicken raw plucked',
    '鸭腿': 'duck leg raw meat', '鸭脖': 'duck neck raw',
    '鸭翅': 'duck wing raw', '鸭掌': 'duck feet raw webbed',
    '整鸭': 'whole duck raw plucked', '鹅肉': 'goose meat raw',
    '兔肉': 'rabbit meat raw', '驴肉': 'donkey meat raw',
    '鹿肉': 'venison deer meat raw', '鸭蛋': 'duck egg fresh raw',
    '鹅蛋': 'goose egg fresh raw', '皮蛋': 'century egg preserved duck egg',
    '咸鸭蛋': 'salted duck egg preserved', '卤蛋': 'braised egg soy sauce egg',
    '茶叶蛋': 'tea egg marbled egg Chinese',
    '苹果': 'apple fruit fresh red', '香蕉': 'banana fruit fresh yellow',
    '哈密瓜': 'honeydew melon cantaloupe fruit', '桃子': 'peach fruit fresh',
    '梨': 'pear fruit fresh', '樱桃': 'cherry fruit fresh red',
    '榴莲': 'durian fruit fresh whole', '山竹': 'mangosteen fruit fresh',
    '龙眼': 'longan fruit fresh', '杨梅': 'bayberry fruit red fresh',
    '枇杷': 'loquat fruit fresh yellow', '牛油果': 'avocado fruit fresh',
    '蔓越莓': 'cranberry fruit fresh red', '甘蔗': 'sugarcane fresh stalk',
    '荸荠': 'water chestnut fresh corm', '草莓': 'strawberry fruit fresh',
    '豆腐': 'tofu soybean curd block white', '嫩豆腐': 'silken tofu soft soybean curd',
    '老豆腐': 'firm tofu pressed bean curd', '北豆腐': 'northern style firm tofu',
    '南豆腐': 'southern style soft tofu', '豆干': 'dried tofu firm pressed',
    '千页豆腐': 'tofu sheet layered bean curd', '腐竹': 'dried tofu skin yuba stick',
    '豆皮': 'tofu skin yuba sheet', '豆油皮': 'soybean oil skin tofu sheet',
    '豆腐皮': 'tofu skin dried sheet', '油豆腐': 'fried tofu puff',
    '豆泡': 'tofu puff fried bean curd', '素鸡': 'vegetarian chicken tofu roll',
    '素火腿': 'vegetarian ham tofu product', '豆浆': 'soy milk liquid drink white',
    '豆腐脑': 'tofu pudding soft curd', '豆豉': 'fermented black bean douchi',
    '纳豆': 'natto fermented soybean Japanese',
    '大米': 'rice grain raw uncooked white', '小米': 'millet grain foxtail yellow',
    '糯米': 'glutinous rice sticky grain', '黑米': 'black rice grain raw',
    '糙米': 'brown rice grain raw unpolished', '面条': 'noodle wheat raw dried',
    '挂面': 'dried noodle hung wheat', '方便面': 'instant noodle dried block',
    '意大利面': 'pasta spaghetti dried raw', '通心粉': 'macaroni pasta dried tube',
    '荞麦面': 'buckwheat noodle soba dried', '玉米面': 'cornmeal maize flour yellow',
    '面粉': 'wheat flour white powder', '饺子皮': 'dumpling wrapper raw dough circle',
    '馄饨皮': 'wonton wrapper raw dough square', '包子皮': 'bao bun dough raw',
    '馒头': 'steamed bun mantou white', '花卷': 'flower roll steamed bun twisted',
    '油条': 'fried dough stick youtiao', '饺子': 'dumpling jiaozi raw uncooked',
    '馄饨': 'wonton raw uncooked', '烧麦': 'siu mai shumai dumpling',
    '红薯': 'sweet potato fresh raw tuber', '紫薯': 'purple sweet potato fresh',
    '藜麦': 'quinoa grain raw seed', '红豆': 'red bean adzuki dry',
    '绿豆': 'mung bean green dry', '芸豆': 'kidney bean dry legume',
    '虾': 'shrimp raw fresh unpeeled', '鲤鱼': 'carp fish fresh raw',
    '鲫鱼': 'crucian carp fish fresh', '鲈鱼': 'sea bass fish fresh perch',
    '鳕鱼': 'cod fish fresh raw', '带鱼': 'hairtail fish beltfish fresh',
    '黄花鱼': 'yellow croaker fish fresh', '三文鱼': 'salmon fish raw fillet',
    '巴沙鱼': 'basa fish pangasius fillet', '龙利鱼': 'sole fish flounder fillet',
    '鲶鱼': 'catfish fresh raw', '黑鱼': 'snakehead fish fresh raw',
    '基围虾': 'shrimp prawn raw fresh', '明虾': 'prawn white shrimp raw',
    '河虾': 'freshwater shrimp raw small', '小龙虾': 'crayfish crawfish raw fresh',
    '皮皮虾': 'mantis shrimp squilla raw', '大闸蟹': 'hairy crab mitten crab fresh',
    '梭子蟹': 'swimming crab blue crab raw', '面包蟹': 'brown crab edible crab raw',
    '花甲': 'clam shellfish raw fresh', '蛏子': 'razor clam shellfish raw',
    '生蚝': 'oyster shellfish raw fresh', '扇贝': 'scallop shellfish raw',
    '蛤蜊': 'clam hard shell raw fresh', '蚬子': 'freshwater clam corbicula raw',
    '鱿鱼': 'squid raw fresh whole', '墨鱼': 'cuttlefish raw fresh',
    '章鱼': 'octopus raw fresh whole', '八爪鱼': 'octopus raw fresh small',
    '泥鳅': 'loach fish freshwater raw', '黄鳝': 'rice eel swamp eel raw',
    '香菇': 'shiitake mushroom fresh brown', '金针菇': 'enoki mushroom fresh white',
    '杏鲍菇': 'king oyster mushroom fresh', '木耳': 'wood ear mushroom black fungus',
    '银耳': 'white fungus snow fungus tremella', '平菇': 'oyster mushroom fresh grey',
    '口蘑': 'white button mushroom fresh', '蟹味菇': 'shimeji beech mushroom fresh',
    '白玉菇': 'white shimeji mushroom fresh', '茶树菇': 'tea tree mushroom Agrocybe',
    '猴头菇': 'lions mane mushroom hericium', '竹荪': 'bamboo fungus dictyophora',
    '牛肝菌': 'porcini mushroom boletus fresh', '羊肚菌': 'morel mushroom morchella',
    '鸡枞菌': 'termite mushroom termitomyces', '松茸': 'matsutake mushroom fresh',
    '松露': 'truffle fungus tuber fresh', '鸡腿菇': 'shaggy mane coprinus mushroom',
    '草菇': 'straw mushroom volvariella fresh', '凤尾菇': 'phoenix tail mushroom pleurotus',
    '酱油': 'soy sauce liquid dark condiment', '生抽': 'light soy sauce liquid condiment',
    '老抽': 'dark soy sauce thick condiment', '蚝油': 'oyster sauce thick brown',
    '醋': 'vinegar rice black chinkiang', '料酒': 'shaoxing cooking wine rice wine',
    '鸡精': 'chicken bouillon powder seasoning', '味精': 'MSG monosodium glutamate crystal',
    '胡椒粉': 'white pepper powder ground', '花椒': 'sichuan peppercorn red dried',
    '八角': 'star anise whole spice dried', '香叶': 'bay leaf dried spice',
    '干辣椒': 'dried chili pepper red whole', '麻椒': 'sichuan green peppercorn',
    '孜然': 'cumin seed spice dried', '五香粉': 'five spice powder chinese',
    '十三香': 'thirteen spice powder chinese', '豆瓣酱': 'doubanjiang broad bean paste chili',
    '黄豆酱': 'soybean paste yellow fermented', '番茄酱': 'tomato ketchup sauce red',
    '沙拉酱': 'mayonnaise salad dressing white', '芝麻酱': 'sesame paste tahini',
    '香油': 'sesame oil liquid condiment', '辣椒油': 'chili oil red liquid',
    '花椒油': 'sichuan peppercorn oil', '火锅底料': 'hot pot soup base block',
    '咖喱块': 'curry roux block solid',
    // New ingredients (added from recipe audit)
    '香菜': 'cilantro coriander fresh herb leaves', '包菜': 'cabbage whole green vegetable',
    '菜心': 'choy sum flowering cabbage vegetable', '蒜苔': 'garlic scape stem green vegetable',
    '青蒜': 'green garlic leek fresh vegetable', '泡椒': 'pickled chili pepper red jar',
    '彩椒': 'bell pepper red yellow orange fresh', '剁椒': 'chopped chili pepper salted condiment',
    '酸萝卜': 'pickled radish white sour vegetable', '马蹄': 'water chestnut fresh corm brown',
    '冬笋': 'winter bamboo shoot fresh vegetable', '蒲菜': 'cattail shoot vegetable',
    '梅干菜': 'meigan cai dried pickled mustard green', '枸杞': 'goji berry dried red fruit',
    '牛肉': 'beef meat raw fresh red', '牛肉末': 'ground beef minced raw meat',
    '牛舌': 'beef tongue raw meat', '牛肚': 'beef tripe stomach raw',
    '牛蛙': 'bullfrog frog meat raw', '猪腰': 'pork kidney raw meat',
    '午餐肉': 'spam luncheon meat canned pork', '腊肠': 'chinese sausage lap cheong dried',
    '腊肉': 'chinese cured bacon preserved pork', '腊鱼': 'cured dried fish salted preserved',
    '鸡肉': 'chicken meat raw fresh', '咸肉': 'salted pork cured meat preserved',
    '三黄鸡': 'chinese yellow chicken whole raw', '鸽子': 'pigeon squab raw meat',
    '甲鱼': 'softshell turtle terrapin raw', '鸭血': 'duck blood curd tofu dark',
    '毛肚': 'beef tripe omasum hairy stomach', '黄喉': 'pork aorta blood vessel white',
    '鸡胗': 'chicken gizzard raw meat organ', '鸡心': 'chicken heart raw meat organ',
    '鸡肝': 'chicken liver raw meat organ', '猪血丸子': 'blood tofu sausage hunan smoked',
    '蛋饺': 'egg dumpling wonton golden yellow',
    '鳜鱼': 'mandarin fish whole fresh raw', '银鱼': 'icefish whitebait small fish fresh',
    '鱼头': 'fish head whole fresh raw salmon', '鲍鱼': 'abalone shellfish fresh raw',
    '干贝': 'dried scallop conpoy yao zhu', '香螺': 'whelk sea snail conch shell',
    '海蚌': 'geoduck clam shellfish fresh', '海参': 'sea cucumber beche de mer dried',
    '香干': 'smoked tofu dried spiced bean curd', '蛋清': 'egg white separated raw liquid',
    '米饭': 'cooked rice steamed white bowl', '粉丝': 'glass noodle vermicelli dried bean thread',
    '淀粉': 'cornstarch potato starch white powder', '沙姜': 'sand ginger galangal rhizome',
    '蒸鱼豉油': 'steamed fish soy sauce bottle seasoning', '芥末': 'wasabi mustard paste green condiment',
    '松子': 'pine nut pine seed kernel', '龙井茶叶': 'longjing dragon well green tea leaves',
    '荷叶': 'lotus leaf dried whole green', '蒸肉粉': 'steamed rice powder meat coating',
    '甜辣酱': 'sweet chili sauce Thai condiment', '红糟': 'red yeast rice wine lees fujian',
    '沙茶酱': 'shacha sauce satay paste condiment', '蜂蜜': 'honey golden liquid jar',
    '白芝麻': 'white sesame seed raw grain', '葛粉': 'kudzu root powder starch arrowroot',
    '鸡汤': 'chicken broth stock soup base',
  }
  return queries[n] || n
}

function makePrompt(name, cat) {
  // Determine if seasoning
  const seasonings = ['酱油', '生抽', '老抽', '蚝油', '醋', '料酒', '鸡精', '味精', '胡椒粉', '花椒', '八角', '香叶', '干辣椒', '麻椒', '孜然', '五香粉', '十三香', '豆瓣酱', '黄豆酱', '番茄酱', '沙拉酱', '芝麻酱', '香油', '辣椒油', '花椒油', '火锅底料', '咖喱块']

  if (seasonings.includes(name) || cat === '调味品') {
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
    return `审核主食/粮食类"${name}"的图片。必须是该食材的原始干燥/未烹饪状态。不能是烹饪后的菜品/熟食（除非该食材本身就是熟食如馒头/花卷/油条/烧麦）。只回答"符合"或"不符合"，简要说明理由。`
  }
  if (cat === '菌菇') {
    return `审核菌菇"${name}"的图片。必须是该菌菇的可食用状态（新鲜或干燥均可），不能与其他菌菇混淆。不能是长在野外的状态（采摘后的可以）。只回答"符合"或"不符合"，简要说明理由。`
  }
  if (cat === '禽蛋') {
    return `审核禽蛋"${name}"的图片。必须是该蛋类本身。生蛋/熟蛋/加工蛋均可（如皮蛋/咸鸭蛋/卤蛋本身就是加工品）。不能混入其他食材。只回答"符合"或"不符合"，简要说明理由。`
  }

  // Default: 蔬菜/水果
  return `审核"${name}"的图片。必须是采摘后的新鲜${cat === '水果' ? '水果' : '蔬菜'}本身，不能长在植株/田地/藤蔓上，不能混入其他食材/物品，不能是花朵/植株/幼苗，不能是菜肴/烹饪过的。只回答"符合"或"不符合"，简要说明理由。`
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

async function getImageUrls(titles) {
  const params = new URLSearchParams({ action: 'query', titles: titles.join('|'), prop: 'imageinfo', iiprop: 'url|size|mime', iiurlwidth: '400', format: 'json', origin: '*' })
  try {
    const res = await wikiFetch('https://commons.wikimedia.org/w/api.php?' + params)
    const d = JSON.parse(await res.text())
    const results = []
    for (const page of Object.values(d.query?.pages || {})) {
      const ii = page.imageinfo?.[0]
      if (ii && ii.mime?.startsWith('image/') && !ii.mime?.includes('svg')) {
        results.push({ title: page.title, url: ii.thumburl || ii.url, orig: ii.url, w: ii.width, h: ii.height })
      }
    }
    return results
  } catch { return [] }
}

async function downloadImage(url, fp) {
  const res = await wikiFetch(url, { signal: AbortSignal.timeout(60000) })
  if (!res.ok) throw new Error('DL ' + res.status)
  writeFileSync(fp, Buffer.from(await res.arrayBuffer()))
}

async function compressImage(fp) {
  const before = statSync(fp).size
  const tmp = fp + '.tmp'
  await sharp(fp).resize(400, undefined, { withoutEnlargement: true }).jpeg({ quality: 80, progressive: true }).toFile(tmp)
  unlinkSync(fp); renameSync(tmp, fp)
  return statSync(fp).size
}

// ====== Doubao API ======
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

// ====== Update ingredients.ts ======
function updateIngredientTs(name) {
  let txt = readFileSync(ING_TS, 'utf-8')
  // Find the ingredient block with this name and PLACEHOLDER image
  const regex = new RegExp(`(name:\\s*'${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'[\\s\\S]*?image:\\s*)'PLACEHOLDER'`, 'g')
  const newPath = `/images/ingredients/${name}.jpg`
  const updated = txt.replace(regex, `$1'${newPath}'`)
  if (updated !== txt) {
    writeFileSync(ING_TS, updated)
    return true
  }
  return false
}

// ====== Main ======
function isProbablyBad(img) {
  const t = img.title.toLowerCase()
  const bad = ['diagram', 'map', 'chart', 'icon', 'logo', 'flag', 'drawing', 'illustration', 'painting', 'stamp', 'sketch', 'cartoon', 'engraving', 'museum', 'coin', 'medal', 'banknote', 'book', 'manuscript', 'document', 'cover', 'signature', 'coat of arms']
  if (bad.some(w => t.includes(w))) return true
  if (img.w < 100 || img.h < 100) return true
  return false
}

async function processItem(item, index, total) {
  const progress = `[${index + 1}/${total}]`
  console.log(`${progress} ${item.name} [${item.category}]`)

  const query = makeQuery(item)
  console.log(`  query: "${query}"`)

  // Search
  const photos = await searchWiki(query)
  console.log(`  ${photos.length} results`)
  if (photos.length === 0) return { name: item.name, status: 'no_results' }

  await sleep(2000)

  // Get URLs
  const imgTitles = photos.filter(p => /\.(jpg|jpeg|png|webp)$/i.test(p.title)).slice(0, 8)
  if (imgTitles.length === 0) return { name: item.name, status: 'no_images' }

  const imgs = await getImageUrls(imgTitles.map(p => p.title))
  const good = imgs.filter(img => !isProbablyBad(img))
  console.log(`  ${good.length} candidates`)

  if (good.length === 0) return { name: item.name, status: 'no_good' }

  const fp = join(OUT, item.name + '.jpg')
  const prompt = makePrompt(item.name, item.category)

  for (let j = 0; j < Math.min(good.length, 6); j++) {
    const img = good[j]
    try {
      // Download
      try { await downloadImage(img.url, fp) } catch {
        if (img.orig !== img.url) { await downloadImage(img.orig, fp) } else { continue }
      }
      const s = await compressImage(fp)

      // Doubao
      const answer = await callDoubao(imageToBase64(fp), prompt)
      const { v, r } = parseVerdict(answer)
      const icon = v === '符合' ? '✓' : '✗'
      console.log(`  [${j + 1}] ${v === '符合' ? '✓' : '✗'} ${r.substring(0, 60)}`)

      if (v === '符合') {
        // Update ingredients.ts
        updateIngredientTs(item.name)
        return { name: item.name, status: 'passed', reason: r }
      }
      await sleep(800)
    } catch (e) { /* continue */ }
  }

  // Delete the last failed attempt
  try { unlinkSync(fp) } catch {}
  return { name: item.name, status: 'all_failed' }
}

async function main() {
  // Load progress
  let progress = {}
  if (existsSync(PROGRESS_FILE)) {
    progress = JSON.parse(readFileSync(PROGRESS_FILE, 'utf-8'))
    console.log(`Resuming: ${Object.keys(progress).length} already processed\n`)
  }

  // Filter pending
  const pending = PLACEHOLDERS.filter(p => !progress[p.name])
  console.log(`Total: ${PLACEHOLDERS.length}, Done: ${PLACEHOLDERS.length - pending.length}, Pending: ${pending.length}\n`)

  let stats = { passed: 0, no_results: 0, no_images: 0, no_good: 0, all_failed: 0 }

  for (let i = 0; i < pending.length; i++) {
    const result = await processItem(pending[i], i, pending.length)

    progress[result.name] = result
    if (result.status === 'passed') stats.passed++
    else if (result.status === 'no_results') stats.no_results++
    else if (result.status === 'no_images') stats.no_images++
    else if (result.status === 'no_good') stats.no_good++
    else if (result.status === 'all_failed') stats.all_failed++

    // Save progress every 5 items
    if ((i + 1) % 5 === 0) {
      writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2))
      console.log(`  [SAVED] passed=${stats.passed} failed=${stats.no_results + stats.no_images + stats.no_good + stats.all_failed}\n`)
    }

    // Rate limit
    await sleep(4000)
  }

  // Final save
  writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2))

  console.log('\n===== BATCH COMPLETE =====')
  console.log(`Passed: ${stats.passed}`)
  console.log(`No results: ${stats.no_results}`)
  console.log(`No images: ${stats.no_images}`)
  console.log(`No good candidates: ${stats.no_good}`)
  console.log(`All failed Doubao: ${stats.all_failed}`)
  console.log(`Total: ${pending.length}`)
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1) })

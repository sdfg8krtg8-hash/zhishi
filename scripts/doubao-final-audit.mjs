import { existsSync, writeFileSync, readFileSync, statSync, renameSync, unlinkSync } from 'fs'
import { join, basename } from 'path'
import { request } from 'https'
import sharp from 'sharp'
import { ProxyAgent, fetch } from 'undici'

const PROXY = 'http://127.0.0.1:7897'
const DOUBAO_KEY = process.env.DOUBAO_KEY || ''
const DOUBAO_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions'
const MODEL = 'doubao-seed-1-6-vision-250815'
const OUT = join(process.cwd(), 'public', 'images', 'ingredients')
const LOG_FILE = join(process.cwd(), 'scripts', 'doubao-final-audit.txt')
const DELAY_DOUBAO = 800
const DELAY_WIKI = 3000
const TIMEOUT_MS = 20000

const dispatcher = new ProxyAgent({ uri: PROXY, requestTls: { rejectUnauthorized: false } })
async function wikiFetch(url, opts = {}) { const s = opts.signal || AbortSignal.timeout(TIMEOUT_MS); return fetch(url, { ...opts, dispatcher, signal: s }); }
const sleep = ms => new Promise(r => setTimeout(r, ms))

// ====== ALL 54 INGREDIENTS with category info ======
const ALL = [
  // 水果 22
  { name: '橙子', cat: '生鲜食材', query: 'orange fruit fresh Citrus sinensis' },
  { name: '橘子', cat: '生鲜食材', query: 'mandarin orange Citrus reticulata fruit' },
  { name: '柚子', cat: '生鲜食材', query: 'pomelo citrus fruit whole' },
  { name: '柠檬', cat: '生鲜食材', query: 'lemon fruit fresh Citrus limon' },
  { name: '草莓', cat: '生鲜食材', query: 'strawberry fruit fresh Fragaria' },
  { name: '蓝莓', cat: '生鲜食材', query: 'blueberry fruit fresh Vaccinium' },
  { name: '芒果', cat: '生鲜食材', query: 'mango fruit fresh Mangifera' },
  { name: '葡萄', cat: '生鲜食材', query: 'grape fruit fresh Vitis vinifera' },
  { name: '西瓜', cat: '生鲜食材', query: 'watermelon fresh whole Citrullus' },
  { name: '菠萝', cat: '生鲜食材', query: 'pineapple fruit fresh whole Ananas' },
  { name: '凤梨', cat: '生鲜食材', query: 'pineapple fruit fresh whole Ananas' },
  { name: '木瓜', cat: '生鲜食材', query: 'papaya fruit fresh Carica' },
  { name: '荔枝', cat: '生鲜食材', query: 'lychee fruit fresh Litchi chinensis' },
  { name: '柿子', cat: '生鲜食材', query: 'persimmon fruit fresh Diospyros kaki' },
  { name: '无花果', cat: '生鲜食材', query: 'fig fruit fresh Ficus carica' },
  { name: '百香果', cat: '生鲜食材', query: 'passion fruit fresh Passiflora' },
  { name: '西柚', cat: '生鲜食材', query: 'grapefruit fresh citrus' },
  { name: '李子', cat: '生鲜食材', query: 'plum fruit fresh Prunus' },
  { name: '猕猴桃', cat: '生鲜食材', query: 'kiwifruit fresh Actinidia' },
  { name: '火龙果', cat: '生鲜食材', query: 'dragon fruit fresh pitaya' },
  { name: '树莓', cat: '生鲜食材', query: 'raspberry fruit fresh Rubus' },
  { name: '桑葚', cat: '生鲜食材', query: 'mulberry fruit fresh Morus' },
  // 蔬菜 14
  { name: '冬瓜', cat: '生鲜食材', query: 'wax gourd winter melon Benincasa fresh' },
  { name: '南瓜', cat: '生鲜食材', query: 'pumpkin fresh whole Cucurbita' },
  { name: '苦瓜', cat: '生鲜食材', query: 'bitter melon fresh Momordica charantia' },
  { name: '西葫芦', cat: '生鲜食材', query: 'zucchini courgette fresh vegetable whole' },
  { name: '四季豆', cat: '生鲜食材', query: 'green beans fresh Phaseolus vulgaris' },
  { name: '辣椒', cat: '生鲜食材', query: 'chili pepper fresh Capsicum' },
  { name: '大葱', cat: '生鲜食材', query: 'scallion green onion fresh Allium fistulosum' },
  { name: '洋葱', cat: '生鲜食材', query: 'onion fresh whole Allium cepa' },
  { name: '生姜', cat: '生鲜食材', query: 'ginger fresh root Zingiber officinale' },
  { name: '生菜', cat: '生鲜食材', query: 'lettuce fresh head vegetable Lactuca sativa' },
  { name: '豆芽', cat: '生鲜食材', query: 'bean sprouts fresh mung bean' },
  { name: '莲藕', cat: '生鲜食材', query: 'lotus root fresh Nelumbo nucifera' },
  { name: '小米辣', cat: '生鲜食材', query: 'bird eye chili fresh Capsicum frutescens' },
  { name: '玉米', cat: '生鲜食材', query: 'corn fresh maize whole Zea mays' },
  // 肉类 3
  { name: '牛腱', cat: '生鲜食材', query: 'beef shank raw meat fresh' },
  { name: '羊排', cat: '生鲜食材', query: 'lamb rack raw meat fresh' },
  { name: '牛排', cat: '生鲜食材', query: 'beef steak raw meat fresh' },
  // 水产 2
  { name: '草鱼', cat: '生鲜食材', query: 'grass carp fish fresh Ctenopharyngodon' },
  { name: '鳗鱼', cat: '生鲜食材', query: 'eel fish fresh raw Anguilla' },
  // 蛋类 2
  { name: '鸡蛋', cat: '生鲜食材', query: 'chicken egg fresh raw' },
  { name: '鹌鹑蛋', cat: '生鲜食材', query: 'quail egg fresh raw' },
  // 干货 3
  { name: '花生', cat: '干货食材', query: 'peanut fresh raw groundnut' },
  { name: '燕麦', cat: '干货食材', query: 'oat grain dry Avena sativa' },
  // 加工主食 2
  { name: '包子', cat: '加工主食', query: 'steamed baozi bun Chinese' },
  { name: '饼', cat: '加工主食', query: 'flatbread Chinese bing pancake' },
  // 调味品 7
  { name: '盐', cat: '调味品', query: 'table salt white sodium chloride cooking' },
  { name: '糖', cat: '调味品', query: 'white sugar granulated sucrose food' },
  { name: '桂皮', cat: '调味品', query: 'cinnamon bark stick Cinnamomum cassia spice' },
  { name: '辣椒酱', cat: '调味品', query: 'chili sauce paste condiment' },
  { name: '花生酱', cat: '调味品', query: 'peanut butter spread paste' },
  { name: '甜面酱', cat: '调味品', query: 'sweet bean sauce Chinese tianmianjiang' },
  { name: '食用油', cat: '调味品', query: 'cooking oil vegetable oil liquid' },
]

// ====== MASTER PROMPT — comprehensive rules ======
function makePrompt(name, cat) {
  const base = `你是一个美食网站的严格图片审核员。请审核这张图片是否为"${name}"的真实合格照片。

该食材类别：${cat}

【核心规则——必须全部满足】
1. 图片主体必须100%是"${name}"本身。任何其他食材/物品混入、主体不符、相似但不同的食材，一律判定为不符合。

2. 生鲜食材（水果/蔬菜/肉类/水产/蛋类）：必须是未经烹饪、未加工的原始自然状态。切开/去皮可以，但做成菜/烤/煮/炒/炸的一律不符合。

3. 蔬菜类特别要求：必须是采摘后的食材，不能是长在菜地/田里/土里的植株。不能是花朵/幼苗。

4. 调味品（盐/糖/酱料/食用油/香料）特别要求：
   - "盐"必须是白色食用盐颗粒/结晶，不能是粉色盐/玫瑰盐/浴盐/含盐菜肴
   - "糖"必须是白砂糖晶体/颗粒/粉末，不能是冰糖/红糖/糖果/甜点/含糖食品/甘蔗
   - 酱料类（辣椒酱/花生酱/甜面酱）必须是酱料本身，不能是用了该酱料的菜品
   - "食用油"必须是液态油本身，不能是含油的菜肴
   - "桂皮"必须是肉桂棒/桂皮块（树皮卷），不能是风景/植物/粉末

5. 干货食材必须是干燥可食用状态，不能是田间植株/麦穗。

6. 加工主食（包子/饼等）必须是该食品本身的可食用状态。

7. 不能是已经做成菜肴/菜品的样子。
8. 不能是包装食品/罐头/塑料袋包装袋装的食品。
9. 不能是插画/绘画/素描/CG/3D渲染图。
10. 图片清晰、主体突出，适合美食网站使用。

请严格按此格式回答（不要多余内容）：
判定：<符合/不符合>
理由：<简要说明，不超过30字>`


  return base
}

// ====== Wikimedia search & download ======
async function searchWiki(query) {
  const params = new URLSearchParams({ action: 'query', list: 'search', srsearch: query, srnamespace: '6', srlimit: '15', format: 'json', origin: '*' })
  const url = 'https://commons.wikimedia.org/w/api.php?' + params
  const res = await wikiFetch(url)
  const txt = await res.text()
  try { const d = JSON.parse(txt); return d.query?.search || [] } catch { return [] }
}

async function getImageUrls(titles) {
  const params = new URLSearchParams({ action: 'query', titles: titles.join('|'), prop: 'imageinfo', iiprop: 'url|size|mime', iiurlwidth: '400', format: 'json', origin: '*' })
  const url = 'https://commons.wikimedia.org/w/api.php?' + params
  const res = await wikiFetch(url)
  const txt = await res.text()
  try {
    const d = JSON.parse(txt); const results = []
    for (const page of Object.values(d.query?.pages || {})) {
      const ii = page.imageinfo?.[0]
      if (ii && ii.mime?.startsWith('image/') && !ii.mime?.includes('svg')) results.push({ title: page.title, url: ii.thumburl || ii.url, orig: ii.url, w: ii.width, h: ii.height })
    }
    return results
  } catch { return [] }
}

function isObviouslyBad(img) {
  const t = img.title.toLowerCase()
  const bad = ['diagram', 'map', 'chart', 'icon', 'logo', 'flag', 'drawing', 'illustration', 'painting', 'stamp', 'sketch', 'cartoon', 'engraving', 'museum', 'monument', 'portrait', 'coin', 'medal', 'banknote', 'book', 'manuscript', 'document', 'cover', 'signature', 'coat of arms']
  for (const w of bad) { if (t.includes(w)) return true }
  if (img.w < 150 || img.h < 150) return true
  return false
}

async function downloadImage(url, filepath) {
  const res = await wikiFetch(url, { signal: AbortSignal.timeout(60000) })
  if (!res.ok) throw new Error('DL ' + res.status)
  const buf = await res.arrayBuffer()
  writeFileSync(filepath, Buffer.from(buf))
}

async function compress(fp) {
  const before = statSync(fp).size
  const tmp = fp + '.tmp'
  await sharp(fp).resize(400, undefined, { withoutEnlargement: true }).jpeg({ quality: 80, progressive: true }).toFile(tmp)
  unlinkSync(fp); renameSync(tmp, fp)
  return { before, after: statSync(fp).size }
}

// ====== Doubao verify ======
function imageToBase64(path) { return 'data:image/jpeg;base64,' + readFileSync(path).toString('base64') }

function callDoubao(imageUri, prompt) {
  return new Promise((resolve) => {
    const url = new URL(DOUBAO_URL)
    const payload = JSON.stringify({ model: MODEL, messages: [{ role: 'user', content: [{ type: 'image_url', image_url: { url: imageUri } }, { type: 'text', text: prompt }] }], max_tokens: 256 })
    const options = {
      hostname: url.hostname, port: 443, path: url.pathname + url.search, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + DOUBAO_KEY, 'Content-Length': Buffer.byteLength(payload) }, timeout: 60000
    }
    const req = request(options, res => { let body = ''; res.on('data', c => body += c); res.on('end', () => { try { const d = JSON.parse(body); resolve(d.choices?.[0]?.message?.content?.trim() || 'ERR'); } catch { resolve('ERR') } }) })
    req.on('error', e => resolve('NET: ' + e.message)); req.on('timeout', () => { req.destroy(); resolve('TIMEOUT') })
    req.write(payload); req.end()
  })
}

function parseVerdict(answer) {
  if (answer.startsWith('符合') || (answer.includes('符合') && !answer.includes('不符合'))) return { verdict: '符合', reason: answer.replace(/^(符合|不符合)\s*[,，。.]?\s*/, '').replace(/判定[：:]\s*(符合|不符合)\s*/g, '').trim().substring(0, 80) }
  if (answer.includes('不符合')) return { verdict: '不符合', reason: answer.replace(/^(符合|不符合)\s*[,，。.]?\s*/, '').replace(/判定[：:]\s*(符合|不符合)\s*/g, '').trim().substring(0, 80) }
  return { verdict: '未知', reason: answer.substring(0, 80) }
}

// ====== Main ======
async function reviewOne(name, cat, filepath) {
  const imageUri = imageToBase64(filepath)
  const answer = await callDoubao(imageUri, makePrompt(name, cat))
  return parseVerdict(answer)
}

async function downloadAndVerify(item, maxCandidates = 8) {
  console.log(`  搜索: "${item.query}"`)
  const photos = await searchWiki(item.query)
  console.log(`  ${photos.length} 个结果`)

  if (photos.length === 0) return null

  const imgs = await getImageUrls(photos.slice(0, 15).map(p => p.title))
  const candidates = imgs.filter(img => !isObviouslyBad(img))
  console.log(`  ${candidates.length} 个可用候选`)

  const filepath = join(OUT, item.name + '.jpg')

  for (let j = 0; j < Math.min(candidates.length, maxCandidates); j++) {
    const img = candidates[j]
    try {
      let dlUrl = img.url
      try { await downloadImage(dlUrl, filepath) } catch {
        if (img.orig !== img.url) { await downloadImage(img.orig, filepath) } else { continue }
      }
      const { before, after } = await compress(filepath)
      const title = img.title.replace('File:', '').substring(0, 55)
      console.log(`  [${j + 1}] ${title} (${(before / 1024).toFixed(0)}KB→${(after / 1024).toFixed(0)}KB)`)

      const { verdict, reason } = await reviewOne(item.name, item.cat, filepath)
      const icon = verdict === '符合' ? '✓' : '✗'
      console.log(`    豆包: ${icon} ${verdict} — ${reason}`)

      if (verdict === '符合') return { name: item.name, verdict: '符合', reason, action: 'downloaded' }
      await sleep(DELAY_DOUBAO)
    } catch (e) { console.log(`    ⚠ ${e.message}`) }
  }
  return null
}

async function main() {
  console.log('===== 最终严格审核：' + ALL.length + ' 张图片 =====\n')
  console.log('规则已内置：调味品vs食材区分、白色食盐/白砂糖、非菜地/非风景/非混入\n')

  const results = {}
  let passCount = 0, failCount = 0, replacedCount = 0, skipCount = 0

  // Load existing log for resume
  if (existsSync(LOG_FILE)) {
    const lines = readFileSync(LOG_FILE, 'utf-8').split('\n').filter(Boolean)
    for (const line of lines) {
      const [n, v, r, a] = line.split('|').map(s => s.trim())
      if (v === '符合' || v === '不符合' || v === '跳过') {
        results[n] = { verdict: v, reason: r || '', action: a || '' }
        if (v === '符合') passCount++
        else if (v === '不符合') failCount++
        else if (v === '跳过') skipCount++
      }
    }
    console.log(`已有 ${Object.keys(results).length} 条记录，跳过已审核的\n`)
  }

  for (let i = 0; i < ALL.length; i++) {
    const item = ALL[i]
    const progress = `[${i + 1}/${ALL.length}]`
    const filepath = join(OUT, item.name + '.jpg')

    // Skip if already reviewed
    if (results[item.name] && (results[item.name].verdict === '符合' || results[item.name].verdict === '跳过')) {
      continue
    }

    console.log(`${progress} ${item.name} [${item.cat}]`)

    // Step 1: Review existing image
    if (existsSync(filepath)) {
      try {
        const { verdict, reason } = await reviewOne(item.name, item.cat, filepath)
        const icon = verdict === '符合' ? '✓' : '✗'
        console.log(`  审核现有: ${icon} ${verdict} — ${reason}`)

        if (verdict === '符合') {
          results[item.name] = { verdict: '符合', reason, action: 'existing' }
          passCount++
          // Save log
          saveLog()
          await sleep(DELAY_DOUBAO)
          continue
        }
        // Failed — will try to download replacement
        console.log(`  → 不通过，尝试下载替换...`)
      } catch (e) {
        console.log(`  ⚠ 审核现有图片失败: ${e.message}`)
      }
    } else {
      console.log(`  文件不存在，尝试下载...`)
    }

    // Step 2: Try to download replacement
    const downloadResult = await downloadAndVerify(item)

    if (downloadResult) {
      results[item.name] = downloadResult
      passCount++; replacedCount++
    } else {
      console.log(`  ✗ 无法找到合适替换，跳过`)
      results[item.name] = { verdict: '跳过', reason: '无合适图片', action: 'skipped' }
      skipCount++
    }

    // Save log after each
    saveLog()
    await sleep(DELAY_WIKI)
  }

  function saveLog() {
    const lines = Object.entries(results).map(([n, r]) => `${n}|${r.verdict}|${r.reason}|${r.action}`)
    writeFileSync(LOG_FILE, lines.join('\n') + '\n')
  }

  console.log(`\n===== 最终审核完成 =====`)
  console.log(`总计: ${ALL.length}`)
  console.log(`符合: ${passCount} (${(passCount / ALL.length * 100).toFixed(1)}%)`)
  console.log(`  其中原有保持: ${passCount - replacedCount}`)
  console.log(`  其中新下载替换: ${replacedCount}`)
  console.log(`跳过: ${skipCount}`)
  console.log(`日志: ${LOG_FILE}`)
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1) })

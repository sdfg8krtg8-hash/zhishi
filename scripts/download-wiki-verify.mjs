import { existsSync, writeFileSync, readFileSync, statSync, renameSync, unlinkSync } from 'fs'
import { join } from 'path'
import { request } from 'https'
import sharp from 'sharp'
import { ProxyAgent, fetch } from 'undici'

const PROXY = 'http://127.0.0.1:7897'
const API_KEY_DOUBAO = process.env.DOUBAO_KEY || ''
const DOUBAO_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions'
const MODEL = 'doubao-seed-1-6-vision-250815'
const OUTPUT_DIR = join(process.cwd(), 'public', 'images', 'ingredients')
const DELAY_MS = 4000
const TIMEOUT_MS = 20000

const dispatcher = new ProxyAgent({ uri: PROXY, requestTls: { rejectUnauthorized: false } })

async function wikiFetch(url, options = {}) {
  const signal = options.signal || AbortSignal.timeout(TIMEOUT_MS)
  return fetch(url, { ...options, dispatcher, signal })
}

// Items that still need proper images
const ITEMS = [
  { name: '盐', query: 'salt food cooking fine sea salt' },
  { name: '糖', query: 'sugar white granulated sucrose' },
  { name: '燕麦', query: 'oat flakes porridge oats' },
  { name: '李子', query: 'plum fruit fresh Prunus' },
]

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function searchWiki(query) {
  const params = new URLSearchParams({
    action: 'query', list: 'search', srsearch: query,
    srnamespace: '6', srlimit: '15', format: 'json', origin: '*',
  })
  const url = `https://commons.wikimedia.org/w/api.php?${params}`
  const res = await wikiFetch(url)
  const data = await res.json()
  return data.query?.search || []
}

async function getImageUrls(titles) {
  const params = new URLSearchParams({
    action: 'query', titles: titles.join('|'),
    prop: 'imageinfo', iiprop: 'url|size|mime', iiurlwidth: '400',
    format: 'json', origin: '*',
  })
  const url = `https://commons.wikimedia.org/w/api.php?${params}`
  const res = await wikiFetch(url)
  const data = await res.json()
  const results = []
  for (const page of Object.values(data.query?.pages || {})) {
    const ii = page.imageinfo?.[0]
    if (ii && ii.mime?.startsWith('image/') && !ii.mime?.includes('svg')) {
      results.push({
        title: page.title,
        url: ii.thumburl || ii.url,
        originalUrl: ii.url,
        width: ii.width, height: ii.height,
      })
    }
  }
  return results
}

function scoreImage(img, name) {
  let score = 0
  if (img.width >= 1200 && img.height >= 900) score += 5
  else if (img.width >= 800 && img.height >= 600) score += 3
  else if (img.width >= 400 && img.height >= 300) score += 1

  const t = img.title.toLowerCase()

  // General bad keywords
  const bad = ['diagram', 'map', 'chart', 'icon', 'logo', 'flag', 'drawing', 'illustration',
    'painting', 'stamp', 'sketch', 'cartoon', 'engraving', 'flower', 'bloom', 'blossom',
    'botanical', 'herbarium', 'specimen', 'seedling', 'museum', 'monument', 'portrait',
    'line art', 'black and white', 'b&w', 'dish', 'cuisine', 'meal', 'cooked', 'fried',
    'roasted', 'baked', 'grilled', 'recipe', 'plate', 'bowl', 'sauce', 'salad', 'soup',
    'dessert', 'candy', 'chocolate', 'donut', 'cake', 'cookie', 'pastry', 'sweet',
    'caramel', 'confectionery', 'cane', 'sugarcane', 'plant', 'tree', 'garden', 'field',
    'farm', 'person', 'people', 'woman', 'man', 'hand', 'face', 'body', 'spa', 'bath',
    'cosmetic', 'skin', 'cream', 'lotion', 'soap', 'skincare', 'body butter']
  for (const w of bad) {
    if (t.includes(w)) score -= 10
  }

  // Item-specific good keywords
  const goodGeneral = ['food', 'cooking', 'ingredient', 'fresh', 'raw', 'whole', 'background']
  for (const w of goodGeneral) {
    if (t.includes(w)) score += 1
  }

  // Name-specific boosting
  if (name === '盐') {
    for (const w of ['salt', 'sodium chloride', 'sea salt', 'table salt', 'cooking salt',
      'salt shaker', 'salt cellar', 'pile', 'mound', 'heap', 'spoon', 'scoop',
      'pouring', 'scattered', 'granulated', 'fine salt', 'coarse salt', 'white salt'])
      if (t.includes(w)) score += 3
    for (const w of ['pink', 'himalayan', 'rose', 'bath salt', 'epsom'])
      if (t.includes(w)) score -= 15
  }

  if (name === '糖') {
    for (const w of ['sugar', 'white sugar', 'granulated sugar', 'table sugar', 'refined sugar',
      'sucrose', 'sugar crystals', 'sugar cube', 'sugar bowl', 'pile', 'mound', 'heap',
      'spoon', 'scoop', 'pouring', 'scattered'])
      if (t.includes(w)) score += 3
    for (const w of ['cane', 'sugarcane', 'brown sugar', 'raw sugar', 'muscovado',
      'candy', 'sweet', 'dessert', 'cake', 'cookie', 'chocolate', 'donut', 'pastry',
      'confectionery', 'caramel', 'molasses', 'syrup', 'cookies'])
      if (t.includes(w)) score -= 15
  }

  if (name === '燕麦') {
    for (const w of ['oat', 'rolled oat', 'oatmeal', 'porridge oat', 'oat grain',
      'avena', 'oat flake', 'breakfast cereal', 'steel cut', 'scottish oat'])
      if (t.includes(w)) score += 3
    for (const w of ['plant', 'field', 'farm', 'crop', 'growing', 'harvest',
      'cooked', 'bowl', 'porridge', 'dish', 'meal', 'fruit', 'berry', 'granola'])
      if (t.includes(w)) score -= 10
  }

  if (name === '花生酱') {
    for (const w of ['peanut butter', 'peanut paste', 'ground peanut', 'nut butter'])
      if (t.includes(w)) score += 4
    for (const w of ['sandwich', 'bread', 'toast', 'jelly', 'jam', 'cracker',
      'cookie', 'cupcake', 'chocolate', 'body', 'cream', 'lotion', 'skin', 'cosmetic'])
      if (t.includes(w)) score -= 15
  }

  if (name === '李子') {
    for (const w of ['plum', 'prunus', 'damson', 'prune', 'stone fruit', 'drupe'])
      if (t.includes(w)) score += 3
    for (const w of ['lemon', 'apple', 'peach', 'apricot', 'cherry', 'fig', 'orange',
      'flower', 'bloom', 'blossom', 'tree', 'branch', 'leaf', 'jam', 'preserve', 'jar',
      'canned', 'dried', 'cake', 'pie', 'tart', 'dessert'])
      if (t.includes(w)) score -= 10
  }

  if (img.width < 300 || img.height < 300) score -= 5
  return score
}

async function downloadImage(url, filepath) {
  const res = await wikiFetch(url, { signal: AbortSignal.timeout(60000) })
  if (!res.ok) throw new Error(`Download ${res.status}`)
  const buffer = await res.arrayBuffer()
  writeFileSync(filepath, Buffer.from(buffer))
}

async function compressImage(filepath) {
  const before = statSync(filepath).size
  const tmpPath = filepath + '.tmp'
  await sharp(filepath)
    .resize(400, undefined, { withoutEnlargement: true })
    .jpeg({ quality: 80, progressive: true })
    .toFile(tmpPath)
  unlinkSync(filepath)
  renameSync(tmpPath, filepath)
  const after = statSync(filepath).size
  return { before, after }
}

// ====== Doubao verify ======
function imageToBase64(path) { const buf = readFileSync(path); return `data:image/jpeg;base64,${buf.toString('base64')}` }

function callDoubao(imageUri, prompt) {
  return new Promise((resolve) => {
    const url = new URL(DOUBAO_URL)
    const payload = JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: [
        { type: 'image_url', image_url: { url: imageUri } },
        { type: 'text', text: prompt }
      ]}],
      max_tokens: 256
    })
    const options = {
      hostname: url.hostname, port: 443, path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY_DOUBAO}`,
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 60000
    }
    const req = request(options, res => {
      let body = ''
      res.on('data', chunk => body += chunk)
      res.on('end', () => {
        try {
          const data = JSON.parse(body)
          resolve(data.choices?.[0]?.message?.content?.trim() || `ERROR: ${body.substring(0, 200)}`)
        } catch(e) { resolve(`PARSE_ERROR: ${body.substring(0, 200)}`) }
      })
    })
    req.on('error', err => resolve(`NET_ERROR: ${err.message}`))
    req.on('timeout', () => { req.destroy(); resolve('TIMEOUT') })
    req.write(payload)
    req.end()
  })
}

function makePrompt(name) {
  const seasonings = ['盐', '糖', '花生酱', '甜面酱', '辣椒酱', '桂皮', '食用油']
  const isSeasoning = seasonings.includes(name)

  if (isSeasoning) {
    if (name === '盐') {
      return `你是一个美食网站的严格图片审核员。请审核这张图片。

食材名称："${name}" — 属于调味品。

审核标准：
1. 图片主体必须100%是食盐本身——白颜色的食盐颗粒/结晶
2. 不能是粉色盐/玫瑰盐/喜马拉雅盐等彩色盐
3. 不能是含有盐的菜肴/食物
4. 不能是浴盐/粗盐/岩盐块
5. 图片清晰、主体突出

请只回答：符合 或 不符合，然后简要说明理由（不超过30字）。`
    }
    if (name === '糖') {
      return `你是一个美食网站的严格图片审核员。请审核这张图片。

食材名称："${name}" — 属于调味品。

审核标准：
1. 图片主体必须100%是白砂糖本身——白色砂糖晶体/颗粒/粉末形态
2. 不能是冰糖/红糖/黄糖等其他颜色的糖
3. 不能是糖果/甜点/巧克力/蛋糕/曲奇等含糖食品
4. 不能是甘蔗/糖浆/焦糖/蜂蜜
5. 图片清晰、主体突出

请只回答：符合 或 不符合，然后简要说明理由（不超过30字）。`
    }
    if (name === '花生酱') {
      return `你是一个美食网站的严格图片审核员。请审核这张图片。

食材名称："${name}" — 属于调味品/酱料。

审核标准：
1. 图片主体必须100%是花生酱本身
2. 不能是含花生酱的菜品/三明治/吐司
3. 不能是花生颗粒（那是花生，不是花生酱）
4. 酱料形态、清晰可见

请只回答：符合 或 不符合，然后简要说明理由（不超过30字）。`
    }
  }

  // Default for 食材
  return `你是一个美食网站的严格图片审核员。请审核这张图片。

食材名称："${name}" — 属于食材。

严格审核标准：
1. 图片主体必须100%是"${name}"本身，任何其他食材混入一律不符合
2. 必须是未经烹饪的原始食材状态
3. 不能是花朵/植株/幼苗
4. 不能是菜肴/菜品
5. 不能是罐头/包装食品
6. 图片清晰、主体突出

请只回答：符合 或 不符合，然后简要说明理由（不超过30字）。`
}

async function main() {
  console.log('=== Wikimedia + 豆包严格验证：盐、糖、燕麦、花生酱、李子 ===\n')

  for (let i = 0; i < ITEMS.length; i++) {
    const item = ITEMS[i]
    const filename = `${item.name}.jpg`
    const filepath = join(OUTPUT_DIR, filename)
    const progress = `[${i + 1}/${ITEMS.length}]`

    console.log(`${progress} ${item.name} — 搜索: "${item.query}"`)

    try {
      const photos = await searchWiki(item.query)
      console.log(`  找到 ${photos.length} 个结果`)

      if (photos.length === 0) { console.log(`  ✗ 无搜索结果\n`); continue }

      const titles = photos.slice(0, 15).map(p => p.title)
      const images = await getImageUrls(titles)

      const scored = images.map(img => ({ ...img, score: scoreImage(img, item.name) }))
      scored.sort((a, b) => b.score - a.score)

      console.log(`  Top candidates:`)
      for (const s of scored.slice(0, 5)) {
        console.log(`    score:${s.score} ${s.title.replace('File:', '').substring(0, 70)}`)
      }

      // Try top candidates until Doubao approves
      let approved = false
      for (let j = 0; j < Math.min(scored.length, 8); j++) {
        const best = scored[j]
        if (best.score < -20) { console.log(`  → 跳过低分候选 (score:${best.score})`); continue }

        try {
          if (best.url !== best.originalUrl) {
            try { await downloadImage(best.url, filepath) } catch {
              console.log(`    缩略图失败，尝试原图...`)
              await downloadImage(best.originalUrl, filepath)
            }
          } else {
            await downloadImage(best.url, filepath)
          }

          const { before, after } = await compressImage(filepath)
          console.log(`  → [${j + 1}] ${(before/1024).toFixed(0)}KB → ${(after/1024).toFixed(0)}KB`)

          // Doubao verify
          const imageUri = imageToBase64(filepath)
          const answer = await callDoubao(imageUri, makePrompt(item.name))

          let verdict = '未知'
          if (answer.startsWith('符合') || (answer.includes('符合') && !answer.includes('不符合'))) verdict = '符合'
          else if (answer.includes('不符合')) verdict = '不符合'

          const reason = answer.replace(/^(符合|不符合)\s*[,，]?\s*/, '').trim()

          const icon = verdict === '符合' ? '✓' : '✗'
          console.log(`    豆包: ${icon} ${verdict} — ${reason}`)

          if (verdict === '符合') {
            approved = true
            console.log(`  ✓ 通过! 已保存 ${filename}`)
            break
          } else {
            console.log(`  → 不通过，尝试下一张...`)
            await sleep(1000)
          }
        } catch(e) {
          console.log(`    ⚠ ${e.message}`)
        }
      }

      if (!approved) console.log(`  ✗ 所有候选均未通过`)

    } catch(e) {
      console.error(`  ✗ 错误: ${e.message}`)
    }

    console.log()
    await sleep(DELAY_MS)
  }

  console.log('===== 完成 =====')
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1) })

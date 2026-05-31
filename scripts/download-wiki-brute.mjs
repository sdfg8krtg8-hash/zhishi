import { existsSync, writeFileSync, readFileSync, statSync, renameSync, unlinkSync } from 'fs'
import { join } from 'path'
import { request } from 'https'
import sharp from 'sharp'
import { ProxyAgent, fetch } from 'undici'

const PROXY = 'http://127.0.0.1:7897'
const API_KEY_DOUBAO = 'ark-b8ba9b44-b9ab-4006-9304-cf8537d980b3-a62b3'
const DOUBAO_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions'
const MODEL = 'doubao-seed-1-6-vision-250815'
const OUTPUT_DIR = join(process.cwd(), 'public', 'images', 'ingredients')
const DELAY_MS = 3000
const TIMEOUT_MS = 20000

const dispatcher = new ProxyAgent({ uri: PROXY, requestTls: { rejectUnauthorized: false } })

async function wikiFetch(url, options = {}) {
  const signal = options.signal || AbortSignal.timeout(TIMEOUT_MS)
  return fetch(url, { ...options, dispatcher, signal })
}

const ITEMS = [
  { name: '燕麦', queries: ['oats', 'oat flakes', 'rolled oats', 'oat grain', 'avena sativa', 'oatmeal dry'] },
  { name: '李子', queries: ['plum fruit', 'prunus plum', 'fresh plum', 'plum whole fruit', 'damson'] },
]

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function searchWiki(query) {
  const params = new URLSearchParams({
    action: 'query', list: 'search', srsearch: query,
    srnamespace: '6', srlimit: '10', format: 'json', origin: '*',
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

function isBadImage(img, name) {
  const t = img.title.toLowerCase()
  const bad = ['diagram', 'map', 'chart', 'icon', 'logo', 'flag', 'drawing', 'illustration',
    'painting', 'stamp', 'sketch', 'cartoon', 'engraving', 'herbarium', 'museum',
    'monument', 'portrait', 'coin', 'medal', 'banknote', 'book', 'manuscript',
    'document', 'cover', 'signature', 'coat of arms', 'arms']
  for (const w of bad) {
    if (t.includes(w)) return true
  }
  if (img.width < 150 || img.height < 150) return true
  return false
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
  if (name === '盐') {
    return `你是一个美食网站的严格图片审核员。请审核这张图片是否为"食盐"。

要求：图片主体必须是白色的日常食用盐（细盐/食盐颗粒或结晶），不是粉色盐/玫瑰盐/浴盐/含盐菜肴。只回答"符合"或"不符合"，然后简要说明理由。`
  }
  if (name === '糖') {
    return `你是一个美食网站的严格图片审核员。请审核这张图片是否为"白砂糖"。

要求：图片主体必须是白色的白砂糖（晶体/颗粒/粉末），不是冰糖/红糖/糖果/甜点/含糖食品/甘蔗。只回答"符合"或"不符合"，然后简要说明理由。`
  }
  if (name === '燕麦') {
    return `你是一个美食网站的严格图片审核员。请审核这张图片是否为"燕麦"食材。

要求：图片主体必须是燕麦片/燕麦粒（干燥可食用形态），不是燕麦植株/燕麦粥/燕麦菜品的照片。只回答"符合"或"不符合"，然后简要说明理由。`
  }
  if (name === '李子') {
    return `你是一个美食网站的严格图片审核员。请审核这张图片是否为"李子"食材。

要求：图片主体必须是新鲜李子的果实，不能有其他水果混入，不能是罐头/果酱/果干/蛋糕。只回答"符合"或"不符合"，然后简要说明理由。`
  }
  return `审核这张图片是否为"${name}"食材。只回答"符合"或"不符合"，然后简要说明理由。`
}

async function main() {
  console.log('=== 多查询Wikimedia + 豆包审核（无评分过滤）===\n')

  for (let i = 0; i < ITEMS.length; i++) {
    const item = ITEMS[i]
    const filename = `${item.name}.jpg`
    const filepath = join(OUTPUT_DIR, filename)
    const progress = `[${i + 1}/${ITEMS.length}]`

    console.log(`${progress} ${item.name}`)

    // Try multiple queries
    let allPhotos = []
    let seenTitles = new Set()
    for (const q of item.queries) {
      try {
        const photos = await searchWiki(q)
        for (const p of photos) {
          if (!seenTitles.has(p.title)) {
            seenTitles.add(p.title)
            allPhotos.push(p)
          }
        }
        if (allPhotos.length >= 30) break
        await sleep(500)
      } catch(e) { console.log(`  ⚠ 搜索 "${q}" 失败: ${e.message}`) }
    }

    console.log(`  ${allPhotos.length} 个去重结果`)

    // Get image URLs in batches
    let allImages = []
    for (let b = 0; b < allPhotos.length; b += 10) {
      try {
        const batch = allPhotos.slice(b, b + 10).map(p => p.title)
        const imgs = await getImageUrls(batch)
        allImages.push(...imgs)
        await sleep(300)
      } catch(e) {
        console.log(`  ⚠ 获取图片URL失败: ${e.message}`)
      }
    }

    // Filter out obviously bad ones
    const candidates = allImages.filter(img => !isBadImage(img, item.name))
    console.log(`  ${candidates.length} 个可用候选`)

    if (candidates.length === 0) {
      console.log(`  ✗ 无可用候选\n`)
      continue
    }

    // Try each candidate until Doubao approves (max 10)
    let approved = false
    for (let j = 0; j < Math.min(candidates.length, 10); j++) {
      const img = candidates[j]
      const shortTitle = img.title.replace('File:', '').substring(0, 60)

      try {
        await downloadImage(img.url, filepath)
        const { before, after } = await compressImage(filepath)
        console.log(`  [${j + 1}] ${shortTitle} (${(before/1024).toFixed(0)}KB → ${(after/1024).toFixed(0)}KB)`)

        const imageUri = imageToBase64(filepath)
        const answer = await callDoubao(imageUri, makePrompt(item.name))

        let verdict = '未知'
        if (answer.startsWith('符合') || (answer.includes('符合') && !answer.includes('不符合'))) verdict = '符合'
        else if (answer.includes('不符合')) verdict = '不符合'

        const reason = answer.replace(/^(符合|不符合)\s*[,，。.]?\s*/, '').trim()
        const icon = verdict === '符合' ? '✓' : '✗'
        console.log(`    → ${icon} ${verdict} — ${reason}`)

        if (verdict === '符合') {
          approved = true
          console.log(`  ✓ 通过! 已保存 ${filename}`)
          break
        }
        await sleep(800)
      } catch(e) {
        if (img.url !== img.originalUrl) {
          try {
            await downloadImage(img.originalUrl, filepath)
            const { before, after } = await compressImage(filepath)
            // Also verify
            const imageUri = imageToBase64(filepath)
            const answer = await callDoubao(imageUri, makePrompt(item.name))
            let verdict = '未知'
            if (answer.startsWith('符合') || (answer.includes('符合') && !answer.includes('不符合'))) verdict = '符合'
            else if (answer.includes('不符合')) verdict = '不符合'
            const reason = answer.replace(/^(符合|不符合)\s*[,，。.]?\s*/, '').trim()
            const icon = verdict === '符合' ? '✓' : '✗'
            console.log(`    [重试] ${shortTitle} → ${icon} ${verdict} — ${reason}`)
            if (verdict === '符合') { approved = true; console.log(`  ✓ 通过! 已保存 ${filename}`); break }
          } catch {}
        } else {
          console.log(`    ⚠ ${e.message}`)
        }
        await sleep(800)
      }
    }

    if (!approved) console.log(`  ✗ 所有候选均未通过\n`)
    else console.log()

    await sleep(DELAY_MS)
  }

  console.log('===== 完成 =====')
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1) })

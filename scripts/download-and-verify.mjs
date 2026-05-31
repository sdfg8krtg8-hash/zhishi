import { existsSync, writeFileSync, readFileSync, statSync, renameSync, unlinkSync } from 'fs'
import { join } from 'path'
import { request } from 'https'
import sharp from 'sharp'

const API_KEY_PEXELS = 'o9PrRJ8CCFLfCIOwNT2xeDIvbSCnRa96QqXTUEllmbdGP5lh0QpX6LuF'
const API_KEY_DOUBAO = 'ark-b8ba9b44-b9ab-4006-9304-cf8537d980b3-a62b3'
const DOUBAO_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions'
const MODEL = 'doubao-seed-1-6-vision-250815'
const OUTPUT_DIR = join(process.cwd(), 'public', 'images', 'ingredients')
const DELAY_MS = 5000
const TIMEOUT_MS = 30000

const ITEMS = [
  { name: '盐', query: 'salt cooking white food ingredient' },
  { name: '糖', query: 'sugar granulated white food ingredient' },
  { name: '燕麦', query: 'oatmeal rolled oats food ingredient' },
  { name: '花生酱', query: 'peanut butter food ingredient' },
  { name: '柚子', query: 'pomelo citrus fruit whole' },
  { name: '李子', query: 'fresh plum fruit whole' },
]

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// ====== Pexels download ======
async function searchPexels(query) {
  const params = new URLSearchParams({
    query, per_page: 5, orientation: 'square', size: 'medium', locale: 'en-US',
  })
  const res = await fetch(`https://api.pexels.com/v1/search?${params}`, {
    headers: { Authorization: API_KEY_PEXELS },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (res.status === 429) {
    const retryAfter = res.headers.get('Retry-After') || 60
    console.log(`  限流，等待 ${retryAfter}s...`)
    await sleep(Number(retryAfter) * 1000 + 1000)
    return searchPexels(query)
  }
  if (!res.ok) throw new Error(`Pexels ${res.status}`)
  const data = await res.json()
  return data.photos || []
}

function cleanImageUrl(url) {
  try { const u = new URL(url); return u.origin + u.pathname } catch { return url }
}

async function downloadImage(url, filepath, retries = 2) {
  const cleanUrl = cleanImageUrl(url)
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(cleanUrl, { signal: AbortSignal.timeout(TIMEOUT_MS) })
      if (!res.ok) throw new Error(`Download ${res.status}`)
      const buffer = await res.arrayBuffer()
      writeFileSync(filepath, Buffer.from(buffer))
      return
    } catch (err) {
      if (attempt === retries) throw err
      await sleep(3000)
    }
  }
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
  const isSeasoning = ['盐', '糖', '花生酱', '甜面酱', '辣椒酱', '桂皮', '食用油'].includes(name)
  const typeDesc = isSeasoning
    ? `"${name}"是调味品/调料。图片必须是该调味品本身的形态。`
    : `"${name}"是食材。图片必须是该食材本身的原始形态。`

  return `你是一个美食网站的严格图片审核员。请审核这张图片。

${typeDesc}

严格审核标准：
1. 图片主体必须100%是"${name}"本身，任何其他食材混入或主体不符一律判定为不符合
2. 【调味品特别严格】如果"${name}"是调味品，图片必须是该调味品本身，绝不能是含有该调味品的食物/菜肴/甜点。例如："盐"必须是食盐颗粒/结晶的形态（白色食盐）；"糖"必须是白砂糖/砂糖晶体/糖粉的形态，绝不能是糖果、甜点、蛋糕等含糖食品
3. 食材类必须是未经烹饪的原始状态（除非该食材本身就是熟食/加工品）
4. 不能是植物幼苗、花朵、植株（除非食材本身就是花或苗）
5. 不能是已经做成菜肴/菜品的样子
6. 图片应当清晰、美观，主体突出，适合美食网站使用
7. 不能是包装食品、罐头、塑料袋/包装袋装的食品

请严格按以下格式回答（不要多余内容）：
判定：<符合/不符合>
理由：<简要说明，不超过30字>`}

async function main() {
  console.log('=== 下载 + 豆包验证：盐、糖 + 4个不通过食材 ===\n')

  for (let i = 0; i < ITEMS.length; i++) {
    const item = ITEMS[i]
    const filename = `${item.name}.jpg`
    const filepath = join(OUTPUT_DIR, filename)
    const progress = `[${i + 1}/${ITEMS.length}]`

    console.log(`${progress} ${item.name} — 搜索: "${item.query}"`)

    try {
      // Step 1: Search Pexels
      let photos = await searchPexels(item.query)
      if (photos.length === 0) {
        console.log(`  ✗ Pexels 无结果`)
        continue
      }

      // Try up to 3 photos until Doubao approves
      let approved = false
      for (let p = 0; p < Math.min(photos.length, 3); p++) {
        const photo = photos[p]
        console.log(`  → [${p + 1}] ${photo.photographer}: ${photo.alt}`)

        // Download
        await downloadImage(photo.src.medium, filepath)
        const { before, after } = await compressImage(filepath)
        console.log(`    ${(before/1024).toFixed(0)}KB → ${(after/1024).toFixed(0)}KB`)

        // Doubao verify
        const imageUri = imageToBase64(filepath)
        const answer = await callDoubao(imageUri, makePrompt(item.name))

        let verdict = '未知'
        if (answer.startsWith('符合') || (answer.includes('符合') && !answer.includes('不符合'))) verdict = '符合'
        else if (answer.includes('不符合')) verdict = '不符合'

        const reason = answer.replace(/^(符合|不符合)\s*[,，]?\s*/, '').replace(/判定[：:]\s*(符合|不符合)\s*/g, '')

        const icon = verdict === '符合' ? '✓' : '✗'
        console.log(`    豆包: ${icon} ${verdict} — ${reason}`)

        if (verdict === '符合') {
          approved = true
          console.log(`  → 通过! 已保存 ${filename}`)
          break
        } else {
          console.log(`  → 不通过，尝试下一张...`)
          await sleep(1000)
        }
      }

      if (!approved) {
        console.log(`  ✗ 所有候选图片均未通过豆包审核`)
      }

    } catch(e) {
      console.error(`  ✗ 错误: ${e.message}`)
    }

    if (i < ITEMS.length - 1) {
      console.log(`  → 等待 ${DELAY_MS / 1000}s...`)
      await sleep(DELAY_MS)
    }
  }

  console.log('\n===== 完成 =====')
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1) })

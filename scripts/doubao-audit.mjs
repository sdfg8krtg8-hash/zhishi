import { readFileSync, readdirSync, writeFileSync, existsSync } from 'fs'
import { join, basename } from 'path'
import { request } from 'https'

const API_KEY = 'ark-b8ba9b44-b9ab-4006-9304-cf8537d980b3-a62b3'
const API_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions'
const MODEL = 'doubao-seed-1-6-vision-250815'
const ING_DIR = join(process.cwd(), 'public', 'images', 'ingredients')
const RESULT_FILE = join(process.cwd(), 'scripts', 'doubao-audit-results.txt')
const DELAY_MS = 500

const PROMPT = (name) => `你是一个美食网站的图片审核员。请严格审核这张图片。

这是一道食材审核题：请判断这张图片是否为食材"${name}"的真实照片。

审核标准：
1. 图片主体必须是"${name}"本身（可食用状态），相似食材不算
2. 必须是未经烹饪的原始食材状态（除非该食材本身就是熟食/加工品）
3. 不能是植物幼苗、花朵、植株（除非食材本身就是花或苗）
4. 不能是已经做成菜肴/菜品的样子
5. 图片应当清晰、美观，适合美食网站使用
6. 不能是包装食品、罐头、干货包装袋

请只回答一个词：符合 或 不符合，然后简要说明理由（不超过30字）。`

function imageToBase64(path) {
  const buf = readFileSync(path)
  return `data:image/jpeg;base64,${buf.toString('base64')}`
}

function callDoubao(imageUri, prompt) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_URL)
    const payload = JSON.stringify({
      model: MODEL,
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: imageUri } },
          { type: 'text', text: prompt }
        ]
      }],
      max_tokens: 256
    })

    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
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
          if (data.choices?.[0]?.message?.content) {
            resolve(data.choices[0].message.content.trim())
          } else {
            resolve(`ERROR: ${body.substring(0, 200)}`)
          }
        } catch(e) {
          resolve(`PARSE_ERROR: ${body.substring(0, 200)}`)
        }
      })
    })
    req.on('error', err => resolve(`NET_ERROR: ${err.message}`))
    req.on('timeout', () => { req.destroy(); resolve('TIMEOUT') })
    req.write(payload)
    req.end()
  })
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function main() {
  const files = readdirSync(ING_DIR).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
  const names = files.map(f => basename(f, /\.(jpg|jpeg|png|webp)$/i.exec(f)?.[0] || '.jpg'))

  console.log(`待审核图片: ${names.length} 张\n`)

  // Load existing results
  const results = {}
  if (existsSync(RESULT_FILE)) {
    const lines = readFileSync(RESULT_FILE, 'utf-8').split('\n').filter(Boolean)
    for (const line of lines) {
      const [name, verdict, ...reason] = line.split('|').map(s => s.trim())
      if (verdict === '符合' || verdict === '不符合') {
        results[name] = { verdict, reason: reason.join('|') }
      }
    }
    console.log(`已有结果: ${Object.keys(results).length} 个\n`)
  }

  let reviewed = 0
  let passed = 0
  let failed = 0

  for (let i = 0; i < names.length; i++) {
    const name = names[i]

    if (results[name]) {
      if (results[name].verdict === '符合') passed++
      else failed++
      continue
    }

    const filepath = join(ING_DIR, files[i])
    const progress = `[${i + 1}/${names.length}]`

    try {
      const imageUri = imageToBase64(filepath)
      const answer = await callDoubao(imageUri, PROMPT(name))

      let verdict = '未知'
      if (answer.startsWith('符合')) verdict = '符合'
      else if (answer.startsWith('不符合')) verdict = '不符合'
      else if (answer.includes('符合') && !answer.includes('不符合')) verdict = '符合'
      else if (answer.includes('不符合')) verdict = '不符合'

      const reason = answer.replace(/^(符合|不符合)\s*[,，]?\s*/, '')
      results[name] = { verdict, reason }

      if (verdict === '符合') passed++
      else failed++
      reviewed++

      const icon = verdict === '符合' ? '✓' : '✗'
      console.log(`${progress} ${icon} ${name} — ${reason}`)

      // Save after each review
      const lines = Object.entries(results).map(([n, r]) => `${n}|${r.verdict}|${r.reason}`)
      writeFileSync(RESULT_FILE, lines.join('\n') + '\n')

    } catch(e) {
      console.log(`${progress} ? ${name} — ERROR: ${e.message}`)
    }

    await sleep(DELAY_MS)
  }

  console.log(`\n===== 审核完成 =====`)
  console.log(`符合: ${passed}`)
  console.log(`不符合: ${failed}`)
  console.log(`总计: ${names.length}`)
  console.log(`结果已保存: ${RESULT_FILE}`)
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1) })

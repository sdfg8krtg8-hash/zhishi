import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, basename } from 'path'
import { request } from 'https'

const API_KEY = 'ark-b8ba9b44-b9ab-4006-9304-cf8537d980b3-a62b3'
const API_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions'
const MODEL = 'doubao-seed-1-6-vision-250815'
const ING_DIR = join(process.cwd(), 'public', 'images', 'ingredients')
const RESULT_FILE = join(process.cwd(), 'scripts', 'doubao-reaudit-results.txt')
const DELAY_MS = 800

// 54 previously approved ingredients
const APPROVED = [
  // 水果 21
  '橙子', '橘子', '柚子', '柠檬', '草莓', '蓝莓', '芒果', '葡萄', '西瓜', '菠萝',
  '凤梨', '木瓜', '荔枝', '柿子', '无花果', '百香果', '西柚', '李子', '猕猴桃', '火龙果',
  '树莓', '桑葚',
  // 蔬菜 14
  '冬瓜', '南瓜', '苦瓜', '西葫芦', '四季豆', '辣椒', '大葱', '洋葱', '生姜', '生菜',
  '豆芽', '莲藕', '小米辣', '玉米',
  // 肉类 2
  '牛腱', '羊排',
  // 水产 2
  '草鱼', '鳗鱼',
  // 蛋类 2
  '鸡蛋', '鹌鹑蛋',
  // 干货/主食 4
  '花生', '燕麦', '饼', '包子', '牛排',
  // 调料/调味品 7
  '盐', '糖', '桂皮', '辣椒酱', '花生酱', '甜面酱', '食用油',
]

const PROMPT = (name) => `你是一个美食网站的严格图片审核员。请审核这张图片。

食材名称："${name}"

首先判断"${name}"属于哪一类：
- 生鲜食材（水果、蔬菜、肉类、水产、蛋类等）：必须是未经烹饪、未加工的原始自然状态
- 干货食材（花生、燕麦等）：必须是干燥可食用的原始状态
- 调味品（盐、糖、酱料、食用油、香料等）：必须是该调味品本身，绝不能是含有该调味品的食物、菜肴或甜点
- 加工主食（包子、饼等）：必须是该食品本身的可食用状态

严格审核标准：
1. 图片主体必须100%是"${name}"本身，任何相似但不相同的食材一律判定为不符合
2. 生鲜食材必须是未经烹饪的原始状态，切开/去皮可以接受，但做成菜的一律不符合
3. 【调味品特别标准】调味品必须展示该调味品本身的形态。例如："糖"必须是白砂糖、冰糖、红糖等糖的晶体或粉末形态，绝不能是糖果、巧克力、甜点、蛋糕等含糖食品；"盐"必须是食盐颗粒/结晶形态；"食用油"必须是液态油本身，不能是含油的菜肴；"酱油/酱料"必须是酱料本身，不能是用了该酱料的菜品
4. 不能是植物幼苗、花朵、植株（除非食材本身就是花或苗）
5. 不能是已经做成菜肴/菜品的样子
6. 图片应当清晰、美观，主体突出，适合美食网站使用
7. 不能是包装食品、罐头、塑料袋/包装袋装的食品

请严格按以下格式回答（不要多余内容）：
类别：<生鲜食材/干货食材/调味品/加工主食>
判定：<符合/不符合>
理由：<简要说明，不超过30字>`

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

function parseResponse(answer) {
  // Parse: 类别：xxx 判定：xxx 理由：xxx
  let category = '未识别'
  let verdict = '未知'
  let reason = answer

  const catMatch = answer.match(/类别[：:]\s*(.+?)(?:\n|$|判定|。)/)
  if (catMatch) category = catMatch[1].trim()

  if (answer.includes('符合') && !answer.includes('不符合')) {
    verdict = '符合'
  } else if (answer.includes('不符合')) {
    verdict = '不符合'
  }

  const reasonMatch = answer.match(/理由[：:]\s*(.+?)$/m)
  if (reasonMatch) reason = reasonMatch[1].trim()
  else reason = answer.replace(/类别[：:].+?\n?/g, '').replace(/判定[：:].+?\n?/g, '').trim()

  return { category, verdict, reason }
}

async function main() {
  console.log('===== 豆包严格重新审核 =====')
  console.log(`待审核: ${APPROVED.length} 张（之前全部通过）\n`)

  const results = {}
  if (existsSync(RESULT_FILE)) {
    const lines = readFileSync(RESULT_FILE, 'utf-8').split('\n').filter(Boolean)
    for (const line of lines) {
      const parts = line.split('|')
      if (parts.length >= 3) {
        results[parts[0]] = { category: parts[1], verdict: parts[2], reason: parts.slice(3).join('|') }
      }
    }
  }

  let reviewed = 0, passed = 0, failed = 0

  for (let i = 0; i < APPROVED.length; i++) {
    const name = APPROVED[i]

    if (results[name] && (results[name].verdict === '符合' || results[name].verdict === '不符合')) {
      if (results[name].verdict === '符合') passed++
      else failed++
      continue
    }

    const file = `${name}.jpg`
    const filepath = join(ING_DIR, file)
    if (!existsSync(filepath)) {
      console.log(`[${i + 1}/${APPROVED.length}] ✗ ${name} — 文件不存在`)
      results[name] = { category: 'N/A', verdict: '文件缺失', reason: '' }
      failed++
      continue
    }

    console.log(`[${i + 1}/${APPROVED.length}] 审核: ${name}...`)

    try {
      const imageUri = imageToBase64(filepath)
      const answer = await callDoubao(imageUri, PROMPT(name))
      const { category, verdict, reason } = parseResponse(answer)

      results[name] = { category, verdict, reason }
      reviewed++

      if (verdict === '符合') passed++
      else failed++

      const icon = verdict === '符合' ? '✓' : '✗'
      console.log(`  ${icon} [${category}] ${name} — ${reason}`)

      // Save after each
      const lines = Object.entries(results).map(([n, r]) => `${n}|${r.category}|${r.verdict}|${r.reason}`)
      writeFileSync(RESULT_FILE, lines.join('\n') + '\n')

    } catch(e) {
      console.log(`  ? ${name} — ERROR: ${e.message}`)
    }

    await sleep(DELAY_MS)
  }

  console.log(`\n===== 重新审核完成 =====`)
  console.log(`符合: ${passed}`)
  console.log(`不符合: ${failed}`)
  console.log(`总计: ${APPROVED.length}`)
  console.log(`通过率: ${(passed / APPROVED.length * 100).toFixed(1)}%`)
  console.log(`结果保存: ${RESULT_FILE}`)
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1) })

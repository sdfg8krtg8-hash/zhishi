import { writeFileSync, readFileSync, statSync, renameSync, unlinkSync } from 'fs'
import { join } from 'path'
import { request } from 'https'
import sharp from 'sharp'
import { ProxyAgent, fetch } from 'undici'

const PROXY = 'http://127.0.0.1:7897'
const dispatcher = new ProxyAgent({ uri: PROXY, requestTls: { rejectUnauthorized: false } })
async function wf(url, opts = {}) { const s = opts.signal || AbortSignal.timeout(20000); return fetch(url, { ...opts, dispatcher, signal: s }) }
const OUT = join(process.cwd(), 'public', 'images', 'ingredients')
const DK = process.env.DOUBAO_KEY || ''
const sleep = ms => new Promise(r => setTimeout(r, ms))

async function search(q) {
  const p = new URLSearchParams({ action: 'query', list: 'search', srsearch: q, srnamespace: '6', srlimit: '15', format: 'json', origin: '*' })
  const r = await wf('https://commons.wikimedia.org/w/api.php?' + p)
  try { const d = JSON.parse(await r.text()); return d.query?.search || [] } catch { return [] }
}

async function getUrls(titles) {
  const p = new URLSearchParams({ action: 'query', titles: titles.join('|'), prop: 'imageinfo', iiprop: 'url|size|mime', iiurlwidth: '400', format: 'json', origin: '*' })
  const r = await wf('https://commons.wikimedia.org/w/api.php?' + p)
  try {
    const d = JSON.parse(await r.text()); const res = []
    for (const pg of Object.values(d.query?.pages || {})) {
      const ii = pg.imageinfo?.[0]
      if (ii && ii.mime?.startsWith('image/') && !ii.mime?.includes('svg')) res.push({ title: pg.title, url: ii.thumburl || ii.url, orig: ii.url, w: ii.width, h: ii.height })
    }
    return res
  } catch { return [] }
}

function isBad(img) {
  const t = img.title.toLowerCase()
  const badWords = ['diagram', 'map', 'chart', 'icon', 'logo', 'flag', 'drawing', 'illustration',
    'painting', 'stamp', 'sketch', 'cartoon', 'engraving', 'museum', 'coin', 'medal', 'banknote',
    'book', 'manuscript', 'document', 'cover', 'signature', 'coat of arms']
  if (badWords.some(w => t.includes(w))) return true
  if (img.w < 100 || img.h < 100) return true
  return false
}

async function dl(url, fp) {
  const r = await wf(url, { signal: AbortSignal.timeout(60000) })
  if (!r.ok) throw new Error('DL ' + r.status)
  writeFileSync(fp, Buffer.from(await r.arrayBuffer()))
}

async function comp(fp) {
  const b = statSync(fp).size; const t = fp + '.tmp'
  await sharp(fp).resize(400, undefined, { withoutEnlargement: true }).jpeg({ quality: 80, progressive: true }).toFile(t)
  unlinkSync(fp); renameSync(t, fp); return statSync(fp).size
}

function b64(p) { return 'data:image/jpeg;base64,' + readFileSync(p).toString('base64') }

function askDoubao(imgUri, prompt) {
  return new Promise(res => {
    const u = new URL('https://ark.cn-beijing.volces.com/api/v3/chat/completions')
    const body = JSON.stringify({ model: 'doubao-seed-1-6-vision-250815', messages: [{ role: 'user', content: [{ type: 'image_url', image_url: { url: imgUri } }, { type: 'text', text: prompt }] }], max_tokens: 256 })
    const opts = { hostname: u.hostname, port: 443, path: u.pathname + u.search, method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + DK, 'Content-Length': Buffer.byteLength(body) }, timeout: 60000 }
    const req = request(opts, r => { let b = ''; r.on('data', c => b += c); r.on('end', () => { try { const d = JSON.parse(b); res(d.choices?.[0]?.message?.content?.trim() || 'ERR') } catch { res('ERR') } }) })
    req.on('error', e => res('NET: ' + e.message)); req.on('timeout', () => { req.destroy(); res('TIMEOUT') })
    req.write(body); req.end()
  })
}

const ITEMS = [
  {
    name: '葡萄', cat: '生鲜食材',
    prompt: '审核是否为"葡萄"食材。要求：必须是采摘后的新鲜葡萄果实（成串），不能混入花瓶/花/其他水果/人物。只回答"符合"或"不符合"，简要说明理由。',
    queries: ['grape fruit bunch fresh', 'table grape Vitis food', 'fresh grapes cluster', 'grape food ingredient']
  },
  {
    name: '凤梨', cat: '生鲜食材',
    prompt: '审核是否为"凤梨"食材。要求：必须是新鲜凤梨（菠萝），不能混入花/杯子/其他物品。只回答"符合"或"不符合"，简要说明理由。',
    queries: ['pineapple fruit whole fresh', 'Ananas comosus pineapple food', 'pineapple isolated']
  },
  {
    name: '荔枝', cat: '生鲜食材',
    prompt: '审核是否为"荔枝"食材。要求：必须是新鲜荔枝果实，不能混入面包/其他食物。只回答"符合"或"不符合"，简要说明理由。',
    queries: ['lychee fruit fresh', 'Litchi chinensis fruit food', 'lychee bunch fresh']
  },
  {
    name: '苦瓜', cat: '生鲜食材',
    prompt: '审核是否为"苦瓜"食材。要求：必须是采摘后的新鲜苦瓜（单独放置），不能长在藤上/植株上/田里。只回答"符合"或"不符合"，简要说明理由。',
    queries: ['bitter melon fruit fresh', 'bitter gourd vegetable', 'Momordica charantia fruit', 'karela food']
  },
  {
    name: '西葫芦', cat: '生鲜食材',
    prompt: '审核是否为"西葫芦"食材。要求：必须是生鲜西葫芦（zucchini/courgette绿色长圆柱形），不是黄瓜，不是烤过/烹饪过的。只回答"符合"或"不符合"，简要说明理由。',
    queries: ['zucchini fresh whole raw', 'courgette vegetable raw', 'zucchini squash food ingredient']
  },
  {
    name: '花生', cat: '干货食材',
    prompt: '审核是否为"花生"食材。要求：必须是花生（带壳或去壳均可），不能混入刀叉/盘子/其他食物。只回答"符合"或"不符合"，简要说明理由。',
    queries: ['peanut groundnut fresh raw', 'Arachis hypogaea peanut food', 'peanut shell raw ingredient']
  },
  {
    name: '桂皮', cat: '调味品',
    prompt: '审核是否为调味品"桂皮"。桂皮是肉桂树皮卷成的香料棒。要求：必须是桂皮/肉桂棒本身，不能有人物/风景/植物/粉末。只回答"符合"或"不符合"，简要说明理由。',
    queries: ['cinnamon stick spice', 'cinnamon bark Cinnamomum', 'cinnamon quill spice food']
  },
  {
    name: '食用油', cat: '调味品',
    prompt: '审核是否为"食用油"。要求：必须是液态食用油本身（透明或淡黄色液体），不能混入青柠/辣椒/其他食材。只回答"符合"或"不符合"，简要说明理由。',
    queries: ['cooking oil liquid vegetable', 'olive oil bottle pouring', 'oil food ingredient cooking']
  },
]

async function processItem(item) {
  console.log('=== ' + item.name + ' [' + item.cat + '] ===')
  let allPhotos = []; const seen = new Set()
  for (const q of item.queries) {
    const photos = await search(q)
    console.log('  query: ' + q + ' -> ' + photos.length + ' results')
    for (const p of photos) { if (!seen.has(p.title)) { seen.add(p.title); allPhotos.push(p) } }
    if (allPhotos.length >= 30) break
    await sleep(500)
  }
  console.log('  total unique: ' + allPhotos.length)

  let allImgs = []
  for (let b = 0; b < allPhotos.length; b += 15) {
    const imgs = await getUrls(allPhotos.slice(b, b + 15).map(p => p.title))
    allImgs.push(...imgs)
    await sleep(300)
  }
  console.log('  image URLs: ' + allImgs.length)

  // Show raw results to debug
  if (allImgs.length === 0) {
    console.log('  NO IMAGES AT ALL — showing raw search titles:')
    for (const p of allPhotos.slice(0, 5)) console.log('    ' + p.title.replace('File:', '').substring(0, 80))
    return false
  }

  const candidates = allImgs.filter(img => !isBad(img))
  console.log('  candidates (after filter): ' + candidates.length)

  if (candidates.length === 0) {
    console.log('  showing all images (unfiltered):')
    for (const img of allImgs.slice(0, 5)) console.log('    ' + img.title.replace('File:', '').substring(0, 70) + ' (' + img.w + 'x' + img.h + ')')
    return false
  }

  const fp = join(OUT, item.name + '.jpg')
  for (let j = 0; j < Math.min(candidates.length, 10); j++) {
    const img = candidates[j]
    try {
      await dl(img.url, fp); const s = await comp(fp)
      console.log(' [' + (j + 1) + '] ' + img.title.replace('File:', '').substring(0, 55) + ' (' + (s / 1024).toFixed(0) + 'KB)')
      const a = await askDoubao(b64(fp), item.prompt)
      let v = '?'
      if (a.startsWith('符合') || (a.includes('符合') && !a.includes('不符合'))) v = '符合'
      else if (a.includes('不符合')) v = '不符合'
      const reason = a.replace(/^(符合|不符合)\s*[,，。.]?\s*/, '').substring(0, 70)
      console.log('   -> ' + (v === '符合' ? '✓' : '✗') + ' ' + v + ' — ' + reason)
      if (v === '符合') { console.log('  PASSED!'); return true }
      await sleep(800)
    } catch (e) { console.log('   err: ' + e.message.substring(0, 60)) }
  }
  return false
}

async function main() {
  let ok = 0, fail = 0
  for (const item of ITEMS) {
    if (await processItem(item)) ok++; else fail++
    console.log()
    await sleep(2000)
  }
  console.log('===== DONE =====')
  console.log('Fixed: ' + ok + '/' + ITEMS.length)
  console.log('Still skipped: ' + fail)
}
main().catch(e => console.error('Fatal:', e.message))

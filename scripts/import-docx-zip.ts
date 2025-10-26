import fs from 'node:fs/promises'
import path from 'node:path'
import JSZip from 'jszip'
import { XMLParser } from 'fast-xml-parser'
import minimist from 'minimist'
import slugify from 'slugify'

// Usage (Windows PowerShell examples):
//   npx tsx scripts\import-docx-zip.ts --zip .\recipes.zip --out .\data\recipes\imported.ts --debug --loose --peek 3

const argv = minimist(process.argv.slice(2))
const zipPath = argv.zip as string
const outPath = (argv.out as string) || './data/recipes/imported.ts'
const debug = !!argv.debug
const loose = true // force loose heuristics by default for your corpus
const peek = Number(argv.peek ?? 0)

if (!zipPath) {
  console.error('Usage: --zip <file.zip> [--out ./data/recipes/imported.ts] [--debug] [--peek N]')
  process.exit(1)
}

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '', textNodeName: 'text' })

// We’ll still respect headings if present, but you likely don’t have them:
const ING_HEADERS = new Set(['ingredients','ingredient','ingredients:'])
const STEP_HEADERS = new Set(['steps','method','directions','preparation','procedure','instructions'])

const UNIT_WORDS = new Set([
  '#','tsp','teaspoon','teaspoons','tbsp','tablespoon','tablespoons',
  'cup','cups','c', 'c.',
  'ml','milliliter','milliliters','l','liter','litre','liters','litres',
  'oz','ounce','ounces','lb','pound','pounds','g','gram','grams','kg','kilogram','kilograms',
  'qt','quart','quarts','gal','gallon','gallons','pinch','dash','clove','cloves'
])

const UNIT_MAP: Record<string,string> = {
  t:'tsp', tsp:'tsp', teaspoon:'tsp', teaspoons:'tsp',
  tbsp:'tbsp', tablespoon:'tbsp', tablespoons:'tbsp', tbl:'tbsp', tbs:'tbsp', T:'tbsp', 'ybsp.':'tbsp',
  cup:'cup', cups:'cup', c:'cup', 'c.':'cup',
  ml:'ml', milliliter:'ml', milliliters:'ml', mL:'ml',
  l:'l', liter:'l', litre:'l', liters:'l', litres:'l', L:'l',
  fl:'fl oz', floz:'fl oz', 'fl oz':'fl oz', fluidounce:'fl oz', fluidounces:'fl oz',
  oz:'oz', ounce:'oz', ounces:'oz', 'oz.':'oz',
  lb:'lb', lbs:'lb', pound:'lb', pounds:'lb',  '#': 'lb', 
  g:'g', gram:'g', grams:'g',
  kg:'kg', kilogram:'kg', kilograms:'kg',
  qt:'qt', quart:'qt', quarts:'qt',
  gal:'gal', gallon:'gal', gallons:'gal'
}

const UNIT_SHORTS = [
  't', 'tsp', 'tbsp',
  'c', 'cup', 'cups',
  'oz', 'lb', 'lbs',
  'g', 'kg', 'ml', 'l',
  'qt', 'gal'
]

function toCanonicalUnit(u?: string): string | undefined {
  if (!u) return undefined
  const key = u.replace(/\./g,'').trim().toLowerCase()
  return UNIT_MAP[key] ?? u.toLowerCase()
}

const UNICODE_FRAC: Record<string,string> = {
  '¼': '1/4','½':'1/2','¾':'3/4','⅐':'1/7','⅑':'1/9','⅒':'1/10',
  '⅓':'1/3','⅔':'2/3','⅕':'1/5','⅖':'2/5','⅗':'3/5','⅘':'4/5',
  '⅙':'1/6','⅚':'5/6','⅛':'1/8','⅜':'3/8','⅝':'5/8','⅞':'7/8'
}
function replaceUnicodeFractions(s: string) {
  return s.replace(/[¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]/g, ch => UNICODE_FRAC[ch] || ch)
}

function parseMixedNumber(s: string): number | null {
  s = replaceUnicodeFractions(s).trim()         // "½" -> "1/2", "1 ½" stays "1 1/2"
  const m1 = s.match(/^(\d+)\s+(\d+)\/(\d+)$/); if (m1) return +m1[1] + (+m1[2]/+m1[3])
  const m2 = s.match(/^(\d+)\/(\d+)$/);         if (m2) return +m2[1]/+m2[2]
  const n = Number(s.replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

function collectText(node: any): string {
  if (!node) return ''
  if (typeof node === 'string') return node
  if (node.text) return String(node.text)
  if (Array.isArray(node)) return node.map(collectText).join('')
  let out = ''
  for (const k of Object.keys(node)) out += collectText((node as any)[k])
  return out
}

// paragraphs + table rows
function extractLines(xml: string): string[] {
  const json = parser.parse(xml)
  const body = json?.['w:document']?.['w:body']
  if (!body) return []
  const lines: string[] = []

  // paragraphs
  const paras = body['w:p']
  const pArr = Array.isArray(paras) ? paras : (paras ? [paras] : [])
  for (const p of pArr) {
    const runs = p['w:r']
    const rArr = Array.isArray(runs) ? runs : (runs ? [runs] : [])
    let text = ''
    for (const r of rArr) text += collectText(r['w:t'])
    const cleaned = (text ?? '').replace(/\u00A0/g, ' ').trim()
    if (cleaned) lines.push(cleaned)
  }

  // tables → join cell text per row
  const tbls = body['w:tbl']
  const tArr = Array.isArray(tbls) ? tbls : (tbls ? [tbls] : [])
  for (const tbl of tArr) {
    const trs = tbl['w:tr']
    const rRows = Array.isArray(trs) ? trs : (trs ? [trs] : [])
    for (const tr of rRows) {
      const tcs = tr['w:tc']
      const cArr = Array.isArray(tcs) ? tcs : (tcs ? [tcs] : [])
      const cells: string[] = []
      for (const tc of cArr) {
        const cellText = collectText(tc).replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim()
        if (cellText) cells.push(cellText)
      }
      const joined = cells.join(' ')
      if (joined) lines.push(joined)
    }
  }

  // remove consecutive duplicates
  const dedup: string[] = []
  for (const l of lines) if (!dedup.length || dedup[dedup.length-1] !== l) dedup.push(l)
  return dedup
}

function findHeaderIndex(lines: string[], set: Set<string>): number {
  return lines.findIndex(l => set.has(l.trim().toLowerCase().replace(/:$/,'')))
}

// Treat "Yield: 3.5 gal", "(Yield 3 1/2 qt)", "Serves 12", "Makes 2 gal" as metadata, not ingredients
function isYieldMetaLine(s: string): boolean {
  return /^\s*\(?\s*(yield|yields|serves|makes)\b/i.test(s.trim())
}

// Ingredient detector tuned for your docs
function looksLikeIngredient(line: string): boolean {
  const s = line.trim()
  if (/^[-•·]/.test(s)) return true                     // bullets
  if (/^\(\d+\)/.test(s)) return true                   // (12) chicken breasts
  if (/^[0-9]/.test(s)) return true                     // 3 tsp ..., 6 eggs
  if (/^[¼½¾⅓⅔⅛⅜⅝⅞]/.test(s)) return true               // Unicode fraction first
  if (/\b\d+\s*#\b/.test(s)) return true
  if (/\b\d+\s*\/\s*\d+\b/.test(s)) return true         // 1/2 cup ..., 3/4 tsp ...
  if (/^#\s*\d+/.test(s)) return !isCanSizeToken(s)
  // number + known unit somewhere
  const unitAlt = Array.from(UNIT_WORDS).map(u => u.replace(/[-/\\^$*+?.()|[\]{}]/g,'\\$&')).join('|')
  return new RegExp(`\\b(\\d+|[¼½¾⅓⅔⅛⅜⅝⅞])\\s*(${unitAlt})\\b`, 'i').test(s)
}

// Build one or more ingredient entries from a line
function splitEntries(line: string): Array<{qty?: number; unit?: string; name: string}> {
  let s = line.replace(/^[•·-]\s*/,'').trim()
  const unitBoundary = new RegExp(`\\b(${UNIT_SHORTS.join('|')})\\.(?=[A-Za-z])`, 'gi')
  s = s.replace(unitBoundary, (_m, u) => `${u} `)
  s = s.replace(/(\d[\d\s\/,\.¼½¾⅓⅔⅛⅜⅝⅞]*)\s*#\.?\s*/g, (_, q) => `${q} # `)
  s = s.replace(/(\d)(?=(?:tsp|tbsp|oz|lb|g|kg|ml|l|qt|gal|c)\.)/gi, '$1 ')
  // Parenthesized count at start → treat as count and strip: "(12) Thing" → qty=12, unit=count
  const paren = s.match(/^\((\d+)\)\s+(.*)$/)
  if (paren) {
    const name = paren[2].trim()
    return [{ qty: Number(paren[1]), unit: 'count', name }]
  }
  // General pattern: support unicode fractions in qty token
  const QTY = '([0-9¼½¾⅓⅔⅛⅜⅝⅞][\\d\\s\\/,\\.¼½¾⅓⅔⅛⅜⅝⅞]*)'
  const rx = new RegExp(`${QTY}\\s*([A-Za-z\\.#]+)?\\s+([^0-9].*?)$`)
  const m = s.match(rx)
  
  if (m) {
    const qty = parseMixedNumber(m[1]) ?? undefined
    const rawUnit = (m[2] || '').trim()
    const canon = toCanonicalUnit(rawUnit)
    let name = (m[3] || '').trim()
    if (!canon) {
      // e.g., "6 large eggs" => treat "large" as part of name, unit=count
      return [{ qty, unit: 'count', name: (rawUnit ? `${rawUnit} ${name}` : name).trim() }]
    }
    
    return [{ qty, unit: canon, name }]
  }
  // Fallback: name-only (rare)
  return [{ qty: undefined, unit: undefined, name: s }]
}

function isCanSizeToken(s: string): boolean {
  return /^#\s*\d+(?:\.\d+)?\s*(?:can|cans)\b/i.test(s.trim())
}

function parseYield(lines: string[]): { count: number; unit: string } {
  // Look for "Serves 12" / "Yield: ..." / "Makes ..."
  for (const l of lines.slice(0,12)) {
    const m1 = l.match(/yield\s*:\s*(\d+(?:[.,]\d+)?)\s*([A-Za-z]+)?/i)
    if (m1) return { count: Number(m1[1].replace(',','.')), unit: (m1[2]||'servings').toLowerCase() }
    const m2 = l.match(/serves?\s*(\d+)/i)
    if (m2) return { count: Number(m2[1]), unit: 'servings' }
    const m3 = l.match(/makes?\s*(\d+(?:[.,]\d+)?)\s*([A-Za-z]+)?/i)
    if (m3) return { count: Number(m3[1].replace(',','.')), unit: (m3[2]||'batch').toLowerCase() }
  }
  return { count: 1, unit: 'batch' }
}

async function main() {
  const raw = await fs.readFile(zipPath)
  const outer = await JSZip.loadAsync(raw)

  const paths = Object.keys(outer.files)
  const docx = paths.filter(n => n.toLowerCase().endsWith('.docx'))
  const dotdoc = paths.filter(n => n.toLowerCase().endsWith('.doc'))

  if (debug) {
    console.log(`[importer] entries in zip: ${paths.length}`)
    console.log(`[importer] .docx found: ${docx.length}`)
    if (dotdoc.length) console.log(`[importer] WARNING: .doc files detected: ${dotdoc.length} (convert to .docx)`)
    for (const s of docx.slice(0, 10)) console.log('  -', s)
  }

  if (!docx.length) {
    console.error('[importer] No .docx files found. Check your zip path or convert .doc to .docx.')
    process.exit(2)
  }

  const out: any[] = []
  let skipped = 0

  for (const entryName of docx) {
    const f = outer.file(entryName); if (!f) continue
    const buf = await f.async('uint8array')
    const inner = await JSZip.loadAsync(buf)
    const xml = await inner.file('word/document.xml')?.async('string')
    if (!xml) { skipped++; if (debug) console.log('[skip] no document.xml:', entryName); continue }

    const lines = extractLines(xml)
    if (debug && peek > 0) {
      console.log(`\n[peek] ${entryName}`)
      for (const s of lines.slice(0, peek)) console.log('   ', s)
    }

    // title & category
    const norm = entryName.replace(/\\/g,'/')
    const parts = norm.split('/')
    const file = parts.pop()!
    const category = (parts.pop() || 'General').replace(/_/g,' ')
    const basename = file.replace(/\.docx$/i,'')
    const title = (lines.find(l => l.trim()) || basename).trim()

    const y = parseYield(lines)

    // Try to find explicit sections
    const trimmed = lines.map(s => s.trim())
    const ingIdx = findHeaderIndex(trimmed, ING_HEADERS)
    const stepIdx = findHeaderIndex(trimmed, STEP_HEADERS)

    const ingredients: any[] = []
    const steps: string[] = []

    // Sectioned parse (if present)
    if (ingIdx >= 0) {
      let end = stepIdx > ingIdx ? stepIdx : trimmed.length
      let order = 0
      for (const raw of trimmed.slice(ingIdx + 1, end)) {
        const s = raw.trim(); if (!s) continue
        const key = s.toLowerCase().replace(/:$/,'')
        if (ING_HEADERS.has(key) || STEP_HEADERS.has(key)) break
        if (isYieldMetaLine(s)) continue
        for (const e of splitEntries(s)) {
          if (!e.name) continue
          ingredients.push({ orderIndex: order++, name: e.name, quantity: e.qty ?? 0, unit: (e.unit as any) || 'count' })
        }
      }
    }
    if (stepIdx >= 0) {
      for (const raw of trimmed.slice(stepIdx + 1)) {
        const s = raw.trim(); if (!s) continue
        const key = s.toLowerCase().replace(/:$/,'')
        if (ING_HEADERS.has(key) || STEP_HEADERS.has(key)) break
        steps.push(s.replace(/^\s*\d+[\.)]?\s*/, ''))
      }
    }

    // Fallback (loose): treat lines that look like ingredients as ingredients; others as steps
    if (loose && ingredients.length === 0) {
      let order = 0
      for (const s of trimmed.slice(1)) { // skip the title
        if (isYieldMetaLine(s)) continue
        if (looksLikeIngredient(s)) {
          for (const e of splitEntries(s)) {
            if (!e.name) continue
            ingredients.push({ orderIndex: order++, name: e.name, quantity: e.qty ?? 0, unit: (e.unit as any) || 'count' })
          }
        }
      }
    }
    if (loose && steps.length === 0) {
      for (const s of trimmed.slice(1)) {
        if (/^(serves|yield|makes)\b/i.test(s)) continue // don't treat “Serves 12” as a step
        if (!looksLikeIngredient(s)) steps.push(s.replace(/^\s*\d+[\.)]?\s*/, ''))
      }
    }

    if (ingredients.length < 1 || steps.length < 1) {
      skipped++; if (debug) console.log('[skip] not enough structure:', entryName)
      continue
    }
    
    const BAD_UNIT_NAMES = new Set(['tsp','tbsp','cup','cups','ml','l','fl oz','oz','lb','#','g','kg','qt','gal'])
    const cleanedIngredients = ingredients.filter(i =>
          i.name && !BAD_UNIT_NAMES.has(String(i.name).trim().toLowerCase())
    )
    if (cleanedIngredients.length < 1 || steps.length < 1) {
      skipped++; if (debug) console.log('[skip] not enough structure after cleaning:', entryName)
      continue
    }

    out.push({
      slug: slugify(title || basename, { lower: true, strict: true }),
      title,
      category,
      description: '',
      yieldCount: y.count,
      yieldUnit: y.unit,
      ingredients: cleanedIngredients,
      steps
    })
  }

  const header = `// Auto-generated from ${path.basename(zipPath)}\n// Do not edit by hand\n`
  const ts = `${header}const data = ${JSON.stringify(out, null, 2)} as const;\nexport default data as any;\n`
  await fs.writeFile(outPath, ts, 'utf8')
  console.log(`Imported ${out.length} recipes, skipped ${skipped} → ${outPath}`)
}

main().catch(err => { console.error(err); process.exit(1) })

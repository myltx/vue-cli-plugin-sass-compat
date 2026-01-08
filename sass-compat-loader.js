/**
 * 兼容旧项目 SCSS 写法，便于从 node-sass(libsass) 迁移到 sass(dart-sass)：
 * 1) 将 `/deep/`、`>>>` 转成 `::v-deep`（避免 dart-sass 报 “Expected selector”）
 * 2) 修复 `calc(100%-16px)` 这类写法（dart-sass 要求运算符两侧有空格）
 *
 * @param {string} source
 * @param {any} map
 * @returns {string|void}
 * @this {import('webpack').LoaderContext<{fixDeep?: boolean, fixCalc?: boolean}>}
 */
module.exports = function sassCompatLoader(source, map) {
  if (this && typeof this.cacheable === 'function') this.cacheable()

  const options = getLoaderOptions(this)
  const fixDeep = options.fixDeep !== false
  const fixCalc = options.fixCalc !== false

  const resourcePath = (this && this.resourcePath) || ''
  if (resourcePath.includes('node_modules')) {
    if (this && typeof this.callback === 'function') return this.callback(null, source, map)
    return source
  }

  let out = String(source)

  if (fixDeep) {
    out = out.replace(/\/deep\//g, '::v-deep')
    out = out.replace(/\s*>>>\s*/g, ' ::v-deep ')
    out = out.replace(/::v-deep(?=[^\s{(])/g, '::v-deep ')
  }

  if (fixCalc) out = fixCalcOperatorSpacing(out)

  if (this && typeof this.callback === 'function') return this.callback(null, out, map)
  return out
}

/**
 * @param {any} context
 * @returns {{[key: string]: any}}
 */
function getLoaderOptions(context) {
  if (!context) return {}

  if (typeof context.getOptions === 'function') {
    try {
      return context.getOptions() || {}
    } catch (_) {
      return {}
    }
  }

  const query = context.query
  if (!query) return {}
  if (typeof query === 'object') return query
  if (typeof query !== 'string') return {}

  // 支持 "?fixDeep=false&fixCalc=true" 这种形式
  const raw = query.startsWith('?') ? query.slice(1) : query
  if (!raw) return {}

  const out = {}
  for (const part of raw.split('&')) {
    if (!part) continue
    const idx = part.indexOf('=')
    const key = decodeURIComponent(idx === -1 ? part : part.slice(0, idx))
    const value = decodeURIComponent(idx === -1 ? '' : part.slice(idx + 1))
    if (!key) continue
    if (value === 'true') out[key] = true
    else if (value === 'false') out[key] = false
    else out[key] = value
  }
  return out
}

/**
 * @param {string} input
 * @returns {string}
 */
function fixCalcOperatorSpacing(input) {
  let result = ''
  let index = 0

  while (true) {
    const start = input.indexOf('calc(', index)
    if (start === -1) {
      result += input.slice(index)
      break
    }

    result += input.slice(index, start)

    const exprStart = start + 'calc('.length
    let depth = 1
    let position = exprStart

    for (; position < input.length; position++) {
      const ch = input[position]
      if (ch === '(') depth++
      else if (ch === ')') depth--
      if (depth === 0) break
    }

    if (depth !== 0) {
      result += input.slice(start)
      break
    }

    const expr = input.slice(exprStart, position)
    const fixedExpr = spaceBinaryPlusMinus(expr)
    result += `calc(${fixedExpr})`

    index = position + 1
  }

  return result
}

/**
 * @param {string} expr
 * @returns {string}
 */
function spaceBinaryPlusMinus(expr) {
  let out = ''

  for (let i = 0; i < expr.length; i++) {
    const ch = expr[i]
    if (ch !== '+' && ch !== '-') {
      out += ch
      continue
    }

    const prev = expr[i - 1]
    const next = expr[i + 1]

    if (!isBinaryOperator(prev, next)) {
      out += ch
      continue
    }

    if (out.length > 0 && !/\s/.test(out[out.length - 1])) out += ' '
    out += ch
    if (next && !/\s/.test(next)) out += ' '
  }

  return out
}

/**
 * @param {string | undefined} prev
 * @param {string | undefined} next
 * @returns {boolean}
 */
function isBinaryOperator(prev, next) {
  if (!prev || !next) return false
  if (/\s/.test(prev) || /\s/.test(next)) return false

  // 排除一元运算、var(--x) 这类场景
  const badLeft = new Set(['(', ',', '+', '-', '*', '/'])
  const badRight = new Set([')', ',', '+', '-', '*', '/'])
  if (badLeft.has(prev)) return false
  if (badRight.has(next)) return false

  return true
}

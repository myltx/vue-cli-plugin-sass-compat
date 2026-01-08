const sassCompatLoaderPath = require.resolve('./sass-compat-loader')
const fs = require('fs')
const path = require('path')

function normalizeBoolean(value, defaultValue) {
  if (value === undefined) return defaultValue
  if (value === true || value === false) return value
  if (typeof value === 'string') return value === 'true'
  return defaultValue
}

function readJsonIfExists(filePath) {
  try {
    if (!filePath) return null
    if (!fs.existsSync(filePath)) return null
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch (_) {
    return null
  }
}

function getDepVersion(pkg, name) {
  if (!pkg || !name) return null
  const sections = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']
  for (const key of sections) {
    const table = pkg[key]
    if (table && Object.prototype.hasOwnProperty.call(table, name)) return table[name]
  }
  return null
}

function checkSassMigration(api, { verbose } = {}) {
  const resolveFromApi = api && typeof api.resolve === 'function' ? api.resolve.bind(api) : null
  const pkgPath = resolveFromApi ? resolveFromApi('package.json') : path.resolve(process.cwd(), 'package.json')
  const pkg = readJsonIfExists(pkgPath)
  if (!pkg) return { ok: true, messages: [] }

  const nodeSass = getDepVersion(pkg, 'node-sass')
  const sass = getDepVersion(pkg, 'sass')
  const sassLoader = getDepVersion(pkg, 'sass-loader')

  const messages = []
  if (nodeSass) {
    messages.push(
      `检测到依赖 node-sass@${nodeSass}（建议迁移到 sass/dart-sass：npm rm node-sass && npm i -D sass）`
    )
  }
  if (!sass) messages.push('未检测到依赖 sass(dart-sass)（建议：npm i -D sass）')

  if (verbose) {
    if (sassLoader) messages.push(`检测到 sass-loader@${sassLoader}`)
    else messages.push('未检测到 sass-loader（通常由 Vue CLI 管理；若你自行配置请确认版本兼容）')
  }

  return { ok: messages.length === 0, messages }
}

function attachCompatLoader(config, ruleName, loaderOptions) {
  const rule = config.module.rule(ruleName)
  if (!rule || !rule.oneOfs || !rule.oneOfs.store) return

  for (const [, oneOf] of rule.oneOfs.store) {
    if (!oneOf.uses || !oneOf.uses.has('sass-loader')) continue
    oneOf
      .use('sass-compat-loader')
      .loader(sassCompatLoaderPath)
      .options(loaderOptions)
      .after('sass-loader')
  }
}

module.exports = (api, projectOptions = {}) => {
  const pluginOptions = (projectOptions && projectOptions.pluginOptions && projectOptions.pluginOptions.sassCompat) || {}
  const fixDeep = normalizeBoolean(pluginOptions.fixDeep, true)
  const fixCalc = normalizeBoolean(pluginOptions.fixCalc, true)

  // 运行时检查（在 serve/build 首次执行时给出迁移提示；避免在 npm install 阶段做侵入式操作）
  const migration = checkSassMigration(api)
  if (!migration.ok) {
    // eslint-disable-next-line no-console
    console.warn(
      `[vue-cli-plugin-sass-compat] 检测到你的项目可能尚未完成 node-sass -> sass(dart-sass) 迁移：\n- ${migration.messages.join(
        '\n- '
      )}\n你也可以运行：vue-cli-service sass-compat:doctor`
    )
  }

  if (api && typeof api.registerCommand === 'function') {
    api.registerCommand('sass-compat:doctor', { description: '检查 node-sass -> sass(dart-sass) 迁移状态' }, () => {
      const report = checkSassMigration(api, { verbose: true })
      if (report.ok) {
        // eslint-disable-next-line no-console
        console.log('[vue-cli-plugin-sass-compat] 未检测到 node-sass，且已安装 sass(dart-sass)。')
        return
      }
      // eslint-disable-next-line no-console
      console.log('[vue-cli-plugin-sass-compat] 迁移检查结果：')
      // eslint-disable-next-line no-console
      console.log(`- ${report.messages.join('\n- ')}`)
    })
  }

  api.chainWebpack((config) => {
    const loaderOptions = { fixDeep, fixCalc }
    attachCompatLoader(config, 'scss', loaderOptions)
    attachCompatLoader(config, 'sass', loaderOptions)
  })
}

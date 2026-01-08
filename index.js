const sassCompatLoaderPath = require.resolve('./sass-compat-loader')

function normalizeBoolean(value, defaultValue) {
  if (value === undefined) return defaultValue
  if (value === true || value === false) return value
  if (typeof value === 'string') return value === 'true'
  return defaultValue
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

  api.chainWebpack((config) => {
    const loaderOptions = { fixDeep, fixCalc }
    attachCompatLoader(config, 'scss', loaderOptions)
    attachCompatLoader(config, 'sass', loaderOptions)
  })
}

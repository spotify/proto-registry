const { loaderNameMatches, getLoader } = require('react-app-rewired')
const rewireTypescript = require('react-app-rewire-typescript')

const ruleTestMatches = (rule, value) =>
  rule.test &&
  ((rule.test instanceof RegExp && value.match(rule.test)) ||
    (typeof rule.test === 'string' && value.indexOf(rule.test) !== -1))

const ruleChildren = rule =>
  rule.use || rule.oneOf || (Array.isArray(rule.loader) && rule.loader) || []

const findIndexAndRules = (rulesSource, ruleMatcher) => {
  let result
  const rules = Array.isArray(rulesSource)
    ? rulesSource
    : ruleChildren(rulesSource)
  rules.some(
    (rule, index) =>
      (result = ruleMatcher(rule)
        ? { index, rules }
        : findIndexAndRules(ruleChildren(rule), ruleMatcher))
  )
  return result
}

const addBeforeRule = (rulesSource, ruleMatcher, value) => {
  const { index, rules } = findIndexAndRules(rulesSource, ruleMatcher)
  rules.splice(index, 0, value)
}

module.exports = (config, env) => {
  config = rewireTypescript(config, env)

  const cssMatcher = r => ruleTestMatches(r, '.css')
  const cssLoader = getLoader(config.module.rules, cssMatcher)
  const scssRules = {
    test: /\.scss$/,
    use: (cssLoader.use || cssLoader.loader).concat([{
      loader: 'sass-loader'
    }])
  }

  const fileLoaderMatcher = r => loaderNameMatches(r, 'file-loader')
  addBeforeRule(config.module.rules, fileLoaderMatcher, scssRules)

  return config
}

const {mochaGrep} = require('@applitools/test-utils')

const tags = ['image', 'chrome', 'chromium', 'firefox', 'webkit', 'safari', 'all-cookies']
const group = process.env.MOCHA_GROUP

module.exports = {
  timeout: 0,
  require: ['ts-node/register'],
  reporter: 'mocha-multi',
  reporterOptions: [`spec=-,json=./logs/report${group ? `-${group}` : ''}.json,xunit=./logs/coverage-test-report.xml`],
  grep: mochaGrep({tags: {allow: tags}}),
}

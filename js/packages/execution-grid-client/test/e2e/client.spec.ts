import type {ECClient} from '../../src/types'
import {Builder, type WebDriver} from 'selenium-webdriver'
import {getTestInfo} from '@applitools/test-utils'
import {makeECClient} from '../../src/client'
import assert from 'assert'
import * as utils from '@applitools/utils'

describe('client', () => {
  let client: ECClient, driver: WebDriver

  afterEach(async () => {
    await driver.quit()
    await client.close()
  })

  it('works', async () => {
    client = await makeECClient({settings: {options: {useSelfHealing: false}}})
    driver = await new Builder().forBrowser('chrome').usingServer(client.url).build()

    await driver.get('https://demo.applitools.com')

    // execute script works as expected
    const title = await driver.executeScript('return document.title')
    assert.strictEqual(title, 'ACME Demo App by Applitools')

    // find element (important! without self healing logic) returns a proper error
    await assert.rejects(
      Promise.race([
        driver.findElement({css: '#doesn-exists'}),
        utils.general.sleep(1000)?.then(() => Promise.reject(new Error('Timeout error'))),
      ]),
      error => error.name === 'NoSuchElementError',
    )
  })

  it.skip('works in australia', async () => {
    client = await makeECClient({settings: {options: {useSelfHealing: false}}})
    driver = await new Builder()
      .withCapabilities({browserName: 'chrome', 'applitools:region': 'australia'})
      .usingServer(client.url)
      .build()

    await driver.get('https://mylocation.org')

    const location = await driver.executeScript(
      `return Array.from(document.querySelectorAll('td')).find(td => td.textContent === 'Country').nextElementSibling.textContent`,
    )

    assert.strictEqual(location, 'Australia')
  })

  it('works with self healing', async () => {
    client = await makeECClient()

    driver = new Builder()
      .withCapabilities({browserName: 'chrome', 'applitools:useSelfHealing': true})
      .usingServer(client.url)
      .build()

    await driver.get('https://demo.applitools.com')
    await driver.findElement({css: '#log-in'})
    await driver.executeScript("document.querySelector('#log-in').id = 'log-inn'")
    await driver.findElement({css: '#log-in'})

    const result: any[] = await driver.executeScript('applitools:metadata')
    assert.deepStrictEqual(result.length, 1)
    assert.ok(result[0].successfulSelector)
    assert.deepStrictEqual(result[0].originalSelector, {using: 'css selector', value: '#log-in'})
    const noResult: any[] = await driver.executeScript('applitools:metadata')
    assert.deepStrictEqual(noResult, [])
  })

  it('works with functional tests', async () => {
    client = await makeECClient()

    driver = await new Builder().withCapabilities({browserName: 'chrome'}).usingServer(client.url).build()

    await driver.executeScript('applitools:startTest', {testName: 'EC functional test'})
    await driver.get('https://applitools.com')
    await driver.executeScript('applitools:endTest', {status: 'Failed'})
    const [result] = await driver.executeScript<any[]>('applitools:getResults')
    const info = await getTestInfo(result)
    assert.strictEqual(info.scenarioName, 'EC functional test')
    assert.strictEqual(info.appName, 'default')
    assert.strictEqual(info.startInfo.nonVisual, true)
    // assert.strictEqual(info.status, 'Failed') bug on backend
  })
})

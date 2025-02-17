import * as utils from '@applitools/utils'

export const config: any = {
  serverUrl: 'https://eyesapi.applitools.com',
  ...utils.config.getConfig({params: ['apiKey', 'serverUrl', 'proxy']}),
}
export function getProxyCurlArg() {
  // HTTP_PROXY and HTTPS_PROXY are read by cURL.
  let proxyUrl
  if (config.proxy) {
    proxyUrl = new URL(utils.types.isString(config.proxy) ? config.proxy : config.proxy.url)
    if (config.proxy.username) proxyUrl.username = config.proxy.username
    if (config.proxy.password) proxyUrl.password = config.proxy.password
  }
  return proxyUrl ? `-x ${proxyUrl.href}` : ''
}

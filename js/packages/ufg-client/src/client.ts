import type {UFGClient, UFGClientConfig} from './types'
import {makeLogger, type Logger} from '@applitools/logger'
import {makeUFGRequests} from './server/requests'
import {makeCreateRenderTarget} from './create-render-target'
import {makeBookRenderer} from './book-renderer'
import {makeRender} from './render'
import {makeProcessResources} from './resources/process-resources'
import {makeFetchResource} from './resources/fetch-resource'
import {makeUploadResource} from './resources/upload-resource'

export const defaultResourceCache = new Map<string, any>()

export function makeUFGClient({
  config,
  cache = defaultResourceCache,
  logger,
}: {
  config: UFGClientConfig
  cache?: Map<string, any>
  logger?: Logger
}): UFGClient {
  logger = makeLogger({logger, format: {label: 'ufg-client'}})

  const requests = makeUFGRequests({config, logger})
  const fetchResource = makeFetchResource({fetchConcurrency: config.fetchConcurrency, logger})
  const uploadResource = makeUploadResource({requests, logger})
  const processResources = makeProcessResources({fetchResource, uploadResource, cache, logger})

  return {
    createRenderTarget: makeCreateRenderTarget({processResources, logger}),
    bookRenderer: makeBookRenderer({requests, logger}),
    render: makeRender({requests, logger}),
    getChromeEmulationDevices: requests.getChromeEmulationDevices,
    getAndroidDevices: requests.getAndroidDevices,
    getIOSDevices: requests.getIOSDevices,
    getCachedResourceUrls: () => Array.from(cache.keys()),
  }
}

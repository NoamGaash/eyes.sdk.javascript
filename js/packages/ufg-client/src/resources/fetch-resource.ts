import type {Cookie} from '../types'
import {type Logger} from '@applitools/logger'
import {makeReq, type Fetch, type Proxy, type Hooks} from '@applitools/req'
import {makeResource, type UrlResource, type ContentfulResource, FailedResource} from './resource'
import {AbortController} from 'abort-controller'
import {createCookieHeader} from '../utils/create-cookie-header'
import {createUserAgentHeader} from '../utils/create-user-agent-header'
import throat from 'throat'
import * as utils from '@applitools/utils'

type Options = {
  retryLimit?: number
  streamingTimeout?: number
  fetchConcurrency?: number
  fetchTimeout?: number
  cache?: Map<string, Promise<ContentfulResource | FailedResource>>
  fetch?: Fetch
  logger: Logger
}

export type FetchResourceSettings = {
  referer?: string
  proxy?: Proxy
  autProxy?: Proxy & {mode?: 'Allow' | 'Block'; domains?: string[]}
  cookies?: Cookie[]
  userAgent?: string
}

export type FetchResource = (options: {
  resource: UrlResource
  settings?: FetchResourceSettings
  logger?: Logger
}) => Promise<ContentfulResource | FailedResource>

export function makeFetchResource({
  retryLimit = 5,
  streamingTimeout = 30 * 1000,
  fetchTimeout = 30 * 1000,
  fetchConcurrency,
  cache = new Map(),
  fetch,
  logger: mainLogger,
}: Options): FetchResource {
  const req = makeReq({
    retry: {
      limit: retryLimit,
      validate: ({error}) => Boolean(error),
    },
    fetch,
  })
  return fetchConcurrency ? throat(fetchConcurrency, fetchResource) : fetchResource

  async function fetchResource({
    resource,
    settings = {},
    logger = mainLogger,
  }: {
    resource: UrlResource
    settings?: FetchResourceSettings
    logger?: Logger
  }): Promise<ContentfulResource | FailedResource> {
    logger = logger.extend(mainLogger, {tags: [`fetch-resource-${utils.general.shortid()}`]})
    let runningRequest = cache.get(resource.id)
    if (runningRequest) return runningRequest

    runningRequest = req(resource.url, {
      headers: {
        Referer: settings.referer,
        Cookie: settings.cookies && createCookieHeader({url: resource.url, cookies: settings.cookies}),
        'User-Agent': (resource.renderer && createUserAgentHeader({renderer: resource.renderer})) ?? settings.userAgent,
      },
      proxy: resourceUrl => {
        const {proxy, autProxy} = settings
        if (autProxy) {
          if (!autProxy.domains) return autProxy
          const domainMatch = autProxy.domains.includes(resourceUrl.hostname)
          if ((autProxy.mode === 'Allow' && domainMatch) || (autProxy.mode === 'Block' && !domainMatch)) return autProxy
        }
        return proxy
      },
      hooks: [handleLogs({logger}), handleStreaming({timeout: streamingTimeout, logger})],
      timeout: fetchTimeout,
    })
      .then(async response => {
        return response.ok
          ? makeResource({
              ...resource,
              value: Buffer.from(await response.arrayBuffer()),
              contentType: response.headers.get('Content-Type')!,
            })
          : makeResource({...resource, errorStatusCode: response.status})
      })
      .finally(() => cache.delete(resource.id))
    cache.set(resource.id, runningRequest)
    return runningRequest
  }
}

function handleLogs({logger}: {logger?: Logger}): Hooks {
  return {
    beforeRequest({request}) {
      logger?.log(
        `Resource with url ${request.url} will be fetched using headers`,
        Object.fromEntries(request.headers.entries()),
      )
    },
    beforeRetry({request, attempt}) {
      logger?.log(`Resource with url ${request.url} will be re-fetched (attempt ${attempt})`)
    },
    afterResponse({request, response}) {
      logger?.log(`Resource with url ${request.url} respond with ${response.statusText}(${response.statusText})`)
    },
    afterError({request, error}) {
      logger?.error(`Resource with url ${request.url} failed with error`, error)
    },
  }
}

function handleStreaming({timeout, logger}: {timeout: number; logger?: Logger}): Hooks {
  const controller = new AbortController()
  return {
    async beforeRequest({request}) {
      if (request.signal?.aborted) return
      request.signal?.addEventListener('abort', () => controller.abort())
      return {request, signal: controller.signal}
    },
    async afterResponse({response}) {
      const contentLength = response.headers.get('Content-Length')
      const contentType = response.headers.get('Content-Type')
      const isProbablyStreaming = response.ok && !contentLength && contentType && /^(audio|video)\//.test(contentType)
      if (!isProbablyStreaming) return
      return new Promise(resolve => {
        const timer = setTimeout(() => {
          controller.abort()
          resolve({status: 599})
          logger?.log(`Resource with url ${response.url} was interrupted, due to it takes too long to download`)
        }, timeout)
        response
          .arrayBuffer()
          .then(body => resolve({response, body: Buffer.from(body)}))
          .catch(() => resolve({status: 599}))
          .finally(() => clearTimeout(timer))
      })
    },
  }
}

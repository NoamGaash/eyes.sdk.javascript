import type {ECClient, ECClientSettings, ECSession} from './types'
import {type AddressInfo} from 'net'
import {createServer} from 'http'
import {type Logger} from '@applitools/logger'
import {makeCore} from '@applitools/core-base'
import {makeCallback} from './utils/router'
import {makeTunnelManager} from './tunnels/manager'
import {makeTunnelManagerClient} from './tunnels/manager-client'
import {makeReqProxy} from './req-proxy'
import {makeStartSession} from './commands/start-session'
import {makeExecuteScript} from './commands/execute-script'
import {makeEndSession} from './commands/end-session'
import {makeFindElement} from './commands/find-element'
import * as utils from '@applitools/utils'

export async function makeServer({
  settings,
  logger: mainLogger,
}: {
  settings: ECClientSettings
  logger: Logger
}): Promise<ECClient> {
  const serverLogger = mainLogger.extend()
  const req = makeReqProxy({
    proxy: settings.proxy,
    retry: {
      validate: async ({response, error}) => {
        if (error) return !utils.types.instanceOf(error, 'AbortError')
        if (response) return response.status >= 500 && !utils.types.has(await response.clone().json(), 'value')
        return false
      },
      limit: 10,
      timeout: 5000,
    },
    useDnsCache: settings.useDnsCache,
  })
  const core = makeCore({agentId: `js/ec-client/${require('../package.json').version}`})
  const tunnels = settings.tunnel?.serviceUrl
    ? await makeTunnelManager({settings: settings.tunnel, logger: serverLogger})
    : await makeTunnelManagerClient({settings: settings.tunnel})
  const sessions = new Map<string, ECSession>()

  const commands = {
    startSession: makeStartSession({settings, req, tunnels}),
    endSession: makeEndSession({req, tunnels}),
    executeScript: makeExecuteScript({req, core}),
    findElement: makeFindElement({req}),
  }

  const server = createServer(
    makeCallback(({router, request, response}) => {
      const requestLogger = serverLogger.extend({tags: [`proxy-request-${utils.general.shortid()}`]})
      requestLogger.log(`Received request [${request.method}] ${request.url}`)

      router.post('/session', async () => {
        const session = await commands.startSession({request, response, logger: requestLogger})
        sessions.set(session.sessionId, session)
      })
      router.post('/session/:sessionId/execute/sync', async ({match}) => {
        const session = sessions.get(match.groups!.sessionId)!
        await commands.executeScript({session, request, response, logger: requestLogger})
      })
      router.post('/session/:sessionId/element', async ({match}) => {
        const session = sessions.get(match.groups!.sessionId)!
        await commands.findElement({session, request, response, logger: requestLogger})
      })
      router.delete('/session/:sessionId', async ({match}) => {
        const session = sessions.get(match.groups!.sessionId)!
        await commands.endSession({session, request, response, logger: requestLogger})
        sessions.delete(session.sessionId)
      })
      router.any(/^\/session\/(?<sessionId>[^\/]+).*$/, async ({match}) => {
        requestLogger.log('Passthrough request')
        const session = sessions.get(match.groups!.sessionId)!
        await req(request.url!, {baseUrl: session.serverUrl, io: {request, response}, logger: requestLogger})
      })
      router.fallback(async () => {
        throw new Error('Unknown request')
      })
      router.catch(async ({error}) => {
        requestLogger.error(`Error during processing request`, error)
        if (response.writableEnded) return
        response
          .writeHead(500)
          .end(JSON.stringify({value: {error: 'internal proxy server error', message: error.message, stacktrace: ''}}))
      })
      router.finally(async () => {
        requestLogger.log(`Request was responded with status ${response.statusCode}`)
      })
    }),
  )

  server.listen({port: settings.port ?? 0, hostname: 'localhost'})

  return new Promise<ECClient>((resolve, reject) => {
    server.on('listening', () => {
      const address = server.address() as AddressInfo
      serverLogger.log(`Proxy server has started on port ${address.port}`)
      resolve({
        url: `http://localhost:${address.port}`,
        port: address.port,
        unref: () => server.unref(),
        close: () => server.close(),
      })
    })
    server.on('error', async (err: Error) => {
      serverLogger.fatal('Error starting proxy server', err)
      reject(err)
    })
  })
}

import type {CloseBatchSettings} from './types'
import {type MaybeArray} from '@applitools/utils'
import {type Logger} from '@applitools/logger'
import {type CoreRequests} from './server/requests'
import * as utils from '@applitools/utils'

type Options = {
  requests: CoreRequests
  logger: Logger
}

export function makeCloseBatch({requests, logger: mainLogger}: Options) {
  return async function closeBatch({
    settings,
    logger = mainLogger,
  }: {
    settings: MaybeArray<CloseBatchSettings>
    logger?: Logger
  }): Promise<void> {
    logger = logger.extend(mainLogger, {tags: [`close-batch-base-${utils.general.shortid()}`]})

    logger.log('Command "closeBatch" is called with settings', settings)
    settings = utils.types.isArray(settings) ? settings : [settings]
    const results = await Promise.allSettled(
      settings.map(settings => (settings.batchId ? requests.closeBatch({settings, logger}) : null)),
    )
    const error = results.find(({status}) => status === 'rejected') as PromiseRejectedResult
    if (error) throw error.reason
  }
}

import type {GetResultsSettings, TestResult} from './types'
import {type Eyes as BaseEyes} from '@applitools/core-base'
import {type Logger} from '@applitools/logger'
import {AbortError} from '../errors/abort-error'
import {Renderer} from '@applitools/ufg-client'

type Options = {
  storage: Map<string, Promise<{renderer: Renderer; eyes: BaseEyes}>[]>
  logger: Logger
}

export function makeGetResults({storage, logger: mainLogger}: Options) {
  return async function getResults({
    settings,
    logger = mainLogger,
  }: {
    settings?: GetResultsSettings
    logger?: Logger
  } = {}): Promise<TestResult[]> {
    logger = logger.extend(mainLogger)

    logger.log('Command "getResults" is called with settings', settings)
    return Promise.all(
      Array.from(storage.values(), async promises => {
        try {
          const [{eyes, renderer}] = await Promise.all(promises)
          const [result] = await eyes.getResults({settings, logger})
          return {...result, renderer}
        } catch (error: any) {
          if (error instanceof AbortError && error.info?.eyes) {
            logger.warn('Command "getResults" received an abort error during performing', settings)
            const [result] = await error.info.eyes.getResults({settings, logger})
            return {...result, renderer: error.info.renderer}
          }
          logger.fatal('Command "getResults" received an error during performing', settings)
          throw error
        }
      }),
    )
  }
}

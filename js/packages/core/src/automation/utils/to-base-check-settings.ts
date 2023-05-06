import type {Region} from '@applitools/utils'
import type {CheckSettings} from '../types'
import type {CheckSettings as BaseCheckSettings} from '@applitools/core-base'
import {type SpecType, type ElementReference, type Selector} from '@applitools/driver'
import * as utils from '@applitools/utils'

export function toBaseCheckSettings<TSpec extends SpecType>({settings}: {settings: CheckSettings<TSpec>}) {
  const regionTypes = ['ignore', 'layout', 'strict', 'content', 'floating', 'accessibility'] as const
  const elementReferencesToCalculate = regionTypes.flatMap(regionType => {
    return (settings[`${regionType}Regions`] ?? []).reduce((regions, reference) => {
      const {region} = utils.types.has(reference, 'region') ? reference : {region: reference}
      return !isRegion(region) ? regions.concat(region) : regions
    }, [] as ElementReference<TSpec>[])
  })

  const elementReferenceToTarget = !isRegion(settings.region) ? settings.region : undefined

  return {elementReferencesToCalculate, elementReferenceToTarget, getBaseCheckSettings}

  function getBaseCheckSettings({
    calculatedRegions,
    preserveTransformation,
  }: {
    calculatedRegions: {selector?: Selector; regions: Region[]}[]
    preserveTransformation?: boolean
  }): BaseCheckSettings {
    const transformedSettings = {...settings}

    if (!preserveTransformation) {
      delete transformedSettings.region
      delete transformedSettings.normalization
    } else if (elementReferenceToTarget) {
      delete transformedSettings.region
    }

    regionTypes.forEach(regionType => {
      if (!transformedSettings[`${regionType}Regions`]) return
      transformedSettings[`${regionType}Regions`] = transformedSettings[`${regionType}Regions`]?.flatMap(reference => {
        const {region, ...options} = utils.types.has(reference, 'region') ? reference : {region: reference}
        if (isRegion(region)) return reference
        const regionsWithSelectors = calculatedRegions.shift();
        if (!regionsWithSelectors) {
            // calculatedRegions is empty, so we cannot shift an element from it
            return null;
        }
        const { selector, regions } = regionsWithSelectors;
        return regions.map(region => ({
          region,
          regionId: utils.types.isString(selector) ? selector : selector?.selector,
          ...options,
        }))
      }).filter(Boolean); // filter out null elements
    })
    return transformedSettings as BaseCheckSettings
  }

  function isRegion(region: any): region is Region {
    return utils.types.has(region, ['x', 'y', 'width', 'height'])
  }
}

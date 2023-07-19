import {saveCache} from '@actions/cache'
import * as core from '@actions/core'

main().catch(err => {
  console.error(err)
  core.setFailed(`save cache failed: ${err.message}`)
})

async function main(): Promise<number> {
  const name = core.getInput('name', {required: true})
  const paths = core.getMultilineInput('path', {required: true}).flatMap(path => path.split(/[\s\n,]+/))
  return saveCache(paths, name, {}, true)
}

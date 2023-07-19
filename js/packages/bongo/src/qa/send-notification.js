const {getLatestReleaseEntries} = require('../changelog/query')
const fetch = require('node-fetch')

async function sendReleaseNotification({reportId, name, releaseVersion, changelogPath}) {
  if (!changelogPath) changelogPath = process.cwd()
  const changelog = getLatestReleaseEntries({targetFolder: changelogPath}).join('\n')

  const notification = {
    id: reportId,
    sdk: name,
    version: releaseVersion,
    changeLog: changelog,
    testCoverageGap: 'TODO',
  }

  const url =
    notification.sdk === 'core'
      ? 'http://applitools-quality-server.herokuapp.com/send_mail/core_sdk'
      : 'http://applitools-quality-server.herokuapp.com/send_mail/sdks'
  const response = await fetch(url, {
    method: 'post',
    body: JSON.stringify(notification),
    headers: {'Content-Type': 'application/json'},
  })

  if (response.status !== 200) {
    console.error(await response.text())
    throw new Error(
      `There was a problem sending the release notification: status ${response.status} with message ${response.message}`,
    )
  }
}

module.exports = {sendReleaseNotification}

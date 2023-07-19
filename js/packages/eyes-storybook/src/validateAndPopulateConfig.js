'use strict';
const chalk = require('chalk');
const fs = require('fs');
const detect = require('detect-port');
const {version: packageVersion} = require('../package.json');
const {
  missingApiKeyFailMsg,
  missingAppNameAndPackageJsonFailMsg,
  missingAppNameInPackageJsonFailMsg,
  startStorybookFailMsg,
} = require('./errMessages');
const startStorybookServer = require('./startStorybookServer');
const {isIE} = require('./shouldRenderIE');
const {makeLogger} = require('@applitools/logger');
const findNpmModuleCommandPath = require('./findNpmModuleCommandPath');
const {resolve} = require('path');

async function validateAndPopulateConfig({config, packagePath = '', logger = makeLogger()}) {
  if (!config.apiKey) {
    throw new Error(missingApiKeyFailMsg);
  }

  const packageJsonPath = `${packagePath}/package.json`;
  const packageJson = fs.existsSync(packageJsonPath) ? require(packageJsonPath) : undefined;
  const {storybookPath, isVersion7, sbArg} = await determineStorybookVersion(packagePath);
  logger.log(
    `[validateAndPopulateConfig] storybookPath=${storybookPath} isVersion7=${isVersion7} sbArg=${sbArg}`,
  );

  if (!config.appName) {
    if (!packageJson) {
      throw new Error(missingAppNameAndPackageJsonFailMsg);
    }

    if (!packageJson.name) {
      throw new Error(missingAppNameInPackageJsonFailMsg);
    }

    config.appName = packageJson.name;
  }

  if (!config.storybookUrl) {
    try {
      config.storybookPort = await detect(config.storybookPort);
    } catch (ex) {
      console.log(chalk.red(`couldn't find available port around`, config.storybookPort));
    }

    config.storybookUrl = await startStorybookServer(
      Object.assign({packagePath, logger, storybookPath, sbArg}, config),
    );

    // NOTE (Amit): I don't understand why this condition is here. It shouldn't happen. I might have been the one to put it here, but it seems like a mistake. We should take a thorough look and remove it.
    if (!config.storybookUrl) {
      console.log(startStorybookFailMsg);
      process.exit(1);
    }
  }

  config.agentId = `eyes-storybook/${packageVersion}`;

  if (config.runInDocker) {
    config.puppeteerOptions = config.puppeteerOptions || {};
    config.puppeteerOptions.args = config.puppeteerOptions.args || [];
    if (!config.puppeteerOptions.args.includes('--disable-dev-shm-usage')) {
      config.puppeteerOptions.args.push('--disable-dev-shm-usage');
    }
  }

  if (config.fakeIE && !config.renderers.find(isIE)) {
    console.log(
      chalk.yellow(
        `\u26A0 fakeIE flag was set, but no IE browsers were found in the configuration`,
      ),
    );
  }
  return isVersion7;
}

async function determineStorybookVersion(packagePath) {
  let sbArg,
    storybookPath,
    isVersion7 = false;

  const storybookPathV6 = resolve(packagePath, 'node_modules/.bin/start-storybook');
  const storybookPathV7 = resolve(packagePath, 'node_modules/.bin/sb');

  // first we look for the binaries in the local node_modules/.bin folder in case there are multiple versions of storybook installed
  if (fs.existsSync(storybookPathV6)) {
    storybookPath = storybookPathV6;
  } else if (fs.existsSync(storybookPathV7)) {
    storybookPath = storybookPathV7;
    isVersion7 = true;
    sbArg = 'dev';
  } else {
    // the binary is not in the local node_modules/.bin folder, so we need to find it
    storybookPath = await findNpmModuleCommandPath('start-storybook', packagePath);
    if (!storybookPath) {
      storybookPath = await findNpmModuleCommandPath('sb', packagePath);
      isVersion7 = true;
      sbArg = 'dev';
    } else {
      isVersion7 = false;
    }
  }

  return {storybookPath, isVersion7, sbArg};
}
module.exports = validateAndPopulateConfig;

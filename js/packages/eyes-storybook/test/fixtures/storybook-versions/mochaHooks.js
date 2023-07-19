const fs = require('fs');
const { exec } = require('child_process');
const { promisify: p } = require('util');
const pexec = p(exec);
const path = require('path');

exports.mochaHooks = {
  beforeAll: async () => {
    if (!process.env.APPLITOOLS_FRAMEWORK_VERSION) {
      process.env.APPLITOOLS_FRAMEWORK_VERSION = 'latest';
    }
    const storybookVersion = String(process.env.APPLITOOLS_FRAMEWORK_VERSION);
    const versionDir = path.resolve(__dirname, `./${storybookVersion}`);
    fs.readdirSync(versionDir).map(fileName => {
      const filePath = path.join(versionDir, fileName);
      if (fs.existsSync(filePath) && fs.lstatSync(filePath).isDirectory() && !filePath.includes('.storybook')) {
        fs.rmSync(filePath, { recursive: true })
      }
    });

    process.env.INIT_CWD = versionDir;
    process.chdir(versionDir);
    await pexec(`npm install`, {
      maxBuffer: 1000000,
    });
  },
  afterAll: async () => {
    delete process.env.APPLITOOLS_FRAMEWORK_VERSION;
    delete process.env.INIT_CWD;
  }
};
const { spawn } = require('child_process');
const fs = require('fs');

const run = (command, args) => {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'inherit', 'inherit'] });

    child.on('error', (error) => {
      reject(error);
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} exited with code ${code}`));
    });
  });
};

// extract-zip 2.0.1 waits on a zip stream that never ends on Node 26, so
// Electron Forge stops after the first archive entry. unzip and tar both
// understand the zip files @electron/packager extracts.
const extractZip = async (zipPath, opts = {}) => {
  const dir = opts.dir;

  if (!zipPath || !dir) {
    throw new Error('extract-zip requires a zip path and opts.dir');
  }

  await fs.promises.mkdir(dir, { recursive: true });

  if (process.platform === 'win32') {
    await run('tar', ['-xf', zipPath, '-C', dir]);
    return;
  }

  await run('unzip', ['-qo', zipPath, '-d', dir]);
};

module.exports = extractZip;

const { spawn } = require('child_process');
const path = require('path');
const { getInstalledWinExePath, toWindowsPath } = require('./win-paths');

const exePath = getInstalledWinExePath();
const windowsExePath = exePath ? toWindowsPath(exePath) : null;

if (!exePath || !windowsExePath) {
  console.error('Could not determine the Windows install path.');
  console.error('Run: npm run package:win && npm run local-install:win');
  process.exit(1);
}

console.log(`Launching ${windowsExePath}`);

const child = spawn(exePath, [], {
  cwd: path.dirname(exePath),
  detached: true,
  stdio: 'ignore'
});

child.on('error', (error) => {
  console.error(`Failed to launch ${windowsExePath}: ${error.message}`);
  process.exit(1);
});

child.unref();

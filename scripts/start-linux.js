const { spawn } = require('child_process');
const fs = require('fs');
const { getInstalledExePath } = require('./linux-paths');

const exePath = getInstalledExePath();

if (!fs.existsSync(exePath)) {
  console.error('Could not find the Linux install.');
  console.error('Run: npm run package:linux && npm run local-install:linux');
  process.exit(1);
}

const args = process.argv.slice(2);
console.log(`Launching ${exePath}${args.length > 0 ? ` ${args.join(' ')}` : ''}`);

const child = spawn(exePath, args, {
  cwd: process.cwd(),
  detached: true,
  stdio: 'ignore'
});

child.on('error', (error) => {
  console.error(`Failed to launch ${exePath}: ${error.message}`);
  process.exit(1);
});

child.unref();

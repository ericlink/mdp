const fs = require('fs');
const path = require('path');
const {
  getWindowsLocalAppData,
  isWindowsFilesystemPath,
  toWindowsPath
} = require('./win-paths');

const projectRoot = path.resolve(__dirname, '..');
const outDir = path.join(projectRoot, 'out');

const findWinAppDir = (rootDir) => {
  const names = fs.existsSync(rootDir) ? fs.readdirSync(rootDir) : [];
  const preferred = ['mdp-win32-x64', ...names.filter((name) => name.startsWith('mdp-win32-'))];

  for (const name of preferred) {
    const candidate = path.join(rootDir, name);
    if (fs.existsSync(path.join(candidate, 'mdp.exe'))) {
      return candidate;
    }
  }

  return null;
};

console.log('Looking for packaged app...');

const sourceDir = findWinAppDir(outDir);

if (!sourceDir) {
  console.error('Could not find out/mdp-win32-x64/mdp.exe.');
  console.error('Run npm run package:win and wait for every step to show a checkmark.');
  process.exit(1);
}

const localAppData = getWindowsLocalAppData();

if (!localAppData || !isWindowsFilesystemPath(localAppData)) {
  console.error('Need a Windows install path.');
  console.error('Example:');
  console.error('  LOCALAPPDATA=/mnt/c/Users/<WindowsUser>/AppData/Local npm run local-install:win');
  process.exit(1);
}

const destDir = path.join(localAppData, 'Programs', 'mdp');
const windowsDest = toWindowsPath(destDir);

console.log(`Copying ${sourceDir}`);
console.log(`     to ${destDir}`);
console.log('This can take a minute on /mnt/c ...');

try {
  fs.rmSync(destDir, { recursive: true, force: true });
  fs.mkdirSync(destDir, { recursive: true });
  fs.cpSync(sourceDir, destDir, { recursive: true });
} catch (error) {
  console.error(`Copy failed: ${error.message}`);
  console.error('If your Windows username is not the same as your WSL user, run:');
  console.error('  LOCALAPPDATA=/mnt/c/Users/<WindowsUser>/AppData/Local npm run local-install:win');
  process.exit(1);
}

console.log(`Installed to ${windowsDest}`);
console.log('Launch with:');
console.log('  npm run start:win');
console.log(`  ${toWindowsPath(path.join(destDir, 'mdp.exe'))}`);
console.log('Do not launch the copy under /home — that hits GPU error 18.');

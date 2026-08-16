const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { toWindowsPath } = require('./win-paths');

const WINDOWS_APP_USER_MODEL_ID = 'com.ericlink.mdp';

const toPowerShellPath = (value) => {
  const windowsPath = toWindowsPath(value);
  if (/^[A-Za-z]:\\/.test(windowsPath) || windowsPath.startsWith('\\\\')) {
    return windowsPath;
  }

  const converted = spawnSync('wslpath', ['-w', value], { encoding: 'utf8' });
  if (converted.status === 0 && converted.stdout.trim()) {
    return converted.stdout.trim();
  }

  return windowsPath;
};

const createWindowsShortcut = ({ exePath, shortcutPath }) => {
  if (!exePath || !shortcutPath) {
    throw new Error('exePath and shortcutPath are required');
  }

  const scriptPath = path.join(__dirname, 'create-win-shortcut.ps1');
  const powershell = process.platform === 'win32'
    ? 'powershell.exe'
    : '/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe';

  if (!fs.existsSync(powershell)) {
    throw new Error(`PowerShell not found at ${powershell}`);
  }

  const iconFile = path.join(path.dirname(exePath), 'resources', 'app', 'assets', 'app.ico');
  const iconLocation = fs.existsSync(iconFile)
    ? `${toPowerShellPath(iconFile)},0`
    : `${toPowerShellPath(exePath)},0`;

  const result = spawnSync(powershell, [
    '-NoProfile',
    '-NonInteractive',
    '-ExecutionPolicy', 'Bypass',
    '-File', toPowerShellPath(scriptPath),
    '-ShortcutPath', toPowerShellPath(shortcutPath),
    '-TargetPath', toPowerShellPath(exePath),
    '-WorkingDirectory', toPowerShellPath(path.dirname(exePath)),
    '-IconLocation', iconLocation,
    '-AppUserModelId', WINDOWS_APP_USER_MODEL_ID
  ], {
    encoding: 'utf8'
  });

  if (result.status !== 0) {
    const details = [result.stderr, result.stdout, result.error && result.error.message]
      .filter(Boolean)
      .join('\n')
      .trim();
    throw new Error(details || `PowerShell exited with code ${result.status}`);
  }
};

const getStartMenuShortcutPath = () => {
  if (process.platform === 'win32') {
    return path.join(
      process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'),
      'Microsoft',
      'Windows',
      'Start Menu',
      'Programs',
      'mdp.lnk'
    );
  }

  const windowsUser = process.env.MDP_WIN_USER || 'ericm';
  return `/mnt/c/Users/${windowsUser}/AppData/Roaming/Microsoft/Windows/Start Menu/Programs/mdp.lnk`;
};

module.exports = {
  WINDOWS_APP_USER_MODEL_ID,
  createWindowsShortcut,
  getStartMenuShortcutPath
};

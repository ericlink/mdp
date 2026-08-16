const path = require('path');

const toWslPath = (windowsPath) => {
  const match = String(windowsPath).trim().match(/^([A-Za-z]):[\\/](.*)$/);
  if (!match) {
    return windowsPath.trim().replace(/\\/g, '/');
  }

  return `/mnt/${match[1].toLowerCase()}/${match[2].replace(/\\/g, '/')}`;
};

const toWindowsPath = (maybeWslPath) => {
  const match = String(maybeWslPath).trim().match(/^\/mnt\/([a-zA-Z])\/(.*)$/);
  if (!match) {
    return maybeWslPath;
  }

  return `${match[1].toUpperCase()}:\\${match[2].replace(/\//g, '\\')}`;
};

const isWindowsFilesystemPath = (value) => {
  return /^[A-Za-z]:[\\/]/.test(value) || /^\/mnt\/[a-zA-Z]\//.test(value);
};

const getWindowsLocalAppData = () => {
  if (process.env.LOCALAPPDATA) {
    return process.platform === 'win32'
      ? process.env.LOCALAPPDATA
      : toWslPath(process.env.LOCALAPPDATA);
  }

  if (process.platform === 'win32') {
    return path.join(process.env.USERPROFILE || require('os').homedir(), 'AppData', 'Local');
  }

  const windowsUser = process.env.MDP_WIN_USER || 'ericm';
  if (!windowsUser) {
    return null;
  }

  return `/mnt/c/Users/${windowsUser}/AppData/Local`;
};

const getInstalledWinExePath = () => {
  const localAppData = getWindowsLocalAppData();
  if (!localAppData) {
    return null;
  }

  return path.join(localAppData, 'Programs', 'mdp', 'mdp.exe');
};

module.exports = {
  getInstalledWinExePath,
  getWindowsLocalAppData,
  isWindowsFilesystemPath,
  toWindowsPath,
  toWslPath
};

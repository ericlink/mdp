const os = require('os');
const path = require('path');

const DESKTOP_FILE_NAME = 'mdp.desktop';
const MARKDOWN_EXTENSIONS = ['md', 'markdown', 'mdown', 'mkd', 'mkdn', 'mdtxt'];
const MARKDOWN_MIME_TYPES = ['text/markdown', 'text/x-markdown'];

const getDataHome = () => {
  return process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local', 'share');
};

const getBinDir = () => {
  return path.join(os.homedir(), '.local', 'bin');
};

const getInstallDir = () => {
  return path.join(getDataHome(), 'mdp');
};

const getInstalledExePath = () => {
  return path.join(getInstallDir(), 'mdp');
};

const getLauncherPath = () => {
  return path.join(getBinDir(), 'mdp');
};

const getDesktopFilePath = () => {
  return path.join(getDataHome(), 'applications', DESKTOP_FILE_NAME);
};

module.exports = {
  DESKTOP_FILE_NAME,
  MARKDOWN_EXTENSIONS,
  MARKDOWN_MIME_TYPES,
  getBinDir,
  getDataHome,
  getDesktopFilePath,
  getInstallDir,
  getInstalledExePath,
  getLauncherPath
};

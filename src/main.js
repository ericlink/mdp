const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const fs = require('fs');
const menu   = require('./menu.js');
const path = require('path');
const { pathToFileURL } = require('url');
const windowStateKeeper = require('electron-window-state');

const appRoot = path.resolve(__dirname, '..');
const mainTracePath = '/tmp/mdp-main.log';
const windows = new Set();
const pendingFilesByWebContentsId = new Map();

const debugBoot = (...args) => {
  if (process.env.MDP_DEBUG_BOOT === '1') {
    fs.appendFileSync('/tmp/mdp-debug.log', `[mdp debug] ${JSON.stringify(args)}\n`);
  }
};

const formatMainLogValue = (value) => {
  if (value instanceof Error) {
    return value.stack || `${value.name}: ${value.message}`;
  }

  if (typeof value === 'object' && value !== null) {
    try {
      return JSON.stringify(value);
    } catch (error) {
      return Object.prototype.toString.call(value);
    }
  }

  return String(value);
};

const writeMainLog = (level, ...args) => {
  const text = args.map(formatMainLogValue).join(' ');

  if (level === 'error') {
    console.error(text);
  } else {
    console.log(text);
  }

  fs.appendFileSync(mainTracePath, `[${level}] ${text}\n`);
};

process.on('uncaughtException', (error) => {
  writeMainLog('error', 'uncaughtException', error);
});

process.on('unhandledRejection', (reason) => {
  writeMainLog('error', 'unhandledRejection', reason);
});

const resolveAppFilePath = (file) => {
  if (!file) {
    return null;
  }

  if (path.isAbsolute(file)) {
    return file;
  }

  const cwdResolved = path.resolve(process.cwd(), file);
  if (fs.existsSync(cwdResolved)) {
    return cwdResolved;
  }

  return path.resolve(appRoot, file);
};

const normalizeFileState = (file) => {
  const absoluteFile = resolveAppFilePath(file);

  return {
    name: absoluteFile,
    path: path.dirname(absoluteFile) + path.sep
  };
};

const setGlobalFile = (file) => {
  global.file = normalizeFileState(file);
};

const resolveFileArg = (candidate) => {
  if (!candidate || candidate.startsWith('-')) {
    return null;
  }

  const absoluteCandidate = resolveAppFilePath(candidate);

  if (absoluteCandidate === path.resolve(__filename)) {
    return null;
  }

  try {
    const stats = fs.statSync(absoluteCandidate);
    return stats.isFile() ? candidate : null;
  } catch (error) {
    return null;
  }
};

const getFileArg = (argv = []) => {
  const candidateArgs = (app.isPackaged ? argv.slice(1) : argv.slice(2))
    .filter((arg) => arg && !arg.startsWith('-psn'))
    .map(resolveFileArg)
    .filter(Boolean);

  if (candidateArgs.length > 0) {
    return candidateArgs[candidateArgs.length - 1];
  }

  if (process.env.MDP_DEFAULT_FILE) {
    return process.env.MDP_DEFAULT_FILE;
  }

  switch (process.env.npm_lifecycle_event) {
    case 'dev-readme':
      return 'README.md';
    case 'dev':
    case 'start':
      return 'assets/example.md';
    default:
      return null;
  }
};

const processArgs = (argv) => {
  const file = getFileArg(argv);
  debugBoot('processArgs', { argv, file, defaultFile: process.env.MDP_DEFAULT_FILE || null });

  if (file) {
    setGlobalFile(file);
  }
};

const createMainWindow = () => {
  debugBoot('createMainWindow', { file: global.file || null });
  if (!global.file) return;

  const mainWindowState = windowStateKeeper({ defaultWidth: 1000, defaultHeight: 800 });
  const fileState = global.file;
  global.file = null;

  const window = new BrowserWindow({
    show: true,
    title: 'mdp',
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      partition: 'persist:main',
      webSecurity: false,
      allowRunningInsecureContent: true
    }
  });

  windows.add(window);
  pendingFilesByWebContentsId.set(window.webContents.id, fileState);
  mainWindowState.manage(window);
  const rendererUrl = pathToFileURL(path.join(__dirname, 'renderer', 'index.html'));
  rendererUrl.searchParams.set('name', fileState.name);
  rendererUrl.searchParams.set('path', fileState.path);

  window.loadURL(rendererUrl.toString());
  window.once('ready-to-show', () => { window.show(); });
  window.webContents.once('did-finish-load', () => {
    window.show();
    debugBoot('did-finish-load', { url: window.webContents.getURL() });
  });
  window.webContents.on('did-fail-load', (event, code, description, validatedURL) => {
    writeMainLog('error', 'did-fail-load', { code, description, validatedURL });
  });
  window.on('closed', () => {
    pendingFilesByWebContentsId.delete(window.webContents.id);
    windows.delete(window);
    debugBoot('window closed');
  });
};

ipcMain.handle('consume-file', (event) => {
  const fileState = pendingFilesByWebContentsId.get(event.sender.id) || null;

  if (fileState) {
    pendingFilesByWebContentsId.delete(event.sender.id);
  }

  return fileState;
});

ipcMain.handle('select-editor', async (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  const result = await dialog.showOpenDialog(window, {
    properties: ['openFile'],
    message: 'Please select a markdown editor application'
  });

  return result.canceled ? [] : result.filePaths;
});

app.on('open-file', (event, filePath) => {
  event.preventDefault();
  setGlobalFile(filePath);
  createMainWindow();
});

const allowMultiInstance = process.env.MDP_ALLOW_MULTI_INSTANCE === '1';
const hasSingleInstanceLock = allowMultiInstance || app.requestSingleInstanceLock();

if (!hasSingleInstanceLock) {
  // quit and let second-instance handler take it
  app.quit();
} else {
  // register these only on first instance that got the lock
  if (!allowMultiInstance) {
    app.on('second-instance', (event, commandLine) => {
      processArgs(commandLine);
      createMainWindow();
    });
  }

  app.on('ready', () => {
    debugBoot('app ready');
    menu.setupMenu(app);
    processArgs(process.argv);
    createMainWindow();
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

}


/** poc questions holding zone **/
/*
 mdp ./audio.md
 need to expand file args to absolute paths
[2019-03-23 08:45:29.633] [info] [ '/Applications/mdp.app/Contents/MacOS/mdp', './audio.md' ]
[2019-03-23 08:45:30.285] [info] readFile ./audio.md
[2019-03-23 08:45:30.297] [error] readFile Error: ENOENT: no such file or directory, open './audio.md'
[2019-03-23 08:45:30.298] [error] readFile no data
*/

/*
- check for if exists in readFile, else close window
first launch accepting open anyway security
[2019-03-23 08:42:31.939] [info] readFile -psn_0_3715979
[2019-03-23 08:42:31.952] [error] readFile Error: ENOENT: no such file or directory, open '-psn_0_3715979'
[2019-03-23 08:42:31.953] [error] readFile no data
*/

/*
*/

/* fixme need activate? app.on('activate', () => { if (window === null) { createWindow() } }); */

/* fixme window is destroyed, keep list or?
in app.on('second-instance', (event, commandLine, workingDirectory)
if (window) {
  if (window.isMinimized()) window.restore();
  window.focus();
}
*/
//
// fixme - may need to push to array so not collected after multiple win?
// let window = null;

/* fixme url and slashes window.loadURL(url.format({ pathname: path.join(__dirname, 'view/index.html'), protocol: 'file:', slashes: true })); */

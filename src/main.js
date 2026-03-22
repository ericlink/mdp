const { app, BrowserWindow, dialog, ipcMain, shell } = require('electron');
const { execFile } = require('child_process');
const fs = require('fs');
const menu = require('./menu.js');
const path = require('path');
const { fileURLToPath, pathToFileURL } = require('url');
const windowStateKeeper = require('electron-window-state');

const appRoot = path.resolve(__dirname, '..');
const preloadPath = path.join(__dirname, 'preload.js');
const rendererHtmlPath = path.join(__dirname, 'renderer', 'index.html');
const rendererUrl = pathToFileURL(rendererHtmlPath);
const mainLogPath = '/tmp/mdp-main.log';
const windows = new Set();
const pendingFilesByWebContentsId = new Map();
const watchersByWebContentsId = new Map();
let settingsCache = null;
let pendingOpenFilePath = null;
let lastOpenedFilePath = null;

try {
  fs.writeFileSync(mainLogPath, '');
} catch (error) {
  console.error(error);
}

const formatLogValue = (value) => {
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

const writeMainLog = (...args) => {
  const text = args.map(formatLogValue).join(' ');
  fs.appendFileSync(mainLogPath, `${text}\n`);
};

process.on('uncaughtException', (error) => {
  console.error(error);
  writeMainLog('uncaughtException', error);
});

process.on('unhandledRejection', (reason) => {
  console.error(reason);
  writeMainLog('unhandledRejection', reason);
});

const normalizeFileState = (filePath) => {
  const absoluteFilePath = resolveFilePath(filePath);

  return {
    name: absoluteFilePath,
    path: `${path.dirname(absoluteFilePath)}${path.sep}`,
    filePath: absoluteFilePath,
    fileUrl: pathToFileURL(absoluteFilePath).toString()
  };
};

const resolveFilePath = (filePath) => {
  if (!filePath) {
    return null;
  }

  if (path.isAbsolute(filePath)) {
    return filePath;
  }

  const cwdResolved = path.resolve(process.cwd(), filePath);
  if (fs.existsSync(cwdResolved)) {
    return cwdResolved;
  }

  return path.resolve(appRoot, filePath);
};

const resolveFileUrlPath = (fileUrl) => {
  if (!fileUrl) {
    return null;
  }

  try {
    return fileURLToPath(fileUrl);
  } catch (error) {
    return null;
  }
};

const resolveStartupFileArg = (candidate) => {
  if (!candidate || candidate.startsWith('-')) {
    return null;
  }

  const resolvedFilePath = resolveFilePath(candidate);

  if (resolvedFilePath === path.resolve(__filename)) {
    return null;
  }

  try {
    const stats = fs.statSync(resolvedFilePath);
    return stats.isFile() ? resolvedFilePath : null;
  } catch (error) {
    return null;
  }
};

const getStartupFilePath = (argv = []) => {
  const candidateArgs = (app.isPackaged ? argv.slice(1) : argv.slice(2))
    .filter((arg) => arg && !arg.startsWith('-psn'))
    .map(resolveStartupFileArg)
    .filter(Boolean);

  if (candidateArgs.length > 0) {
    return candidateArgs[candidateArgs.length - 1];
  }

  if (process.env.MDP_DEFAULT_FILE) {
    return resolveStartupFileArg(process.env.MDP_DEFAULT_FILE);
  }

  switch (process.env.npm_lifecycle_event) {
    case 'dev-readme':
      return path.join(appRoot, 'README.md');
    case 'dev':
    case 'start':
      return path.join(appRoot, 'assets', 'example.md');
    default:
      return null;
  }
};

const getSettingsFilePath = () => {
  return path.join(app.getPath('userData'), 'settings.json');
};

const loadSettings = () => {
  if (settingsCache) {
    return settingsCache;
  }

  try {
    const contents = fs.readFileSync(getSettingsFilePath(), 'utf8');
    settingsCache = JSON.parse(contents);
  } catch (error) {
    settingsCache = {};
  }

  return settingsCache;
};

const saveSettings = (nextSettings) => {
  const filePath = getSettingsFilePath();
  const mergedSettings = { ...loadSettings(), ...nextSettings };

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(mergedSettings, null, 2));
  settingsCache = mergedSettings;

  return mergedSettings;
};

const isRendererEntryUrl = (value) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === rendererUrl.protocol && parsed.pathname === rendererUrl.pathname;
  } catch (error) {
    return false;
  }
};

const isTrustedIpcSender = (event) => {
  const senderUrl = event.senderFrame?.url || event.sender.getURL();
  return isRendererEntryUrl(senderUrl);
};

const ensureTrustedIpcSender = (event) => {
  if (!isTrustedIpcSender(event)) {
    throw new Error('Untrusted IPC sender');
  }
};

const cleanupFileWatcher = (webContentsId) => {
  const watcher = watchersByWebContentsId.get(webContentsId);
  if (!watcher) {
    return;
  }

  fs.unwatchFile(watcher.filePath, watcher.listener);
  watchersByWebContentsId.delete(webContentsId);
};

const createMainWindow = (fileState) => {
  if (!fileState) {
    return null;
  }

  const mainWindowState = windowStateKeeper({
    defaultWidth: 1000,
    defaultHeight: 800
  });

  const window = new BrowserWindow({
    show: false,
    title: 'mdp',
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      // The preload currently uses Node-backed packages, so Electron's
      // default renderer sandbox would block it from initializing.
      sandbox: false,
      webSecurity: true
    }
  });

  const webContents = window.webContents;
  const webContentsId = webContents.id;
  windows.add(window);
  pendingFilesByWebContentsId.set(webContentsId, fileState);
  mainWindowState.manage(window);

  window.loadFile(rendererHtmlPath).catch((error) => {
    console.error(error);
    writeMainLog('loadFile', error);
  });
  window.once('ready-to-show', () => {
    window.show();
  });
  window.on('closed', () => {
    cleanupFileWatcher(webContentsId);
    pendingFilesByWebContentsId.delete(webContentsId);
    windows.delete(window);
  });
  webContents.on('render-process-gone', (_event, details) => {
    writeMainLog('render-process-gone', details);
  });
  webContents.on('did-fail-load', (_event, code, description, validatedURL) => {
    writeMainLog('did-fail-load', { code, description, validatedURL });
  });

  return window;
};

const openMarkdownFile = (filePath) => {
  if (!filePath) {
    return null;
  }

  const resolvedFilePath = resolveFilePath(filePath);

  if (!app.isReady()) {
    pendingOpenFilePath = resolvedFilePath;
    return null;
  }

  lastOpenedFilePath = resolvedFilePath;
  return createMainWindow(normalizeFileState(resolvedFilePath));
};

const isSafeExternalUrl = (value) => {
  try {
    const url = new URL(value);
    return ['http:', 'https:', 'mailto:'].includes(url.protocol);
  } catch (error) {
    return false;
  }
};

const openLocalPath = async (value) => {
  if (!value) {
    return false;
  }

  const resolvedFilePath = value.startsWith('file:')
    ? resolveFileUrlPath(value)
    : resolveFilePath(value);

  if (!resolvedFilePath) {
    return false;
  }

  const result = await shell.openPath(resolvedFilePath);
  return result === '';
};

const launchEditor = ({ editorPath, filePath }) => {
  const resolvedEditorPath = path.resolve(editorPath);
  const resolvedFilePath = resolveFilePath(filePath);

  return new Promise((resolve, reject) => {
    const callback = (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(true);
    };

    if (process.platform === 'darwin') {
      execFile('open', ['-a', resolvedEditorPath, resolvedFilePath], callback);
      return;
    }

    execFile(resolvedEditorPath, [resolvedFilePath], callback);
  });
};

ipcMain.handle('mdp:consume-file', (event) => {
  ensureTrustedIpcSender(event);

  const fileState = pendingFilesByWebContentsId.get(event.sender.id) || null;
  if (fileState) {
    pendingFilesByWebContentsId.delete(event.sender.id);
  }

  return fileState;
});

ipcMain.handle('mdp:read-file', async (event, filePath) => {
  ensureTrustedIpcSender(event);

  const resolvedFilePath = resolveFilePath(filePath);
  return fs.promises.readFile(resolvedFilePath, 'utf8');
});

ipcMain.handle('mdp:watch-file', (event, filePath) => {
  ensureTrustedIpcSender(event);

  const webContentsId = event.sender.id;
  const resolvedFilePath = resolveFilePath(filePath);
  cleanupFileWatcher(webContentsId);

  const listener = (current, previous) => {
    if (current.mtimeMs === previous.mtimeMs && current.size === previous.size) {
      return;
    }

    if (!event.sender.isDestroyed()) {
      event.sender.send('mdp:file-changed', { filePath: resolvedFilePath });
    }
  };

  fs.watchFile(resolvedFilePath, { interval: 300 }, listener);
  watchersByWebContentsId.set(webContentsId, {
    filePath: resolvedFilePath,
    listener
  });

  return true;
});

ipcMain.handle('mdp:unwatch-file', (event) => {
  ensureTrustedIpcSender(event);
  cleanupFileWatcher(event.sender.id);
  return true;
});

ipcMain.handle('mdp:select-editor', async (event) => {
  ensureTrustedIpcSender(event);

  const window = BrowserWindow.fromWebContents(event.sender);
  const result = await dialog.showOpenDialog(window, {
    properties: process.platform === 'darwin' ? ['openFile', 'openDirectory'] : ['openFile'],
    message: 'Please select a markdown editor application'
  });

  return result.canceled ? [] : result.filePaths;
});

ipcMain.handle('mdp:get-editor-path', (event) => {
  ensureTrustedIpcSender(event);
  return loadSettings().editorPath || null;
});

ipcMain.handle('mdp:set-editor-path', (event, editorPath) => {
  ensureTrustedIpcSender(event);

  const resolvedEditorPath = path.resolve(editorPath);
  saveSettings({ editorPath: resolvedEditorPath });
  return resolvedEditorPath;
});

ipcMain.handle('mdp:launch-editor', async (event, payload) => {
  ensureTrustedIpcSender(event);
  return launchEditor(payload);
});

ipcMain.handle('mdp:open-path', async (event, value) => {
  ensureTrustedIpcSender(event);
  return openLocalPath(value);
});

ipcMain.handle('mdp:open-external', async (event, url) => {
  ensureTrustedIpcSender(event);

  if (!isSafeExternalUrl(url)) {
    return false;
  }

  await shell.openExternal(url);
  return true;
});

app.on('open-file', (event, filePath) => {
  event.preventDefault();
  openMarkdownFile(filePath);
});

app.on('web-contents-created', (_event, contents) => {
  contents.setWindowOpenHandler(({ url }) => {
    if (isSafeExternalUrl(url)) {
      shell.openExternal(url);
    }

    return { action: 'deny' };
  });

  contents.on('will-navigate', (event, url) => {
    if (!isRendererEntryUrl(url)) {
      event.preventDefault();
    }
  });
});

const allowMultiInstance = process.env.MDP_ALLOW_MULTI_INSTANCE === '1';
const hasSingleInstanceLock = allowMultiInstance || app.requestSingleInstanceLock();

if (!hasSingleInstanceLock) {
  app.quit();
} else {
  if (!allowMultiInstance) {
    app.on('second-instance', (_event, commandLine) => {
      const filePath = getStartupFilePath(commandLine);

      if (filePath) {
        openMarkdownFile(filePath);
        return;
      }

      const [window] = windows;
      if (window && !window.isDestroyed()) {
        if (window.isMinimized()) {
          window.restore();
        }

        window.focus();
      }
    });
  }

  app.whenReady().then(() => {
    writeMainLog('session-start', new Date().toISOString());
    menu.setupMenu(app);
    openMarkdownFile(pendingOpenFilePath || getStartupFilePath(process.argv));
  });

  app.on('activate', () => {
    if (windows.size > 0) {
      return;
    }

    openMarkdownFile(lastOpenedFilePath || getStartupFilePath(process.argv));
  });

  app.on('window-all-closed', () => {
    app.quit();
  });
}

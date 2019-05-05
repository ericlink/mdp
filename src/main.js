const { app, BrowserWindow, session } = require('electron');
const log = require('electron-log');
const menu   = require('./menu.js');
const path = require('path');
const update = require('update-electron-app');
const url = require('url');
const windowStateKeeper = require('electron-window-state');

log.catchErrors({});
log.transports.console.level = process.env.DEV_MODE ? 'silly' : 'info';
log.transports.file.level = process.env.DEV_MODE ? 'silly' : 'info';
log.debug('--- debug mode ---');

const setGlobalFile = (file) => {
  global.file = {
    name: file,
    path: path.resolve(path.dirname(file)) + path.sep
  };
}

const processArgs = (argv) => {
  const lastArg =  argv[argv.length-1];
  const macFinderArgPrefixProcessSerialNumber = '-psn';
  if (argv && argv.length > 1 && lastArg !== './src/main.js' && !lastArg.startsWith(macFinderArgPrefixProcessSerialNumber)) {
    setGlobalFile(lastArg);
  }
}

const createMainWindow = () => {
  if (!global.file) return;

  let mainWindowState = windowStateKeeper({ defaultWidth: 1000, defaultHeight: 800 });

  const window = new BrowserWindow({
    show: false,
    title: 'mdp',
    'x': mainWindowState.x,
    'y': mainWindowState.y,
    'width': mainWindowState.width,
    'height': mainWindowState.height,
    webPreferences: {
      nodeIntegration: true,
      partition: "persist:main",
      webSecurity: false,
      allowRunningInsecureContent: true
    }
  });

  mainWindowState.manage(window);
  window.loadURL('file://' + path.join(__dirname, './renderer/index.html'));
  window.once('ready-to-show', () => { window.show(); });
}

app.on('open-file', (event, filePath) => {
  event.preventDefault();
  setGlobalFile(filePath);
  createMainWindow();
});

if (!app.requestSingleInstanceLock()) {
  // quit and let second-instance handler take it
  app.quit()
} else {
  // register these only on first instance that got the lock
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    processArgs(commandLine);
    createMainWindow();
  });

  app.on('ready', () => {
    menu.setupMenu(app);
    processArgs(process.argv);
    createMainWindow();
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
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

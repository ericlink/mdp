const { app, BrowserWindow, session } = require('electron');
const log = require('electron-log');
const path = require('path');
const update = require('update-electron-app');
const url = require('url');
const windowStateKeeper = require('electron-window-state');
const menu   = require('./menu.js');

// fixme - may need to push to array so not collected after multiple win?
let window = null;

const processArgs = (argv) => {
  const lastArg =  argv[argv.length-1];
  if (argv && lastArg !== './src/main.js') {
    global.file = {name: lastArg};
  }
}

const createMainWindow = () => {
  let mainWindowState = windowStateKeeper({ defaultWidth: 1000, defaultHeight: 800 });

  window = new BrowserWindow({
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
  /* fixme url and slashes window.loadURL(url.format({ pathname: path.join(__dirname, 'view/index.html'), protocol: 'file:', slashes: true })); */

  window.once('ready-to-show', () => { window.show(); });
}

app.on('open-file', (event, filePath) => {
  event.preventDefault();
  log.info('open-file',event,filePath);
  global.file = {name: filePath};
  createMainWindow();
});

if (!app.requestSingleInstanceLock()) {
  // quit and let second-instance handler take it
  app.quit()
} else {
  // register these only on first instance that got the lock
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (window) {
      if (window.isMinimized()) window.restore();
      window.focus();
    }
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


/** poc holding zone **/

/*
//fixme export - works but missing styles, inject those into doc?
//fs.writeFile('/tmp/mdp.html', new XMLSerializer().serializeToString(document), function(){});
fs.writeFile('/tmp/mdp.html', document.documentElement.outerHTML, function(){
const shell = require('electron').shell;
const path = require('path');
//shell.openItem(path.join(__dirname, 'test.docx'));
shell.openItem('/tmp/mdp.html');
});
*/

/* fixme need activate? app.on('activate', () => { if (window === null) { createWindow() } }); */

const { app, BrowserWindow, session } = require('electron');
const windowStateKeeper = require('electron-window-state');
const menu   = require('./menu.js');
const path = require('path');
const update = require('update-electron-app');
const url = require('url');
const log = require('electron-log');

let window = null;

app.on('open-file', function(event, filePath){
  event.preventDefault();
  log.info('open-file',event,filePath);
  global.openFile = {filePath: filePath};

  //////////
  createMainWindow();
  window.loadURL('file://' + path.join(__dirname, './renderer/index.html'));
  window.once('ready-to-show', () => { window.show(); });
  //////////
});


const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (window) {
      if (window.isMinimized()) window.restore();
      window.focus();
    }
    log.info('second-instance', event, commandLine, workingDirectory);
    // create another window with the new doc
    createMainWindow();
    menu.setupMenu(app);

    global.sharedObject = {commandLine: commandLine};
    window.loadURL('file://' + path.join(__dirname, './renderer/index.html'));
    /*
      window.loadURL(url.format({
        pathname: path.join(__dirname, 'view/index.html'),
        protocol: 'file:',
        slashes: true
      }));
      */

    window.once('ready-to-show', () => {
      window.show();
    });


  });

  app.on('ready', () => {
    createMainWindow();
    menu.setupMenu(app);

    global.sharedObject = {argv: process.argv}
    window.loadURL('file://' + path.join(__dirname, './renderer/index.html'));
    /*
      window.loadURL(url.format({
        pathname: path.join(__dirname, 'view/index.html'),
        protocol: 'file:',
        slashes: true
      }));
      */

    window.once('ready-to-show', () => {
      window.show();
    });

  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  });

  /*
app.on('activate', () => {
  if (window === null) {
    createWindow()
  }
});
*/

}


function createMainWindow() {
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
}

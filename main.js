const { app, BrowserWindow, session } = require('electron');
const windowStateKeeper = require('electron-window-state');
//fails when packaged - const cookie = require('./cookie.js');
const menu   = require('./menu.js');
const pjson  = require('./package.json');
const path = require('path');
const url = require('url');

let window = null;

app.on('ready', () => {
  let url = process.argv[1] ? process.argv[1] : pjson.config.app.url;
  //cookie.initCookieManager(session.defaultSession);
  createMainWindow();
  menu.setupMenu(app);

  global.sharedObject = {argv: process.argv}

  window.loadURL('file://' + path.join(__dirname, 'view/index.html'));
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

app.on('activate', () => {
  if (window === null) {
    createWindow()
  }
});


function createMainWindow() {
  let mainWindowState = windowStateKeeper({ defaultWidth: 1000, defaultHeight: 800 });

  window = new BrowserWindow({
    show: false,
    title: pjson.name,
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

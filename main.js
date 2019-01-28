// update name, productName, description and config.app.url in package.json
const { app, BrowserWindow, session } = require('electron');
const windowStateKeeper = require('electron-window-state');
const cookie = require('./cookie.js');
const menu   = require('./menu.js');
const pjson  = require('./package.json');

let window = null;

app.on('ready', () => {
  let url = process.argv[1] ? process.argv[1] : pjson.config.app.url;
  cookie.initCookieManager(session.defaultSession);
  createMainWindow();
  menu.setupMenu(app);

	window.loadURL(url);

  //window.show();

  window.once('ready-to-show', () => {
    window.show();
  });

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
      nodeIntegration: false,
      partition: "persist:main" 
    }
  });

  mainWindowState.manage(window);
}

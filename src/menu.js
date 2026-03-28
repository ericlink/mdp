const { BrowserWindow, Menu, dialog, shell } = require('electron');

let applicationMenu = null;
let cachedApp = null;
const APP_NAME = 'mdp';
const PROJECT_URL = 'https://ericlink.github.io/mdp/';

const showAboutDialog = async (app, targetWindow) => {
  const options = {
    type: 'info',
    title: `About ${APP_NAME}`,
    buttons: ['Open Project Website', 'OK'],
    defaultId: 1,
    cancelId: 1,
    noLink: true,
    message: APP_NAME,
    detail: `Version ${app.getVersion()}\n\n${PROJECT_URL}`
  };

  const result = targetWindow
    ? await dialog.showMessageBox(targetWindow, options)
    : await dialog.showMessageBox(options);

  if (result.response === 0) {
    await shell.openExternal(PROJECT_URL);
  }
};

const buildMenu = (app, sendMenuAction, getTargetWindow) => {
  const settingsMenuItem = {
    label: 'Settings...',
    accelerator: 'CmdOrCtrl+,',
    click: (_menuItem, browserWindow) => {
      sendMenuAction('open-reader-settings', browserWindow);
    }
  };
  const fileMenu = {
    label: 'File',
    submenu: [
      { role: 'close' }
    ]
  };

  const actionsMenu = {
    label: 'Actions',
    submenu: [
      {
        label: 'Edit Markdown',
        accelerator: 'CmdOrCtrl+E',
        click: (_menuItem, browserWindow) => {
          sendMenuAction('edit-file', browserWindow);
        }
      },
      {
        label: 'Select Markdown Editor',
        click: (_menuItem, browserWindow) => {
          sendMenuAction('select-editor', browserWindow);
        }
      },
      {
        label: 'Open as HTML',
        accelerator: 'CmdOrCtrl+K',
        click: (_menuItem, browserWindow) => {
          sendMenuAction('view-as-html', browserWindow);
        }
      },
      { type: 'separator' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { role: 'resetZoom' },
      { type: 'separator' },
      {
        label: 'Back',
        accelerator: 'CmdOrCtrl+Left',
        click: (_menuItem, browserWindow) => {
          const window = getTargetWindow(browserWindow);
          if (window && window.webContents.canGoBack()) {
            window.webContents.goBack();
          }
        }
      },
      {
        label: 'Forward',
        accelerator: 'CmdOrCtrl+Right',
        click: (_menuItem, browserWindow) => {
          const window = getTargetWindow(browserWindow);
          if (window && window.webContents.canGoForward()) {
            window.webContents.goForward();
          }
        }
      },
      { type: 'separator' },
      { role: 'togglefullscreen' },
      { role: 'toggleDevTools' }
    ]
  };

  if (process.platform === 'darwin') {
    return Menu.buildFromTemplate([
      {
        label: APP_NAME,
        submenu: [
          {
            label: `About ${APP_NAME}`,
            click: (_menuItem, browserWindow) => {
              const window = getTargetWindow(browserWindow);
              void showAboutDialog(app, window);
            }
          },
          { type: 'separator' },
          settingsMenuItem,
          { type: 'separator' },
          { role: 'services' },
          { type: 'separator' },
          { role: 'hide' },
          { role: 'hideOthers' },
          { role: 'unhide' },
          { type: 'separator' },
          { role: 'quit' }
        ]
      },
      fileMenu,
      { role: 'editMenu' },
      actionsMenu,
      { role: 'windowMenu' }
    ]);
  }

  return Menu.buildFromTemplate([
    {
      label: 'Settings',
      submenu: [
        settingsMenuItem
      ]
    },
    fileMenu,
    { role: 'editMenu' },
    actionsMenu,
    { role: 'windowMenu' }
  ]);
};

const refreshApplicationMenu = (app, sendMenuAction, getTargetWindow) => {
  applicationMenu = buildMenu(app, sendMenuAction, getTargetWindow);
  Menu.setApplicationMenu(applicationMenu);
  return applicationMenu;
};

exports.setupMenu = function(app) {
  cachedApp = app;
  app.setName(APP_NAME);

  const getTargetWindow = (browserWindow) => {
    if (browserWindow && !browserWindow.isDestroyed()) {
      return browserWindow;
    }

    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (focusedWindow && !focusedWindow.isDestroyed()) {
      return focusedWindow;
    }

    return BrowserWindow.getAllWindows().find((window) => !window.isDestroyed()) || null;
  };

  const sendMenuAction = (action, browserWindow) => {
    setImmediate(() => {
      const window = getTargetWindow(browserWindow);
      if (window && !window.isDestroyed()) {
        window.webContents.send('mdp:menu-action', { action });
      }

      if (process.platform === 'darwin' && action === 'open-reader-settings' && cachedApp) {
        setTimeout(() => {
          refreshApplicationMenu(cachedApp, sendMenuAction, getTargetWindow);
        }, 75);
      }
    });
  };

  return refreshApplicationMenu(app, sendMenuAction, getTargetWindow);
};

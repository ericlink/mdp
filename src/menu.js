const { BrowserWindow, Menu } = require('electron');

let applicationMenu = null;
let cachedApp = null;

const buildMenu = (app, sendMenuAction, getTargetWindow) => {
  const settingsMenuItem = {
    label: 'Settings...',
    accelerator: 'CmdOrCtrl+,',
    click: (_menuItem, browserWindow) => {
      sendMenuAction('open-reader-settings', browserWindow);
    }
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

  const settingsMenu = {
    label: 'Settings',
    submenu: [
      settingsMenuItem
    ]
  };

  const template = [
    settingsMenu,
    { role: 'editMenu' },
    actionsMenu,
    { role: 'windowMenu' }
  ];

  if (process.platform === 'darwin') {
    template.unshift({ role: 'appMenu' });
  }

  return Menu.buildFromTemplate(template);
};

const refreshApplicationMenu = (app, sendMenuAction, getTargetWindow) => {
  applicationMenu = buildMenu(app, sendMenuAction, getTargetWindow);
  Menu.setApplicationMenu(applicationMenu);
  return applicationMenu;
};

exports.setupMenu = function(app) {
  cachedApp = app;

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

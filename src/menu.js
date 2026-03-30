const { BrowserWindow, Menu, MenuItem } = require('electron');
const APP_NAME = 'mdp';

const buildMenu = (app, sendMenuAction, getTargetWindow) => {
  const settingsMenuItem = {
    id: 'open-reader-settings',
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
    const applicationMenu = Menu.buildFromTemplate([
      { role: 'appMenu' },
      fileMenu,
      { role: 'editMenu' },
      actionsMenu,
      { role: 'windowMenu' }
    ]);

    const appSubmenu = applicationMenu.items[0]?.submenu;
    if (appSubmenu && !appSubmenu.getMenuItemById('open-reader-settings')) {
      appSubmenu.insert(1, new MenuItem(settingsMenuItem));
    }

    return applicationMenu;
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

exports.setupMenu = function(app) {
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
    });
  };

  const applicationMenu = buildMenu(app, sendMenuAction, getTargetWindow);
  Menu.setApplicationMenu(applicationMenu);
  return applicationMenu;
};

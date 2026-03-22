const { BrowserWindow, Menu, shell } = require('electron');
const tmp = require('tmp');

exports.setupMenu = function(app) {
  const sendMenuAction = (action) => {
    const window = BrowserWindow.getFocusedWindow();
    if (window && !window.isDestroyed()) {
      window.webContents.send('mdp:menu-action', { action });
    }
  };

  const template = [
    {
      label: 'Edit',
      submenu: [
        { role: 'copy' },
        { role: 'selectall' }
      ]
    },
    { role: 'windowMenu' },
    {
      label: 'Actions',
      submenu: [
        {
          label: 'Edit Markdown',
          accelerator: 'CmdOrCtrl+e',
          click: () => {
            sendMenuAction('edit-file');
          }
        },
        {
          label: 'Select Markdown Editor',
          click: () => {
            sendMenuAction('select-editor');
          }
        },
        {
          label: 'Open as HTML',
          accelerator: 'CmdOrCtrl+k',
          click: () => {
            const window = BrowserWindow.getFocusedWindow();

            if (!window || window.isDestroyed()) {
              return;
            }

            const tmpFile = tmp.fileSync().name + '.html';
            window.webContents.savePage(tmpFile, 'HTMLComplete', () => {
              shell.openPath(tmpFile);
            });
          }
        },
        { type: 'separator'},
        { role: 'zoomin' },
        { role: 'zoomout' },
        { role: 'resetzoom' },
        { type: 'separator'},
        {
          label: 'Back',
          accelerator: 'CmdOrCtrl+Left',
          click: () => {
            const window = BrowserWindow.getFocusedWindow();
            if (window && window.webContents.canGoBack()) {
              window.webContents.goBack();
            }
          }
        },
        {
          label: 'Forward',
          accelerator: 'CmdOrCtrl+Right',
          click: () => {
            const window = BrowserWindow.getFocusedWindow();
            if (window && window.webContents.canGoForward()) {
              window.webContents.goForward();
            }
          }
        },
        { type: 'separator'},
        { role: 'togglefullscreen'},
        { role: 'toggledevtools' }
      ]}
  ];
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        {role: 'about'},
        {type: 'separator'},
        {role: 'services', submenu: []},
        {type: 'separator'},
        {role: 'hide'},
        {role: 'hideothers'},
        {role: 'unhide'},
        {type: 'separator'},
        {role: 'quit'}
      ]
    });
    // Edit menu
    template[1].submenu.push(
      {type: 'separator'},
      {
        label: 'Speech',
        submenu: [
          {role: 'startspeaking'},
          {role: 'stopspeaking'}
        ]
      }
    );
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};

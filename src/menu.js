
const { BrowserWindow, Menu } = require('electron');
const tmp = require('tmp');

exports.setupMenu = function(app) {
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
            BrowserWindow
              .getFocusedWindow()
              .webContents
              .send('edit-file', 'edit the current markdown file');
          }
        },
        {
          label: 'Select Markdown Editor',
          click: () => {
            BrowserWindow
              .getFocusedWindow()
              .webContents
              .send('select-editor', 'Select a markdown editor');
          }
        },
        {
          label: 'Open as HTML',
          accelerator: 'CmdOrCtrl+k',
          click: () => {
            var tmpFile = tmp.fileSync().name + '.html';
            BrowserWindow
              .getFocusedWindow()
              .webContents
              .savePage(tmpFile, 'HTMLComplete', (error) => {
                require('electron').shell.openItem(tmpFile);
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
            if (BrowserWindow.getFocusedWindow().webContents.canGoBack()) {
              BrowserWindow.getFocusedWindow().webContents.goBack();
            }
          }
        },
        {
          label: 'Forward',
          accelerator: 'CmdOrCtrl+Right',
          click: () => {
            if (BrowserWindow.getFocusedWindow().webContents.canGoForward()) {
              BrowserWindow.getFocusedWindow().webContents.goForward();
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

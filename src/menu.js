const { BrowserWindow, Menu } = require('electron');

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

    /* Window menu
    template[3].submenu = [
      {role: 'close'},
      {role: 'minimize'},
      {role: 'zoom'},
      {type: 'separator'},
      {role: 'front'}
    ];
    */
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};

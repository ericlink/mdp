const { Menu } = require('electron');

exports.setupMenu = function(app, window) {
  const template = [
  {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { role: 'selectall' }
    ]
  },
  {
    label: 'Actions',
    submenu: [
      { role: 'reload' },
      { role: 'forcereload' },
      { type: 'separator' },
      { role: 'zoomin' },
      { role: 'zoomout' },
      { role: 'resetzoom' },
      { type: 'separator'},
      {
        label: 'Back',
        accelerator: 'CmdOrCtrl+Left',
        click: () => {
            if (window.webContents.canGoBack()) {
              window.webContents.goBack();
            }
        }
      },
      {
        label: 'Forward',
        accelerator: 'CmdOrCtrl+Right',
        click: () => {
            if (window.webContents.canGoForward()) {
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
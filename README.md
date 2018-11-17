# electron-forge-webapp-template

Host a webapp in electron with an app icon, persistent cookie support, window position management, common menus and keyboard shortcuts

`app.icns` &mdash; mac icon support

`cookie.js` &mdash; ensure cookies persist by flushing cookie storage

`index.html` &mdash; show versions and load `renderer.js`

`main.js` &mdash; main entry point

`menu.js` &mdash; setup menus and shortcut keys

`renderer.js` &mdash; require `electron-cookies` bacause it has to run in the renderer process
# electron-forge-webapp-template

Host a webapp in electron with an app icon, persistent cookie support, window position management, common menus and keyboard shortcuts

## Setup an app

1. Clone the repo

    `git clone https://github.com/ericlink/electron-forge-webapp-template.git`

1. Find a mac icon and replace `app.icns` with it ([Icon Finder](https://www.easyicon.net/language.en/))
1. Edit `package.json` to set the name and url for the app

    ``` json
    "name": "template",
    "productName": "template",
    "description": "template",
    ```

    ``` json
    "config": {
        "app": {
        "url": "https://google.com"
        },
    ```
1. `npm install`
1. `npm run package`
1. `mv ./out/App-x64/myApp.app /Applications/`
1. `rm -rf out node_modules`

## Inventory

`app.icns` &mdash; mac icon support

`cookie.js` &mdash; ensure cookies persist by flushing cookie storage

`index.html` &mdash; show versions and load `renderer.js`

`main.js` &mdash; main entry point

`menu.js` &mdash; setup menus and shortcut keys

`renderer.js` &mdash; require `electron-cookies` bacause it has to run in the renderer process
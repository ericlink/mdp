# **m**ark**d**own**p**review

Markdown preview using marked, highlight.js, mermaid and live reload.


`./node_modules/.bin/electron main.js ./example.md`

`mdp example.md`

upstream is `git clone https://github.com/ericlink/electron-forge-webapp-template.git`

[icon finder](https://www.easyicon.net/language.en/))

## build
1. `npm install`
1. `npm run package`
1. `mv ./out/App-x64/myApp.app /Applications/`
1. `rm -rf out node_modules`

## inventory

`app.icns` &mdash; mac icon support

`cookie.js` &mdash; ensure cookies persist by flushing cookie storage

`index.html` &mdash; show versions and load `renderer.js`

`main.js` &mdash; main entry point

`menu.js` &mdash; setup menus and shortcut keys

`renderer.js` &mdash; require `electron-cookies` because it has to run in the renderer process

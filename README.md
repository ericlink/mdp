# mdp

**m**ark**d**own **p**review using marked, highlight.js, mermaid and live reload

## todo

[x] move poc into app (works using dev command line)

[] get working as packaged

[] get working as packaged --detach

[] get working as cmd line

[] get working from file associated in finder

[] get working with *marked* markdown themes

[] fix up js

## dev
1. `npm install`
1. `./node_modules/.bin/electron main.js ./example.md`

upstream repo is `git clone https://github.com/ericlink/electron-forge-webapp-template.git`

## package
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

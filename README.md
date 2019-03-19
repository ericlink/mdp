# mdp
**m**ark **d**own **p**review using marked, highlight.js, mermaid and live reload

## todo
- [ ] export menu (html, open in browser)
- [ ] close window key
- [ ] fix up js
- [ ] load modules more efficiently
- [ ] webpack
- [ ] window menu
- [ ] zoom by window
- [ ] get working with *highlight.js* themes
- [ ] get working with *marked* themes
- [ ] installer - install command line script
- [ ] mac code signing
- [x] get working from file associated in finder
- [x] get working opening multiple from command line
- [x] get working as cmd line
- [x] get working as packaged
- [x] github release using electron-forge
- [x] keep scroll position on reload
- [x] move poc into app (works using dev command line)

## dev
1. `npm install`
1. `./node_modules/.bin/electron ./app/main.js ./assets/example.md`
1. `npm run dev-publish`
1. logs to `~/Library/Logs/mdp/log.log`

upstream repo is `git clone https://github.com/ericlink/electron-forge-webapp-template.git`

## package
1. `npm install`
1. `npm run package`
1. `npm run make && npm run publish`


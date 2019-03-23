# mdp
**m**ark **d**own **p**review using marked, highlight.js, mermaid and live reload

## todo
- [ ] export menu (html, open in browser)
- [ ] fix up js
- [ ] zoom by window?
- [ ] installer - install command line script
- [ ] load modules more efficiently
- [ ] webpack
- [ ] get working with *highlight.js* themes
- [ ] get working with *marked* themes
- [ ] mac code signing
- [x] window menu
- [x] close window key
- [x] get working from file associated in finder
- [x] get working opening multiple from command line
- [x] get working as cmd line
- [x] get working as packaged
- [x] github release using electron-forge
- [x] keep scroll position on reload
- [x] move poc into app (works using dev command line)

## dev
1. `npm install`
1. `npm run dev`
1. `npm run dev &` - run in background to test open-file with subsequent open
1. `npm run dev-noarg` - tests launch ./README.md by default
1. `./node_modules/.bin/electron ./src/main.js ./README.md`
1. `./node_modules/.bin/electron ./src/main.js` - launch readme by default
1. `npm run dev-publish`
1. open from finder once packaged
1. open from mdp shell script once packaged
1. `tail -f ~/Library/Logs/mdp/log.log`

upstream repo is `git clone https://github.com/ericlink/electron-forge-webapp-template.git`

## package
1. `npm install`
1. `npm run package`
1. `npm run make && npm run publish`


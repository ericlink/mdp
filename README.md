# mdp
**m**ark **d**own **p**review using marked, highlight.js, mermaid and live reload

[mdp releases](https://github.com/ericlink/mdp/releases)

to use from the command line, put the `mdp` script in the `package` directory in your path.

## dev
1. `npm install`
1. `npm run dev`

### test and publish
1. `npm run dev &` - run in background to test open-file with subsequent open
1. `npm run dev-noarg` - tests launch with no arg, app starts with no window
1. `./node_modules/.bin/electron ./src/main.js ./README.md`
1. `npm run dev-publish`
1. open from finder once packaged
1. open from mdp shell script once packaged
1. `tail -f ~/Library/Logs/mdp/log.log`

upstream repo is `git clone https://github.com/ericlink/electron-forge-webapp-template.git`

### package
1. `npm install`
1. `npm run package`
1. `npm run make && npm run publish`

## todo

### usability
- [ ] zoom by window?

### tech
- [ ] auto updater using git releases
- [ ] get electron-forge start working (not passing arg; detect mode and default arg to readme?)
- [ ] installer - install command line script
- [ ] load modules more efficiently?
- [ ] webpack

### nice to have
- [ ] get working with *highlight.js* themes
- [ ] get working with *marked* themes

### package and install
- [ ] installer - install command line script
- [ ] mac code signing

## done
- [x] open url only add listener once, not every reload
- [x] export menu (html, open in browser)
- [x] open links in os browser
- [x] expand cmd args to absolute path
- [x] fix up js
- [x] window menu
- [x] close window key
- [x] get working from file associated in finder
- [x] get working opening multiple from command line
- [x] get working as cmd line
- [x] get working as packaged
- [x] github release using electron-forge
- [x] keep scroll position on reload
- [x] move poc into app (works using dev command line)



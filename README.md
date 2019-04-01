# mdp
<b>m</b>ark<b>d</b>own <b>p</b>review using marked, highlight.js, mermaid, node-emoji and live reload


[https://ericlink.github.io/mdp/](https://ericlink.github.io/mdp/)

## dev notes
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

### features
- [ ] recent documents app.addRecentDocument('/Users/USERNAME/Desktop/work.type') app.clearRecentDocuments()
- [ ] issues and site linked in about
- [ ] keep scroll position on reload
- [ ] autosave sometimes doesn't refresh (file watcher issue?)
- [ ] vim keymappings
- [ ] get working with *highlight.js* themes
- [ ] get working with *marked* themes
- [ ] zoom by window?

### package and install
- [ ] installer - install command line script into /usr/local/bin
- [ ] sign app to enable auto updater using git releases

### tech
- [ ] upgrade packages
- [ ] get electron-forge start working (not passing arg; detect mode and default arg to readme?)
- [ ] load modules more efficiently?
- [ ] webpack?
- [ ] extendInfo any - The extra entries for Info.plist.

### done
- [x] preferences to set editor, e.g.  var executablePath = "mvim";
- [x] use tmp file for html
- [x] fixup markdown inline images to use base path of .md file they are in
- [x] emoji support
- [x] cmd+e to edit current markdown in system editor
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



# mdp
**m**ark **d**own **p**review using marked, highlight.js, mermaid, node-emoji and live reload
- [mdp releases](https://github.com/ericlink/mdp/releases)

## features

- highlight.js syntax highlighting [https://highlightjs.org/](https://highlightjs.org/)
- mermaid diagrams [https://mermaidjs.github.io/](https://mermaidjs.github.io/)
- node-emoji [https://github.com/omnidan/node-emoji](https://github.com/omnidan/node-emoji), [supported emoji](https://raw.githubusercontent.com/omnidan/node-emoji/master/lib/emoji.json)
- marked markdown parsing [https://marked.js.org/](https://marked.js.org/), [https://github.com/markedjs/marked](https://github.com/markedjs/marked)
- [example.md](https://github.com/ericlink/mdp/blob/master/assets/example.md)
- keys
    - _Open as HTML_ &#8984;K
    - _Edit Markdown_ &#8984;E
    - _Zoom_ - zoom in &#8984;+, zoom out &#8984;, actual size &#8984;0
- macOS
    - full screen support
    - dark mode window
- command line
    - put `mdp.app/Contents/Resources/app/package/mdp` script in your path
- logs
    - on Linux - `~/.config/<app name>/log.log`
    - on macOS - `~/Library/Logs/<app name>/log.log`
    - on Windows - `%USERPROFILE%\AppData\Roaming\<app name>\log.log`

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
- [ ] keep scroll position on reload
- [ ] autosave sometimes doesn't refresh (file watcher issue?)
- [ ] vim keymappings
- [ ] preferences to set editor, e.g.  var executablePath = "mvim";
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

### done
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



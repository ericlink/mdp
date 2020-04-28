Please fork and submit your PR with enough comments for someone who's never seen it. Thanks for the contrib!  The goal of mdp is to make a simple previewer that handles the most common use cases.  If 80% of the world used markdown, could mdp be the 20% solution?

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

### package for app store
1. `cat ~/.appl_pass`
1. `npm make`
1. `npm run apple-upload`

### publish to github
```
`cat ~/.git-mdp-publish-token`
env |grep GIT
npm run publish
```


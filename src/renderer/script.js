const chokidar = require('chokidar');
const fs = require('fs')
const hljs = require('highlight.js')
const marked = require('marked')
const mermaid = require('mermaid')
const remote = require('electron').remote
const log = require('electron-log');

var mermaidConfig = {
  startOnLoad:false,
  theme: 'neutral',
  sequence:{
    useMaxWidth:false,
    htmlLabels:true
  },
  flowchart:{
    useMaxWidth:false,
    htmlLabels:true
  }
};
mermaid.initialize(mermaidConfig);

const readFile = (file) => {
  fs.readFile(file, (err, data) => {
    // marked
    document.querySelector('.md').innerHTML = marked(data.toString());
    // highlight.js
    Array.from(document.querySelectorAll('pre code')).forEach(
      block => hljs.highlightBlock(block))
    // mermaid
    Array.from(document.querySelectorAll('.lang-mermaid')).forEach(
      block => mermaid.init(undefined, block))
  })
  //
  const htmlOutput = document.querySelector('.md').innerHTML;
  fs.writeFile('/tmp/mdp.html', htmlOutput, function(){});
}

// 2nd arg for dev, first arg for normal, README.md as default
const commandLine = remote.getGlobal('sharedObject').commandLine;
const secondInstanceFile = commandLine && commandLine[3] ? commandLine[3] : null;
const openFileFilePath = remote.getGlobal('openFile') ?  remote.getGlobal('openFile').filePath : null;

let path = null;

const argv = remote.getGlobal('sharedObject').argv;
if (argv && argv.length > 1 && argv[1] !== './src/main.js') {
  log.info('argv', argv);
  log.info('argv len=1', argv[argv.length -1]);
  path = argv[argv.length -1];
}

log.info('commandLine', commandLine);
log.info('secondInstanceFile', secondInstanceFile);
log.info('openFileFilePath', openFileFilePath);
log.info('path', path);


// assign from shared and clear shared
// move all logic to main to set single shared
const file = openFileFilePath || secondInstanceFile || path || 'README.md';
log.info('file',file);

readFile(file);

const watcher = chokidar.watch(file, { ignored: /[\/\\]\./, persistent: true });

watcher.on('change', function(file) {
  readFile(file);
})


const chokidar = require('chokidar');
const fs = require('fs')
const hljs = require('highlight.js')
const log = require('electron-log');
const marked = require('marked')
const mermaid = require('mermaid')
const remote = require('electron').remote
const shell = require('electron').shell;

const readFile = (file) => {
  log.info('readFile', file);
  fs.readFile(file, (err, data) => {
    if (err) log.error('readFile', err);
    if (!data || data.length == 0) log.error('readFile', 'no data');
    // marked
    document.querySelector('.md').innerHTML = marked(data.toString());
    // highlight.js
    Array.from(document.querySelectorAll('pre code')).forEach(
      block => hljs.highlightBlock(block)
    );
    // mermaid
    Array.from(document.querySelectorAll('.lang-mermaid')).forEach(
      block => mermaid.init(undefined, block)
    );
    // open all links in external browser
    document.addEventListener('click', function (event) {
      if (event.target.tagName === 'A' && event.target.href.startsWith('http')) {
        event.preventDefault();
        shell.openExternal(event.target.href);
      }
    })
  })
}

const initMermaid = () => {
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
}

const getFileName = () => {
  if (remote.getGlobal('file') && remote.getGlobal('file').name) {
    const file = remote.getGlobal('file').name;
    remote.getGlobal('file').name = null;
    return file;
  } else {
    remote.getCurrentWindow().close();
  }
}

const watchFile = (file) => {
  const watcher = chokidar.watch(file, { ignored: /[\/\\]\./, persistent: true });

  watcher.on('change', (file) => {
    readFile(file);
  })
}

const file = getFileName();
initMermaid();
readFile(file);
watchFile(file);


const chokidar = require('chokidar');
const fs = require('fs')
const hljs = require('highlight.js')
const log = require('electron-log');
const marked = require('marked')
const mermaid = require('mermaid')
const remote = require('electron').remote

const readFile = (file) => {
  log.info('readFile',file);
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
  log.info('remote.getGlobal.file.name', remote.getGlobal('file').name);
  const file = remote.getGlobal('file').name || 'README.md';
  remote.getGlobal('file').name = null;
  return file;
}

const main = () => {
  const file = getFileName();
  initMermaid();
  readFile(file);

  const watcher = chokidar.watch(file, { ignored: /[\/\\]\./, persistent: true });

  watcher.on('change', (file) => {
    readFile(file);
  })
}

main();


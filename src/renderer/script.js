const chokidar = require('chokidar');
const dialog = require('electron').remote.dialog;
const electron = require('electron');
const emoji = require('node-emoji');
const fs = require('fs');
const hljs = require('highlight.js');
const log = require('electron-log');
const marked = require('marked');
const mermaid = require('mermaid');
const remote = require('electron').remote;
const settings = require('electron-settings');
const shell = require('electron').shell;

log.catchErrors({});

const readFile = (file) => {
  fs.readFile(file, (err, data) => {
    if (err) log.error('readFile', err);
    if (!data || data.length == 0) log.error('readFile', 'no data');
    // emojify
    const emojified = emoji.emojify(data.toString());
    // marked
    document.querySelector('.md').innerHTML = marked(emojified);
    // highlight.js - here is cleaner than marked function, to avoid mermaid
    Array.from(document.querySelectorAll('pre code:not(.lang-mermaid)')).forEach(
      block => hljs.highlightBlock(block)
    );
    // mermaid
    Array.from(document.querySelectorAll('.lang-mermaid')).forEach(
      block => mermaid.init(undefined, block)
    );
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

const getFileObj = () => {
  if (remote.getGlobal('file') && remote.getGlobal('file').name) {
    const file = JSON.parse(JSON.stringify(remote.getGlobal('file')));
    remote.getGlobal('file').name = null;
    remote.getGlobal('file').path = null;
    return file;
  } else {
    remote.getCurrentWindow().close();
  }
}

const watchFile = (file) => {
  const watcher = chokidar.watch(file, { ignored: /[\/\\]\./, persistent: true });

  watcher.on('change', (file) => {
    readFile(file);
  });
}

// edit current markdown file
electron.ipcRenderer.on('edit-file', () => {
  const editor = settings.get('editor');
  if(editor) {
    editFile(editor);
  } else {
    dialog.showOpenDialog(remote.getCurrentWindow(),
      { properties: [ 'openFile' ],
        message: 'Please select a markdown editor application'
      },
      (files) => {
        if (files === undefined) return;
        const executablePath = files[0];
        settings.set('editor',executablePath);
        editFile(executablePath);
      });
  }
});

electron.ipcRenderer.on('select-editor', () => {
  dialog.showOpenDialog(remote.getCurrentWindow(),
    { properties: [ 'openFile' ],
      message: 'Please select a markdown editor application'
    },
    (files) => {
      if (files === undefined) return;
      settings.set('editor', files[0]);
    }
  );
});

const editFile = (editorPath) => {
  const child = require('child_process').execFile;
  child(editorPath, [file], (err, data) => {
    if (err) log.error(err);
  });
}

// open all links in external browser
document.addEventListener('click', (event) => {
  if (event.target.tagName === 'A' && event.target.href.startsWith('http')) {
    event.preventDefault();
    shell.openExternal(event.target.href);
  }
})

const initMarked = (path) => {
  marked.setOptions({
    baseUrl: path,
    breaks: true,
    gfm: true,
    pedantic: false,
    renderer: new marked.Renderer(),
    sanitize: false,
    smartLists: true,
    smartypants: false,
    tables: true,
    xhtml: false
  });
}

const fileObj = getFileObj();
const file = fileObj.name;
initMarked(fileObj.path);
initMermaid();
readFile(file);
watchFile(file);


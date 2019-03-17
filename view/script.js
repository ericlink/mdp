//require('electron-cookies')
const fs = require('fs')
const marked = require('marked')
const hljs = require('highlight.js')
const mermaid = require('mermaid')
const remote = require('electron').remote
const chokidar = require('chokidar');


var mermaidConfig = {
    startOnLoad:false,
    theme: 'neutral',
    sequenceDiagram:{
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
    const out = document.querySelector('.md').innerHTML;
	fs.writeFile('/tmp/output.html', out, function(){});
}

// 2nd arg for dev, first arg for normal, README.md as default
const argv = remote.getGlobal('sharedObject').argv;
const path = argv[1] === 'main.js' ? argv[2] : argv[1];
const file = path || 'README.md';
readFile(file);

const watcher = chokidar.watch(path, { ignored: /[\/\\]\./, persistent: true });

watcher.on('change', function(path) {
	console.log('File', path, 'has been changed');
	readFile(path);
})


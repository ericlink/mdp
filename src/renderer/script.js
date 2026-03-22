const { ipcRenderer, shell } = require('electron');
const fs = require('fs');

const rendererTraceEnabled = process.env.MDP_TRACE_RENDER === '1';
const rendererTracePath = '/tmp/mdp-renderer-debug.log';

const summarizeDomTarget = (target) => {
  if (!target || !target.tagName) {
    return target;
  }

  const summary = { tagName: target.tagName };

  if (target.id) {
    summary.id = target.id;
  }

  if (target.className && typeof target.className === 'string') {
    summary.className = target.className;
  }

  if (target.src) {
    summary.src = target.src;
  }

  if (target.href) {
    summary.href = target.href;
  }

  return summary;
};

const sanitizeConsoleArg = (value) => {
  if (value instanceof Error) {
    return value.stack || `${value.name}: ${value.message}`;
  }

  if (typeof DOMException !== 'undefined' && value instanceof DOMException) {
    return `${value.name}: ${value.message}`;
  }

  if (typeof Event !== 'undefined' && value instanceof Event) {
    return {
      type: value.type,
      target: summarizeDomTarget(value.target)
    };
  }

  if (typeof Node !== 'undefined' && value instanceof Node) {
    return summarizeDomTarget(value);
  }

  if (typeof value === 'function') {
    return value.toString();
  }

  if (typeof value === 'object' && value !== null) {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch (error) {
      return Object.prototype.toString.call(value);
    }
  }

  return value;
};

['log', 'info', 'warn', 'error', 'debug'].forEach((method) => {
  const original = console[method].bind(console);

  console[method] = (...args) => {
    original(...args.map(sanitizeConsoleArg));
  };
});

const traceRenderer = (...args) => {
  if (!rendererTraceEnabled) {
    return;
  }

  const parts = args.map((value) => {
    if (value instanceof Error) {
      return value.stack || `${value.name}: ${value.message}`;
    }

    if (typeof value === 'object' && value !== null) {
      try {
        return JSON.stringify(value);
      } catch (error) {
        return Object.prototype.toString.call(value);
      }
    }

    return String(value);
  });

  fs.appendFileSync(rendererTracePath, `[renderer] ${parts.join(' ')}\n`);
};

const safeRequire = (moduleName, fallback) => {
  try {
    const loaded = require(moduleName);
    traceRenderer('require:ok', moduleName);
    return loaded;
  } catch (error) {
    traceRenderer('require:failed', moduleName, error);
    return fallback;
  }
};

const chokidar = safeRequire('chokidar', null);
const emoji = safeRequire('node-emoji', { emojify: (value) => value });
const hljs = safeRequire('highlight.js', null);
const marked = safeRequire('marked', null);
const mermaid = safeRequire('mermaid', null);

const logError = (...args) => {
  traceRenderer('logError', ...args);
  console.error(...args);
};

const formatErrorForLog = (value) => {
  if (!value) {
    return 'Unknown renderer error';
  }

  if (value instanceof Error) {
    return value.stack || `${value.name}: ${value.message}`;
  }

  if (typeof DOMException !== 'undefined' && value instanceof DOMException) {
    return `${value.name}: ${value.message}`;
  }

  if (typeof value === 'object') {
    const summary = {};
    ['name', 'message', 'type', 'filename', 'lineno', 'colno'].forEach((key) => {
      if (value[key] !== undefined && value[key] !== null) {
        summary[key] = value[key];
      }
    });

    const target = value.target;
    if (target && target.tagName) {
      summary.target = target.tagName;
      if (target.src) {
        summary.src = target.src;
      }
      if (target.href) {
        summary.href = target.href;
      }
    }

    try {
      return JSON.stringify(summary);
    } catch (err) {
      return Object.prototype.toString.call(value);
    }
  }

  return String(value);
};

window.addEventListener('error', (event) => {
  event.preventDefault();
  const details = event.error || {
    type: event.type,
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    target: event.target
  };
  traceRenderer('window.error', formatErrorForLog(details));
  logError(formatErrorForLog(details));
});

window.addEventListener('unhandledrejection', (event) => {
  event.preventDefault();
  traceRenderer('window.unhandledrejection', formatErrorForLog(event.reason));
  logError(formatErrorForLog(event.reason));
});

const editorStorageKey = 'editor';
let currentFile = null;

const renderPlainText = (content) => {
  const container = document.querySelector('.md');

  if (!container) {
    logError('missing .md container');
    return;
  }

  const pre = document.createElement('pre');
  pre.textContent = content;
  pre.style.whiteSpace = 'pre-wrap';
  pre.style.wordBreak = 'break-word';
  container.replaceChildren(pre);
};

const readFile = (file) => {
  traceRenderer('readFile:start', file);
  fs.readFile(file, (err, data) => {
    if (err) {
      logError('readFile', err);
      return;
    }
    if (!data || data.length == 0) return;
    traceRenderer('readFile:loaded', { bytes: data.length });

    if (!marked) {
      traceRenderer('readFile:plain-text-fallback');
      renderPlainText(data.toString());
      return;
    }

    // emojify
    const emojified = emoji.emojify(data.toString());
    // marked
    try {
      traceRenderer('readFile:marked:start');
      document.querySelector('.md').innerHTML = marked(emojified);
      traceRenderer('readFile:marked:done');
    } catch (error) {
      logError('marked render failed', error);
      renderPlainText(data.toString());
      return;
    }
    // highlight.js - here is cleaner than marked function, to avoid mermaid
    if (hljs) {
      traceRenderer('readFile:highlight:start');
      Array.from(document.querySelectorAll('pre code:not(.language-mermaid)')).forEach(
        block => hljs.highlightBlock(block)
      );
      traceRenderer('readFile:highlight:done');
    }
    // mermaid
    if (mermaid) {
      traceRenderer('readFile:mermaid:start');
      Array.from(document.querySelectorAll('pre code.language-mermaid')).forEach(
        block => mermaid.init(undefined, block)
      );
      traceRenderer('readFile:mermaid:done');
    }
  });
};

const initMermaid = () => {
  if (!mermaid) {
    traceRenderer('initMermaid:skipped');
    return;
  }

  traceRenderer('initMermaid:start');
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
  traceRenderer('initMermaid:done');
};

const getFileObj = async () => {
  traceRenderer('getFileObj:start', window.location.search);
  const params = new URLSearchParams(window.location.search);
  const name = params.get('name');
  const basePath = params.get('path');

  if (name && basePath) {
    traceRenderer('getFileObj:resolved', { name, path: basePath });
    return { name, path: basePath };
  }

  traceRenderer('getFileObj:fallback-ipc');
  const fileState = await ipcRenderer.invoke('consume-file');

  if (fileState && fileState.name && fileState.path) {
    traceRenderer('getFileObj:resolved-ipc', fileState);
    return fileState;
  }

  traceRenderer('getFileObj:missing');
  window.close();
  return null;
};

const watchFile = (file) => {
  if (!chokidar) {
    traceRenderer('watchFile:skipped');
    return;
  }

  traceRenderer('watchFile:start', file);
  const watcher = chokidar.watch(file, { ignored: /[\/\\]\./, persistent: true });

  watcher.on('change', (file) => {
    traceRenderer('watchFile:change', file);
    readFile(file);
  });
};

// edit current markdown file
ipcRenderer.on('edit-file', async () => {
  const editor = window.localStorage.getItem(editorStorageKey);

  if (editor) {
    editFile(editor);
  } else {
    const files = await selectEditor();
    if (files.length > 0) {
      editFile(files[0]);
    }
  }
});

ipcRenderer.on('select-editor', async () => {
  await selectEditor();
});

const selectEditor = async () => {
  traceRenderer('selectEditor:invoke');
  const files = await ipcRenderer.invoke('select-editor');

  if (files.length > 0) {
    window.localStorage.setItem(editorStorageKey, files[0]);
  }

  return files;
};

const editFile = (editorPath) => {
  const child = require('child_process').execFile;

  child(editorPath, [currentFile], (err) => {
    if (err) logError(err);
  });
};

// open all links in external browser
document.addEventListener('click', (event) => {
  if (event.target.tagName === 'A' && event.target.href.startsWith('http')) {
    event.preventDefault();
    shell.openExternal(event.target.href);
  }
});

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
};

const init = async () => {
  traceRenderer('init:start');
  const fileObj = await getFileObj();

  if (!fileObj) {
    traceRenderer('init:no-file');
    return;
  }

  currentFile = fileObj.name;
  traceRenderer('init:currentFile', currentFile);
  initMarked(fileObj.path);
  initMermaid();
  readFile(currentFile);
  watchFile(currentFile);
  traceRenderer('init:done');
};

init().catch((error) => {
  logError(formatErrorForLog(error));
});

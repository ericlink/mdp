const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const hljs = require('highlight.js');
const emoji = require('node-emoji');
const path = require('path');
const { fileURLToPath, pathToFileURL } = require('url');

const appRoot = path.resolve(__dirname, '..');

const inferAssetType = (relativePath, fallbackType) => {
  if (relativePath.endsWith('.css')) {
    return 'style';
  }

  if (relativePath.endsWith('.mjs')) {
    return 'module';
  }

  return fallbackType;
};

const pickAsset = (candidates, fallbackType) => {
  for (const relativePath of candidates) {
    const absolutePath = path.join(appRoot, relativePath);
    if (fs.existsSync(absolutePath)) {
      return {
        type: inferAssetType(relativePath, fallbackType),
        url: pathToFileURL(absolutePath).toString()
      };
    }
  }

  return null;
};

const rendererAssets = {
  marked: pickAsset([
    'node_modules/marked/lib/marked.umd.min.js',
    'node_modules/marked/lib/marked.umd.js',
    'node_modules/marked/marked.min.js',
    'node_modules/marked/lib/marked.esm.js',
    'node_modules/marked/lib/marked.js'
  ], 'script'),
  mermaid: pickAsset([
    'node_modules/mermaid/dist/mermaid.esm.min.mjs',
    'node_modules/mermaid/dist/mermaid.esm.mjs',
    'node_modules/mermaid/dist/mermaid.min.js',
    'node_modules/mermaid/dist/mermaid.js',
    'node_modules/mermaid/dist/mermaid.core.mjs'
  ], 'script')
};

const subscribe = (channel, callback) => {
  const listener = (_event, payload) => {
    callback(payload);
  };

  ipcRenderer.on(channel, listener);

  return () => {
    ipcRenderer.removeListener(channel, listener);
  };
};

contextBridge.exposeInMainWorld('mdp', {
  assets: rendererAssets,
  consumeFile: () => ipcRenderer.invoke('mdp:consume-file'),
  emojify: (value) => emoji.emojify(value),
  fromFileUrl: (value) => fileURLToPath(value),
  highlightCode: (code, language) => {
    try {
      if (language && hljs.getLanguage(language)) {
        const result = hljs.highlight(code, {
          language,
          ignoreIllegals: true
        });

        return {
          html: result.value,
          language: result.language || language
        };
      }

      const result = hljs.highlightAuto(code);
      return {
        html: result.value,
        language: result.language || null
      };
    } catch (error) {
      return null;
    }
  },
  openExternal: (url) => ipcRenderer.invoke('mdp:open-external', url),
  openPath: (value) => ipcRenderer.invoke('mdp:open-path', value),
  exportHtml: (payload) => ipcRenderer.invoke('mdp:export-html', payload),
  readFile: (filePath) => ipcRenderer.invoke('mdp:read-file', filePath),
  watchFile: (filePath) => ipcRenderer.invoke('mdp:watch-file', filePath),
  unwatchFile: () => ipcRenderer.invoke('mdp:unwatch-file'),
  selectEditor: () => ipcRenderer.invoke('mdp:select-editor'),
  getEditorPath: () => ipcRenderer.invoke('mdp:get-editor-path'),
  setEditorPath: (editorPath) => ipcRenderer.invoke('mdp:set-editor-path', editorPath),
  getDisplaySettings: () => ipcRenderer.invoke('mdp:get-display-settings'),
  getSystemFonts: () => ipcRenderer.invoke('mdp:get-system-fonts'),
  setDisplaySettings: (displaySettings) => ipcRenderer.invoke('mdp:set-display-settings', displaySettings),
  toFileUrl: (filePath) => pathToFileURL(path.resolve(filePath)).toString(),
  launchEditor: (editorPath, filePath) => ipcRenderer.invoke('mdp:launch-editor', {
    editorPath,
    filePath
  }),
  onFileChanged: (callback) => subscribe('mdp:file-changed', callback),
  onMenuAction: (callback) => subscribe('mdp:menu-action', callback)
});

const appApi = window.mdp;

if (!appApi) {
  throw new Error('Preload bridge is unavailable. Check BrowserWindow preload setup.');
}

const markdownContainer = document.querySelector('.md');
const markdownFilePattern = /\.(md|markdown|mdown|mkdn|mkd|mdtxt)$/i;
const assetLoaders = new Map();
const state = {
  currentFile: null,
  currentFileUrl: null,
  markedApi: null,
  mermaidApi: null,
  markedConfigured: false,
  mermaidConfigured: false,
  renderToken: 0
};

const createStateCard = (title, message, details) => {
  const wrapper = document.createElement('section');
  wrapper.className = 'state-card';

  const heading = document.createElement('h1');
  heading.textContent = title;
  wrapper.appendChild(heading);

  if (message) {
    const paragraph = document.createElement('p');
    paragraph.textContent = message;
    wrapper.appendChild(paragraph);
  }

  if (details) {
    const pre = document.createElement('pre');
    pre.textContent = details;
    wrapper.appendChild(pre);
  }

  return wrapper;
};

const showStateCard = (title, message, details) => {
  markdownContainer.replaceChildren(createStateCard(title, message, details));
};

const getFilePathFromLocation = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get('file');
};

const getBaseFileUrl = () => {
  return state.currentFileUrl || window.location.href;
};

const updateHistory = (filePath, mode) => {
  if (!mode) {
    return;
  }

  const currentLocationFile = getFilePathFromLocation();
  if (currentLocationFile === filePath && mode === 'push') {
    return;
  }

  const url = new URL(window.location.href);
  url.searchParams.set('file', filePath);
  window.history[mode === 'push' ? 'pushState' : 'replaceState']({ filePath }, '', url);
};

const getFileName = (filePath) => {
  const parts = filePath.split(/[\\/]/);
  return parts[parts.length - 1] || filePath;
};

const escapeHtml = (value) => {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};

const getCodeLanguage = (codeBlock) => {
  for (const className of codeBlock.classList) {
    if (className.startsWith('language-')) {
      return className.slice('language-'.length);
    }

    if (className.startsWith('lang-')) {
      return className.slice('lang-'.length);
    }
  }

  return null;
};

const isMarkdownFile = (filePath) => {
  return markdownFilePattern.test(filePath || '');
};

const isUnsafeUrl = (value) => {
  return /^javascript:/i.test(value) || /^vbscript:/i.test(value);
};

const resolveMarkdownHref = (value) => {
  if (!value || value.startsWith('#')) {
    return value;
  }

  try {
    return new URL(value, getBaseFileUrl()).toString();
  } catch (error) {
    return value;
  }
};

const sanitizeRenderedContent = (root) => {
  root.querySelectorAll('script, iframe, object, embed, link[rel="import"], meta[http-equiv="refresh"]').forEach((node) => {
    node.remove();
  });

  root.querySelectorAll('*').forEach((element) => {
    Array.from(element.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim();

      if (name.startsWith('on')) {
        element.removeAttribute(attribute.name);
        return;
      }

      if ((name === 'href' || name === 'src') && isUnsafeUrl(value)) {
        element.removeAttribute(attribute.name);
        return;
      }

      if (name === 'href' && /^data:/i.test(value)) {
        element.removeAttribute(attribute.name);
      }
    });
  });
};

const rewriteRelativeResources = (root) => {
  root.querySelectorAll('a[href]').forEach((link) => {
    const href = link.getAttribute('href');

    if (!href || href.startsWith('#') || isUnsafeUrl(href)) {
      return;
    }

    const resolvedHref = resolveMarkdownHref(href);
    link.setAttribute('href', resolvedHref);

    if (/^(https?:|mailto:)/i.test(resolvedHref)) {
      link.rel = 'noopener noreferrer';
    }
  });

  root.querySelectorAll('img[src], source[src]').forEach((element) => {
    const src = element.getAttribute('src');

    if (!src || isUnsafeUrl(src)) {
      return;
    }

    element.setAttribute('src', resolveMarkdownHref(src));
  });
};

const loadAsset = (asset) => {
  if (!asset) {
    return Promise.resolve(null);
  }

  if (assetLoaders.has(asset.url)) {
    return assetLoaders.get(asset.url);
  }

  let loader;

  if (asset.type === 'module') {
    loader = import(asset.url);
  } else if (asset.type === 'style') {
    loader = new Promise((resolve, reject) => {
      const existing = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
        .find((element) => element.dataset.mdpAssetUrl === asset.url);

      if (existing) {
        resolve(existing);
        return;
      }

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = asset.url;
      link.dataset.mdpAssetUrl = asset.url;
      link.onload = () => resolve(link);
      link.onerror = () => reject(new Error(`Failed to load ${asset.url}`));
      document.head.appendChild(link);
    });
  } else {
    loader = new Promise((resolve, reject) => {
      const existing = Array.from(document.querySelectorAll('script'))
        .find((element) => element.dataset.mdpAssetUrl === asset.url);

      if (existing) {
        resolve(existing);
        return;
      }

      const script = document.createElement('script');
      script.src = asset.url;
      script.dataset.mdpAssetUrl = asset.url;
      script.onload = () => resolve(script);
      script.onerror = () => reject(new Error(`Failed to load ${asset.url}`));
      document.head.appendChild(script);
    });
  }

  assetLoaders.set(asset.url, loader);
  return loader;
};

const resolveMarkedApi = async () => {
  if (state.markedApi) {
    return state.markedApi;
  }

  const asset = appApi.assets?.marked;
  if (!asset) {
    return null;
  }

  const loaded = await loadAsset(asset);
  const candidates = [
    loaded?.marked,
    loaded?.default,
    loaded,
    window.marked
  ];

  state.markedApi = candidates.find((candidate) => {
    return candidate && (typeof candidate === 'function' || typeof candidate.parse === 'function');
  }) || null;

  if (state.markedApi && !state.markedConfigured) {
    const options = {
      breaks: true,
      gfm: true
    };

    if (typeof state.markedApi.setOptions === 'function') {
      state.markedApi.setOptions(options);
    } else if (typeof state.markedApi.use === 'function') {
      state.markedApi.use(options);
    }

    state.markedConfigured = true;
  }

  return state.markedApi;
};

const resolveMermaidApi = async () => {
  if (state.mermaidApi) {
    return state.mermaidApi;
  }

  const asset = appApi.assets?.mermaid;
  if (!asset) {
    return null;
  }

  const loaded = await loadAsset(asset);
  const candidates = [
    loaded?.default,
    loaded?.mermaid,
    loaded,
    window.mermaid
  ];

  state.mermaidApi = candidates.find((candidate) => {
    return candidate && (typeof candidate.run === 'function' || typeof candidate.init === 'function');
  }) || null;

  if (state.mermaidApi && !state.mermaidConfigured && typeof state.mermaidApi.initialize === 'function') {
    state.mermaidApi.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      theme: 'neutral',
      flowchart: {
        useMaxWidth: false,
        htmlLabels: true
      },
      sequence: {
        useMaxWidth: false,
        htmlLabels: true
      }
    });
    state.mermaidConfigured = true;
  }

  return state.mermaidApi;
};

const highlightCodeBlocks = (root) => {
  root.querySelectorAll('pre > code').forEach((codeBlock) => {
    const language = getCodeLanguage(codeBlock);

    if (language === 'mermaid') {
      return;
    }

    const result = appApi.highlightCode(codeBlock.textContent || '', language);
    if (!result || !result.html) {
      return;
    }

    codeBlock.innerHTML = result.html;
    codeBlock.classList.add('hljs');

    if (result.language) {
      codeBlock.classList.add(`language-${result.language}`);
    }
  });
};

const renderMermaidBlocks = async (root) => {
  const mermaid = await resolveMermaidApi();
  if (!mermaid) {
    return;
  }

  const blocks = Array.from(root.querySelectorAll('pre > code.language-mermaid, pre > code.lang-mermaid'))
    .map((codeBlock) => {
      const source = codeBlock.textContent || '';
      const wrapper = document.createElement('div');
      wrapper.className = 'mermaid-block';

      const diagram = document.createElement('div');
      diagram.className = 'mermaid';
      diagram.textContent = source;

      wrapper.appendChild(diagram);
      codeBlock.closest('pre').replaceWith(wrapper);

      return {
        source,
        wrapper,
        diagram
      };
    });

  if (blocks.length === 0) {
    return;
  }

  try {
    const nodes = blocks.map((block) => block.diagram);

    if (typeof mermaid.run === 'function') {
      await mermaid.run({ nodes });
      return;
    }

    if (typeof mermaid.init === 'function') {
      mermaid.init(undefined, nodes);
    }
  } catch (error) {
    console.error(error);
    blocks.forEach((block) => {
      const pre = document.createElement('pre');
      const code = document.createElement('code');
      code.className = 'language-mermaid';
      code.textContent = block.source;
      pre.appendChild(code);
      block.wrapper.replaceWith(pre);
    });
  }
};

const parseMarkdown = async (content) => {
  const markedApi = await resolveMarkedApi();

  if (!markedApi) {
    return null;
  }

  if (typeof markedApi.parse === 'function') {
    return markedApi.parse(content);
  }

  if (typeof markedApi === 'function') {
    return markedApi(content);
  }

  return null;
};

const renderPlainText = (content) => {
  const pre = document.createElement('pre');
  pre.textContent = content;
  markdownContainer.replaceChildren(pre);
};

const buildStandaloneHtml = () => {
  const title = state.currentFile ? `${getFileName(state.currentFile)} · mdp` : 'mdp';
  const baseHref = state.currentFileUrl ? new URL('.', state.currentFileUrl).toString() : window.location.href;
  const styles = Array.from(document.styleSheets)
    .map((styleSheet) => {
      try {
        return Array.from(styleSheet.cssRules).map((rule) => rule.cssText).join('\n');
      } catch (error) {
        return '';
      }
    })
    .filter(Boolean)
    .join('\n\n');

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <base href="${escapeHtml(baseHref)}">
    <style>${styles}</style>
  </head>
  <body>
    <main class="container">
      <article class="md">${markdownContainer.innerHTML}</article>
    </main>
  </body>
</html>
`;
};

const renderFile = async (filePath, { historyMode = 'replace' } = {}) => {
  if (!filePath) {
    showStateCard('No file selected', 'Launch mdp with a markdown file to preview.');
    return;
  }

  const renderToken = ++state.renderToken;
  state.currentFile = filePath;
  state.currentFileUrl = appApi.toFileUrl(filePath);
  document.title = `${getFileName(filePath)} · mdp`;
  updateHistory(filePath, historyMode);

  let rawContent = '';

  try {
    rawContent = await appApi.readFile(filePath);
    if (renderToken !== state.renderToken) {
      return;
    }

    const emojified = appApi.emojify(rawContent);
    const renderedHtml = await parseMarkdown(emojified);

    if (renderToken !== state.renderToken) {
      return;
    }

    if (!renderedHtml) {
      renderPlainText(rawContent);
      return;
    }

    markdownContainer.innerHTML = renderedHtml;
    sanitizeRenderedContent(markdownContainer);
    rewriteRelativeResources(markdownContainer);
    highlightCodeBlocks(markdownContainer);
    await renderMermaidBlocks(markdownContainer);
  } catch (error) {
    console.error(error);
    showStateCard('Unable to render file', error.message || 'An unexpected error occurred.', rawContent || null);
  } finally {
    if (renderToken === state.renderToken) {
      try {
        await appApi.watchFile(filePath);
      } catch (error) {
        console.error(error);
      }
    }
  }
};

const selectEditorPath = async () => {
  const files = await appApi.selectEditor();

  if (files.length === 0) {
    return null;
  }

  return appApi.setEditorPath(files[0]);
};

const editCurrentFile = async () => {
  if (!state.currentFile) {
    return;
  }

  let editorPath = await appApi.getEditorPath();
  if (!editorPath) {
    editorPath = await selectEditorPath();
  }

  if (!editorPath) {
    return;
  }

  try {
    await appApi.launchEditor(editorPath, state.currentFile);
  } catch (error) {
    console.error(error);
    showStateCard('Unable to open editor', error.message || 'The configured editor could not be launched.');
  }
};

const viewCurrentFileAsHtml = async () => {
  if (!state.currentFile) {
    return;
  }

  try {
    await appApi.exportHtml({
      filePath: state.currentFile,
      html: buildStandaloneHtml()
    });
  } catch (error) {
    console.error(error);
    showStateCard('Unable to open HTML preview', error.message || 'The rendered document could not be exported.');
  }
};

const handleLinkClick = async (event) => {
  const link = event.target.closest('a[href]');
  if (!link) {
    return;
  }

  const href = link.getAttribute('href');
  if (!href || href.startsWith('#')) {
    return;
  }

  let resolvedUrl;

  try {
    resolvedUrl = new URL(href, getBaseFileUrl());
  } catch (error) {
    return;
  }

  if (['http:', 'https:', 'mailto:'].includes(resolvedUrl.protocol)) {
    event.preventDefault();
    await appApi.openExternal(resolvedUrl.toString());
    return;
  }

  if (resolvedUrl.protocol !== 'file:') {
    return;
  }

  const nextFilePath = appApi.fromFileUrl(resolvedUrl.toString());

  if (isMarkdownFile(nextFilePath)) {
    event.preventDefault();
    await renderFile(nextFilePath, { historyMode: 'push' });
    window.scrollTo({ top: 0, left: 0 });
    return;
  }

  event.preventDefault();
  await appApi.openPath(resolvedUrl.toString());
};

const initMenuActions = () => {
  appApi.onMenuAction(async ({ action }) => {
    if (action === 'edit-file') {
      await editCurrentFile();
      return;
    }

    if (action === 'select-editor') {
      await selectEditorPath();
      return;
    }

    if (action === 'view-as-html') {
      await viewCurrentFileAsHtml();
    }
  });
};

const initFileWatching = () => {
  appApi.onFileChanged(async ({ filePath }) => {
    if (filePath !== state.currentFile) {
      return;
    }

    await renderFile(filePath, { historyMode: null });
  });
};

const resolveInitialFilePath = async () => {
  const locationFile = getFilePathFromLocation();
  if (locationFile) {
    return locationFile;
  }

  const fileState = await appApi.consumeFile();
  return fileState?.filePath || fileState?.name || null;
};

const initHistory = () => {
  window.addEventListener('popstate', async (event) => {
    const nextFilePath = event.state?.filePath || getFilePathFromLocation();
    if (!nextFilePath || nextFilePath === state.currentFile) {
      return;
    }

    await renderFile(nextFilePath, { historyMode: null });
  });
};

const init = async () => {
  document.addEventListener('click', (event) => {
    void handleLinkClick(event);
  });

  window.addEventListener('beforeunload', () => {
    void appApi.unwatchFile();
  });

  initMenuActions();
  initFileWatching();
  initHistory();

  const filePath = await resolveInitialFilePath();
  await renderFile(filePath, { historyMode: 'replace' });
};

init().catch((error) => {
  console.error(error);
  showStateCard('Renderer failed to start', error.message || 'An unexpected startup error occurred.');
});

const appApi = window.mdp;

if (!appApi) {
  throw new Error('Preload bridge is unavailable. Check BrowserWindow preload setup.');
}

const markdownContainer = document.querySelector('.md');
const readerSettingsShell = document.querySelector('.reader-settings-shell');
const readerSettingsDialog = document.querySelector('.reader-settings-dialog');
const readerSettingsForm = document.querySelector('.reader-settings-form');
const themeSelect = document.querySelector('#theme-select');
const themePresetGrid = document.querySelector('#theme-preset-grid');
const fontTypeRadios = Array.from(document.querySelectorAll('input[name="fontType"]'));
const fontSelect = document.querySelector('#font-select');
const backgroundColorInput = document.querySelector('#background-color-input');
const foregroundColorInput = document.querySelector('#foreground-color-input');
const resetDisplaySettingsButton = document.querySelector('#reset-display-settings');
const saveDisplaySettingsButton = document.querySelector('#save-display-settings');
const contrastSummary = document.querySelector('#contrast-summary');
const previewSwatch = document.querySelector('.preview-swatch');
const previewLabel = document.querySelector('.preview-label');
const previewTitle = document.querySelector('.preview-title');
const previewBody = document.querySelector('.preview-body');
const markdownFilePattern = /\.(md|markdown|mdown|mkdn|mkd|mdtxt)$/i;
const assetLoaders = new Map();
const DISPLAY_THEME_PRESETS = [
  {
    value: 'alabaster',
    label: 'Alabaster',
    description: 'Neutral ivory with cool blue links.',
    mermaidTheme: 'default',
    backgroundColor: '#f8f4ed',
    foregroundColor: '#181410',
    accentColor: '#2d628d'
  },
  {
    value: 'linen',
    label: 'Linen',
    description: 'Warm editorial paper with russet accents.',
    mermaidTheme: 'default',
    backgroundColor: '#f0e3d0',
    foregroundColor: '#23170f',
    accentColor: '#8e4d31'
  },
  {
    value: 'sage',
    label: 'Sage',
    description: 'Soft eucalyptus tones for daytime reading.',
    mermaidTheme: 'default',
    backgroundColor: '#e4ede6',
    foregroundColor: '#18211b',
    accentColor: '#2f6f5b'
  },
  {
    value: 'dusk',
    label: 'Dusk',
    description: 'Slate blue dark mode with crisp contrast.',
    mermaidTheme: 'dark',
    backgroundColor: '#1a2330',
    foregroundColor: '#e7edf5',
    accentColor: '#8dc6ff'
  },
  {
    value: 'obsidian',
    label: 'Obsidian',
    description: 'Near-black canvas with amber navigation.',
    mermaidTheme: 'dark',
    backgroundColor: '#090807',
    foregroundColor: '#f3ede3',
    accentColor: '#e0b66d'
  }
];
const DISPLAY_FONTS = [
  {
    value: 'sans',
    label: 'Modern Sans',
    readerFont: '"Avenir Next", "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif'
  },
  {
    value: 'serif',
    label: 'Book Serif',
    readerFont: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif'
  },
  {
    value: 'humanist',
    label: 'Humanist Sans',
    readerFont: '"Optima", "Segoe UI", Candara, "Trebuchet MS", sans-serif'
  },
  {
    value: 'mono',
    label: 'Technical Mono',
    readerFont: '"SFMono-Regular", "JetBrains Mono", "Cascadia Code", "Source Code Pro", Consolas, monospace'
  }
];
const DEFAULT_DISPLAY_SETTINGS = {
  theme: 'linen',
  fontType: 'preset',
  fontValue: 'sans',
  backgroundColor: '#f0e3d0',
  foregroundColor: '#23170f'
};
const state = {
  currentFile: null,
  currentFileUrl: null,
  currentRawContent: '',
  displaySettings: { ...DEFAULT_DISPLAY_SETTINGS },
  dialogDraftDisplaySettings: { ...DEFAULT_DISPLAY_SETTINGS },
  systemFonts: [],
  systemFontsPromise: null,
  appliedDocumentStyleProperties: {},
  markedApi: null,
  mermaidApi: null,
  markedConfigured: false,
  mermaidConfigKey: null,
  renderToken: 0,
  settingsReturnFocusTarget: null
};

const displayFontMap = new Map(DISPLAY_FONTS.map((font) => [font.value, font]));
const displayThemeMap = new Map(DISPLAY_THEME_PRESETS.map((theme) => [theme.value, theme]));
const customThemeVariableNames = [
  'color-scheme',
  '--bg',
  '--bg-accent',
  '--panel',
  '--panel-strong',
  '--border',
  '--text',
  '--muted',
  '--link',
  '--link-hover',
  '--inline-code',
  '--inline-code-bg',
  '--quote-bg',
  '--quote-border',
  '--table-header-bg',
  '--pre-bg',
  '--pre-border',
  '--kbd-bg',
  '--kbd-text',
  '--kbd-border',
  '--mermaid-bg',
  '--shadow',
  '--focus-ring'
];

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

const normalizeHexColor = (value, fallback) => {
  if (typeof value !== 'string') {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  return /^#[0-9a-f]{6}$/i.test(normalized) ? normalized : fallback;
};

const normalizeFontValue = (fontType, fontValue) => {
  if (typeof fontValue !== 'string') {
    return DEFAULT_DISPLAY_SETTINGS.fontValue;
  }

  const normalized = fontValue.trim();
  if (!normalized) {
    return DEFAULT_DISPLAY_SETTINGS.fontValue;
  }

  if (fontType === 'preset') {
    return displayFontMap.has(normalized) ? normalized : DEFAULT_DISPLAY_SETTINGS.fontValue;
  }

  return normalized.slice(0, 160);
};

const normalizeDisplaySettings = (displaySettings = {}) => {
  const theme = displayThemeMap.has(displaySettings.theme) || displaySettings.theme === 'custom'
    ? displaySettings.theme
    : DEFAULT_DISPLAY_SETTINGS.theme;
  const presetTheme = displayThemeMap.get(theme) || displayThemeMap.get(DEFAULT_DISPLAY_SETTINGS.theme);
  const fontType = displaySettings.fontType === 'custom'
    ? 'system'
    : ['preset', 'system'].includes(displaySettings.fontType)
      ? displaySettings.fontType
      : DEFAULT_DISPLAY_SETTINGS.fontType;
  const fontValue = normalizeFontValue(fontType, displaySettings.fontValue);

  return {
    theme,
    fontType,
    fontValue,
    backgroundColor: theme === 'custom'
      ? normalizeHexColor(displaySettings.backgroundColor, DEFAULT_DISPLAY_SETTINGS.backgroundColor)
      : presetTheme.backgroundColor,
    foregroundColor: theme === 'custom'
      ? normalizeHexColor(displaySettings.foregroundColor, DEFAULT_DISPLAY_SETTINGS.foregroundColor)
      : presetTheme.foregroundColor
  };
};

const hexToRgb = (hexColor) => {
  const normalized = normalizeHexColor(hexColor, '#000000').slice(1);
  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16)
  ];
};

const rgbToHex = (rgb) => {
  return `#${rgb.map((value) => value.toString(16).padStart(2, '0')).join('')}`;
};

const mixHexColors = (leftHex, rightHex, rightWeight) => {
  const leftRgb = hexToRgb(leftHex);
  const rightRgb = hexToRgb(rightHex);

  return rgbToHex(leftRgb.map((channel, index) => {
    return Math.round((channel * (1 - rightWeight)) + (rightRgb[index] * rightWeight));
  }));
};

const toRgba = (hexColor, alpha) => {
  const [red, green, blue] = hexToRgb(hexColor);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

const getRelativeLuminance = (hexColor) => {
  const transformChannel = (value) => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  };

  const [red, green, blue] = hexToRgb(hexColor).map(transformChannel);
  return (0.2126 * red) + (0.7152 * green) + (0.0722 * blue);
};

const getContrastRatio = (leftHex, rightHex) => {
  const leftLuminance = getRelativeLuminance(leftHex);
  const rightLuminance = getRelativeLuminance(rightHex);
  const lighter = Math.max(leftLuminance, rightLuminance);
  const darker = Math.min(leftLuminance, rightLuminance);

  return (lighter + 0.05) / (darker + 0.05);
};

const isDarkColor = (hexColor) => {
  return getRelativeLuminance(hexColor) < 0.35;
};

const escapeCssString = (value) => {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
};

const buildSystemFontStack = (fontFamily) => {
  return `"${escapeCssString(fontFamily)}", sans-serif`;
};

const getReaderFontFamily = (displaySettings) => {
  if (displaySettings.fontType === 'preset') {
    return (displayFontMap.get(displaySettings.fontValue) || displayFontMap.get(DEFAULT_DISPLAY_SETTINGS.fontValue)).readerFont;
  }

  if (displaySettings.fontType === 'system') {
    return buildSystemFontStack(displaySettings.fontValue);
  }

  return displaySettings.fontValue;
};

const buildCustomThemeVariables = (displaySettings) => {
  const backgroundColor = displaySettings.backgroundColor;
  const foregroundColor = displaySettings.foregroundColor;
  const darkSurface = isDarkColor(backgroundColor);
  const accentBase = darkSurface ? '#8fd3ff' : '#005ea2';
  const warningBase = darkSurface ? '#fef08a' : '#8f1d2c';
  const linkColor = mixHexColors(foregroundColor, accentBase, 0.72);
  const preBackground = mixHexColors(backgroundColor, foregroundColor, darkSurface ? 0.1 : 0.04);

  return {
    'color-scheme': darkSurface ? 'dark' : 'light',
    '--bg': mixHexColors(backgroundColor, foregroundColor, darkSurface ? 0.12 : 0.02),
    '--bg-accent': toRgba(foregroundColor, darkSurface ? 0.16 : 0.1),
    '--panel': toRgba(backgroundColor, 0.92),
    '--panel-strong': mixHexColors(backgroundColor, foregroundColor, darkSurface ? 0.05 : 0.03),
    '--border': toRgba(foregroundColor, darkSurface ? 0.18 : 0.2),
    '--text': foregroundColor,
    '--muted': mixHexColors(foregroundColor, backgroundColor, 0.35),
    '--link': linkColor,
    '--link-hover': mixHexColors(linkColor, darkSurface ? '#ffffff' : '#000000', darkSurface ? 0.18 : 0.12),
    '--inline-code': mixHexColors(foregroundColor, warningBase, 0.55),
    '--inline-code-bg': toRgba(foregroundColor, 0.1),
    '--quote-bg': toRgba(foregroundColor, darkSurface ? 0.08 : 0.09),
    '--quote-border': toRgba(foregroundColor, 0.5),
    '--table-header-bg': toRgba(foregroundColor, 0.08),
    '--pre-bg': preBackground,
    '--pre-border': toRgba(foregroundColor, 0.14),
    '--kbd-bg': toRgba(foregroundColor, 0.08),
    '--kbd-text': foregroundColor,
    '--kbd-border': toRgba(foregroundColor, 0.15),
    '--mermaid-bg': toRgba(foregroundColor, 0.04),
    '--shadow': darkSurface
      ? '0 24px 64px rgba(0, 0, 0, 0.32)'
      : '0 20px 48px rgba(30, 30, 30, 0.12)',
    '--focus-ring': toRgba(foregroundColor, 0.28)
  };
};

const getMermaidTheme = (displaySettings) => {
  if (displaySettings.theme === 'custom') {
    return isDarkColor(displaySettings.backgroundColor) ? 'dark' : 'default';
  }

  return (displayThemeMap.get(displaySettings.theme) || displayThemeMap.get(DEFAULT_DISPLAY_SETTINGS.theme)).mermaidTheme;
};

const serializeInlineStyleProperties = (properties) => {
  return Object.entries(properties)
    .map(([name, value]) => `${name}: ${value}`)
    .join('; ');
};

const getPreviewPalette = (displaySettings) => {
  const nextSettings = normalizeDisplaySettings(displaySettings);
  const fontFamily = getReaderFontFamily(nextSettings);

  if (nextSettings.theme === 'custom') {
    const customTheme = buildCustomThemeVariables(nextSettings);

    return {
      backgroundColor: nextSettings.backgroundColor,
      borderColor: customTheme['--border'],
      foregroundColor: customTheme['--text'],
      mutedColor: customTheme['--muted'],
      accentColor: customTheme['--link'],
      fontFamily
    };
  }

  const presetTheme = displayThemeMap.get(nextSettings.theme) || displayThemeMap.get(DEFAULT_DISPLAY_SETTINGS.theme);
  const darkSurface = isDarkColor(presetTheme.backgroundColor);

  return {
    backgroundColor: presetTheme.backgroundColor,
    borderColor: toRgba(presetTheme.foregroundColor, darkSurface ? 0.2 : 0.16),
    foregroundColor: presetTheme.foregroundColor,
    mutedColor: mixHexColors(presetTheme.foregroundColor, presetTheme.backgroundColor, 0.35),
    accentColor: presetTheme.accentColor,
    fontFamily
  };
};

const applyPreviewTheme = (displaySettings) => {
  if (!previewSwatch) {
    return;
  }

  const palette = getPreviewPalette(displaySettings);

  previewSwatch.style.background = palette.backgroundColor;
  previewSwatch.style.color = palette.foregroundColor;
  previewSwatch.style.borderColor = palette.borderColor;
  previewSwatch.style.fontFamily = palette.fontFamily;

  if (previewLabel) {
    previewLabel.style.color = palette.accentColor;
  }

  if (previewTitle) {
    previewTitle.style.color = palette.foregroundColor;
  }

  if (previewBody) {
    previewBody.style.color = palette.foregroundColor;
  }

  contrastSummary.style.color = palette.mutedColor;
};

const applyDisplaySettings = (displaySettings) => {
  const nextSettings = normalizeDisplaySettings(displaySettings);
  const htmlElement = document.documentElement;
  const fontFamily = getReaderFontFamily(nextSettings);
  const inlineStyleProperties = {
    '--reader-font': fontFamily
  };

  state.displaySettings = nextSettings;
  htmlElement.dataset.theme = nextSettings.theme;
  htmlElement.dataset.font = nextSettings.fontType === 'preset' ? nextSettings.fontValue : 'custom';
  htmlElement.style.setProperty('--reader-font', fontFamily);

  if (nextSettings.theme === 'custom') {
    Object.assign(inlineStyleProperties, buildCustomThemeVariables(nextSettings));
  }

  customThemeVariableNames.forEach((propertyName) => {
    if (Object.prototype.hasOwnProperty.call(inlineStyleProperties, propertyName)) {
      htmlElement.style.setProperty(propertyName, inlineStyleProperties[propertyName]);
      return;
    }

    htmlElement.style.removeProperty(propertyName);
  });

  state.appliedDocumentStyleProperties = inlineStyleProperties;
  return nextSettings;
};

const getMermaidConfig = () => {
  return {
    startOnLoad: false,
    securityLevel: 'strict',
    theme: getMermaidTheme(state.displaySettings),
    fontFamily: getReaderFontFamily(state.displaySettings),
    flowchart: {
      useMaxWidth: false,
      htmlLabels: true
    },
    sequence: {
      useMaxWidth: false,
      htmlLabels: true
    }
  };
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

  if (state.mermaidApi && typeof state.mermaidApi.initialize === 'function') {
    const config = getMermaidConfig();
    const configKey = JSON.stringify(config);

    if (configKey !== state.mermaidConfigKey) {
      state.mermaidApi.initialize(config);
      state.mermaidConfigKey = configKey;
    }
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

const renderDocumentContent = async (rawContent, renderToken) => {
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
};

const populatePresetFontOptions = () => {
  fontSelect.replaceChildren();
  fontSelect.disabled = false;

  DISPLAY_FONTS.forEach((font) => {
    const option = document.createElement('option');
    option.value = font.value;
    option.textContent = font.label;
    fontSelect.appendChild(option);
  });
};

const populateSystemFontOptions = (systemFonts) => {
  fontSelect.replaceChildren();

  if (!systemFonts || systemFonts.length === 0) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'No system fonts found';
    fontSelect.appendChild(option);
    fontSelect.disabled = true;
    return;
  }

  fontSelect.disabled = false;

  systemFonts.forEach((fontFamily) => {
    const option = document.createElement('option');
    option.value = fontFamily;
    option.textContent = fontFamily;
    fontSelect.appendChild(option);
  });
};

const ensureSystemFontsLoaded = async () => {
  if (!state.systemFontsPromise) {
    state.systemFontsPromise = appApi.getSystemFonts()
      .then((systemFonts) => {
        state.systemFonts = Array.isArray(systemFonts) ? systemFonts : [];
        populateSystemFontOptions(state.systemFonts);
        return state.systemFonts;
      })
      .catch((error) => {
        console.error(error);
        state.systemFonts = [];
        populateSystemFontOptions([]);
        return [];
      });
  }

  return state.systemFontsPromise;
};

const getSelectedFontType = () => {
  return fontTypeRadios.find((radio) => radio.checked)?.value || DEFAULT_DISPLAY_SETTINGS.fontType;
};

const syncFontSelectOptions = async (fontType, selectedValue) => {
  if (fontType === 'system') {
    await ensureSystemFontsLoaded();
    populateSystemFontOptions(state.systemFonts);

    if (selectedValue && !Array.from(fontSelect.options).some((option) => option.value === selectedValue)) {
      const option = document.createElement('option');
      option.value = selectedValue;
      option.textContent = selectedValue;
      fontSelect.appendChild(option);
    }

    fontSelect.value = selectedValue || fontSelect.options[0]?.value || '';
    return;
  }

  populatePresetFontOptions();
  fontSelect.value = displayFontMap.has(selectedValue) ? selectedValue : DEFAULT_DISPLAY_SETTINGS.fontValue;
};

const getDialogDisplaySettings = () => {
  const theme = themeSelect.value;
  const fontType = getSelectedFontType();
  const fontValue = fontSelect.value;

  return normalizeDisplaySettings({
    theme,
    fontType,
    fontValue,
    backgroundColor: backgroundColorInput.value,
    foregroundColor: foregroundColorInput.value
  });
};

const updateDialogPreview = () => {
  const draftSettings = getDialogDisplaySettings();
  const contrastRatio = getContrastRatio(draftSettings.backgroundColor, draftSettings.foregroundColor);

  applyPreviewTheme(draftSettings);

  contrastSummary.textContent = `Contrast ${contrastRatio.toFixed(2)}:1${contrastRatio >= 4.5 ? ' meets WCAG AA for body text.' : ' is below WCAG AA for body text.'}`;
  contrastSummary.dataset.contrastState = contrastRatio >= 4.5 ? 'pass' : 'warn';
  if (contrastRatio < 4.5) {
    contrastSummary.style.color = '#ffb4a2';
  }

  state.dialogDraftDisplaySettings = draftSettings;
  updateThemePresetSelection(draftSettings.theme);
};

const buildThemeCardStyleProperties = (theme) => {
  const darkSurface = isDarkColor(theme.backgroundColor);

  return {
    '--theme-card-bg': theme.backgroundColor,
    '--theme-card-panel': mixHexColors(theme.backgroundColor, theme.foregroundColor, darkSurface ? 0.14 : 0.04),
    '--theme-card-text': theme.foregroundColor,
    '--theme-card-muted': mixHexColors(theme.foregroundColor, theme.backgroundColor, 0.34),
    '--theme-card-accent': theme.accentColor,
    '--theme-card-border': toRgba(theme.foregroundColor, darkSurface ? 0.18 : 0.14),
    '--theme-card-shadow': darkSurface
      ? '0 18px 36px rgba(0, 0, 0, 0.28)'
      : '0 14px 28px rgba(37, 31, 24, 0.12)'
  };
};

const populateThemeOptions = () => {
  themeSelect.replaceChildren();

  DISPLAY_THEME_PRESETS.forEach((theme) => {
    const option = document.createElement('option');
    option.value = theme.value;
    option.textContent = theme.label;
    themeSelect.appendChild(option);
  });

  const customOption = document.createElement('option');
  customOption.value = 'custom';
  customOption.textContent = 'Custom';
  themeSelect.appendChild(customOption);
};

const updateThemePresetSelection = (selectedTheme) => {
  if (!themePresetGrid) {
    return;
  }

  const selectedValue = displayThemeMap.has(selectedTheme) ? selectedTheme : null;

  themePresetGrid.querySelectorAll('.theme-preset-card').forEach((card) => {
    const isSelected = card.dataset.themeValue === selectedValue;
    card.dataset.selected = isSelected ? 'true' : 'false';
    card.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
  });
};

const renderThemePresetCards = () => {
  if (!themePresetGrid) {
    return;
  }

  themePresetGrid.replaceChildren();

  DISPLAY_THEME_PRESETS.forEach((theme) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'theme-preset-card';
    card.dataset.themeValue = theme.value;
    card.setAttribute('aria-pressed', 'false');

    Object.entries(buildThemeCardStyleProperties(theme)).forEach(([name, value]) => {
      card.style.setProperty(name, value);
    });

    const surface = document.createElement('span');
    surface.className = 'theme-preset-card-surface';

    const eyebrow = document.createElement('span');
    eyebrow.className = 'theme-preset-card-eyebrow';
    eyebrow.textContent = theme.label;

    const title = document.createElement('span');
    title.className = 'theme-preset-card-title';
    title.textContent = 'Readable markdown';

    const body = document.createElement('span');
    body.className = 'theme-preset-card-body';
    body.textContent = theme.description;

    const accent = document.createElement('span');
    accent.className = 'theme-preset-card-accent';
    accent.textContent = 'Inline code, quotes, and links stay distinct.';

    const meta = document.createElement('span');
    meta.className = 'theme-preset-card-meta';
    meta.textContent = `${theme.backgroundColor} / ${theme.foregroundColor}`;

    surface.append(eyebrow, title, body, accent);
    card.append(surface, meta);
    card.addEventListener('click', () => {
      themeSelect.value = theme.value;
      handleThemeSelectionChange();
    });

    themePresetGrid.appendChild(card);
  });
};

const syncDialogControls = (displaySettings) => {
  const nextSettings = normalizeDisplaySettings(displaySettings);

  themeSelect.value = nextSettings.theme;
  fontTypeRadios.forEach((radio) => {
    radio.checked = radio.value === nextSettings.fontType;
  });
  backgroundColorInput.value = nextSettings.backgroundColor;
  foregroundColorInput.value = nextSettings.foregroundColor;
  state.dialogDraftDisplaySettings = nextSettings;

  return syncFontSelectOptions(nextSettings.fontType, nextSettings.fontValue)
    .then(() => {
      updateDialogPreview();
    });
};

const openReaderSettingsDialog = async () => {
  await syncDialogControls(state.displaySettings);
  state.settingsReturnFocusTarget = document.activeElement instanceof HTMLElement
    ? document.activeElement
    : null;
  document.documentElement.dataset.settingsOpen = 'true';
  readerSettingsShell.hidden = false;
  window.requestAnimationFrame(() => {
    themeSelect.focus();
  });
};

const focusReaderSurface = () => {
  if (typeof markdownContainer.focus === 'function') {
    markdownContainer.focus();
  }
};

const closeReaderSettingsDialog = ({ restoreFocus = true } = {}) => {
  if (!readerSettingsShell.hidden) {
    if (
      document.activeElement instanceof HTMLElement &&
      readerSettingsShell.contains(document.activeElement) &&
      typeof document.activeElement.blur === 'function'
    ) {
      document.activeElement.blur();
    }

    readerSettingsShell.hidden = true;
    delete document.documentElement.dataset.settingsOpen;

    const focusTarget = restoreFocus &&
      state.settingsReturnFocusTarget &&
      state.settingsReturnFocusTarget.isConnected &&
      !readerSettingsShell.contains(state.settingsReturnFocusTarget) &&
      typeof state.settingsReturnFocusTarget.focus === 'function'
      ? state.settingsReturnFocusTarget
      : markdownContainer;

    state.settingsReturnFocusTarget = null;

    window.requestAnimationFrame(() => {
      if (typeof focusTarget.focus === 'function') {
        focusTarget.focus();
        return;
      }

      focusReaderSurface();
    });
    return;
  }

  state.settingsReturnFocusTarget = null;

  if (!restoreFocus) {
    focusReaderSurface();
  }
};

const prepareForQuit = () => {
  closeReaderSettingsDialog({ restoreFocus: false });

  if (document.activeElement instanceof HTMLElement && typeof document.activeElement.blur === 'function') {
    document.activeElement.blur();
  }

  window.requestAnimationFrame(() => {
    focusReaderSurface();
  });
};

const handleThemeSelectionChange = () => {
  if (themeSelect.value !== 'custom') {
    const presetTheme = displayThemeMap.get(themeSelect.value) || displayThemeMap.get(DEFAULT_DISPLAY_SETTINGS.theme);
    backgroundColorInput.value = presetTheme.backgroundColor;
    foregroundColorInput.value = presetTheme.foregroundColor;
  }

  updateDialogPreview();
};

const handleColorInputChange = () => {
  themeSelect.value = 'custom';
  updateDialogPreview();
};

const handleFontTypeChange = async () => {
  const nextFontType = getSelectedFontType();
  const selectedValue = state.dialogDraftDisplaySettings.fontType === nextFontType
    ? state.dialogDraftDisplaySettings.fontValue
    : nextFontType === 'preset'
      ? DEFAULT_DISPLAY_SETTINGS.fontValue
      : '';

  await syncFontSelectOptions(nextFontType, selectedValue);
  updateDialogPreview();
};

const restoreDefaultDisplaySettings = () => {
  void syncDialogControls(DEFAULT_DISPLAY_SETTINGS);
};

const initReaderSettingsDialog = async () => {
  populateThemeOptions();
  populatePresetFontOptions();
  renderThemePresetCards();

  readerSettingsShell.addEventListener('click', (event) => {
    if (event.target === readerSettingsShell) {
      closeReaderSettingsDialog();
    }
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !readerSettingsShell.hidden) {
      event.preventDefault();
      closeReaderSettingsDialog();
    }
  });

  readerSettingsDialog.querySelectorAll('[data-dialog-close]').forEach((button) => {
    button.addEventListener('click', () => {
      closeReaderSettingsDialog();
    });
  });

  themeSelect.addEventListener('change', () => {
    handleThemeSelectionChange();
  });

  fontTypeRadios.forEach((radio) => {
    radio.addEventListener('change', () => {
      void handleFontTypeChange();
    });
  });

  fontSelect.addEventListener('change', () => {
    updateDialogPreview();
  });

  backgroundColorInput.addEventListener('input', () => {
    handleColorInputChange();
  });

  foregroundColorInput.addEventListener('input', () => {
    handleColorInputChange();
  });

  resetDisplaySettingsButton.addEventListener('click', () => {
    restoreDefaultDisplaySettings();
  });

  readerSettingsForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    saveDisplaySettingsButton.disabled = true;

    try {
      await appApi.setDisplaySettings(getDialogDisplaySettings());
      closeReaderSettingsDialog();
    } finally {
      saveDisplaySettingsButton.disabled = false;
    }
  });
};

const buildStandaloneHtml = () => {
  const title = state.currentFile ? `${getFileName(state.currentFile)} · mdp` : 'mdp';
  const baseHref = state.currentFileUrl ? new URL('.', state.currentFileUrl).toString() : window.location.href;
  const htmlAttributes = [
    `data-theme="${escapeHtml(state.displaySettings.theme)}"`,
    `data-font="${escapeHtml(state.displaySettings.fontType === 'preset' ? state.displaySettings.fontValue : 'custom')}"`
  ].join(' ');
  const inlineStyle = serializeInlineStyleProperties(state.appliedDocumentStyleProperties);
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
<html lang="en" ${htmlAttributes} style="${escapeHtml(inlineStyle)}">
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

const rerenderCurrentDocument = async () => {
  if (!state.currentFile) {
    return;
  }

  const renderToken = ++state.renderToken;
  const previousScrollY = window.scrollY;

  try {
    await renderDocumentContent(state.currentRawContent, renderToken);
  } catch (error) {
    console.error(error);
    showStateCard('Unable to update preview', error.message || 'An unexpected error occurred while applying display settings.', state.currentRawContent || null);
    return;
  }

  if (renderToken === state.renderToken) {
    window.scrollTo({ top: previousScrollY, left: 0, behavior: 'auto' });
  }
};

const renderFile = async (filePath, { historyMode = 'replace' } = {}) => {
  if (!filePath) {
    state.currentFile = null;
    state.currentFileUrl = null;
    state.currentRawContent = '';
    document.title = 'mdp';
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
    state.currentRawContent = rawContent;
    await renderDocumentContent(rawContent, renderToken);
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
  appApi.onMenuAction(async ({ action, displaySettings }) => {
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
      return;
    }

    if (action === 'open-reader-settings') {
      await openReaderSettingsDialog();
      return;
    }

    if (action === 'apply-display-settings') {
      applyDisplaySettings(displaySettings);
      await syncDialogControls(displaySettings);
      await rerenderCurrentDocument();
      return;
    }

    if (action === 'prepare-for-quit') {
      prepareForQuit();
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

  await initReaderSettingsDialog();
  applyDisplaySettings(await appApi.getDisplaySettings());
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

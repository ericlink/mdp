const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  DESKTOP_FILE_NAME,
  MARKDOWN_EXTENSIONS,
  MARKDOWN_MIME_TYPES,
  getBinDir,
  getDataHome,
  getDesktopFilePath,
  getInstallDir,
  getInstalledExePath,
  getLauncherPath
} = require('./linux-paths');

const projectRoot = path.resolve(__dirname, '..');
const outDir = path.join(projectRoot, 'out');
const MIME_PACKAGE_NAME = 'mdp-markdown.xml';
const SHIM_MARKER = 'mdp-markdown-mimetype';

const run = (command, args) => {
  const result = spawnSync(command, args, { encoding: 'utf8' });
  const output = `${result.stdout || ''}${result.stderr || ''}`.trim();

  if (result.error) {
    throw new Error(`${command} failed: ${result.error.message}`);
  }

  if (result.status !== 0) {
    throw new Error(output || `${command} exited with code ${result.status}`);
  }

  return (result.stdout || '').trim();
};

const findLinuxAppDir = (rootDir) => {
  const names = fs.existsSync(rootDir) ? fs.readdirSync(rootDir) : [];
  const archDir = `mdp-linux-${process.arch === 'arm64' ? 'arm64' : 'x64'}`;
  const preferred = [archDir, ...names.filter((name) => name.startsWith('mdp-linux-'))];

  for (const name of preferred) {
    const candidate = path.join(rootDir, name);
    if (fs.existsSync(path.join(candidate, 'mdp'))) {
      return candidate;
    }
  }

  return null;
};

const buildMimeXml = () => {
  const globs = MARKDOWN_EXTENSIONS
    .map((extension) => `    <glob pattern="*.${extension}" weight="60"/>`)
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<mime-info xmlns="http://www.freedesktop.org/standards/shared-mime-info">
  <mime-type type="text/markdown">
    <comment>Markdown document</comment>
    <sub-class-of type="text/plain"/>
    <alias type="text/x-markdown"/>
${globs}
  </mime-type>
</mime-info>
`;
};

const buildMimetypeShim = () => {
  const patterns = MARKDOWN_EXTENSIONS.map((extension) => `*.${extension}`).join('|');

  return `#!/bin/sh
# ${SHIM_MARKER}
# xdg-open on a generic desktop classifies files with \`file\`, which reports
# Markdown as text/plain. xdg-mime prefers this command when it is on PATH.

if [ "\${1:-}" = "--version" ]; then
  echo "${SHIM_MARKER} 1"
  exit 0
fi

file_path=""
for arg in "$@"; do
  case "$arg" in
    --*) ;;
    *) file_path=$arg ;;
  esac
done

if [ -z "$file_path" ]; then
  echo "mimetype: missing file" >&2
  exit 1
fi

lower=$(printf '%s' "$file_path" | tr '[:upper:]' '[:lower:]')
case "$lower" in
  ${patterns})
    echo text/markdown
    exit 0
    ;;
esac

if command -v gio >/dev/null 2>&1; then
  content_type=$(gio info -a standard::content-type -- "$file_path" 2>/dev/null \\
    | sed -n 's/^[[:space:]]*standard::content-type:[[:space:]]*//p' \\
    | head -n 1)
  if [ -n "$content_type" ]; then
    printf '%s\\n' "$content_type"
    exit 0
  fi
fi

exec /usr/bin/file --brief --dereference --mime-type -- "$file_path"
`;
};

const writeLauncher = (exePath) => {
  const binDir = getBinDir();
  const launcherPath = getLauncherPath();
  fs.mkdirSync(binDir, { recursive: true });

  const existing = fs.lstatSync(launcherPath, { throwIfNoEntry: false });
  if (existing) {
    if (existing.isDirectory()) {
      throw new Error(`${launcherPath} is a directory.`);
    }

    fs.unlinkSync(launcherPath);
  }

  fs.symlinkSync(exePath, launcherPath);
  return launcherPath;
};

const installIcons = () => {
  const icons = [
    ['256x256', 'app-256.png'],
    ['64x64', 'app.png']
  ];

  for (const [size, fileName] of icons) {
    const source = path.join(projectRoot, 'assets', fileName);
    const iconDir = path.join(getDataHome(), 'icons', 'hicolor', size, 'apps');
    fs.mkdirSync(iconDir, { recursive: true });
    fs.copyFileSync(source, path.join(iconDir, 'mdp.png'));
  }

  return path.join(getDataHome(), 'icons', 'hicolor', '256x256', 'apps', 'mdp.png');
};

const writeDesktopFile = ({ launcherPath, iconPath }) => {
  const desktopFilePath = getDesktopFilePath();
  fs.mkdirSync(path.dirname(desktopFilePath), { recursive: true });

  const desktopFile = `[Desktop Entry]
Version=1.0
Type=Application
Name=mdp
GenericName=Markdown Preview
Comment=Markdown preview for local files
Exec=${launcherPath} %f
TryExec=${launcherPath}
Icon=${iconPath}
Terminal=false
Categories=Office;Viewer;
MimeType=${MARKDOWN_MIME_TYPES.join(';')};
Keywords=markdown;preview;
StartupWMClass=mdp
StartupNotify=true
`;

  fs.writeFileSync(desktopFilePath, desktopFile);
  return desktopFilePath;
};

const installMimetypeShim = () => {
  const shimPath = path.join(getBinDir(), 'mimetype');

  if (fs.existsSync(shimPath)) {
    const existing = fs.readFileSync(shimPath, 'utf8');
    if (!existing.includes(SHIM_MARKER)) {
      console.log(`Leaving existing ${shimPath} in place.`);
      return;
    }
  }

  fs.writeFileSync(shimPath, buildMimetypeShim(), { mode: 0o755 });
  fs.chmodSync(shimPath, 0o755);
  console.log(`MIME helper: ${shimPath}`);
};

const queryDefault = (mimeType) => {
  const result = spawnSync('xdg-mime', ['query', 'default', mimeType], { encoding: 'utf8' });
  return (result.stdout || '').trim();
};

console.log('Looking for packaged app...');

const sourceDir = findLinuxAppDir(outDir);

if (!sourceDir) {
  console.error('Could not find out/mdp-linux-x64/mdp.');
  console.error('Run npm run package:linux and wait for it to finish.');
  process.exit(1);
}

const destDir = getInstallDir();
const exePath = getInstalledExePath();

console.log(`Copying ${sourceDir}`);
console.log(`     to ${destDir}`);

try {
  fs.rmSync(destDir, { recursive: true, force: true });
  fs.mkdirSync(destDir, { recursive: true });
  fs.cpSync(sourceDir, destDir, { recursive: true });
  fs.chmodSync(exePath, 0o755);
} catch (error) {
  console.error(`Copy failed: ${error.message}`);
  process.exit(1);
}

let launcherPath;
let iconPath;
let desktopFilePath;

try {
  launcherPath = writeLauncher(exePath);
  iconPath = installIcons();
  desktopFilePath = writeDesktopFile({ launcherPath, iconPath });
  installMimetypeShim();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

const previousDefault = queryDefault('text/markdown');
const mimeXmlPath = path.join(os.tmpdir(), MIME_PACKAGE_NAME);

try {
  fs.writeFileSync(mimeXmlPath, buildMimeXml());
  run('xdg-mime', ['install', '--mode', 'user', mimeXmlPath]);
  run('update-desktop-database', [path.join(getDataHome(), 'applications')]);
  run('xdg-mime', ['default', DESKTOP_FILE_NAME, ...MARKDOWN_MIME_TYPES]);
} catch (error) {
  console.error(`File association failed: ${error.message}`);
  process.exit(1);
} finally {
  fs.rmSync(mimeXmlPath, { force: true });
}

for (const mimeType of MARKDOWN_MIME_TYPES) {
  const configured = queryDefault(mimeType);
  if (configured !== DESKTOP_FILE_NAME) {
    console.error(`Expected ${mimeType} to open with ${DESKTOP_FILE_NAME}, got ${configured || 'nothing'}.`);
    process.exit(1);
  }
}

console.log(`Installed to ${destDir}`);
console.log(`Launcher: ${launcherPath}`);
console.log(`Desktop entry: ${desktopFilePath}`);
console.log('Markdown files open with mdp.');

if (previousDefault && previousDefault !== DESKTOP_FILE_NAME) {
  console.log(`Replaced ${previousDefault}.`);
  console.log(`Restore it with: xdg-mime default ${previousDefault} ${MARKDOWN_MIME_TYPES.join(' ')}`);
}

console.log('Launch with:');
console.log('  npm run start:linux');
console.log(`  ${launcherPath}`);

const fs = require('fs');
const path = require('path');

const isInternalBuild = process.env.MDP_INTERNAL === '1';

const hasCommand = (name) => {
  return (process.env.PATH || '').split(path.delimiter).some((dir) => {
    if (!dir) {
      return false;
    }

    try {
      fs.accessSync(path.join(dir, name), fs.constants.X_OK);
      return true;
    } catch (error) {
      return false;
    }
  });
};

const getArgValue = (name) => {
  const prefix = `--${name}=`;
  const inline = process.argv.find((arg) => arg.startsWith(prefix));
  if (inline) {
    return inline.slice(prefix.length);
  }

  const flagIndex = process.argv.indexOf(`--${name}`);
  if (flagIndex >= 0) {
    return process.argv[flagIndex + 1] || null;
  }

  return null;
};

const requestedPlatform = getArgValue('platform');
const lifecycleEvent = process.env.npm_lifecycle_event || '';
const isWindowsBuild = requestedPlatform === 'win32'
  || ['package:win', 'make:win', 'local-install:win'].includes(lifecycleEvent);
const isLinuxBuild = !isWindowsBuild && (
  requestedPlatform === 'linux'
  || ['package:linux', 'make:linux', 'local-install:linux'].includes(lifecycleEvent)
  || (!requestedPlatform && process.platform === 'linux' && !lifecycleEvent.includes('mac'))
);

const internalDarwinMakers = [
  {
    name: '@electron-forge/maker-dmg',
    config: {
      format: 'ULFO'
    }
  },
  {
    name: '@electron-forge/maker-zip',
    platforms: ['darwin', 'linux'],
    config: {}
  }
];

const macPackagerConfig = {
  icon: 'assets/app.icns',
  darwinDarkModeSupport: true,
  overwrite: true,
  extendInfo: 'Info.plist',
  helperBundleId: 'com.electron.mdp',
  appBundleId: 'com.electron.mdp',
  ...(isInternalBuild ? {} : {
    osxSign: {
      identity: 'Developer ID Application: Eric Link (W8QA48B3XU)',
      hardenedRuntime: true,
      gatekeeperAssess: false,
      entitlements: 'entitlements.plist',
      'entitlements-inherit': 'entitlements.plist',
      'signature-flags': 'library'
    },
    osxNotarize: process.env.APPL_PASS ? {
      appleId: 'eric.m.link@gmail.com',
      appleIdPassword: process.env.APPL_PASS
    } : undefined
  })
};

const windowsPackagerConfig = {
  icon: 'assets/app.ico',
  overwrite: true,
  win32metadata: {
    CompanyName: 'elink',
    FileDescription: 'mdp',
    InternalName: 'mdp',
    OriginalFilename: 'mdp.exe',
    ProductName: 'mdp'
  }
};

const linuxPackagerConfig = {
  icon: 'assets/app-256.png',
  overwrite: true,
  executableName: 'mdp'
};

// deb and rpm makers shell out to distro tools. Skip them when those tools
// are not installed so `npm run make` still produces a zip on Arch.
const linuxPackageMakers = [
  ...(hasCommand('dpkg') && hasCommand('fakeroot') ? [{
    name: '@electron-forge/maker-deb',
    config: {
      options: {
        maintainer: 'elink',
        homepage: 'https://github.com/ericlink/mdp',
        icon: 'assets/app-256.png',
        categories: ['Office', 'Viewer'],
        mimeType: ['text/markdown', 'text/x-markdown']
      }
    }
  }] : []),
  ...(hasCommand('rpmbuild') ? [{
    name: '@electron-forge/maker-rpm',
    config: {
      options: {
        homepage: 'https://github.com/ericlink/mdp',
        icon: 'assets/app-256.png',
        categories: ['Office', 'Viewer'],
        mimeType: ['text/markdown', 'text/x-markdown']
      }
    }
  }] : [])
];

const packagerConfig = isWindowsBuild
  ? windowsPackagerConfig
  : isLinuxBuild
    ? linuxPackagerConfig
    : macPackagerConfig;

module.exports = {
  packagerConfig,
  rebuildConfig: {
    onlyModules: []
  },
  makers: isInternalBuild ? internalDarwinMakers : [
    {
      name: '@electron-forge/maker-pkg',
      config: {
        identity: '3rd Party Mac Developer Installer: Eric Link (W8QA48B3XU)'
      }
    },
    ...internalDarwinMakers,
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        setupIcon: 'assets/app.ico'
      }
    },
    ...linuxPackageMakers
  ],
  publishers: isInternalBuild ? [] : [
    {
      name: '@electron-forge/publisher-github',
      platforms: ['darwin'],
      config: {
        repository: {
          owner: 'ericlink',
          name: 'mdp'
        },
        prerelease: false
      }
    }
  ]
};

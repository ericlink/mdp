const isInternalBuild = process.env.MDP_INTERNAL === '1';

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

const isWindowsBuild = getArgValue('platform') === 'win32'
  || ['package:win', 'make:win', 'local-install:win'].includes(process.env.npm_lifecycle_event);

const internalDarwinMakers = [
  {
    name: '@electron-forge/maker-dmg',
    config: {
      format: 'ULFO'
    }
  },
  {
    name: '@electron-forge/maker-zip',
    platforms: ['darwin'],
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

module.exports = {
  packagerConfig: isWindowsBuild ? windowsPackagerConfig : macPackagerConfig,
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
    {
      name: '@electron-forge/maker-deb',
      config: {}
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {}
    }
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

const isInternalBuild = process.env.MDP_INTERNAL === '1';

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

module.exports = {
  packagerConfig: {
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
      name: '@electron-forge/maker-squirrel'
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

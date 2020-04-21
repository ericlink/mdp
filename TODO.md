# todo

## features
- [ ] get working with *highlight.js* themes
- [ ] get working with *marked* themes
- [ ] get working with mermaid themes / css (mermaid-cli -C)

- [ ] keep scroll position on reload
- [ ] vim keymappings
- [ ] recent documents app.addRecentDocument('/Users/USERNAME/Desktop/work.type') app.clearRecentDocuments()
- [ ] issues and site linked in about
- [ ] autosave sometimes doesn't refresh (file watcher issue?)
- [ ] zoom by window?

## package and install
- [ ] installer - install command line script into /usr/local/bin
- [ ] sign app to enable auto updater using git releases

## tech
- [ ] upgrade packages
- [ ] get electron-forge start working (not passing arg; detect mode and default arg to readme?)
- [ ] load modules more efficiently?
- [ ] webpack?
- [ ] extendInfo any - The extra entries for Info.plist.

## done
- [x] print style sheets
- [x] preferences to set editor, e.g.  var executablePath = "mvim";
- [x] use tmp file for html
- [x] fixup markdown inline images to use base path of .md file they are in
- [x] emoji support
- [x] cmd+e to edit current markdown in system editor
- [x] open url only add listener once, not every reload
- [x] export menu (html, open in browser)
- [x] open links in os browser
- [x] expand cmd args to absolute path
- [x] fix up js
- [x] window menu
- [x] close window key
- [x] get working from file associated in finder
- [x] get working opening multiple from command line
- [x] get working as cmd line
- [x] get working as packaged
- [x] github release using electron-forge
- [x] keep scroll position on reload
- [x] move poc into app (works using dev command line)


## MAS Transporter errors

```
ERROR ITMS-90237: "The product archive package's signature is invalid.
Ensure that it is signed with your "3rd Party Mac Developer Installer" certificate."

ERROR ITMS-90255: "The installer package includes files that are only readable by the root user.
This will prevent verification of the application's code signature when your app is run.
Ensure that non-root users can read the files in your app."

ERROR ITMS-90296: "App sandbox not enabled. The following executables must include the
"com.apple.security.app-sandbox" entitlement with a Boolean value of true in the entitlements property list:
[( "com.electron.mdp.pkg/Payload/mdp.app/Contents/Frameworks/Electron Framework.framework/Versions/A/Resources/crashpad_handler", "com.electron.mdp.pkg/Payload/mdp.app/Contents/Frameworks/Squirrel.framework/Versions/A/Resources/ShipIt", "com.electron.mdp.pkg/Payload/mdp.app/Contents/Frameworks/mdp Helper.app/Contents/MacOS/mdp Helper", "com.electron.mdp.pkg/Payload/mdp.app/Contents/MacOS/mdp" )]
Refer to App Sandbox page at https://developer.apple.com/documentation/security/app_sandbox for more information on sandboxing your app."
```

```
ERROR ITMS-90255: "The installer package includes files that are only readable by the root user.
This will prevent verification of the application's code signature when your app is run.
Ensure that non-root users can read the files in your app."

ERROR ITMS-90287: "Invalid Code Signing Entitlements.
The entitlements in your app bundle signature do not match the ones that are contained in the provisioning profile.
The bundle contains a key that is not included in the provisioning profile:
'com.apple.application-identifier' in 'com.electron.mdp.pkg/Payload/mdp.app/Contents/MacOS/mdp'."

ERROR ITMS-90287: "Invalid Code Signing Entitlements.
The entitlements in your app bundle signature do not match the ones that are contained in the provisioning profile.
The bundle contains a key that is not included in the provisioning profile:
'com.apple.developer.team-identifier' in 'com.electron.mdp.pkg/Payload/mdp.app/Contents/MacOS/mdp'."
```

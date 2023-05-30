# LIDIA Annotations

Zotero plugin for capturing PDF reader annotations in a structured format for the LIDIA project.

The project is set up as a bootstrapped plugin for Zotero 6 and 7. Tested only under Zotero 6.

## Development

Make Zotero ready for the extension (you only need to do this once):

- Create a new Zotero profile with `zotero --ProfileManager` (here named `Develop`).
- Configure a custom data directory for the new profile (in this example we use `~/.zotero/zotero/Develop`).
- Start the new profile: `zotero -P Develop` and exit.
- `git clone git@github.com:UUDigitalHumanitieslab/lidia-zotero.git /path/to/Projects/LIDIA/lidia-zotero`
- `mkdir $HOME/.zotero/zotero/Develop/extensions`
- `echo "<absolute-path-to-source>/build" > $HOME/.zotero/zotero/Develop/extensions/lidia-zotero@cdh.uu.nl`
- `sed -i '/.*extensions\.lastAppBuildId.*/d' $HOME/.zotero/zotero/Develop/prefs.js`
- `sed -i '/.*extensions\.lastAppVersion.*/d' $HOME/.zotero/zotero/Develop/prefs.js`

This will enable the plugin from the source directory.

Install npm packages:
- `npm install`

Build and run:
- Make changes in your source
- `npm run build`
- `zotero -P Develop -purgecaches -ZoteroDebugText`

### Use of React

This extension uses React for rendering part of the UI, as was done earlier in
Diego de la Hera's plugin `zotero-cita`. To make that possible we include a
patch to `react-dom` that is included in `zotero-cita` as well. This patch
forces the use of the XHTML namespace when creating elements, because Zotero 6
by default creates XUL elements.

React also needs to have access to global objects like `window` and `document`.
This is achieved by passing the window object of the Zotero main window to
the bundled JavaScript file when it is loaded in `bootstrap.js` using
the `Services.scriptloader.loadSubScript` method.

### Release

Releases and local builds are made using [zotero-plugin](https://github.com/retorquere/zotero-plugin).

To create a local build, run `npm run build`.

To create a release:

- Switch to `main` branch
- Bump the version in `package.json` (e.g. `0.2.1`)
- Create an annotated tag with the same version (e.g. `git tag --sign -m "Release v0.2.1" v0.2.1`)
- `git push --follow-tags`

### Reading

- [Setting Up a Plugin Development Environment](https://www.zotero.org/support/dev/client_coding/plugin_development#setting_up_a_plugin_development_environment).
- [Zotero 7 for Developers](https://www.zotero.org/support/dev/zotero_7_for_developers)

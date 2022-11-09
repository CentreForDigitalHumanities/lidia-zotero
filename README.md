# LIDIA Annotations

Zotero plugin for capturing PDF reader annotations in a structured format for the LIDIA project.

The project is set up as a bootstrapped plugin for Zotero 6 and 7. Tested only under Zotero 6.

## Development

- Create a new Zotero profile with `zotero --ProfileManager` (here named `Develop`).
- Configure a custom data directory for the new profile.
- Start the new profile: `zotero -P Develop` and exit.
- `git clone git@github.com:UUDigitalHumanitieslab/lidia-zotero.git /path/to/Projects/LIDIA/lidia-zotero`
- `mkdir $HOME/.zotero/zotero/Develop/extensions`
- `echo "/absolute/path/to/Projects/LIDIA/lidia-zotero" > $HOME/.zotero/zotero/Develop/extensions/lidia-annotations@dig.hum.uu.nl`
- `sed -i '/.*extensions\.lastAppBuildId.*/d' $HOME/.zotero/zotero/Develop/prefs.js`
- `sed -i '/.*extensions\.lastAppVersion.*/d' $HOME/.zotero/zotero/Develop/prefs.js`
- `zotero -P Develop` # The plugin is now enabled from the source directory
- Make changes in your source
- Restart Zotero `zotero -P Develop -purgecaches -ZoteroDebugText`

### Reading

- [Setting Up a Plugin Development Environment](https://www.zotero.org/support/dev/client_coding/plugin_development#setting_up_a_plugin_development_environment).
- [Zotero 7 for Developers](https://www.zotero.org/support/dev/zotero_7_for_developers)

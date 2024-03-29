import React from "react";

import { LidiaPanel } from "./panel.js";
import { migrateAllLidiaAnnotations } from "./relations.js";
/* global window, Zotero */


window.Lidia = {
    fields: [
        {"id": "argcont", "label": "lidiaArgumentContinuation.label"}
        , {"id": "argname", "label": "lidiaArgumentName.label"}
        , {"id": "pagestart", "label": "lidiaPageStart.label"}
        , {"id": "pageend", "label": "lidiaPageEnd.label"}
        , {"id": "arglang", "label": "lidiaArgumentLanguage.label"}
        , {"id": "termgroups", "label": "lidiaTermGroups.label"}
        , {"id": "description","label": "lidiaArgumentDescription.label"}
        , {"id": "relationType","label": "lidiaArgumentDescription.label"}
        , {"id": "relationTo","label": "lidiaArgumentDescription.label"}
    ],

    async init({ id, version, rootURI }) {
        if (this.initialized) return;
        log('Initializing LIDIA extension (lib.js)');
        log('Window object:' + window.toString());
		this.id = id;
		this.version = version;
		this.rootURI = rootURI;
		this.initialized = true;
        this.win = Zotero.getMainWindow();
        this.doc = this.win.document;
        this.stringBundle = Services.strings.createBundle(
            'chrome://lidia-zotero/locale/lidia.properties'
        );

        this.notifierCallback = {
            // After zotero-pdf-translate
            notify: async (event, type, ids, extraData) => {
                if (event === "select" &&
                        type === "tab" &&
                        extraData[ids[0]].type === "reader"
                ) {
                    let reader = Zotero.Reader.getByTabID(ids[0]);
                    let delayCount = 0;
                    while (!reader && delayCount < 10) {
                        await Zotero.Promise.delay(100);
                        reader = Zotero.Reader.getByTabID(ids[0]);
                        delayCount++;
                    }
                    await reader._initPromise;
                    await this.onReaderSelect(reader);
                } else if (event === "add" && type === "item") {
                    await this.panel.addSelectEvents();
                }
            }
        }

        this.notifierID = Zotero.Notifier.registerObserver(this.notifierCallback, [
            "tab",
            "item",
            "file",
        ]);

        this.panel = new LidiaPanel();

		this.migrateMenuitem = createXElement('menuitem');
		this.migrateMenuitem.id = 'lidia-migrate';
        this.migrateMenuitem.setAttribute('label', 'Migrate LIDIA items to newest version...')
        this.migrateMenuitem.addEventListener('click', () => {this.onMigrateItemsClicked()});
		this.doc.getElementById('menu_EditPopup').appendChild(this.migrateMenuitem);

        this.aboutMenuitem = createXElement('menuitem');
        this.aboutMenuitem.id = 'lidia-about';
        this.aboutMenuitem.setAttribute('label', 'About LIDIA plugin');
        this.aboutMenuitem.addEventListener('click', () => {
            window.alert(
                `LIDIA extension for Zotero version ${this.version}\n` +
                `For help, see https://lidia.readthedocs.io/`
            );
        });
        this.doc.getElementById('menu_HelpPopup').appendChild(this.aboutMenuitem);

        // If a reader is currently selected, activate it. This is only needed
        // when a user activates the extension while Zotero is running.
        const reader = Zotero.Reader.getByTabID(window.Zotero_Tabs._selectedID);
        if (reader) {
            this.onReaderSelect(reader);
        }
    },

    onReaderSelect: async function(reader) {
        log("Reader selected");
        await this.panel.buildSideBarPanel();
        await this.panel.addSelectEvents();
    },

    shutdown: function() {
        this.panel.destroy();
        this.migrateMenuitem.remove();
        this.aboutMenuitem.remove();

        Zotero.Notifier.unregisterObserver(this.notifierID);
    },

    onMigrateItemsClicked: async function() {
        const libraryID = ZoteroPane.getSelectedLibraryID();
        log("Migrating items of library with ID " + libraryID);
        const dryRunResults = await migrateAllLidiaAnnotations(
            libraryID, true
        );
        if (dryRunResults.migratedLidiaAnnotations === 0) {
            this.win.alert(
                "All annotations in the currently selected library are already " +
                "up to date. No changes made."
            );
            return;
        }
        if (this.win.confirm(
            `Are you sure you want to migrate all LIDIA annotations ` +
            `in the currently selected library? This operation will ` +
            `touch ${dryRunResults.migratedLidiaAnnotations} annotations.`
        )) {
            const results = await migrateAllLidiaAnnotations(libraryID);
            this.win.alert(
                `Migrated ${results.migratedLidiaAnnotations} out ` +
                `of ${results.allLidiaAnnotations} in current library.`
            );
        }
    }
};

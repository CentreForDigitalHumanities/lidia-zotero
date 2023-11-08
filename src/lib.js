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

    async init(rootURI) {
        log('Initializing LIDIA extension (lib.js)');
        log('Window object:' + window.toString());
        this.rootURI = rootURI;
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

		this.menuitem = createXElement('menuitem');
		this.menuitem.id = 'lidia-migrate';
        this.menuitem.setAttribute('label', 'Migrate LIDIA items to newest version...')
        this.menuitem.addEventListener('click', () => {this.onMigrateItemsClicked()});
		this.doc.getElementById('menu_EditPopup').appendChild(this.menuitem);

        // If a reader is currently selected, activate it. This is only needed
        // when a user activates the extension while Zotero is running.
        const reader = Zotero.Reader.getByTabID(window.Zotero_Tabs._selectedID);
        if (reader) {
            this.onReaderSelect(reader);
        }
    },

    onReaderSelect: async function(reader) {
        log("Reader selected");
        const item = Zotero.Items.get(reader.itemID);
        log(
            "We are in file: " + `${item.getField("title")}`
        );
        await this.panel.buildSideBarPanel();
        await this.panel.addSelectEvents();

        /* Disable the panel after a tab is selected, because the user
            * first has to select an annotation. It would be better if
            * the selected annotation was automatically activated. */
        this.panel.disablePanel(undefined);
    },

    shutdown: function() {
        this.panel.destroy();
        this.menuitem.remove();

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

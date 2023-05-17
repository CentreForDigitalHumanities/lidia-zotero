import React from "react";

import { LidiaPanel } from "./panel.js";
/* global window, Zotero */


window.Lidia = {
    fields: [
        {"id": "argcont", "label": "lidiaArgumentContinuation.label"}
        , {"id": "argname", "label": "lidiaArgumentName.label"}
        , {"id": "pagestart", "label": "lidiaPageStart.label"}
        , {"id": "pageend", "label": "lidiaPageEnd.label"}
        , {"id": "arglang", "label": "lidiaArgumentLanguage.label"}
        , {"id": "lexiconterm", "label": "lidiaLexiconTerm.label"}
        , {"id": "otherterm", "label": "lidiaLexiconTerm.label"}
        , {"id": "description","label": "lidiaArgumentDescription.label"}
        , {"id": "relationType","label": "lidiaArgumentDescription.label"}
        , {"id": "relationTo","label": "lidiaArgumentDescription.label"}
    ],

    async init(rootURI) {
        log('Initializing LIDIA extension (lib.js)');
        log('Window object:' + window.toString());
        this.rootURI = rootURI;
        this.win = Zotero.getMainWindow();
        this.stringBundle = Services.strings.createBundle(
            'chrome://lidia-annotations/locale/lidia.properties'
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
};

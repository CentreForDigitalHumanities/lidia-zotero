if (!Zotero.Lidia) {
    Zotero.Lidia = {
        fields: [{
            "id": "argname",
            "label": "lidiaArgumentName.label",
            "type": "input"
        },{
            "id": "linglevel",
            "label": "lidiaLinguisticLevel.label",
            "type": "input"
        },{
            "id": "arglang",
            "label": "lidiaArgumentLanguage.label",
            "type": "input"
        },{
            "id": "description",
            "label": "lidiaArgumentDescription.label",
            "type": "textarea"
        }],

        async init(rootURI) {
            log('Initializing LIDIA extension');
            this.rootURI = rootURI;
            this.win = Zotero.getMainWindow();
            this.stringBundle = Services.strings.createBundle(
                'chrome://lidia-annotations/locale/lidia.properties'
            );
            Services.scriptloader.loadSubScript(this.rootURI + 'panel.js');
            Services.scriptloader.loadSubScript(this.rootURI + 'selecting.js');
            Services.scriptloader.loadSubScript(this.rootURI + 'serialize.js');

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
                        this.onReaderSelect(reader);
                    } else if (event === "add" && type === "item") {
                        await Zotero.Lidia.Selecting.addSelectEvents();
                    }
                }
            }

            this.notifierID = Zotero.Notifier.registerObserver(this.notifierCallback, [
                "tab",
                "item",
                "file",
            ]);
        },

        onReaderSelect: async function(reader) {
            log("Reader selected");
            const item = Zotero.Items.get(reader.itemID);
            log(
                "We are in file: " + `${item.getField("title")}`
            );
            await Zotero.Lidia.Panel.buildSideBarPanel();
            await Zotero.Lidia.Selecting.addSelectEvents();

            /* Disable the panel after a tab is selected, because the user
             * first has to select an annotation. It would be better if
             * the selected annotation was automatically activated. */
            Zotero.Lidia.Panel.disablePanel(true);
        },
    };
}

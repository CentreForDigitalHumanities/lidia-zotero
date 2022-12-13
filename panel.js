if (!Zotero.Lidia.Panel) {
    Zotero.Lidia.Panel = {
        /* fields: definition of LIDIA annotation fields that we want to
         * edit with this Zotero extension. */
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
        initialize: function() {
            this.win = Zotero.getMainWindow();
            this.stringBundle = Services.strings.createBundle('chrome://lidia-annotations/locale/lidia.properties');
            this.notifierCallback = {
                // After zotero-pdf-translate
                notify: async (
                    event,
                    type,
                    ids,
                    extraData
                ) => {
                    if (
                    event == "select" &&
                    type == "tab" &&
                    extraData[ids[0]].type == "reader"
                    ) {
                        log("open PDF reader event detected.");
                        let reader = Zotero.Reader.getByTabID(ids[0]);
                        let delayCount = 0;
                        while (!reader && delayCount < 10) {
                            await Zotero.Promise.delay(100);
                            reader = Zotero.Reader.getByTabID(ids[0]);
                            delayCount++;
                        }
                        await reader._initPromise;
                        this.onReaderSelect(reader);
                    } else if (event == "add" && type == "item") {
                        Zotero.Lidia.SelectButton.addButton();
                    }
                }
            }

            let notifierID = Zotero.Notifier.registerObserver(this.notifierCallback, [
                "tab",
                "item",
                "file",
            ]);
        },

        onReaderSelect: function(reader) {
            log("Reader selected");
            const item = Zotero.Items.get(reader.itemID);
            log(
                "We are in file: " + `${item.getField("title")}`
            );
            this.buildSideBarPanel();
            Zotero.Lidia.SelectButton.addButton();
            this.disablePanel(true);
        },

        buildSideBarPanel: async function() {
            /**
             * Create the sidebar panel (after zotero-pdf-translate extension)
             */
            log("Building LIDIA panel");
            var tab = this.tab;
            if (!tab) {
                tab = this.win.document.createElement("tab");
                tab.setAttribute("id", "lidia-tab");
                tab.setAttribute(
                    "label",
                    'LIDIA'
                );
                this.tab = tab;
            }
            let tabContainer = this.win.document.getElementById(`${this.win.Zotero_Tabs._selectedID}-context`);
            // TODO: make PDFs without parent item work
            /* (or maybe we won't need this, because PDFs without
               parent items may lead to problems) */

            const tabbox = tabContainer.querySelector("tabbox");
            tabbox.querySelector("tabs").appendChild(tab);

            var panelInfo = this.tabPanel;
            if (!panelInfo) {
                panelInfo = this.win.document.createElement("tabpanel");
                panelInfo.setAttribute("id", "lidia-tabpanel");
                panelInfo.setAttribute("flex", "1");

                let vbox = this.win.document.createElement("vbox");
                vbox.setAttribute(
                    "id",
                    "lidia-vbox"
                );
                vbox.setAttribute("flex", "1");
                vbox.setAttribute("align", "center");

                let grid = this.win.document.createElement("grid");
                grid.setAttribute("id", "lidia-edit-grid");
                grid.setAttribute("flex", "1"); // Nodig?
                let columns = this.win.document.createElement("columns");
                let column1 = this.win.document.createElement("column");
                let column2 = this.win.document.createElement("column");
                column2.setAttribute("flex", "1");
                let rows = this.win.document.createElement("rows");
                let row2 = this.win.document.createElement("row");
                let button = this.win.document.createElement("button");
                button.setAttribute(
                    "label",
                    getString('lidiaUpdateAnnotation.label')
                );
                button.setAttribute("flex", "1");
                button.addEventListener("click", () => {
                    this.saveAnnotation();
                });

                let emptydiv = this.win.document.createElement("div");
                row2.append(emptydiv, button);
                columns.append(column1, column2);
                let textRow = this.win.document.createElement("row");
                let textRowLabel = this.win.document.createElement("label");
                let textRowText = this.win.document.createElement("label");
                textRowText.setAttribute("id", "lidia-argument-text");
                textRowLabel.textContent =
                    getString("lidiaArgumentText.label") + ":";
                textRow.append(textRowLabel, textRowText);
                rows.append(textRow);
                for (field of this.fields) {
                    let row = this.win.document.createElement("row");
                    let label = this.win.document.createElement("label");
                    label.textContent = getString(field.label) + ":";
                    // So far we only support textbox
                    let input = this.win.document.createElement("textbox");
                    if (field.type === "textarea") {
                        input.setAttribute("multiline", true);
                        input.setAttribute("rows", 7);
                    }
                    input.setAttribute("flex", 2);
                    input.setAttribute("id", "lidia-" + field.id);
                    row.append(label, input);
                    rows.append(row);
                }
                rows.append(row2);
                grid.append(columns);
                grid.append(rows);

                let statusLabel = this.win.document.createElement("label");
                statusLabel.setAttribute("id", "lidia-status");

                vbox.append(statusLabel);
                vbox.append(grid);

                panelInfo.append(vbox);
                this.tabPanel = panelInfo;
            }
            tabbox.querySelector("tabpanels").appendChild(panelInfo);
            tabbox.selectedIndex = Array.prototype.indexOf.call(
                    tabbox.querySelector("tabs").childNodes,
                    tabbox.querySelector("#lidia-tab")
            );
        },
        activatePanel: function(data, item) {
            /**
             * Activate the LIDIA panel and fill the form with existing data.
             */
            for (field of this.fields) {
                let value = data[field.id] !== undefined ? data[field.id] : "";
                this.win.document.getElementById("lidia-" + field.id).value =
                    value;
            }
            const grid = this.win.document.getElementById("lidia-edit-grid");
            grid.setAttribute("hidden", false);
            const statusLabel = this.win.document.getElementById("lidia-status");
            statusLabel.textContent = "Editing an annotation:";
            const argumentText =
                this.win.document.getElementById("lidia-argument-text");
            argumentText.textContent = item.annotationText;
        },
        disablePanel: function(noselection) {
            log("Disabling panel");
            Zotero.Lidia.currentAnnotation = null;
            const grid = this.win.document.getElementById("lidia-edit-grid");
            grid.setAttribute("hidden", true);
            const statusLabel = this.win.document.getElementById("lidia-status");
            if (noselection) {
                statusLabel.textContent = "Please select an annotation";
            } else {
                statusLabel.textContent = "The annotation you selected is not a LIDIA annotation. Please select a LIDIA annotation or a new annotation without a comment.";
            }
        },
        receiveAnnotation: function(item) {
            /**
             * Act upon the selection of an annotation by activating or
             * disactivating the panel.
             */
            Zotero.Lidia.currentAnnotation = item;
            if (item.annotationComment) {
                data = Zotero.Lidia.Serialize.deserialize(item.annotationComment);
            } else {
                // If there is no comment, start with empty fields
                data = {}
            }
            if (data !== undefined) {
                this.activatePanel(data, item);
            } else {
                /* Data is undefined if it could not be parsed. Disable the
                 * panel to prevent a non-LIDIA comment from being changed */
                this.disablePanel();
            }
        },
        saveAnnotation: async function() {
            /**
             * Serialize contents of the form and save to database
             */
            const item = Zotero.Lidia.currentAnnotation;
            if (item == null) return;
            let data = {};
            for (field of this.fields) {
                data[field.id] =
                    this.win.document.getElementById("lidia-" + field.id).value;
            }
            const serialized = Zotero.Lidia.Serialize.serialize(data);
            item.annotationComment = serialized;
            await item.saveTx();
        }
    }
}

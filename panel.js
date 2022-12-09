if (!Zotero.Lidia.Panel) {
    Zotero.Lidia.Panel = {
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
            "type": "input"
        }],
        initialize: function() {
            this.win = Zotero.getMainWindow();
            this.stringBundle = Services.strings.createBundle('chrome://lidia-annotations/locale/lidia.properties');
            this.notifierCallback = {
                // Call view.updateTranslatePanels when a tab is added or selected
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

            if (tabContainer) {
                log("Found reader tab container");
            }
            let n = 0;
            while (!tabContainer || !tabContainer.querySelector("tabbox")) {
                if (n >= 500) {
                    log("Waiting for reader failed");
                    return;
                }
                // For attachments without parent item
                if (tabContainer.querySelector("description")) {
                    tabContainer.innerHTML = "";
                    const tabbox = this.win.document.createElement("tabbox");
                    tabbox.className = "zotero-view-tabbox";
                    tabbox.setAttribute("flex", "1");

                    const tabs = this.win.document.createElement("tabs");
                    tabs.className = "zotero-editpane-tabs";
                    tabs.setAttribute("orient", "horizontal");
                    tabbox.append(tabs);

                    const tabpanels = this.win.document.createElement("tabpanels");
                    tabpanels.className = "zotero-view-item";
                    tabpanels.setAttribute("flex", "1");

                    tabbox.append(tabpanels);
                    tabContainer.append(tabbox);
                    break;
                }
                await Zotero.Promise.delay(10);
                n++;
            }

            const tabbox = tabContainer.querySelector("tabbox");
            tabbox.querySelector("tabs").appendChild(tab);

            var panelInfo = this.tabPanel;
            if (!panelInfo) {
                panelInfo = this.win.document.createElement("tabpanel");
                panelInfo.setAttribute("id", "lidia-tabpanel");
                panelInfo.setAttribute("flex", "1");

                let vbox = this.win.document.createElement("vbox");
                vbox.setAttribute("id", "lidia-vbox");
                vbox.setAttribute("flex", "1");
                vbox.setAttribute("align", "stretch");
                vbox.style.padding = "0px 10px 10px 10px";

                let hboxOpenWindow = this.win.document.createElement("vbox");
                hboxOpenWindow.setAttribute(
                    "id",
                    "lidia-tabpanel-openwindow-hbox"
                );
                hboxOpenWindow.setAttribute("flex", "1");
                hboxOpenWindow.setAttribute("align", "center");
                hboxOpenWindow.maxHeight = 50;
                hboxOpenWindow.minHeight = 50;
                hboxOpenWindow.style.height = "80px";

                /*let buttonAbout = this.win.document.createElement("button");
                buttonAbout.setAttribute(
                    "label",
                    getString("lidiaAbout.label")
                );
                buttonAbout.setAttribute("flex", "1");

                let buttonAbout2 = this.win.document.createElement("button");
                buttonAbout2.setAttribute(
                    "label",
                    getString('lidiaUpdateAnnotation.label')
                );
                buttonAbout2.setAttribute("flex", "1");

                hboxOpenWindow.append(buttonAbout);
                hboxOpenWindow.append(buttonAbout2);
                */

                let grid = this.win.document.createElement("grid");
                grid.setAttribute("id", "lidia-edit-grid");
                let columns = this.win.document.createElement("columns");
                let column1 = this.win.document.createElement("column");
                let column2 = this.win.document.createElement("column");
                let rows = this.win.document.createElement("rows");
                let row2 = this.win.document.createElement("row");
                let button = this.win.document.createElement("button");
                button.setAttribute(
                    "label",
                    getString('lidiaUpdateAnnotation.label')
                );
                button.addEventListener("click", () => {
                    this.updateAnnotation();
                });

                let emptydiv = this.win.document.createElement("div");
                row2.append(emptydiv, button);
                columns.append(column1, column2);
                for (field of this.fields) {
                    let row = this.win.document.createElement("row");
                    let label = this.win.document.createElement("label");
                    label.textContent = getString(field.label) + ":";
                    // So far we only support textbox
                    let input = this.win.document.createElement("textbox");
                    input.setAttribute("id", "lidia-" + field.id);
                    row.append(label, input);
                    rows.append(row);
                }
                rows.append(row2);
                grid.append(columns);
                grid.append(rows);

                let statusLabel = this.win.document.createElement("label");
                statusLabel.setAttribute("id", "lidia-status");

                hboxOpenWindow.append(statusLabel);
                hboxOpenWindow.append(grid);

                vbox.append(hboxOpenWindow);

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
            for (field of this.fields) {
                let value = data[field.id] !== undefined ? data[field.id] : "";
                this.win.document.getElementById("lidia-" + field.id).value =
                    value;
            }
            const grid = this.win.document.getElementById("lidia-edit-grid");
            grid.setAttribute("hidden", false);
            const statusLabel = this.win.document.getElementById("lidia-status");
            statusLabel.textContent = "Editing an annotation:";
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
            Zotero.Lidia.currentAnnotation = item;
            if (item.annotationComment) {
                data = Zotero.Lidia.Serialize.deserialize(item.annotationComment);
            } else {
                // If there is no comment, start with empty fields
                data = {}
            }
            if (data !== undefined) {
                log(JSON.stringify(data));
                this.activatePanel(data);
            } else {
                /* Data is undefined if it could not be parsed. Disable the
                 * panel to prevent a non-LIDIA comment from being changed */
                this.disablePanel();
            }
        },
        updateAnnotation: async function() {
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

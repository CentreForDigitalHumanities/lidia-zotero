if (!Zotero.Lidia.Panel) {
    Zotero.Lidia.Panel = {
        win: Zotero.Lidia.win,
        /* fields: definition of LIDIA annotation fields that we want to
         * edit with this Zotero extension. */

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

            let n = 0;
            let tabContainer = this.win.document.getElementById(`${this.win.Zotero_Tabs._selectedID}-context`);
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
            //tabContainer = this.win.document.getElementById(`${this.win.Zotero_Tabs._selectedID}-context`);

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
                for (const field of Zotero.Lidia.fields) {
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
                    field.element = input;
                }
                rows.append(row2);
                grid.append(columns);
                grid.append(rows);

                let statusLabel = this.win.document.createElement("label");
                statusLabel.setAttribute("id", "lidia-status");

                this.convertButton =
                    this.win.document.createElement("button");
                this.convertButton.setAttribute("id", "lidia-convert");
                this.convertButton.setAttribute(
                    "label", getString("lidiaConvert.label")
                );
                this.convertButton.addEventListener("click", () => {
                    this.convertToLidiaAnnotation();
                });

                vbox.append(statusLabel);
                vbox.append(this.convertButton);
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
            for (const field of Zotero.Lidia.fields) {
                let value = data[field.id] !== undefined ? data[field.id] : "";
                field.element.setAttribute("value", value);
                field.element.value = value;
            }
            const grid = this.win.document.getElementById("lidia-edit-grid");
            grid.setAttribute("hidden", false);
            this.convertButton.setAttribute("hidden", true);
            const statusLabel = this.win.document.getElementById("lidia-status");
            statusLabel.textContent = "Editing an annotation:";
            const argumentText =
                this.win.document.getElementById("lidia-argument-text");
            argumentText.textContent = item.annotationText;
        },
        disablePanel: function(noselection) {
            log("Disabling panel");
            const grid = this.win.document.getElementById("lidia-edit-grid");
            grid.setAttribute("hidden", true);
            const statusLabel = this.win.document.getElementById("lidia-status");
            if (noselection) {
                statusLabel.textContent = "Please select an annotation";
                this.convertButton.setAttribute("hidden", true);
            } else {
                statusLabel.textContent = "The annotation you selected is not a LIDIA annotation. Please select a LIDIA annotation or a new annotation without a comment.";
                this.convertButton.setAttribute("hidden", false);
            }
        },
        receiveAnnotation: function(item) {
            /**
             * Act upon the selection of an annotation by activating or
             * disactivating the panel.
             */
            Zotero.Lidia.currentAnnotation = item;
            let data;
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
            for (const field of Zotero.Lidia.fields) {
                data[field.id] =
                    this.win.document.getElementById("lidia-" + field.id).value;
            }
            const serialized = Zotero.Lidia.Serialize.serialize(data);
            item.annotationComment = serialized;
            await item.saveTx();
        },
        convertToLidiaAnnotation: async function() {
            /**
             * Convert the current (usually imported) annotation to
             * a LIDIA annotation
             */
            const item = Zotero.Lidia.currentAnnotation;
            // PDF comments on multiple lines are (currently) imported as
            // comments on a single line divided by a space
            const separatorIndex = item.annotationComment.indexOf(" ");
            let data;
            if (separatorIndex !== -1) {
                data = {
                    argname:
                        item.annotationComment.substring(0, separatorIndex),
                    description:
                        item.annotationComment.substring(separatorIndex + 1)
                };
            } else {
                data = {
                    description: item.annotationComment
                };
            }
            this.activatePanel(data, item);
        }
    }
}

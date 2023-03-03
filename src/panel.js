import React from "react";
import { createRoot } from 'react-dom/client';

import { deserialize, serialize } from "./serialize.js";
import TestPanel from "./TestPanel";

/**
 * Represents the panel. There should be only one panel for the application
 * as a whole - this panel is shared between Zotero tabs.
 */
export class LidiaPanel {
    /**
     * Create a LidiaPanel object. Can be called as soon as the Zotero main
     * window is ready. Does not yet build the panel UI.
     * @param {Window} win - The Zotero main window
     */
    constructor(win) {
        this.win = win;
    }

    /**
     * Build the panel. This should be called after the selection of a
     * tab with a PDF reader and can be called more than once.
     * After zotero-pdf-translate extension.
     */
    async buildSideBarPanel() {
        log("Building LIDIA panel");
        let tab = this.tab;
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
            this.saveButton = this.win.document.createElement("button");
            this.saveButton.setAttribute(
                "label",
                getString('lidiaUpdateAnnotation.label')
            );
            this.saveButton.setAttribute("flex", "1");
            this.saveButton.addEventListener("click", () => {
                this.saveAnnotation();
            });

            let emptydiv = this.win.document.createElement("div");
            row2.append(emptydiv, this.saveButton);
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
                let input;
                if (field.type === "input") {
                    input = createHElement("input");
                    input.setAttribute(
                        "style",
                        "margin: 0 5px 5px 0"
                    );
                }
                if (field.type === "textarea") {
                    input = createHElement("textarea");
                    //input.setAttribute("multiline", true);
                    input.setAttribute("rows", 7);
                    input.setAttribute(
                        "style",
                        "font-family: inherit; font-size: inherit; " +
                            "margin: 0 5px 5px 0"
                    );
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

            // ReferenceError: window is not defined
            let container = createHElement("div");
            let root = createRoot(container);
            root.render(<TestPanel />);
            panelInfo.append(container);

            this.tabPanel = panelInfo;
        }
        tabbox.querySelector("tabpanels").appendChild(panelInfo);
        tabbox.selectedIndex = Array.prototype.indexOf.call(
                tabbox.querySelector("tabs").childNodes,
                tabbox.querySelector("#lidia-tab")
        );
    }

    /**
     * Activate the LIDIA panel and fill the form with existing data.
     * @param {object} data - the data with properties for each field
     * @param {DataObject} item - the selected Zotero item
     */
    activatePanel(data, item) {
        for (const field of Zotero.Lidia.fields) {
            let value = data[field.id] !== undefined ? data[field.id] : "";
            field.element.setAttribute("value", value);
            field.element.value = value;
        }
        const grid = this.win.document.getElementById("lidia-edit-grid");
        grid.setAttribute("hidden", false);
        this.convertButton.setAttribute("hidden", true);
        const statusLabel = this.win.document.getElementById("lidia-status");
        const argumentText =
            this.win.document.getElementById("lidia-argument-text");
        argumentText.textContent = item.annotationText;
        if (item.isEditable()) {
            statusLabel.textContent = "Editing an annotation:";
            this.saveButton.setAttribute("disabled", false);
        } else {
            statusLabel.textContent = "Inspecting an annotation (readonly):";
            this.saveButton.setAttribute("disabled", true);
        }
    }

    /**
     * Deactivate the LIDIA panel and give the user a reason why the panel
     * is deactivated according to the selected item.
     * @param {DataObject} item - the selected Zotero item
     */
    disablePanel(item) {
        log("Disabling panel");
        const grid = this.win.document.getElementById("lidia-edit-grid");
        grid.setAttribute("hidden", true);
        const statusLabel = this.win.document.getElementById("lidia-status");
        if (!item) {
            statusLabel.textContent = "Please select an annotation";
            this.convertButton.setAttribute("hidden", true);
        } else {
            statusLabel.textContent = "The annotation you selected is not a LIDIA annotation. Please select a LIDIA annotation or a new annotation without a comment.";
            this.convertButton.setAttribute("hidden", false);
            if (item.isEditable() && !item.annotationIsExternal) {
                /* Only allow converting if annotation is editable (i.e.
                    * not owned by another user) and if it is not external
                    * (if it is external it is part of the PDF) */
                this.convertButton.setAttribute("disabled", false);
            } else {
                this.convertButton.setAttribute("disabled", true);
            }
        }
    }

    /**
     * Act upon the selection of an annotation by activating or
     * disactivating the panel.
     * @param {DataObject} item - the selected Zotero item
     */
    receiveAnnotation(item) {
        this.currentAnnotation = item;
        let data;
        if (item.annotationComment) {
            data = deserialize(item.annotationComment);
        } else {
            // If there is no comment, start with empty fields
            data = {}
        }
        if (data !== undefined) {
            this.activatePanel(data, item);
        } else {
            /* Data is undefined if it could not be parsed. Disable the
                * panel to prevent a non-LIDIA comment from being changed */
            this.disablePanel(item);
        }
    }

    /**
     * Serialize contents of the form and save to database
     */
    async saveAnnotation() {
        const item = this.currentAnnotation;
        if (item == null) return;
        let data = {};
        for (const field of Zotero.Lidia.fields) {
            data[field.id] =
                this.win.document.getElementById("lidia-" + field.id).value;
        }
        const serialized = serialize(data);
        item.annotationComment = serialized;
        await item.saveTx();
    }

    /**
     * Convert the current (usually imported) annotation to
     * a LIDIA annotation
     */
    async convertToLidiaAnnotation() {
        const item = this.currentAnnotation;
        /* The items we want to convert have the argument ID on the first
            * line and the description on the second, but after they are
            * imported into Zotero the newline is (apparently) replaced
            * by a space...
            */
        const separatorIndex = item.annotationComment.indexOf(" ");
        let data;
        if (separatorIndex !== -1) {
            let argname = item.annotationComment.substring(
                0, separatorIndex
            );
            if (argname.endsWith(":")) {
                argname = argname.slice(0, -1);
            }
            const description = item.annotationComment.substring(
                separatorIndex + 1
            );
            data = {argname, description};
        } else {
            data = {
                description: item.annotationComment
            };
        }
        this.activatePanel(data, item);
    }

    /**
     * Add the LIDIA button to each annotation.
     * After zotero-pdf-translate.
     */
    async addSelectEvents() {
        let reader = Zotero.Reader.getByTabID(this.win.Zotero_Tabs._selectedID);
        await reader._initPromise;
        const _document = reader._iframeWindow.document;
        for (const annotation of _document.getElementsByClassName("annotation")) {
            /* Find all annotations using the 'annotation' class and add
                annotation activation event listeners
                If we find a way to get the annotationItem after selecting
                it (which is not necessarily after clicking the annotation
                from the sidebar), that would be better.
            */
            if (annotation.getAttribute("lidiainit") === "true") {
                continue;
            }
            log("Found a new annotation element");
            annotation.setAttribute("lidiainit", "true");

            const itemKey = annotation.getAttribute(
                "data-sidebar-annotation-id"
            );
            const libraryID = (Zotero.Items.get(reader.itemID)).libraryID;
            const annotationItem = Zotero.Items.getByLibraryAndKeyAsync(
                libraryID,
                itemKey
            );

            annotation.addEventListener("click", (e) => {
                this.onAnnotationActivated(annotationItem, true);
                e.preventDefault();
            });
        }
    }

    /**
     * Callback function to be called after an annotation is selected
     * @param {Promise} itemPromise - Promise for a Zotero DataObject
     */
    async onAnnotationActivated(itemPromise) {
        log("Annotation activated :D");
        itemPromise.then((item) => {
            this.receiveAnnotation(item);
        });
    }
}

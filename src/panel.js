import React from "react";
import { createRoot } from 'react-dom/client';

import { deserialize, serialize } from "./serialize.js";
import AnnotationForm from "./components/AnnotationForm";

/* global window, Zotero, Lidia */

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

        const tabbox = tabContainer.querySelector("tabbox");
        tabbox.querySelector("tabs").appendChild(tab);

        let panelInfo = this.tabPanel;
        if (!panelInfo) {
            // The direct child of a XUL "tab" must also be XUL
            panelInfo = createXElement("tabpanel");
            panelInfo.setAttribute("id", "lidia-tabpanel");
            panelInfo.setAttribute("flex", "1");
            let formContainer = createHElement("div");
            formContainer.setAttribute("id", "lidia-annotation-form");
            formContainer.innerHTML = '<div style="margin: 2em;"><p>Please select an annotation</p></div>'
            let formRoot = createRoot(formContainer); // createRoot should be used only once per element
            this.formRoot = formRoot;
            panelInfo.append(formContainer);
            this.tabPanel = panelInfo;
        }
        tabbox.querySelector("tabpanels").appendChild(panelInfo);
        tabbox.selectedIndex = Array.prototype.indexOf.call(
                tabbox.querySelector("tabs").childNodes,
                tabbox.querySelector("#lidia-tab")
        );
    }


    /**
     * Load the annotation form with the current annotation properties.
     * TODO: lidiaData is no longer properly populated.
     */
    loadAnnotationForm(disabled, external, annotationText, lidiaData) {
        this.formRoot.render(<AnnotationForm
                            disabled={disabled}
                            external={external}
                            annotationText={annotationText}
                            data={lidiaData}
                            onSave={this.onSaveAnnotation.bind(this)}
                        />);
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
     * deactivating the panel.
     * @param {DataObject} item - the selected Zotero item
     */
    receiveAnnotation(item) {
        this.currentAnnotation = item;
        log('receiveAnnotation: 0')
        const external = item.annotationIsExternal;
        const editable = item.isEditable();
        let data;
        if (item.annotationComment) {
            data = deserialize(item.annotationComment);
        } else {
            // If there is no comment, start with empty fields
            data = {};
        }
        if (data !== undefined) {
            this.currentAnnotationData = data;
            // this.activatePanel(data, item);
            log('receiveAnnotation: 1: loadAnnotationForm with data');
            this.loadAnnotationForm(!editable, external, item.annotationText, data);
        } else {
            // Data is undefined if it could not be parsed. Disable the
            // panel to prevent a non-LIDIA comment from being changed
            this.currentAnnotationData = undefined;
            // this.disablePanel(item);
            log('receiveAnnotation: 2: loadAnnotationForm undefined');
            this.loadAnnotationForm(true, external, item.annotationText, undefined);
        }
    }

    /**
     * Serialize contents of the form and save to database
     */
    onSaveAnnotation(lidiaData) {
        if (this.currentAnnotation == undefined) {
            // Since this method is bound via React component, this should never happen?
            log('onSaveAnnotation: no currentAnnotation');
            return;
        } else {
            log('onSaveAnnotation: ' + lidiaData.toString());
            const serialized = serialize(lidiaData);
            this.currentAnnotation.annotationComment = serialized;
            this.currentAnnotation.saveTx();
        }
    }


    /**
     * Serialize contents of the form and save to database
     */
    async saveAnnotation() {
        const item = this.currentAnnotation;
        if (item == null) return;
        let data = {};
        for (const field of Lidia.fields) {
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
        // this.activatePanel(data, item);
        log('convertToLidiaAnnotation: loadAnnotationForm');
        this.loadAnnotationForm(true, true, item.annotationText, data);
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

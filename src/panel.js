import React from "react";
import { createRoot } from 'react-dom/client';

import { deserialize, serialize, getEmptyAnnotation } from "./serialize.js";
import AnnotationForm from "./components/AnnotationForm";
import PleaseSelect from "./components/PleaseSelect";

/* global window, document, Zotero, Lidia */

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


    /**
     * Build the panel. This should be called after the selection of a
     * tab with a PDF reader and can be called more than once.
     * After zotero-pdf-translate extension.
     */
    async buildSideBarPanel() {
        log("Building LIDIA panel");
        let tab = this.tab;
        if (!tab) {
            tab = document.createElement("tab");
            tab.setAttribute("id", "lidia-tab");
            tab.setAttribute(
                "label",
                'LIDIA'
            );
            this.tab = tab;
        }

        let n = 0;
        let tabContainer = document.getElementById(`${window.Zotero_Tabs._selectedID}-context`);
        while (!tabContainer || !tabContainer.querySelector("tabbox")) {
            if (n >= 500) {
                log("Waiting for reader failed");
                return;
            }
            // For attachments without parent item
            if (tabContainer.querySelector("description")) {
                tabContainer.innerHTML = "";
                const tabbox = window.document.createElement("tabbox");
                tabbox.className = "zotero-view-tabbox";
                tabbox.setAttribute("flex", "1");

                const tabs = window.document.createElement("tabs");
                tabs.className = "zotero-editpane-tabs";
                tabs.setAttribute("orient", "horizontal");
                tabbox.append(tabs);

                const tabpanels = window.document.createElement("tabpanels");
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

        // panel = this.tabPanel
        if (!this.tabPanel) {
            // The direct child of a XUL "tab" must also be XUL
            const panel = createXElement("tabpanel");
            panel.setAttribute("id", "lidia-tabpanel");
            panel.setAttribute("flex", "1");
            const hbox = createXElement("vbox");
            hbox.setAttribute("flex", "1");
            panel.append(hbox);
            let formContainer = createHElement("div");
            formContainer.setAttribute("id", "lidia-annotation-form");
            let formRoot = createRoot(formContainer); // createRoot should be used only once per element
            this.formRoot = formRoot;
            hbox.append(formContainer);
            this.tabPanel = panel;
            this.formRoot.render(<PleaseSelect status="noselection" />);
        }
        tabbox.querySelector("tabpanels").appendChild(this.tabPanel);
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
        let status;
        let convertible = false;
        if (!item) {
            status = 'noselection';
        } else if (item.annotationIsExternal) {
            status = 'external';
        } else {
            status = 'invalid';
            if (item.isEditable()) {
                convertible = true;
            }
        }
        this.formRoot.render(<PleaseSelect status={status} convertible={convertible} onConvert={this.convertToLidiaAnnotation.bind(this)} />);
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
            data = getEmptyAnnotation();
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
            this.disablePanel(item);
            log('receiveAnnotation: 2: loadAnnotationForm undefined');
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
                window.document.getElementById("lidia-" + field.id).value;
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
        this.loadAnnotationForm(false, false, item.annotationText, data);
    }

    /**
     * Add the LIDIA button to each annotation.
     * After zotero-pdf-translate.
     */
    async addSelectEvents() {
        let reader = Zotero.Reader.getByTabID(window.Zotero_Tabs._selectedID);
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
        itemPromise.then((item) => {
            this.receiveAnnotation(item);
        });
    }
}

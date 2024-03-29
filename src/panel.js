import React from "react";
import { createRoot } from 'react-dom/client';

import { 
    deserialize,
    getEmptyAnnotation,
    getLidiaDefaults,
    migrateLidiaObject,
    serialize
} from "./serialize.js";
import AnnotationForm from "./components/AnnotationForm";
import PleaseSelect from "./components/PleaseSelect";
import { getPreviousAnnotation } from "./continuation.js";
import { getAllLidiaAnnotations } from "./relations.js";

/* global window, document, Zotero, Lidia */

/**
 * Represents the panel. There should be only one panel for the application
 * as a whole - this panel is shared between Zotero tabs.
 */
export class LidiaPanel {
    tab;
    tabPanel;
    tabs;
    tabPanels;
    formRoots;
    currentAnnotation;
    currentLidiaData;
    currentLidiaDataChanged;
    annotationEvents = [];

    /**
     * Create a LidiaPanel object. Can be called as soon as the Zotero main
     * window is ready. Does not yet build the panel UI.
     */
    constructor() {
        this.annotationEvents = [];
        this.currentLidiaData = null;
        this.currentLidiaDataChanged = false;
        this.tabs = new Object();
        this.tabPanels = new Object();
        this.formRoots = new Object();
    }

    getSelectedTab() {
        return window.Zotero_Tabs._selectedID;
    }

    /**
     * Build the panel. This should be called after the selection of a
     * tab with a PDF reader and can be called more than once.
     * After zotero-pdf-translate extension.
     */
    async buildSideBarPanel() {
        /* Check if a sidebar tab and tab panel has already been created for 
         * the currently selected Zotero tab. If not, create it. */
        const selectedZoteroTab = this.getSelectedTab();
        let tab = this.tabs[selectedZoteroTab];
        let tabPanel = this.tabPanels[selectedZoteroTab];
        if (tab && tabPanel) {
            log(`LIDIA tab and tab panel already present for Zotero tab ${selectedZoteroTab}`);
            return;
        }
        log(`Creating LIDIA tab and tab panel for Zotero tab ${selectedZoteroTab}`);

        // Get the tab container (the container of the tabs in the pane on the right)
        const tabContainer = document.getElementById(`${selectedZoteroTab}-context`);
        let tabbox = tabContainer.querySelector("tabbox");
        if (!tabbox) {
            const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
            await sleep(1000);
            tabbox = tabContainer.querySelector("tabbox");
            log("Cannot create LIDIA panel, either the UI is not ready or the attachment has no parent item");
            return;
        }
        const tabPanels = tabbox.querySelector("tabpanels");
       
        // Create the tab (just the button)
        tab = createXElement("tab");
        tab.setAttribute("id", `lidia-tab-${selectedZoteroTab}`);
        tab.setAttribute(
            "label",
            'LIDIA'
        );
        this.tabs[selectedZoteroTab] = tab;
        tabbox.querySelector("tabs").appendChild(tab);

        // Create the panel
        tabPanel = createXElement("tabpanel");
        tabPanel.setAttribute("id", `lidia-tabpanel-${selectedZoteroTab}`);
        tabPanel.setAttribute("flex", "1");
        const hbox = createXElement("vbox");
        hbox.setAttribute("flex", "1");
        tabPanel.append(hbox);
        const formContainer = createHElement("div");
        formContainer.setAttribute("id", "lidia-annotation-form");
        // createRoot should be used only once per element
        const formRoot = createRoot(formContainer);
        hbox.append(formContainer);
        formRoot.render(<PleaseSelect status="noselection" />);
        this.tabPanels[selectedZoteroTab] = tabPanel;
        this.formRoots[selectedZoteroTab] = formRoot;
        
        tabPanels.appendChild(tabPanel);
    }


    getFormRoot() {
        return this.formRoots[this.getSelectedTab()];
    }


    /**
     * Load the annotation form with the current annotation properties.
     */
    async loadAnnotationForm(item, lidiaData) {
        // We already assume a pdfItem must have a bibliographic parent item
        const publication = item.parentItem.parentItem;
        const extra = publication.getField("extra");
        const defaultValues = getLidiaDefaults(extra);
        if (lidiaData.hasOwnProperty('arglang') && lidiaData.arglang === '' && defaultValues.default_arglang) {
            lidiaData = {...lidiaData, arglang: defaultValues.default_arglang};
        }
        log('Data after defaults:\n' + JSON.stringify(lidiaData));
        const annotationText = item.annotationText;
        const annotations = await getAllLidiaAnnotations(item.libraryID);
        const previousAnnotation = getPreviousAnnotation(item);
        let previousAnnotationData = undefined;
        if (previousAnnotation) {
            previousAnnotationData = deserialize(previousAnnotation.annotationComment);
        }
        // TODO: defaults can be removed when default subfield/linglevel is added to lidiaData
        this.getFormRoot().render(<AnnotationForm
                            annotationText={annotationText}
                            data={lidiaData}
                            defaults={defaultValues}
                            previousAnnotationData={previousAnnotationData}
                            onSave={this.onSaveAnnotation.bind(this)}
                            onEdit={this.onEditAnnotation.bind(this)}
                            annotations={annotations}
                            key={item.key}
                        />);
        this.currentLidiaData = null;
        this.activateAutosave();
    }

    destroy() {
        for (const event of this.annotationEvents) {
            event.element.removeEventListener("click", event.callback);
            event.element.setAttribute("lidiainit", "false");
        }
        for (const tab of Object.values(this.tabs)) {
            tab.remove();
        }
        for (const tabPanel of Object.values(this.tabPanels)) {
            tabPanel.remove();
        }
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
        this.getFormRoot().render(<PleaseSelect status={status} convertible={convertible} onConvert={this.convertToLidiaAnnotation.bind(this)} />);
    }

    /**
     * Act upon the selection of an annotation by activating or
     * deactivating the panel.
     * @param {DataObject} item - the selected Zotero item
     */
    async receiveAnnotation(item) {
        // First autosave the current annotation
        this.autosave();
        this.currentAnnotation = item;
        log('receiveAnnotation: 0')
        let data;
        if (item.annotationComment) {
            data = deserialize(item.annotationComment);
        } else {
            // If there is no comment, start with empty fields
            data = getEmptyAnnotation();
        }
        if (data !== undefined) {
            log('receiveAnnotation: 1: loadAnnotationForm with data');
            migrateLidiaObject(data);
            await this.loadAnnotationForm(item, data);
        } else {
            // Data is undefined if it could not be parsed. Disable the
            // panel to prevent a non-LIDIA comment from being changed
            this.disablePanel(item);
            log('receiveAnnotation: 2: loadAnnotationForm undefined');
        }
    }

    /**
     * Serialize contents of the form and save to database
     */
    onSaveAnnotation(lidiaData) {
        if (this.currentAnnotation === undefined) {
            // Since this method is bound via React component, this should never happen?
            log('onSaveAnnotation: no currentAnnotation');
        } else {
            log('onSaveAnnotation: ' + lidiaData.toString());
            this.currentAnnotation.annotationComment = serialize(lidiaData);
            this.currentAnnotation.saveTx();
        }
    }


    /**
     * Save current state of form for autosave
     */
    onEditAnnotation(lidiaData) {
        this.currentLidiaData = lidiaData;
        this.currentLidiaDataChanged = true;
    }

    /**
     * Perform automatic save based on this.lidiaData
     */
    autosave() {
        if (this.currentAnnotation && this.currentLidiaData && this.currentLidiaDataChanged) {
            log("Performing an automatic save");
            this.onSaveAnnotation(this.currentLidiaData);
            this.currentLidiaDataChanged = false;
        }
    }

    activateAutosave() {
        log("Activating autosave");
        this.deactivateAutosave();
        this.autosaveInterval = setInterval(() => {this.autosave()}, 1000);
    }

    deactivateAutosave() {
        if (this.autosaveInterval) {
            log("Disabling autosave");
            clearInterval(this.autosaveInterval)
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
        item.annotationComment = serialize(data);
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
        let data = getEmptyAnnotation();
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
            data.argname = argname;
            data.description = description;
        } else {
            data.description = item.annotationComment;
        }
        log('convertToLidiaAnnotation: loadAnnotationForm');
        await this.loadAnnotationForm(item, data);
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

            const callback = (e) => {
                this.onAnnotationActivated(annotationItem, true);
                e.preventDefault();
            };
            annotation.addEventListener("click", callback);
            this.annotationEvents.push({
                element: annotation, callback: callback
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

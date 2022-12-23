if (!Zotero.Lidia.Selecting) {
    Zotero.Lidia.Selecting = {
        addSelectEvents: async function() {
            /** Add the LIDIA button to each annotation.
             * After zotero-pdf-translate.
             */
            let win = Zotero.getMainWindow();
            let reader = Zotero.Reader.getByTabID(win.Zotero_Tabs._selectedID);
            await reader._initPromise;
            const _document = reader._iframeWindow.document;
            for (const annotation of _document.getElementsByClassName("annotation")) {
                /* Find all annotations through the more buttons and add the
                 * LIDIA button to all that do not yet have a LIDIA button */
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
                /*
                 * If we find a way to get the annotationItem after selecting
                 * it (which is not necessarily after clicking the annotation
                 * from the sidebar), that would be better.
                 */
            }
        },
        onAnnotationActivated: async function(itemPromise) {
            log("Annotation activated");
            itemPromise.then((item) => {
                Zotero.Lidia.Panel.receiveAnnotation(item);
            });
        }
    }
}

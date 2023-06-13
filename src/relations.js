import { deserialize } from "./serialize.js";

/* global window, document, Zotero, Lidia */

/**
 * Get an array of all annotations in a given Zotero library
 * @param {number} libraryID - the requested library ID
 * @return {Array.<Object>} - a list of all annotations as JavaScript objects
 */
export async function getAllLidiaAnnotations(libraryID) {
    if (!libraryID) {
        libraryID = Zotero.Libraries.userLibraryID;
    }
    /* Find all items in the requested library; get their attached PDFs and
     * in turn all their annotations. Check for each annotation if it is a
     * LIDIA annotation and return a list of all of these
     */
    const s = new Zotero.Search();
    s.libraryID = libraryID;
    s.addCondition('recursive', 'true');
    const itemIDs = await s.search();
    const items = await Zotero.Items.getAsync(itemIDs);
    const lidiaAnnotations = [];
    for (const item of items) {
        if (item.isRegularItem()) {
            let attachmentIDs = item.getAttachments();
            for (let id of attachmentIDs) {
                let attachment = Zotero.Items.get(id);
                if (attachment.isFileAttachment() && attachment.attachmentContentType === 'application/pdf') {
                    let annotations = attachment.getAnnotations();
                    for (let annotation of annotations) {
                        if (annotation.annotationComment) {
                            const annotationObj = deserialize(
                                annotation.annotationComment
                            );
                            if (
                                annotationObj !== undefined &&
                                annotationObj.argcont !== true
                            ) {
                                annotationObj.documentTitle = item.getField('title')
                                annotationObj.zoteroKey = annotation.key;
                                lidiaAnnotations.push(annotationObj);
                            }
                        }
                    }
                } else {
                    log(JSON.stringify(attachment));
                }
            }
        }
    }
    return lidiaAnnotations;
}

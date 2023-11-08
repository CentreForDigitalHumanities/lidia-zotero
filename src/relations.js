import { deserialize, serialize, migrateLidiaObject } from "./serialize.js";

/* global window, document, Zotero, Lidia */

/**
 * Get an array of all annotations in a given Zotero library
 * @param {number} libraryID - the requested library ID
 * @param {boolean} includeContinuationAnnotations
 * @param {boolean} includeZoteroObjects
 * @return {Array.<Object>} - a list of all annotations as JavaScript objects
 */
export async function getAllLidiaAnnotations(
    libraryID,
    includeContinuationAnnotations = false,
    includeZoteroObjects = false
) {
    if (!libraryID) {
        libraryID = Zotero.Libraries.userLibraryID;
    }
    log(`Making a list of all LIDIA items in library with ID ${libraryID}`);
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
                                (includeContinuationAnnotations || 
                                    annotationObj.argcont !== true)
                            ) {
                                if (includeZoteroObjects) {
                                    annotationObj.zoteroObject = annotation;
                                }
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

export async function migrateAllLidiaAnnotations(libraryID, dryRun = false) {
    const annotations = await getAllLidiaAnnotations(libraryID, true, true);
    let count = 0;
    for (annotation of annotations) {
        const obj = annotation.zoteroObject;
        // Migrate the object
        migrateLidiaObject(annotation);
        // Remove attributes that do not belong to the annotation
        delete annotation.documentTitle;
        delete annotation.zoteroKey;
        delete annotation.zoteroObject;
        // Serialize and save
        const newComment = serialize(annotation);
        if (obj.annotationComment.trim() !== newComment.trim()) {
            log("Old comment:");
            log("'" + obj.annotationComment + "'");
            log("New comment:");
            log("'" + newComment + "'");
            if (!dryRun) {
                obj.annotationComment = newComment;
                await obj.saveTx();
            }
            count++;
        }
    }
    const result = {
        allLidiaAnnotations: annotations.length,
        migratedLidiaAnnotations: count
    };
    return result;
}

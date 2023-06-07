import { deserialize } from "./serialize.js";

/* global window, document, Zotero, Lidia */

/**
 * Return the annotation that comes before the specified annotation.
 * If this is an annotation that itself is a continuation annotation,
 * return the annotation before that.
 * @param {ZoteroItem} item - the specified annotation
 * @return {ZoteroItem} - the previous annotation
 */
export function getPreviousAnnotation(item) {
    // Get all annotations in current document
    if (item.parentItem.isFileAttachment()) {
        const pdfItem = item.parentItem;
        const annotations = pdfItem.getAnnotations(includeTrashed=false);
        /* Sort annotations according to annotationSortIndex
        * (It seems that we already get the annotations in the right order,
        * but not sure if this is guaranteed) */
        annotations.sort((x, y) => x.annotationSortIndex - y.annotationSortIndex);
        let currentIndex = 0;
        let found = false;
        for (; currentIndex < annotations.length; currentIndex++) {
            const currentItem = annotations[currentIndex];
            if (currentItem.key === item.key) {
                found = true;
                break;
            }
        }
        if (!found || currentIndex === 0) {
            /* Return undefined if the current annotation cannot be found
            * (which is not supposed to happen) or if it has 0 as its index,
            * which means that there is no previous annotation. */
            return null;
        }
        let previousIndex = currentIndex - 1;
        found = false;
        for (; previousIndex >= 0; previousIndex--) {
            const previousItem = annotations[previousIndex];
            const data = deserialize(previousItem.annotationComment);
            if (data && !data.argcont) {
                found = true;
                break;
            }
        }
        if (found) {
            return annotations[previousIndex];
        } else {
            return null;
        }
    } else {
        log(JSON.stringify(item.parentItem))
        return null;
    }
}

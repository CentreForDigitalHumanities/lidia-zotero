/* global window, document, Zotero, Lidia */

/**
 * @param {ZoteroItem} item
 * @return {ZoteroItem}
 */
export function getPreviousAnnotation(item) {
    // Get all annotations in current document
    const pdfItem = item.parentItem;
    const annotations = pdfItem.getAnnotations(includeTrashed=false);
    /* Sort annotations according to annotationSortIndex
     * (It seems that we already get the annotations in the right order,
     * but not sure if this is guaranteed) */
    annotations.sort((x, y) => {
        if (x.annotationSortIndex < y.annotationSortIndex) {
            return -1;
        } else if (x.annotationSortIndex > y.annotationSortIndex) {
            return 1;
        } else {
            return 0;
        }
    });
    let currentIndex = 0;
    let found = false;
    for (; currentIndex < annotations.length; currentIndex++) {
        const currentItem = annotations[currentIndex];
        if (currentItem.key === item.key) {
            found = true;
            log('Current annotation found!');
            break;
        }
    }
    if (!found || currentIndex === 0) {
        /* Return undefined if the current annotation cannot be found
         * (which is not supposed to happen) or if it has 0 as its index,
         * which means that there is no previous annotation. */
        return undefined;
    }
    let previousIndex = currentIndex - 1;
    found = false;
    for (; previousIndex >= 0; previousIndex--) {
        const previousItem = annotations[previousIndex];
        // TODO: check if this item is a continuation; if so go back more
        found = true;
        break;
    }
    if (found) {
        return annotations[previousIndex];
    } else {
        return undefined;
    }
}

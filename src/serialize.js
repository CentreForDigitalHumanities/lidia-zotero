import { parse, stringify } from 'yaml';

/* global window, Zotero, Lidia */

/**
 * Convert a LIDIA item from the way it is saved as a Zotero annotation comment
 * into a LIDIA JavaScript object.
 * @param {string} text - the Zotero annotation comment
 * @return {Object} the LIDIA JavaScript object, or undefined if text
 *                  does not represent a LIDIA annotation
 */
export function deserialize(text) {
    let lidiaObject = undefined;
    const fieldIds = Lidia.fields.map(obj => obj.id);
    if (text.startsWith("~~~LIDIA~~~")) {
        // Keep the old format for now for compatiblity reasons
        let lines = text.split("\n");
        let data = {}
        for (const line of lines) {
            const separatorIndex = line.indexOf(" = ");
            if (separatorIndex !== -1) {
                const key = line.substring(0, separatorIndex);
                /* We cannot use String.replaceAll because of the
                    * Firefox version */
                if (fieldIds.includes(key)) {
                    const value = line.substring(
                        separatorIndex + " = ".length
                    ).replace(/\\n/g, '\n');
                    data[key] = value;
                }
            }
        }
        lidiaObject = data;
    } else if (text.startsWith("~~~~LIDIA~~~~")) {
        // Simply use the YAML parser
        lidiaObject = parse(text.slice("~~~~LIDIA~~~~\n".length));
    }
    if (typeof lidiaObject !== "undefined") {
        // If there are missing fields, assign an empty string to them
        for (const fieldId of fieldIds) {
            if (typeof lidiaObject[fieldId] === "undefined") {
                lidiaObject[fieldId] = '';
            }
        }
        return lidiaObject;
    } else {
        // Not a LIDIA annotation
        return undefined;
    }
}

/**
 * Create a new LIDIA JavaScript object where all fields are empty
 * @return {Object} - the empty LIDIA JavaScript object
 */
export function getEmptyAnnotation() {
    const fieldIds = Lidia.fields.map(obj => obj.id);
    const data = {};
    for (const fieldId of fieldIds) {
        data[fieldId] = '';
    }
    return data;
}

/**
 * Convert a LIDIA JavaScript object in a string in order to save it as a
 * Zotero annotation comment
 * @param {Object} data - the LIDIA JavaScript object
 * @return {string} - a Zotero annotation comment
 */
export function serialize(data) {
    let output = "~~~~LIDIA~~~~\n";
    output += stringify(data);
    return output;
}

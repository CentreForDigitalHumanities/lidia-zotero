/* global window, Zotero, Lidia */

/**
 * Convert a LIDIA item from the way it is saved as a Zotero annotation comment
 * into a LIDIA JavaScript object.
 * @param {string} text - the Zotero annotation comment
 * @return {Object} the LIDIA JavaScript object, or undefined if text
 *                  does not represent a LIDIA annotation
 */
export function deserialize(text) {
    if (text.startsWith("~~~LIDIA~~~")) {
        let lines = text.split("\n");
        let data = {}
        const fieldIds = Lidia.fields.map(obj => obj.id);
        log(fieldIds.length);
        for (const line of lines) {
            const separatorIndex = line.indexOf(" = ");
            if (separatorIndex !== -1) {
                const key = line.substring(0, separatorIndex);
                /* We cannot use String.replaceAll because of the
                    * Firefox version */
                if (fieldIds.includes(key)) {
                    log(key);
                    const value = line.substring(
                        separatorIndex + " = ".length
                    ).replace(/\\n/g, '\n');
                    data[key] = value;
                }
            }
        }
        return data;
    } else {
        // Not a LIDIA annotation
        return undefined;
    }
}

/**
 * Convert a LIDIA JavaScript object in a string in order to save it as a
 * Zotero annotation comment
 * @param {Object} data - the LIDIA JavaScript object
 * @return {string} - a Zotero annotation comment
 */
export function serialize(data) {
    let output = "~~~LIDIA~~~\n";
    const keys = Object.keys(data);
    for (const key of keys) {
        const value = data[key].replace(/\n/g, '\\n');
        output += key + " = " + value + "\n";
    }
    return output;
}

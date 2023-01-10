if (!Zotero.Lidia.Serialize) {
    Zotero.Lidia.Serialize = {
        deserialize: function(text) {
            if (text.startsWith("~~~LIDIA~~~")) {
                let lines = text.split("\n");
                let data = {}
                for (const line of lines) {
                    const separatorIndex = line.indexOf(" = ");
                    if (separatorIndex !== -1) {
                        const key = line.substring(0, separatorIndex);
                        // String.replaceAll is too new
                        const value = line.substring(
                            separatorIndex + " = ".length
                        ).replace(/\\n/g, '\n');
                        data[key] = value;
                    }
                }
                return data;
            } else {
                // Not a LIDIA annotation
                return undefined;
            }
        },
        serialize: function(data) {
            let output = "~~~LIDIA~~~\n";
            const keys = Object.keys(data);
            for (const key of keys) {
                const value = data[key].replace(/\n/g, '\\n');
                output += key + " = " + value + "\n";
            }
            return output;
        }
    }
}

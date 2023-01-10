if (!Zotero.Lidia.Serialize) {
    Zotero.Lidia.Serialize = {
        deserialize: function(text) {
            if (text.startsWith("~~~LIDIA~~~")) {
                let lines = text.split("\n");
                let data = {}
                for (const line of lines) {
                    const splitted = line.split(' = ', 2);
                    if (splitted.length == 2) {
                        data[splitted[0]] = splitted[1];
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
                output += key + " = " + data[key] + "\n";
            }
            return output;
        }
    }
}

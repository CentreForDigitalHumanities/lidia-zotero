if (!Zotero.Lidia.Serialize) {
    Zotero.Lidia.Serialize = {
        deserialize: function(text) {
            if (text.startsWith("~~~LIDIA~~~")) {
                lines = text.split("\n");
                data = {}
                for (line of lines) {
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
            for (key of keys) {
                output += key + " = " + data[key] + "\n";
            }
            return output;
        }
    }
}

import { serialize, deserialize, getLidiaDefaults } from "./serialize";

/* global window, Zotero, Lidia */

class LidiaItemError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "LidiaItemError";
    }
}

class LidiaItemData {
    argcont: boolean = false;
    argname: string = "";
    pagestart: string = "";
    pageend: string = "";
    arglang: string = "";
    lexiconterm: object = {};
    description: string = "";
    relationType: string = "";
    relationTo: string = "";

    loadFromComment(commentText: string) {
        const deserializedData = deserialize(commentText);
        if (typeof deserializedData === "undefined") {
            throw new LidiaItemError(
                "Cannot deserialize: not a LIDIA annotation"
            );
        }
        const fields: string[] = Object.getOwnPropertyNames(this);
        for (const field of fields) {
            const value = deserializedData[field]
            if (value) {
                this[field] = value;
            }
        }
    }

    convertToComment(): string {
        return serialize(this);
    }

    applyDefaults(extraText: string) {
        const defaultValues = getLidiaDefaults(extraText);
        const fields: string[] = defaultValues.getOwnPropertyNames(this);
        for (const field of fields) {
            const value = defaultValues[field];
            
        }
    }
}


class LidiaItem {
    zoteroItem: Zotero.Item;
    data: LidiaItemData;
    isLidiaItem: boolean;
    isNewItem: boolean;

    constructor(zoteroItem: Zotero.Item) {
        if (!zoteroItem.isAnnotation) {
            throw new LidiaItemError(
                "Trying to create a LidiaItem from a Zotero item that is " +
                "not an annotation"
            );
        }
        this.zoteroItem = zoteroItem;
        this.#read();
    }

    async save() {
        const comment = this.data.convertToComment();
        this.zoteroItem.annotationComment = comment;
        await this.zoteroItem.saveTx();
    }

    #read(): void {
        // If annotationComment is empty, start with empty data
        this.data = new LidiaItemData();
        const annotationText = this.zoteroItem.annotationText;
        if (annotationText.trim() !== "") {
            this.isNewItem = false;
            // Try reading the annotation as if it were a LIDIA item
            try {
                this.data.loadFromComment(this.zoteroItem.annotationText);
            } catch (e) {
                this.isLidiaItem = false;
            }
        } else {
            this.isNewItem = true;
        }
    }

    async getPreviousLidiaItem(): Promise<LidiaItem | null> {
        return null; // TODO
    }
}

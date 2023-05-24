import { serialize, deserialize, getLidiaDefaults } from "./serialize";
import { getPreviousAnnotation } from "./continuation";

/* global window, Zotero, Lidia */

export class LidiaItemError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "LidiaItemError";
    }
}

export class LidiaItemData {
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


export class LidiaItem {
    zoteroItem: Zotero.Item;
    data: LidiaItemData;
    isNonLidiaItem: boolean;
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

    async save(force: boolean = false) {
        if (!force && this.isNonLidiaItem) {
            throw new LidiaItemError(
                "Cannot save because annotation contains non-LIDIA data. " +
                "Use force=true to override."
            );
        }
        const comment = this.data.convertToComment();
        this.zoteroItem.annotationComment = comment;
        await this.zoteroItem.saveTx();
    }

    #read(): void {
        // If annotationComment is empty, start with empty data
        this.data = new LidiaItemData();
        const annotationComment = this.zoteroItem.annotationComment;
        if (annotationComment !== null || annotationComment.trim() !== "") {
            this.isNewItem = false;
            // Try reading the annotation as if it were a LIDIA item
            try {
                this.data.loadFromComment(annotationComment);
                this.isNonLidiaItem = false;
            } catch (e) {
                if (e instanceof LidiaItemError) {
                    // Comment could not be parsed, so it is not a LIDIA
                    // item and should be left untouched
                    this.isNonLidiaItem = true;
                } else {
                    // Other error; propagate it
                    throw e;
                }
            }
        } else {
            // If the annotation contains no or empty comment, mark as new
            // item but not as a NonLidiaItem
            this.isNewItem = true;
            this.isNonLidiaItem = false;
        }
    }

    getPreviousLidiaItem(): LidiaItem | null {
        return getPreviousAnnotation(this.zoteroItem);
    }

    toString(): string {
        let lidiaInfo: string;
        if (this.isNewItem) {
            lidiaInfo = 'New item';
        } else if (this.isNonLidiaItem) {
            lidiaInfo = 'Not a LIDIA annotation';
        } else {
            lidiaInfo = JSON.stringify(this.data);
        }
        return `LIDIA item:\nZotero key: ${this.zoteroItem.key}\n${lidiaInfo}`;
    }
}

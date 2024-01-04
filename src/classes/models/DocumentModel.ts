// Note: DocumentModel class

import { TFile } from "obsidian";
import { BaseModel } from "./BaseModel";
import IPrjModel from "../interfaces/IPrjModel";
import DocumentData from "../types/DocumentData";
import Global from "../global";

export class DocumentModel extends BaseModel<DocumentData> implements IPrjModel<DocumentData> {
    private fileCache = Global.getInstance().fileCache;

    private _relatedFiles: DocumentModel[] | null | undefined = undefined;

    constructor(file: TFile) {
        super(file, DocumentData, DocumentData.yamlKeyMap);
    }

    public get data(): Partial<DocumentData> {
        return this._data;
    }
    public set data(value: Partial<DocumentData>) {
        this._data = value;
    }

    public get relatedFiles(): DocumentModel[] | null {
        if (this._relatedFiles === undefined) {
            this._relatedFiles = [];
            const relatedFiles = this.data.relatedFiles;
            if (relatedFiles) {
                relatedFiles.map((relatedFile) => {
                    const file = this.fileCache.findFileByWikilink(relatedFile);
                    if (file instanceof TFile && file.path !== this.file.path) {
                        this._relatedFiles?.push(new DocumentModel(file));
                    }
                    return null;
                });
            } else { this._relatedFiles = null; }
        }
        return this._relatedFiles;
    }
}


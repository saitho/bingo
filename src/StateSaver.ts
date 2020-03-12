import {BingoField, BingoFieldJSON} from "./BingoField";

export class StateSaver {
    protected currentVersion = 1;

    protected dataStorageKey = 'bingoboard';

    /**
     * Saves the current state of the board into local storage
     */
    public saveState(data: HTMLElement, rows: Number, cols: Number) {
        const fields = [];
        data.querySelectorAll('bingo-field').forEach((field: BingoField) => {
            fields.push(field.toJSON());
        });

        localStorage.setItem(this.dataStorageKey, JSON.stringify({
            version: this.currentVersion,
            fields: fields,
            rows: rows,
            cols: cols
        }));
    }

    public getState(): State {
        const content = localStorage.getItem(this.dataStorageKey);
        try {
            const storageObject: State = JSON.parse(content);
            if (!storageObject) {
                return null;
            }
            if (storageObject.version !== this.currentVersion) {
                // todo: migration if we have later versions...
            }

            return storageObject;
        } catch (e) {
            return null;
        }
    }

    /**
     * @deprecated
     * @param container
     */
    public loadState(container: HTMLElement): boolean {
        const content = localStorage.getItem(this.dataStorageKey);
        try {
            const storageObject: State = JSON.parse(content);
            if (!storageObject) {
                return false;
            }
            if (storageObject.version !== this.currentVersion) {
                // todo: migration if we have later versions...
            }

            container.innerHTML = '';
            for (let i = 0; i < storageObject.rows; i++) {
                for (let j = 0; j < storageObject.cols; j++) {

                }
            }

            for (const field of storageObject.fields) {
                container.appendChild(BingoField.fromJSON(field));
            }

            return true;
        } catch (e) {
            return false;
        }
    }
}

export interface State {
    version: Number,
    fields: BingoFieldJSON[],
    rows: Number,
    cols: Number
}
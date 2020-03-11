export class CardStorage {
    static data: string[] = [];
    static pos = 0;

    static init(data: string[]) {
        this.shuffleArray(data);
        this.data = data;
        this.pos = 0;
    }

    protected static shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    static isEmpty(): boolean {
        return this.pos >= this.data.length;
    }

    static countRemaining(): Number {
        return this.data.length - this.pos;
    }

    static countAll(): Number {
        return this.data.length;
    }

    static getNextItem(): string {
        return this.data[this.pos++];
    }
}
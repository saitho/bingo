import {CardStorage} from "./CardStorage";

export class BingoField extends HTMLElement {

    protected text = '';

    checkEvent: CustomEvent = null;
    swapEvent: CustomEvent = null;

    constructor(text: string = '', attributes: BingoFieldAttributes = {reroll: true, toggleable: true, checked: false}) {
        super();

        this.text = text;

        for (let key in attributes) {
            if (!attributes.hasOwnProperty(key)) {
                continue;
            }
            if (attributes[key]) {
                this.setAttribute(key, '');
            } else {
                this.removeAttribute(key);
            }
        }

        const inner = document.createElement('div');
        inner.classList.add('flip-card-inner');

        // Extract text from innerHTML if present (when restoring from LocalStorage)
        const hasContent = this.innerText.trim().length > 0;
        if (hasContent) {
            this.text = this.innerText.trim();
            this.classList.add('flip');
        }

        inner.classList.add('flip-card-inner--empty-front');
        inner.innerHTML = `<div class="flip-card__content flip-card__content--front">
            ${this.getRefreshButton()}
            <span class="text"></span>
         </div>
         <div class="flip-card__content flip-card__content--back">
            ${this.getRefreshButton()}
            <span class="text">${this.text}</span>
         </div>`;

        this.innerHTML = '';
        this.appendChild(inner);

        this.checkEvent = new CustomEvent("bingoFieldChecked", {
            bubbles: true,
            cancelable: false,
            composed: true
        });

        this.swapEvent = new CustomEvent("bingoFieldSwapped", {
            bubbles: true,
            cancelable: false,
            composed: true
        });
    }

    // fires after the element has been attached to the DOM
    connectedCallback() {

        if (this.hasAttribute('toggleable')) {
            this.addEventListener(
                'click',
                (e) => {
                    const clickedElement = e.target as Element;
                    if (
                        clickedElement.classList.contains('refresh-button') ||
                        clickedElement.parentElement.classList.contains('refresh-button')
                    ) {
                        return;
                    }
                    this.checkCard();
                }
            );
        }

        const refreshButtons = this.querySelectorAll('button.refresh-button');
        if (refreshButtons.length) {
            const that = this;
            refreshButtons.forEach((e) => e.addEventListener('click', async () => {
                await that.swapCard(CardStorage.getNextItem())
            }));
        }
    }

    checkCard() {
        this.toggleAttribute('checked');
        this.dispatchEvent(this.checkEvent);
    }

    private getRefreshButton() {
        if (!this.hasAttribute('reroll')) {
            return '';
        }
        return `<button class="refresh-button"><i class="fas fa-redo"></i></button>`;
    }

    /**
     * Sets a text on a given card side
     * @param text
     * @param hiddenSide
     * @param restoreRefreshButton
     */
    protected setCardText(text: string, hiddenSide = false, restoreRefreshButton = false) {
        const sides = ['front', 'back'];
        if (hiddenSide) {
            sides.reverse();
        }

        const side = this.classList.contains('flip') ? sides[1] : sides[0];
        const selector = '.flip-card__content--' + side;
        let contentArea = this.querySelector(selector);

        const contentEmpty = 'flip-card-inner--empty-' + side;
        contentArea.closest('.flip-card-inner').classList.remove(contentEmpty);
        contentArea.querySelector('.text').innerHTML = text;

        this.removeAttribute('checked');

        if (restoreRefreshButton) {
            if (!contentArea.querySelector('button.refresh-button')) {
                contentArea.innerHTML = this.getRefreshButton() + contentArea.innerHTML;
            }
        }
    }

    public swapCard(text: string, addRefreshBtn =false) {
        return new Promise<void>((resolve) => {
            if (!this.hasAttribute('toggleable')) {
                resolve();
                return;
            }

            // Set content on hidden slide
            this.setCardText(text, true, addRefreshBtn);

            // Toggle
            this.classList.toggle('flip');
            this.removeAttribute('checked');

            setTimeout(() => {
                // Clear contents from now hidden side
                this.setCardText('', true,  addRefreshBtn);
                this.dispatchEvent(this.swapEvent);
                resolve();
            }, 100);
        });
    }

    public reset() {
        return new Promise<void>((resolve) => {
            const isFlipped = this.classList.contains('flip');
            const frontSelector = '.flip-card__content--front';
            const backSelector = '.flip-card__content--back';
            const oldContentArea = this.querySelector(isFlipped ? frontSelector : backSelector);
            const newContentArea = this.querySelector(isFlipped ? frontSelector : backSelector);

            // Hide content on other side and flip
            const emptyClass = isFlipped ? 'flip-card-inner--empty-front' : 'flip-card-inner--empty-back';
            newContentArea.closest('.flip-card-inner').classList.add(emptyClass);
            this.classList.toggle('flip');

            setTimeout(() => {
                // if tile is now flipped, hide the other side as well to get the initial state
                if (this.classList.contains('flip')) {
                    const emptyClassOld = isFlipped ? 'flip-card-inner--empty-back' : 'flip-card-inner--empty-front';
                    oldContentArea.closest('.flip-card-inner').classList.add(emptyClassOld);
                    this.classList.toggle('flip');
                    newContentArea.closest('.flip-card-inner').classList.remove(emptyClass);
                }
                resolve();
            }, 300);
        });
    }

    toJSON(): BingoFieldJSON {
        return {
            text: this.text,
            attributes: {
                reroll: this.hasAttribute('reroll'),
                toggleable: this.hasAttribute('toggleable'),
                checked: this.hasAttribute('checked')
            }
        };
    }

    static fromJSON(jsonObject: BingoFieldJSON): BingoField {
        return new this(jsonObject.text, {
            checked: jsonObject.attributes.checked,
            toggleable: jsonObject.attributes.toggleable,
            reroll: jsonObject.attributes.reroll,
        });
    }
}

export interface BingoFieldAttributes {
    reroll?: boolean,
    toggleable?: boolean,
    checked?: boolean
}

export interface BingoFieldJSON {
    text: string,
    attributes: BingoFieldAttributes
}
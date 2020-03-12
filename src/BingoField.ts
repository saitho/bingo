import {CardStorage} from "./CardStorage";

export class BingoField extends HTMLElement {

    // TODO: why is this needed?! without constructor seems to be called twice and fieldText is empty
    protected text = '';

    checkEvent: CustomEvent = null;
    swapEvent: CustomEvent = null;

    constructor(fieldText: string = '', attributes: BingoFieldAttributes = {reroll: true, toggleable: true, checked: false}) {
        super();

        // TODO: why is this needed?! without constructor seems to be called twice and fieldText is empty
        this.text = fieldText;

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
        inner.classList.add('flip-card-inner', 'flip-card-inner--empty-front');
        inner.innerHTML = `<div class="flip-card__content flip-card__content--front">
            <span class="text"></span>
         </div>
         <div class="flip-card__content flip-card__content--back">
            <span class="text"></span>
         </div>`;

        this.appendChild(inner);
        this.setCardText(fieldText, true);

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
    }

    /**
     * Returns text from card side that is currently shown
     */
    getActiveText(): string {
        const side = this.classList.contains('flip') ? 'back' : 'front';
        return this.querySelector('.flip-card__content--' + side + ' .text').textContent;
    }

    /**
     * Sets check state for card
     */
    checkCard() {
        this.toggleAttribute('checked');
        this.dispatchEvent(this.checkEvent);
    }

    /**
     * Returns HTML code for refresh button if it is enabled
     */
    private getRefreshButton() {
        if (!this.hasAttribute('reroll')) {
            return '';
        }
        return `<button class="refresh-button"><i class="fas fa-redo"></i></button>`;
    }

    /**
     * Sets a text on a given card side
     * @param fieldText
     * @param hiddenSide
     */
    protected setCardText(fieldText: string, hiddenSide = false) {
        const sides = ['front', 'back'];
        if (hiddenSide) {
            sides.reverse();
        }

        const side = this.classList.contains('flip') ? sides[1] : sides[0];
        const selector = '.flip-card__content--' + side;
        let contentArea = this.querySelector(selector);

        const contentEmpty = 'flip-card-inner--empty-' + side;
        contentArea.closest('.flip-card-inner').classList.remove(contentEmpty);
        contentArea.querySelector('.text').innerHTML = fieldText;

        if (!contentArea.querySelector('button.refresh-button')) {
            contentArea.innerHTML = this.getRefreshButton() + contentArea.innerHTML;
            const refreshButtons = contentArea.querySelector('button.refresh-button');
            if (refreshButtons) {
                const that = this;
                refreshButtons.addEventListener('click', async () => {
                    await that.swapCard(CardStorage.getNextItem())
                });
            }
        }
    }

    /**
     * Set text on non-visible side and flips card to other side
     * Also clears checked state
     * @param cardText
     */
    public swapCard(cardText: string) {
        return new Promise<void>((resolve) => {
            if (!this.hasAttribute('toggleable')) {
                resolve();
                return;
            }

            // Set content on hidden slide
            this.setCardText(cardText, true);
            this.removeAttribute('checked');

            // Toggle
            this.classList.toggle('flip');

            setTimeout(() => {
                // Clear contents from now hidden side
                this.setCardText('', true);
                this.dispatchEvent(this.swapEvent);
                resolve();
            }, 100);
        });
    }

    public reset() {
        return new Promise<void>((resolve) => {
            const isFlipped = this.classList.contains('flip');
            const sides = ['front', 'back'];
            const side = isFlipped ? sides[0] : sides[1];
            const otherSide = isFlipped ? sides[1] : sides[0];

            // Hide content on other side and flip
            const emptyClass = 'flip-card-inner--empty-' + side;
            this.querySelector('.flip-card-inner').classList.add(emptyClass);
            this.classList.toggle('flip');

            setTimeout(() => {
                // if tile is now flipped, hide the other side as well to get the initial state
                if (this.classList.contains('flip')) {
                    this.querySelector('.flip-card-inner').classList.add('flip-card-inner--empty-' + otherSide);
                    this.classList.toggle('flip');
                    this.querySelector('.flip-card-inner').classList.remove(emptyClass);
                }
                resolve();
            }, 300);
        });
    }

    toJSON(): BingoFieldJSON {
        return {
            text: this.getActiveText(),
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
import {CardStorage} from "./CardStorage";

export class BingoField extends HTMLElement {

    checkEvent: CustomEvent = null;
    swapEvent: CustomEvent = null;

    constructor(attributes: {text?: string, reroll?: boolean, toggleable?: boolean, checked?: boolean}) {
        super();

        this.checkEvent = new CustomEvent("bingoFieldChecked", {
            bubbles: true,
            cancelable: false,
        });


        this.swapEvent = new CustomEvent("bingoFieldSwapped", {
            bubbles: true,
            cancelable: false,
        });

        for (let key in attributes) {
            let value = attributes[key];
            if (value instanceof Boolean) {
                if (value) {
                    this.setAttribute(key, '');
                } else {
                    this.removeAttribute(key);
                }
            }
            this.setAttribute(key, value.toString());
        }
    }

    // fires after the element has been attached to the DOM
    connectedCallback() {
        this.innerHTML = `<div class="flip-card-inner flip-card-inner--empty-front">
         <div class="flip-card__content flip-card__content--front">
            ${this.getRefreshButton()}
            <span class="text"></span>
         </div>
         <div class="flip-card__content flip-card__content--back">
            ${this.getRefreshButton()}
            <span class="text">${this.getAttribute('text')}</span>
         </div>
     </div>`;

        if (!this.hasAttribute('toggleable') || !this.getAttribute('toggleable')) {
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

        const refreshButton = this.querySelector('button.refresh-button');
        if (refreshButton) {
            const that = this;
            refreshButton.addEventListener('click', async () => {
                console.log('swapCard');
                await that.swapCard(CardStorage.getNextItem())
            });
        }
    }

    checkCard() {
        this.toggleAttribute('checked');
        this.dispatchEvent(this.checkEvent);
    }

    private getRefreshButton() {
        if (this.hasAttribute('reroll') && this.getAttribute('reroll')) {
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
        contentArea.classList.remove('checked');
        contentArea.closest('.flip-card-inner').classList.remove(contentEmpty);
        contentArea.querySelector('.text').innerHTML = text;

        if (restoreRefreshButton) {
            if (restoreRefreshButton) {
                if (!contentArea.querySelector('button.refresh-button')) {
                    contentArea.innerHTML = this.getRefreshButton() + contentArea.innerHTML;
                }
            }
        }
    }

    public swapCard(text: string, addRefreshBtn =false) {
        return new Promise<void>((resolve) => {
            if (this.hasAttribute('toggleable') && this.getAttribute('toggleable')) {
                resolve();
                return;
            }

            // Set content on hidden slide
            this.setCardText(text, true, addRefreshBtn);

            // Toggle
            this.classList.toggle('flip');

            setTimeout(() => {
                // Clear contents from now hidden side
                this.setCardText('', true,  addRefreshBtn);
                resolve();
            }, 100);
        });
    }

    public async reset() {
        const isFlipped = this.classList.contains('flip');
        const frontSelector = '.flip-card__content--front';
        const backSelector = '.flip-card__content--back';
        const oldContentArea = this.querySelector(isFlipped ? frontSelector : backSelector);
        const newContentArea = this.querySelector(isFlipped ? frontSelector : backSelector);

        // Hide content on other side and flip
        const emptyClass = isFlipped ? 'flip-card-inner--empty-front' : 'flip-card-inner--empty-back';
        if (!this.classList.contains('flip-card--free')) {
            newContentArea.closest('.flip-card-inner').classList.add(emptyClass);
        }
        this.classList.toggle('flip');

        setTimeout(() => {
            // if tile is now flipped, hide the other side as well to get the initial state
            if (this.classList.contains('flip')) {
                const emptyClassOld = isFlipped ? 'flip-card-inner--empty-back' : 'flip-card-inner--empty-front';
                oldContentArea.closest('.flip-card-inner').classList.add(emptyClassOld);
                this.classList.toggle('flip');
                newContentArea.closest('.flip-card-inner').classList.remove(emptyClass);
            }
        }, 200);
    }
}
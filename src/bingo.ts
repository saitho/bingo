import {BingoField} from "./BingoField";
import {CardStorage} from "./CardStorage";

const settings = {
  cols: 5,
  rows: 5,
  dataStorageKey: 'bingoboard',
  useFreeSpace: true
};


export class Bingo extends HTMLElement {
  protected field: HTMLDivElement = null;
  protected data: string[] = [];
  protected pos = 0;

  boardInitialized = false;

  constructor() {
    // establish prototype chain
    super();

    // attaches shadow tree and returns shadow root reference
    // https://developer.mozilla.org/en-US/docs/Web/API/Element/attachShadow
    this.attachShadow({ mode: 'open' });

    const style = document.createElement('link');
    style.setAttribute('rel', 'stylesheet');
    style.setAttribute('href', 'bingo.css');
    this.shadowRoot.appendChild(style);

    const actions = document.createElement('div');
    actions.className = 'actions';
    actions.innerHTML = `<button class="button blue button-new-card"><i class="fas fa-th"></i> New Bingo</button>
      <button class="button button-print"><i class="fas fa-print"></i> Print Bingo</button>`;
    this.shadowRoot.appendChild(actions);

    this.field = document.createElement('div');
    this.field.classList.add('field-container');
    this.shadowRoot.appendChild(this.field);

    this.bindEvents();
  }


  // fires after the element has been attached to the DOM
  async connectedCallback() {
    await this.resetData();
    if (!this.loadBoard()) {
      await this.newBoard();
    }

    this.shadowRoot.querySelector('.button-new-card').addEventListener('click', async () => {
      await this.resetData();
      await this.newBoard();
    });
    this.shadowRoot.querySelector('.button-print').addEventListener('click', () => window.print());
  }

  async resetActiveBoard() {
    return new Promise<void>(async (resolve) => {
      if (!this.boardInitialized) {
        resolve();
      }
      // hide all cards to regenerate them hidden
      const content = this.shadowRoot.querySelectorAll('bingo-field');
      const promises: Promise<void>[] = [];
      for (let i = 0; i < content.length; i++) {
        const field = content[i] as BingoField;
        promises.push(field.reset());
      }
      this.boardInitialized = false;
      await Promise.all(promises);
      resolve();
    });
  }

  async toggleCard(cellElement: Element) {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        cellElement.classList.toggle('flip');
        resolve();
      }, 50);
    });
  }

  async toggleCards(cells: Element[]) {
    for (const cell of cells) {
      await this.toggleCard(cell);
    }
  }

  async newBoard() {
    if (settings.rows * settings.cols > CardStorage.countAll()) {
      throw Error('Not enough cards in file.');
    }

    await this.resetActiveBoard();

    this.field.innerHTML = '';

    const cells: Element[] = [];
    for(let i = 0; i < settings.cols; i++) {
      const col = document.createElement('div');
      col.className = 'col';
      for(let j = 0; j < settings.rows; j++) {
        let content: HTMLElement = null;
        if(
            settings.useFreeSpace &&
            i === Math.floor(settings.cols / 2) &&
            j === Math.floor(settings.rows / 2)
        ) {
          content = new BingoField('FREE SPACE', { reroll: false, toggleable: true, checked: true });
        } else {
          content = new BingoField(CardStorage.getNextItem());
        }
        col.appendChild(content);
        cells.push(content);
      }
      this.field.appendChild(col);
    }
    await this.toggleCards(cells);
    this.saveBoard();
    this.boardInitialized = true;
  }

  /**
   * Saves the current state of the board into local storage
   */
  saveBoard() {
    localStorage.setItem(settings.dataStorageKey, this.field.innerHTML);
  }

  /**
   * Overrides current state of the board from local storage
   */
  loadBoard() {
    const content = localStorage.getItem(settings.dataStorageKey);
    const hasContent = content && content.length > 0;
    if (hasContent) {
      this.field.innerHTML = content;
      this.boardInitialized = true;
    }
    return hasContent;
  }

  bindEvents() {
    this.addEventListener("bingoFieldChecked", function (e) {
      this.saveBoard();
    });
    this.addEventListener("bingoFieldSwapped", function (e) {
      if (CardStorage.isEmpty()) { // No more cards in array -> remove swap buttons.
        this.field.querySelectorAll('.refresh-button').forEach((e) => e.remove());
      }
      this.saveBoard();
    });
  }

  async resetData() {
    const s = await fetch('cells.txt');
    const t = await s.text();
    let lines = t.split('\n');
    lines = lines.map(function(a) { return a.trim() });
    lines = lines.filter(function(a)    { return a.length > 0 && !a.startsWith('#'); });
    CardStorage.init(lines);
  }
}
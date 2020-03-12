import {BingoField} from "./BingoField";
import {CardStorage} from "./CardStorage";
import {State, StateSaver} from "./StateSaver";

const settings = {
  cols: 5,
  rows: 5,
  useFreeSpace: true
};


export class Bingo extends HTMLElement {
  protected field: HTMLDivElement = null;
  protected saver: StateSaver = null;

  boardInitialized = false;

  constructor() {
    // establish prototype chain
    super();

    this.saver = new StateSaver();

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
    const loadBoard = await this.loadBoard();
    if (!loadBoard) {
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
      const content = this.shadowRoot.querySelectorAll('bingo-field') as NodeListOf<BingoField>;
      const promises: Promise<void>[] = [];
      for (const field  of content) {
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

  async newBoardFromState(state: State) {
    await this.resetActiveBoard();

    this.field.innerHTML = '';

    const cells: Element[] = [];
    for(let i = 0; i < state.cols; i++) {
      const col = document.createElement('div');
      col.className = 'col';
      for(let j = 0; j < state.rows; j++) {
        const content = BingoField.fromJSON(state.fields.shift());
        col.appendChild(content);
        cells.push(content);
      }
      this.field.appendChild(col);
    }
    await this.toggleCards(cells);
    this.saver.saveState(this.field, settings.rows, settings.cols);
    this.boardInitialized = true;
  }

  async newBoard() {
    if (settings.rows * settings.cols > CardStorage.countAll()) {
      throw Error('Not enough cards in file.');
    }

    const fields = [];
    for(let i = 0; i < settings.cols; i++) {
      for(let j = 0; j < settings.rows; j++) {
        let content: BingoField = null;
        if (
            settings.useFreeSpace &&
            i === Math.floor(settings.cols / 2) &&
            j === Math.floor(settings.rows / 2)
        ) {
          content = new BingoField('FREE SPACE', { reroll: false, toggleable: false, checked: true });
        } else {
          content = new BingoField(CardStorage.getNextItem());
        }
        fields.push(content);
      }
    }

    await this.newBoardFromState({
      fields: fields,
      cols: settings.cols,
      rows: settings.rows,
      version: 1
    });
  }

  /**
   * Overrides current state of the board from local storage
   */
  async loadBoard() {
    const state = this.saver.getState();
    if (!state) {
      return false;
    }
    await this.newBoardFromState(state);
    return true;
  }

  bindEvents() {
    this.addEventListener("bingoFieldChecked", function (e) {
      this.saver.saveState(this.field, settings.rows, settings.cols);
    });
    this.addEventListener("bingoFieldSwapped", function (e) {
      if (CardStorage.isEmpty()) { // No more cards in array -> remove swap buttons.
        this.field.querySelectorAll('.refresh-button').forEach((e) => e.remove());
      }
      this.saver.saveState(this.field, settings.rows, settings.cols);
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
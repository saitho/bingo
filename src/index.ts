const settings = {
    cols: 5,
    rows: 5,
    dataStorageKey: 'bingoboard',
    useFreeSpace: true
};

let pos = 0;
let data = [];
let boardInitialized = false;

const BINGO_CONTAINER_ID = 'bingo';

/**
 * Saves the current state of the board into local storage
 */
function saveBoard() {
    let content = document.getElementById(BINGO_CONTAINER_ID).innerHTML;
    content = content.replace(/style=".*?"/g, ''); // remove inline stylings (remaining fade steps)
    localStorage.setItem(settings.dataStorageKey, content);
}

/**
 * Overrides current state of the board from local storage
 */
function loadBoard() {
    const content = localStorage.getItem(settings.dataStorageKey);
    const hasContent = content && content.length > 0;
    if (hasContent) {
        document.getElementById(BINGO_CONTAINER_ID).innerHTML = content;
        boardInitialized = true;
        bindEvents();
    }
    return hasContent;
}

async function init() {
    await resetData();

    if (!loadBoard()) {
        await newBoard();
    }
}

async function resetActiveBoard() {
    return new Promise<void>((resolve) => {
        if (!boardInitialized) {
            resolve();
        }
        // hide all cards to regenerate them hidden
        const content = document.querySelectorAll('.flip-card');
        content.forEach((e) => {
            const isFlipped = e.classList.contains('flip');
            const frontSelector = '.flip-card__content--front';
            const backSelector = '.flip-card__content--back';
            const oldContentArea = e.querySelector(isFlipped ? frontSelector : backSelector);
            const newContentArea = e.querySelector(isFlipped ? frontSelector : backSelector);

            // Hide content on other side and flip
            if (!e.classList.contains('flip-card--free')) {
                newContentArea.classList.add('flip-card__content--empty');
            }
            e.classList.toggle('flip');

            setTimeout(() => {
                // if tile is now flipped, hide the other side as well to get the initial state
                if (e.classList.contains('flip')) {
                    oldContentArea.classList.add('flip-card__content--empty');
                    e.classList.toggle('flip');
                    newContentArea.classList.remove('flip-card__content--empty');
                }
                boardInitialized = false;
                resolve();
            }, 200);
        });
    });
}

async function toggleCard(cellElement: Element) {
    return new Promise<void>((resolve) => {
        setTimeout(() => {
            cellElement.classList.toggle('flip');
            resolve();
        }, 50);
    });
}

async function toggleCards(cells: Element[]) {
    for (const cell of cells) {
        await toggleCard(cell);
    }
}

async function newBoard() {
    if (settings.rows * settings.cols > data.length) {
        throw Error('Not enough cards in file.');
    }

    await resetActiveBoard();

    const bingo = document.getElementById(BINGO_CONTAINER_ID);
    bingo.innerHTML = '';

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
                content = createCellElement('FREE SPACE', true);
            } else {
                content = createCellElement(data[pos++]);
            }
            col.appendChild(content);
            cells.push(content);
        }
        bingo.appendChild(col);
    }
    await toggleCards(cells);
    saveBoard();
    bindEvents();
    boardInitialized = true;
}

function updateCellElement(flipCard: Element, text: string, addRefreshBtn = false): Promise<void> {
    return new Promise<void>((resolve) => {
        const isFlipped = flipCard.classList.contains('flip');
        if (flipCard.classList.contains('flip-card--free')) {
            resolve();
            return;
        }

        const frontSelector = '.flip-card__content--front';
        const backSelector = '.flip-card__content--back';

        // Set new content
        // todo: refactor the next 5 lines into a .reset() method on FlipCard object
        const newContentArea = flipCard.querySelector(isFlipped ? frontSelector : backSelector);
        newContentArea.classList.remove('checked');
        newContentArea.classList.remove('flip-card__content--empty');
        newContentArea.querySelector('.text').innerHTML = text;
        if (addRefreshBtn) {
            if (!newContentArea.querySelector('button.refresh-button')) {
                newContentArea.innerHTML = `<button class="refresh-button"><i class="fa fa-refresh"></i></button>` + newContentArea.innerHTML;
            }
        }

        setTimeout(() => {
            flipCard.classList.toggle('flip');
            // Remove old content
            // todo: refactor the next 5 lines into a .reset() method on FlipCard object
            const oldContentArea = flipCard.querySelector(isFlipped ? backSelector : frontSelector);
            oldContentArea.classList.remove('checked');
            oldContentArea.querySelector('.text').innerHTML = '';
            if (addRefreshBtn) {
                if (!oldContentArea.querySelector('button.refresh-button')) {
                    oldContentArea.innerHTML = `<button class="refresh-button"><i class="fa fa-refresh"></i></button>` + oldContentArea.innerHTML;
                }
            }
            resolve();
        }, 100);
    });
}

function createCellElement(text: string, isFree = false) {
    const flipCard = document.createElement('div');
    flipCard.classList.add('flip-card');
    let refreshButton = `<button class="refresh-button"><i class="fa fa-refresh"></i></button>`;
    if (isFree) {
        flipCard.classList.add('flip-card--free');
        refreshButton = '';
    }
    flipCard.innerHTML = `<div class="flip-card-inner">
         <div class="flip-card__content flip-card__content--front flip-card__content--empty">
            ${refreshButton}
            <span class="text"></span>
         </div>
         <div class="flip-card__content flip-card__content--back">
            ${refreshButton}
            <span class="text">${text}</span>
         </div>
     </div>`;
    return flipCard;
}

function bindEvents() {
    document.querySelectorAll(':not(.flip-card--free) .flip-card__content')
        .forEach((e) => e.addEventListener('click', checkCard));
    document.querySelectorAll('.refresh-button')
        .forEach((e) => {
            e.addEventListener('click', async (e) => await swapCard(e));
        });
}

function checkCard(e) {
    if (e.target.classList.contains('refresh-button') || e.target.parentNode.classList.contains('refresh-button')) {
        return;
    }
    const cell = e.target.closest('.flip-card__content');
    if (cell.classList.contains('checked')) {
        cell.classList.remove('checked');
    } else {
        cell.classList.add('checked')
    }
    saveBoard();
}

async function swapCard(e) {
    const flipCard = e.target.closest('.flip-card');
    await updateCellElement(flipCard, data[pos++]);
    if (pos >= data.length) { // No more cards in array -> remove swap buttons.
        document.querySelectorAll('.refresh-button').forEach((e) => e.remove());
    }
    saveBoard();
}

async function resetData() {
    let s = await fetch('cells.txt');
    let t = await s.text();
    let lines = t.split('\n');
    lines = lines.map(function(a) { return a.trim() });
    lines = lines.filter(function(a)    { return a.length > 0 && !a.startsWith('#'); });
    shuffleArray(lines); /* Randomize */
    data = lines;
    pos = 0;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

window.onload = async () => {
    await init();
    document.querySelector('.button-new-card').addEventListener('click', async () => {
        await resetData();
        await newBoard();
    });
    document.querySelector('.button-print').addEventListener('click', () => window.print());
};
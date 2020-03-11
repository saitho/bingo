const settings = {
    cols: 5,
    rows: 5,
    dataStorageKey: 'bingoboard',
    useFreeSpace: true
};

let pos = 0;
let data = [];

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
        bindEvents();
    }
    return hasContent;
}

async function init() {
    await resetData();

    if (!loadBoard()) {
        newBoard();
    }
}

function newBoard() {
    if (settings.rows * settings.cols > data.length) {
        throw Error('Not enough cards in file.');
    }
    const bingo = document.getElementById(BINGO_CONTAINER_ID);
    bingo.innerHTML = '';
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
        }
        bingo.appendChild(col);
    }
    saveBoard();
    bindEvents();
}

function createCellElement(text: string, isFree = false) {
    const cell = document.createElement('div');
    cell.innerHTML = `<span class="text">${text}</span>`;

    cell.classList.add('cell');
    if (isFree) {
        cell.classList.add('free');
    } else {
        cell.innerHTML = `<button class="refresh-button"><i class="fa fa-refresh"></i></button>` + cell.innerHTML;
    }
    return cell;
}

function bindEvents() {
    document.querySelectorAll('.cell:not(.free)')
        .forEach((e) => e.addEventListener('click', checkCard));
    document.querySelectorAll('.refresh-button')
        .forEach((e) => e.addEventListener('click', swapCard));
}

function checkCard(e) {
    if (e.target.classList.contains('refresh-button') || e.target.parentNode.classList.contains('refresh-button')) {
        return;
    }
    const cell = e.target.closest('.cell');
    if (cell.classList.contains('checked')) {
        cell.classList.remove('checked');
    } else {
        cell.classList.add('checked')
    }
    saveBoard();
}

function swapCard(e) {
    const cell = e.target.closest('.cell');
    cell.classList.remove('checked');
    cell.querySelector('.text').innerHTML = data[pos++];
    if (pos >= data.length) { // No more cards in array -> remove swap buttons.
        document.querySelector('.refresh-button').remove();
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
import {BingoField} from "./BingoField";
import {Bingo as BingoContainer} from "./bingo";
import {StateSaver} from "./StateSaver";

window.onload = () => {
    document.getElementById('reset-cookie').addEventListener('click', () => {
        new StateSaver().clearStates();
        location.reload();
    });
};

customElements.define('bingo-container', BingoContainer);
customElements.define('bingo-field', BingoField);
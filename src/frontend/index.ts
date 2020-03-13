import {BingoField} from "./BingoField";
import {Bingo as BingoContainer} from "./bingo";
import {StateSaver} from "./StateSaver";
import versions from "../_versions";

window.onload = () => {
    document.getElementById('version').innerText = versions.hasOwnProperty('versionLong') ? versions.versionLong : versions.version;
    document.getElementById('reset-cookie').addEventListener('click', () => {
        new StateSaver().clearStates();
        location.reload();
    });
};

customElements.define('bingo-container', BingoContainer);
customElements.define('bingo-field', BingoField);
import { clearElement, copyText, getValue, setValue } from "./utils.js";
import { cleanHtml } from "./html-cleaner.js";
import {
    splitText,
    createSplitterState,
    renderChunk,
    previousChunk,
    nextChunk
} from "./text-splitter.js";
import {
    suggestLabel,
    generateTOCHtml,
    getTOCData,
    resetTOC
} from "./toc-maker.js";

const splitterState = createSplitterState();

function switchTab(tabId, button) {
    document.querySelectorAll(".panel").forEach(panel => {
        panel.classList.remove("active");
    });

    document.querySelectorAll(".tab-btn").forEach(tab => {
        tab.classList.remove("active");
    });

    document.getElementById(tabId).classList.add("active");
    button.classList.add("active");
}

function updateChunkView() {
    const view = renderChunk(splitterState);
    setValue("splitOutput", view.text);
    document.getElementById("chunkCounter").textContent = view.counter;
}

function processHtml() {
    setValue("htmlOutput", cleanHtml(getValue("htmlInput")));
}

function processSplit() {
    const text = getValue("splitInput");

    if (!text) {
        alert("Tempelkan teks novel terlebih dahulu!");
        return;
    }

    const limit = parseInt(getValue("splitLimit"), 10) || 3000;

    splitterState.chunks = splitText(text, limit);
    splitterState.currentIndex = 0;
    updateChunkView();
}

function clearSplit() {
    splitterState.chunks = [];
    splitterState.currentIndex = 0;
    updateChunkView();
}

function handleGenerateTOC() {
    const data = getTOCData();

    if (!data.title) {
        alert("Peringatan: Judul novel wajib diisi!");
        return;
    }

    if (!data.label) {
        alert("Error: Label Chapter wajib diisi!");
        return;
    }

    setValue("tocOutput", generateTOCHtml(data));
}

function handleSuggestLabel() {
    const title = getValue("tocTitle");

    if (!title) return;

    setValue("tocLabel", suggestLabel(title));
}

function handleAction(action, target, button) {
    switch (action) {
        case "clear":
            clearElement(target);
            break;

        case "copy":
            copyText(target);
            break;

        case "process-html":
            processHtml();
            break;

        case "process-split":
            processSplit();
            break;

        case "clear-split":
            clearSplit();
            break;

        case "prev":
            previousChunk(splitterState);
            updateChunkView();
            break;

        case "next":
            nextChunk(splitterState);
            updateChunkView();
            break;

        case "suggest-label":
            handleSuggestLabel();
            break;

        case "generate-toc":
            handleGenerateTOC();
            break;

        case "reset-toc":
            if (confirm("Kosongkan seluruh isian form TOC?")) {
                resetTOC();
            }
            break;

        default:
            console.warn(`Action tidak dikenal: ${action}`, button);
    }
}

document.addEventListener("click", event => {
    const tabButton = event.target.closest(".tab-btn");
    if (tabButton) {
        switchTab(tabButton.dataset.tab, tabButton);
        return;
    }

    const actionButton = event.target.closest("[data-action]");
    if (actionButton) {
        handleAction(
            actionButton.dataset.action,
            actionButton.dataset.target,
            actionButton
        );
    }
});

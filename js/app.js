import { clearElement, copyText, copyRichText, getValue, setValue } from "./utils.js";
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
    generateBloggerLabels,
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
    const inputEl = document.getElementById("htmlInput");
    const outputEl = document.getElementById("htmlOutput");
    if (!inputEl || !outputEl) return;

    // Ambil struktur HTML internal yang tersimpan saat teks berformat di-paste
    const rawContent = inputEl.innerHTML;
    // Bersihkan tag kotor dan susun ulang
    const cleaned = cleanHtml(rawContent);
    // Tampilkan langsung sebagai format visual di kotak output
    outputEl.innerHTML = cleaned;
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

    // 1. Output Hasil HTML (Fungsi Lama)
    setValue("tocOutput", generateTOCHtml(data));

    // 2. Output Label Blogger Terpisah (Fitur Baru)
    setValue("bloggerLabelOutput", generateBloggerLabels(data));
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

        case "copy-rich":
            copyRichText(target);
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

// Inisialisasi dropdown interaktif untuk Genre (Multi-select)
function initGenreDropdown() {
    const trigger = document.getElementById("genreTrigger");
    const options = document.getElementById("genreOptions");

    if (!trigger || !options) return;

    // Buka / tutup dropdown saat trigger diklik
    trigger.addEventListener("click", event => {
        event.stopPropagation();
        options.classList.toggle("open");
    });

    // Perbarui label trigger saat checkbox dicentang/dilepas
    options.addEventListener("change", () => {
        const checked = Array.from(options.querySelectorAll("input:checked")).map(cb => cb.value);
        if (checked.length > 0) {
            trigger.textContent = checked.join(", ");
            trigger.classList.add("has-value");
        } else {
            trigger.textContent = "Pilih Genre...";
            trigger.classList.remove("has-value");
        }
    });

    // Tutup dropdown otomatis jika klik di luar elemen genre
    document.addEventListener("click", event => {
        if (!event.target.closest("#genreDropdownContainer")) {
            options.classList.remove("open");
        }
    });
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

// Jalankan inisialisasi dropdown genre
initGenreDropdown();
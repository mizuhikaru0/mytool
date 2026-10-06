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
    resetTOC,
    parseAndApplyMetadata
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

// =========================================================
// PASTE HANDLER — HTML CLEANER
// Mempertahankan format rich text dari clipboard
// =========================================================
function initHtmlPaste() {
    const editor = document.getElementById("htmlInput");

    if (!editor) return;

    editor.addEventListener("paste", event => {
        event.preventDefault();

        const clipboard = event.clipboardData;

        if (!clipboard) return;

        // Prioritaskan HTML asli dari clipboard
        const html = clipboard.getData("text/html");

        if (html && html.trim()) {
            document.execCommand("insertHTML", false, html);
            return;
        }

        // Jika clipboard hanya memiliki plain text,
        // masukkan sebagai teks biasa.
        const text = clipboard.getData("text/plain");

        if (text) {
            document.execCommand(
                "insertText",
                false,
                text
            );
        }
    });
}

async function pasteIntoHtmlEditor() {
    const editor = document.getElementById("htmlInput");

    if (!editor) return;

    try {
        // Clipboard API: pertahankan HTML jika tersedia.
        if (navigator.clipboard && navigator.clipboard.read) {
            const items = await navigator.clipboard.read();

            for (const item of items) {
                if (item.types.includes("text/html")) {
                    const blob = await item.getType("text/html");
                    const html = await blob.text();

                    if (html.trim()) {
                        editor.focus();
                        document.execCommand("insertHTML", false, html);
                        return;
                    }
                }
            }

            // Fallback ke plain text jika HTML tidak tersedia.
            if (navigator.clipboard.readText) {
                const text = await navigator.clipboard.readText();

                if (text) {
                    editor.focus();
                    document.execCommand("insertText", false, text);
                    return;
                }
            }
        }

        alert("Browser tidak mengizinkan akses Clipboard. Gunakan Ctrl+V di dalam kotak input.");
    } catch (error) {
        console.error("Gagal membaca Clipboard:", error);
        alert("Clipboard tidak dapat diakses. Gunakan Ctrl+V di dalam kotak input.");
    }
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

        case "paste-html":
            pasteIntoHtmlEditor();
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

        case "parse-metadata": {
            const raw = getValue("rawMetadataInput");

            if (!raw || !raw.trim()) {
                alert("Tempelkan teks metadata terlebih dahulu!");
                return;
            }

            const ok = parseAndApplyMetadata(raw);

            if (ok) {
                alert("Metadata berhasil diterapkan ke seluruh kolom!");
            }

            break;
        }

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
        const checked = Array.from(
            options.querySelectorAll("input:checked")
        ).map(cb => cb.value);

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

// Jalankan paste handler HTML Cleaner
initHtmlPaste();

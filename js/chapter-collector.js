import { cleanHtml } from "./html-cleaner.js";

const STORAGE_KEY = "novelPublisherStudio.chapterCollector.v3";
const LEGACY_STORAGE_KEYS = [
    "novelPublisherStudio.chapterCollector.v2",
    "novelPublisherStudio.chapterCollector.v1"
];

const IDB_NAME = "NovelPublisherStudio";
const IDB_VERSION = 1;
const IDB_STORE = "appState";
const IDB_KEY = "chapterCollector";

const state = {
    chapters: {},
    current: null
};

const $ = (id) => document.getElementById(id);

let saveTimer = null;
let saveQueue = Promise.resolve();

function getChapterEditorHtml() {
    const editor = $("chapterEditor");
    return editor?.isContentEditable ? editor.innerHTML : (editor?.value || "");
}

function setChapterEditorHtml(html = "") {
    const editor = $("chapterEditor");
    if (!editor) return;

    if (editor.isContentEditable) {
        editor.innerHTML = html;
    } else {
        editor.value = html;
    }
}

function getChapterEditorText() {
    const editor = $("chapterEditor");
    if (!editor) return "";

    return editor.isContentEditable
        ? editor.textContent
        : editor.value;
}

function cleanChapterContent(rawHtml, chapterNumber) {
    // Gunakan fungsi HTML Cleaner yang sama, tetapi judul chapter dibuat H1.
    let cleaned = cleanHtml(rawHtml, { headingTag: "h1" });

    // Jika sumber tidak memiliki penanda Chapter/Bab/Ch, tetap buat judul H1
    // berdasarkan nomor chapter yang dimasukkan pada field.
    if (cleaned && !/^<h1\b/i.test(cleaned.trim())) {
        cleaned = `<h1 style="text-align: center;">Chapter ${chapterNumber}</h1>\n${cleaned}`;
    } else if (!cleaned) {
        cleaned = `<h1 style="text-align: center;">Chapter ${chapterNumber}</h1>`;
    }

    return cleaned;
}

function getNumber() {
    const value = $("chapterNumber")?.value?.trim() || "";
    const match = value.match(/\d+/);
    return match ? Number(match[0]) : null;
}

function getDraftData() {
    return {
        chapterNumber: $("chapterNumber")?.value || "",
        html: getChapterEditorHtml(),
        current: state.current
    };
}

function getPersistedData() {
    return {
        version: 3,
        savedAt: new Date().toISOString(),
        novelName: $("chapterNovelName")?.value || "Novel",
        chapters: state.chapters,
        draft: getDraftData()
    };
}

function openStorageDB() {
    if (!("indexedDB" in window)) {
        return Promise.resolve(null);
    }

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(IDB_NAME, IDB_VERSION);

        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(IDB_STORE)) {
                db.createObjectStore(IDB_STORE, { keyPath: "key" });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function makeStoragePersistent() {
    try {
        if (navigator.storage?.persist) {
            await navigator.storage.persist();
        }
    } catch (error) {
        console.warn("Persistent browser storage request failed:", error);
    }
}

async function writeIndexedDB(data) {
    const db = await openStorageDB();
    if (!db) return false;

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(IDB_STORE, "readwrite");
        transaction.objectStore(IDB_STORE).put({
            key: IDB_KEY,
            ...data
        });

        transaction.oncomplete = () => {
            db.close();
            resolve(true);
        };

        transaction.onerror = () => {
            db.close();
            reject(transaction.error);
        };
    });
}

async function readIndexedDB() {
    const db = await openStorageDB();
    if (!db) return null;

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(IDB_STORE, "readonly");
        const request = transaction.objectStore(IDB_STORE).get(IDB_KEY);

        request.onsuccess = () => {
            db.close();
            resolve(request.result || null);
        };

        request.onerror = () => {
            db.close();
            reject(request.error);
        };
    });
}

function writeLocalBackup(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.warn("Local backup tidak dapat disimpan:", error);
    }
}

function readLocalBackup() {
    const keys = [STORAGE_KEY, ...LEGACY_STORAGE_KEYS];

    for (const key of keys) {
        try {
            const raw = localStorage.getItem(key);
            if (raw) return JSON.parse(raw);
        } catch (error) {
            console.warn(`Gagal membaca penyimpanan ${key}:`, error);
        }
    }

    return null;
}

function queueSaveState() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
        saveState();
    }, 300);
}

function saveState() {
    const data = getPersistedData();

    // Simpan juga ke localStorage sebagai backup cepat.
    writeLocalBackup(data);

    // Antrekan penulisan IndexedDB agar penyimpanan berurutan dan tidak saling menimpa.
    saveQueue = saveQueue
        .catch(() => {})
        .then(() => writeIndexedDB(data))
        .catch(error => {
            console.warn("Tidak dapat menyimpan ke IndexedDB:", error);
        });

    return saveQueue;
}

async function loadState() {
    let data = null;

    try {
        data = await readIndexedDB();
    } catch (error) {
        console.warn("IndexedDB tidak dapat dibaca:", error);
    }

    if (!data) {
        data = readLocalBackup();

        // Migrasikan backup lama ke IndexedDB/versi baru.
        if (data) {
            try {
                await writeIndexedDB({
                    ...data,
                    version: 3,
                    savedAt: new Date().toISOString()
                });
                writeLocalBackup({
                    ...data,
                    version: 3,
                    savedAt: new Date().toISOString()
                });
            } catch (error) {
                console.warn("Migrasi penyimpanan gagal:", error);
            }
        }
    }

    if (data?.chapters && typeof data.chapters === "object") {
        state.chapters = data.chapters;
    }

    if (data?.novelName && $("chapterNovelName")) {
        $("chapterNovelName").value = data.novelName;
    }

    // Pulihkan draft yang belum sempat dijadikan chapter.
    const draft = data?.draft;
    if (draft && (draft.html || draft.chapterNumber)) {
        if ($("chapterNumber")) {
            $("chapterNumber").value = draft.chapterNumber || "";
        }

        setChapterEditorHtml(draft.html || "");

        state.current = Number.isFinite(Number(draft.current))
            ? Number(draft.current)
            : null;
    } else {
        clearEditor({ persist: false });
    }

    refreshChapterList();

    if (state.current !== null && state.chapters[state.current] !== undefined) {
        updatePreview(state.chapters[state.current]);
    } else if (draft?.html) {
        updatePreview(draft.html);
    } else {
        updatePreview("");
    }
}

function sortedNumbers() {
    return Object.keys(state.chapters)
        .map(Number)
        .filter(Number.isFinite)
        .sort((a, b) => a - b);
}

function refreshChapterList() {
    const list = $("chapterList");
    if (!list) return;

    list.innerHTML = "";

    const numbers = sortedNumbers();

    numbers.forEach(number => {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "chapter-list-item";
        if (state.current === number) item.classList.add("active");

        item.textContent = `Chapter ${number}`;
        item.addEventListener("click", () => loadChapter(number));

        list.appendChild(item);
    });

    if ($("chapterCount")) {
        $("chapterCount").textContent = numbers.length;
    }

    if ($("chapterStatus")) {
        $("chapterStatus").textContent =
            `${numbers.length} chapter tersimpan sementara.`;
    }
}

function updatePreview(content = "") {
    const preview = $("chapterPreview");
    if (!preview) return;

    if (!content) {
        preview.innerHTML =
            '<div class="chapter-preview-empty">Pilih chapter untuk melihat hasil bersih.</div>';
        return;
    }

    // Konten sudah melewati cleanHtml(), sehingga preview dapat ditampilkan sebagai HTML visual.
    preview.innerHTML = content;
}

function addChapter() {
    let number = getNumber();
    const editorText = getChapterEditorText();

    // Saat Tambah Chapter ditekan, otomatis deteksi nomor dari isi editor.
    // Jika berhasil ditemukan, gunakan hasil deteksi tersebut.
    const detectedNumberMatch = editorText.match(
        /^\s*(?:BAB|Chapter|Ch\.)\s*(\d+)\b/im
    );

    if (detectedNumberMatch) {
        number = Number(detectedNumberMatch[1]);
        $("chapterNumber").value = number;
    }

    if (number === null) {
        alert("Nomor chapter tidak ditemukan otomatis. Masukkan nomor chapter terlebih dahulu.");
        $("chapterNumber")?.focus();
        return;
    }

    let content = getChapterEditorHtml();
    if (!content.trim()) {
        alert("Paste hasil terjemahan terlebih dahulu.");
        $("chapterEditor")?.focus();
        return;
    }

    content = cleanChapterContent(content, number);

    if (state.chapters[number] !== undefined) {
        const replace = confirm(
            `Chapter ${number} sudah ada.\n\nGanti dengan isi yang sekarang?`
        );
        if (!replace) return;
    }

    state.chapters[number] = content;
    saveState();

    // Sesuai workflow: setelah Add, input dikosongkan dan siap untuk chapter berikutnya.
    state.current = null;
    $("chapterNumber").value = "";
    setChapterEditorHtml("");
    updatePreview("");

    refreshChapterList();

    if ($("chapterSaveStatus")) {
        $("chapterSaveStatus").textContent =
            `✓ Chapter ${number} ditambahkan sementara.`;
    }

    $("chapterNumber").focus();
}

function loadChapter(number) {
    if (state.chapters[number] === undefined) return;

    state.current = number;

    $("chapterNumber").value = number;
    setChapterEditorHtml(state.chapters[number]);

    updatePreview(state.chapters[number]);
    refreshChapterList();

    if ($("chapterSaveStatus")) {
        $("chapterSaveStatus").textContent =
            `Chapter ${number} sedang dibuka.`;
    }
}

function updateChapter() {
    const number = getNumber();

    if (number === null) {
        alert("Masukkan nomor chapter.");
        return;
    }

    if (state.chapters[number] === undefined) {
        alert(`Chapter ${number} belum ada di daftar sementara.`);
        return;
    }

    let content = getChapterEditorHtml();
    if (!content.trim()) {
        alert("Isi chapter tidak boleh kosong.");
        return;
    }

    content = cleanChapterContent(content, number);
    state.chapters[number] = content;
    saveState();

    updatePreview(content);
    refreshChapterList();

    if ($("chapterSaveStatus")) {
        $("chapterSaveStatus").textContent =
            `✓ Chapter ${number} diperbarui.`;
    }
}

function deleteChapter() {
    let number = state.current;

    if (number === null) {
        number = getNumber();
    }

    if (number === null || state.chapters[number] === undefined) {
        alert("Pilih chapter yang ingin dihapus.");
        return;
    }

    if (!confirm(`Hapus Chapter ${number} dari daftar sementara?`)) {
        return;
    }

    delete state.chapters[number];
    state.current = null;
    saveState();

    clearEditor();
    refreshChapterList();
}

function clearAll() {
    const count = sortedNumbers().length;
    if (!count) return;

    if (!confirm(`Hapus semua ${count} chapter sementara?`)) {
        return;
    }

    state.chapters = {};
    state.current = null;
    saveState();

    clearEditor();
    refreshChapterList();
}

function clearEditor(options = {}) {
    const { persist = true } = options;

    if ($("chapterNumber")) $("chapterNumber").value = "";
    setChapterEditorHtml("");

    state.current = null;
    updatePreview("");
    refreshChapterList();

    if (persist) {
        saveState();
    }
}

function detectChapter() {
    const text = getChapterEditorText();

    const patterns = [
        /<h[1-6]\b[^>]*>\s*(?:BAB|Bab|bab|Chapter|chapter)\s+(\d+)/i,
        /^\s*(?:BAB|Bab|bab|Chapter|chapter)\s+(\d+)/im,
        /\b(?:BAB|Bab|bab|Chapter|chapter)\s+(\d+)/i,
        /\bCh\.\s*(\d+)/i
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            $("chapterNumber").value = match[1];
            return;
        }
    }

    alert("Nomor chapter tidak ditemukan.");
}

function importTxt(file) {
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
        setChapterEditorHtml(reader.result || "");

        const fromName = file.name.match(
            /(?:chapter|ch|bab)[\s_-]*(\d+)/i
        );

        if (fromName) {
            $("chapterNumber").value = fromName[1];
        } else {
            detectChapter();
        }

        if ($("chapterSaveStatus")) {
            $("chapterSaveStatus").textContent =
                "TXT dimuat. Klik Tambah Chapter untuk menyimpannya sementara.";
        }
    };

    reader.readAsText(file);
}

function safeFileName(name) {
    return (name || "Novel")
        .replace(/[<>:"/\\|?*]/g, "_")
        .replace(/\s+/g, "_")
        .replace(/^_+|_+$/g, "") || "Novel";
}

async function generateZip() {
    const numbers = sortedNumbers();

    if (!numbers.length) {
        alert("Belum ada chapter yang ditambahkan.");
        return;
    }

    if (typeof JSZip === "undefined") {
        alert(
            "Library ZIP belum dimuat. Pastikan koneksi internet aktif saat membuka aplikasi."
        );
        return;
    }

    const zip = new JSZip();

    numbers.forEach(number => {
        // Buat entry folder eksplisit, seperti ZIP yang dibuat File Manager.
        const folder = zip.folder(`Chapter ${number}`);

        // Isi ditulis sebagai UTF-8 dan tidak diproses ulang.
        folder.file(
            "chapter-content.txt",
            state.chapters[number]
        );
    });

    if ($("chapterStatus")) {
        $("chapterStatus").textContent = "⏳ Membuat ZIP...";
    }

    try {
        const blob = await zip.generateAsync({
            type: "blob",
            compression: "DEFLATE",
            compressionOptions: { level: 9 },

            // Meniru karakteristik ZIP Android/File Manager:
            // - DOS/Windows platform header
            // - data descriptor (bit 3 / 0x0800 + 0x0008)
            // - entry folder dibuat eksplisit
            platform: "DOS",
            streamFiles: true
        });

        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");

        anchor.href = url;
        anchor.download =
            `${safeFileName($("chapterNovelName")?.value)}_chapters.zip`;

        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();

        setTimeout(() => URL.revokeObjectURL(url), 1000);

        if ($("chapterStatus")) {
            $("chapterStatus").textContent =
                `✓ ZIP berhasil dibuat — ${numbers.length} chapter.`;
        }
    } catch (error) {
        console.error(error);

        if ($("chapterStatus")) {
            $("chapterStatus").textContent = "❌ Generate ZIP gagal.";
        }

        alert(`Gagal membuat ZIP:\n${error.message}`);
    }
}

function handleChapterAction(action) {
    switch (action) {
        case "add":
            addChapter();
            break;
        case "update":
            updateChapter();
            break;
        case "delete":
            deleteChapter();
            break;
        case "clear-all":
            clearAll();
            break;
        case "clear-editor":
            clearEditor();
            break;
        case "detect":
            detectChapter();
            break;
        case "import":
            $("chapterFileInput")?.click();
            break;
        case "generate":
            generateZip();
            break;
    }
}

export function initChapterCollector() {
    if (!$("chapterTab")) return;

    document.querySelectorAll("[data-chapter-action]").forEach(button => {
        button.addEventListener("click", () => {
            handleChapterAction(button.dataset.chapterAction);
        });
    });

    $("chapterFileInput")?.addEventListener("change", event => {
        importTxt(event.target.files?.[0]);
        event.target.value = "";
    });

    $("chapterNovelName")?.addEventListener("input", queueSaveState);
    $("chapterNumber")?.addEventListener("input", queueSaveState);
    $("chapterEditor")?.addEventListener("input", queueSaveState);

    window.addEventListener("pagehide", () => {
        saveState();
    });

    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") {
            saveState();
        }
    });

    makeStoragePersistent();
    loadState();
}

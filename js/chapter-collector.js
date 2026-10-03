const STORAGE_KEY = "novelPublisherStudio.chapterCollector.v1";

const state = {
    chapters: {},
    current: null
};

const $ = (id) => document.getElementById(id);

function normalizeChapterText(text) {
    if (!text) return "";

    // Ubah penanda chapter "Bab 12" menjadi "Chapter 12".
    // Hanya pada awal baris atau heading HTML agar kata "bab" di isi cerita tidak ikut berubah.
    text = text.replace(
        /(^|\r?\n)([ \t]*)(?:BAB|Bab|bab|CHAPTER|Chapter|chapter)([ \t]+)(\d+)([^\r\n]*)/g,
        (m, start, spaces, word, gap, number, rest) => {
            const trimmedRest = rest;
            return `${start}${spaces}Chapter ${number}${trimmedRest}`;
        }
    );

    text = text.replace(
        /(<h[1-6]\b[^>]*>\s*)(?:BAB|Bab|bab|CHAPTER|Chapter|chapter)(\s+)(\d+)([^<]*)(<\/h[1-6]>)/gi,
        (m, prefix, gap, number, rest, close) =>
            `${prefix}Chapter ${number}${rest}${close}`
    );

    return text;
}

function getNumber() {
    const value = $("chapterNumber")?.value?.trim() || "";
    const match = value.match(/\d+/);
    return match ? Number(match[0]) : null;
}

function saveState() {
    const data = {
        novelName: $("chapterNovelName")?.value || "Novel",
        chapters: state.chapters
    };

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.warn("Tidak dapat menyimpan chapter sementara:", e);
    }
}

function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;

        const data = JSON.parse(raw);

        if (data && data.chapters && typeof data.chapters === "object") {
            state.chapters = data.chapters;
        }

        if (data?.novelName && $("chapterNovelName")) {
            $("chapterNovelName").value = data.novelName;
        }
    } catch (e) {
        console.warn("Data chapter sementara tidak dapat dimuat:", e);
    }

    refreshChapterList();
    clearEditor();
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
            '<div class="chapter-preview-empty">Pilih chapter untuk melihat isi sementara.</div>';
        return;
    }

    // Source preview: tampilkan source HTML sebagai teks agar tag tidak dieksekusi.
    const pre = document.createElement("pre");
    pre.textContent = content;
    preview.innerHTML = "";
    preview.appendChild(pre);
}

function addChapter() {
    const number = getNumber();
    if (number === null) {
        alert("Masukkan nomor chapter terlebih dahulu.");
        $("chapterNumber")?.focus();
        return;
    }

    let content = $("chapterEditor")?.value || "";
    if (!content.trim()) {
        alert("Paste hasil terjemahan terlebih dahulu.");
        $("chapterEditor")?.focus();
        return;
    }

    content = normalizeChapterText(content);

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
    $("chapterEditor").value = "";
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
    $("chapterEditor").value = state.chapters[number];

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

    let content = $("chapterEditor")?.value || "";
    if (!content.trim()) {
        alert("Isi chapter tidak boleh kosong.");
        return;
    }

    content = normalizeChapterText(content);
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

function clearEditor() {
    if ($("chapterNumber")) $("chapterNumber").value = "";
    if ($("chapterEditor")) $("chapterEditor").value = "";

    state.current = null;
    updatePreview("");
    refreshChapterList();
}

function detectChapter() {
    const text = $("chapterEditor")?.value || "";

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
        $("chapterEditor").value = reader.result || "";

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
        // Isi ditulis sebagai UTF-8 dan tidak diproses ulang.
        zip.file(
            `Chapter ${number}/chapter-content.txt`,
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
            compressionOptions: { level: 9 }
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

    $("chapterNovelName")?.addEventListener("input", saveState);

    loadState();
}

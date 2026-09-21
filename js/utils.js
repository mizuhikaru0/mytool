export function getValue(id) {
    const el = document.getElementById(id);
    if (!el) return "";
    return el.isContentEditable ? el.innerHTML : el.value;
}

export function setValue(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.isContentEditable) {
        el.innerHTML = value;
    } else {
        el.value = value;
    }
}

export function clearElement(id) {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.isContentEditable) {
        el.innerHTML = "";
    } else {
        el.value = "";
    }
}

/**
 * Menampilkan toast notification.
 * type: success | warning | error
 */
export function showToast(message, type = "success") {
    let container = document.getElementById("toastContainer");

    // Buat container jika belum ada
    if (!container) {
        container = document.createElement("div");
        container.id = "toastContainer";
        container.className = "toast-container";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    const icons = {
        success: "✓",
        warning: "!",
        error: "×"
    };

    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || "✓"}</span>
        <span class="toast-message">${message}</span>
    `;

    container.appendChild(toast);

    // Animasi masuk
    requestAnimationFrame(() => {
        toast.classList.add("show");
    });

    // Hapus otomatis setelah 2,2 detik
    setTimeout(() => {
        toast.classList.remove("show");

        setTimeout(() => {
            toast.remove();

            // Hapus container jika sudah kosong
            if (!container.children.length) {
                container.remove();
            }
        }, 300);
    }, 2200);
}

// Salin teks polos standar (tetap dipakai Splitter dan TOC Maker)
export async function copyText(id) {
    const el = document.getElementById(id);
    if (!el) return;

    const val = el.value !== undefined ? el.value : el.innerText;
    if (!val || !val.trim()) {
        showToast("Tidak ada teks untuk disalin!", "warning");
        return;
    }

    try {
        await navigator.clipboard.writeText(val);
        showToast("Berhasil disalin ke clipboard!", "success");
    } catch {
        try {
            if (el.select) {
                el.select();
                document.execCommand("copy");
                el.setSelectionRange(0, 0);
            }
            showToast("Berhasil disalin ke clipboard!", "success");
        } catch {
            showToast("Gagal menyalin teks!", "error");
        }
    }
}

// Khusus HTML Cleaner: Salin format tebal/miring visual langsung untuk Blogger
export async function copyRichText(id) {
    const el = document.getElementById(id);
    if (!el) return;

    const htmlContent = el.innerHTML.trim();
    const plainText = el.innerText.trim();

    if (!htmlContent) {
        showToast("Tidak ada teks untuk disalin!", "warning");
        return;
    }

    try {
        if (navigator.clipboard && window.ClipboardItem) {
            const blobHtml = new Blob([htmlContent], { type: "text/html" });
            const blobText = new Blob([plainText], { type: "text/plain" });
            const item = new ClipboardItem({
                "text/html": blobHtml,
                "text/plain": blobText
            });
            await navigator.clipboard.write([item]);
            showToast("Teks berformat disalin! Siap paste di Blogger.", "success");
        } else {
            const range = document.createRange();
            range.selectNodeContents(el);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
            document.execCommand("copy");
            sel.removeAllRanges();
            showToast("Teks berformat disalin!", "success");
        }
    } catch {
        showToast("Gagal menyalin format teks!", "error");
    }
}
export function getValue(id) {
    return document.getElementById(id).value;
}

export function setValue(id, value) {
    document.getElementById(id).value = value;
}

export function clearElement(id) {
    setValue(id, "");
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

export async function copyText(id) {
    const el = document.getElementById(id);

    if (!el.value.trim()) {
        showToast("Tidak ada teks untuk disalin!", "warning");
        return;
    }

    try {
        await navigator.clipboard.writeText(el.value);
        showToast("Berhasil disalin ke clipboard!", "success");
    } catch {
        try {
            el.select();
            document.execCommand("copy");
            el.setSelectionRange(0, 0);

            showToast("Berhasil disalin ke clipboard!", "success");
        } catch {
            showToast("Gagal menyalin teks!", "error");
        }
    }
}
export function cleanHtml(raw, options = {}) {
    if (!raw || !raw.trim()) return "";

    const parser = new DOMParser();
    const doc = parser.parseFromString(raw, "text/html");

    // 1. Buang elemen antarmuka, iklan, skrip, dan sampah layout web sumber
    doc.querySelectorAll(
        "script, style, button, svg, path, form, textarea, input, select, iframe, nav, footer, header, noscript"
    ).forEach(el => el.remove());

    // 2. Ubah pembatas blok dan <br> menjadi newline penanda
    let html = doc.body.innerHTML;
    html = html.replace(/<\s*br\s*\/?>/gi, "\n");
    html = html.replace(
        /<\/?(?:div|p|h[1-6]|li|tr|section|article|blockquote)[^>]*>/gi,
        "\n"
    );

    // 3. Pertahankan tag format esensial (tebal, miring, garis bawah, coret, dan link)
    html = html.replace(/<(\/?[a-zA-Z0-9]+)([^>]*)>/g, (match, tag, attrs) => {
        const normalizedTag = tag.toLowerCase().replace("/", "");

        if (["b", "strong", "i", "em", "u", "s"].includes(normalizedTag)) {
            return `<${tag.toLowerCase()}>`;
        }

        if (normalizedTag === "a") {
            const hrefMatch = attrs.match(/href=(["'][^"']*["'])/i);
            return hrefMatch
                ? `<${tag.toLowerCase()} href=${hrefMatch[1]} target="_blank" rel="noopener noreferrer">`
                : "";
        }

        return "";
    });

    // 4. Bersihkan spasi kosong HTML non-breaking
    html = html.replace(/&nbsp;/gi, " ");

    // 5. Filter baris yang tidak kosong
    const lines = html
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line.replace(/<[^>]+>/g, "").trim().length > 0);

    // Regex judul chapter (angka + judul opsional)
    const chapterRegex = /^(?:bab|chapter|ch\.?)\s*(\d+)(?:\s*[:\-–—]?\s*(.*))?$/i;
    // Regex judul khusus (prolog/epilog)
    const specialTitleRegex = /^(?:prolog|prologue|epilog|epilogue)\b/i;

    // Heading judul dapat disesuaikan oleh pemanggil.
    // Default tetap H2 agar perilaku HTML Cleaner lama tidak berubah.
    const headingTag = ["h1", "h2", "h3", "h4", "h5", "h6"].includes(
        String(options.headingTag || "h2").toLowerCase()
    )
        ? String(options.headingTag || "h2").toLowerCase()
        : "h2";

    // 6. Susun elemen: Judul Chapter di tengah, isi paragraf justify tanpa text-indent
    return lines.map((line, index) => {
        const plainText = line.replace(/<[^>]+>/g, "").trim();

        // Cek 2 baris awal untuk penomoran chapter
        if (index <= 1) {
            const match = plainText.match(chapterRegex);
            if (match) {
                const chapterNum = match[1];
                const chapterTitle = match[2] ? match[2].trim() : "";

                const formattedHeading = chapterTitle.length > 0
                    ? `Chapter ${chapterNum}: ${chapterTitle}`
                    : `Chapter ${chapterNum}`;

                return `<${headingTag} style="text-align: center;">${formattedHeading}</${headingTag}>`;
            }

            if (specialTitleRegex.test(plainText)) {
                return `<${headingTag} style="text-align: center;">${line}</${headingTag}>`;
            }
        }

        // Teks isi cerita: Rata kanan-kiri (justify), tanpa text-indent dan tanpa <br> tambahan
        return `<p style="text-align: justify;">${line}</p>`;
    }).join("\n");
}
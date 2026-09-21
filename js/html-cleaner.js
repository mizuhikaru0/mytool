export function cleanHtml(raw) {
    if (!raw || !raw.trim()) return "";

    const parser = new DOMParser();
    const doc = parser.parseFromString(raw, "text/html");

    // 1. Buang elemen antarmuka AI, skrip, frame, dan elemen yang tidak diperlukan
    doc.querySelectorAll(
        "script, style, button, svg, path, form, textarea, input, select, iframe, nav, footer, header, noscript"
    ).forEach(el => el.remove());

    // 2. Ubah pembatas blok dan <br> menjadi newline
    let html = doc.body.innerHTML;
    html = html.replace(/<\s*br\s*\/?>/gi, "\n");
    html = html.replace(
        /<\/?(?:div|p|h[1-6]|li|tr|section|article|blockquote)[^>]*>/gi,
        "\n"
    );

    // 3. Pertahankan hanya formatting dasar dan href pada <a>
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

    // 4. Bersihkan karakter spasi kosong HTML non-breaking
    html = html.replace(/&nbsp;/gi, " ");

    // 5. Pecah per baris dan bungkus rapi dalam tag <p> dengan jeda <br> standar Blogger
    const lines = html
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line.replace(/<[^>]+>/g, "").trim().length > 0);

    return lines.map(line => `<p>${line}</p>`).join("\n<br>\n");
}
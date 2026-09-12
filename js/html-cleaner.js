export function cleanHtml(raw) {
    if (!raw.trim()) return "";

    const parser = new DOMParser();
    const doc = parser.parseFromString(raw, "text/html");

    // Buang elemen antarmuka AI dan elemen yang tidak diperlukan.
    doc.querySelectorAll(
        "script, style, button, svg, path, form, textarea"
    ).forEach(el => el.remove());

    // Ubah pembatas blok dan <br> menjadi newline.
    let html = doc.body.innerHTML;
    html = html.replace(/<\s*br\s*\/?>/gi, "\n");
    html = html.replace(
        /<\/?(?:div|p|h[1-6]|li|tr|section|article)[^>]*>/gi,
        "\n"
    );

    // Pertahankan hanya formatting dasar dan href pada <a>.
    html = html.replace(/<(\/?[a-zA-Z0-9]+)([^>]*)>/g, (match, tag, attrs) => {
        const normalizedTag = tag.toLowerCase().replace("/", "");

        if (["b", "strong", "i", "em", "u", "s"].includes(normalizedTag)) {
            return `<${tag.toLowerCase()}>`;
        }

        if (normalizedTag === "a") {
            const hrefMatch = attrs.match(/href=(["'][^"']*["'])/i);
            return hrefMatch
                ? `<${tag.toLowerCase()} href=${hrefMatch[1]}>`
                : "";
        }

        return "";
    });

    const lines = html
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line.replace(/<[^>]+>/g, "").trim().length > 0);

    return lines.map(line => `<p>${line}</p>`).join("\n<br>\n");
}

export function cleanHtml(raw) {
    if (!raw || !raw.trim()) return "";

    const parser = new DOMParser();
    const doc = parser.parseFromString(raw, "text/html");

    // =========================================================
    // 1. Buang elemen yang tidak diperlukan
    // =========================================================

    doc.querySelectorAll(
        "script, style, button, svg, path, form, textarea, input, select, iframe, nav, footer, header, noscript"
    ).forEach(el => el.remove());

    // Buang semua HTML comment, termasuk <!---->
    const walker = document.createTreeWalker(
        doc.body,
        NodeFilter.SHOW_COMMENT
    );

    const comments = [];

    while (walker.nextNode()) {
        comments.push(walker.currentNode);
    }

    comments.forEach(comment => comment.remove());

    // =========================================================
    // 2. Tag yang tetap dipertahankan
    // =========================================================

    const inlineTags = new Set([
        "b",
        "strong",
        "i",
        "em",
        "u",
        "s",
        "del",
        "mark",
        "small",
        "sub",
        "sup",
        "code",
        "kbd",
        "a"
    ]);

    const headingTags = new Set([
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6"
    ]);

    const blockTags = new Set([
        "blockquote",
        "ul",
        "ol",
        "li"
    ]);

    // =========================================================
    // 3. Bersihkan atribut
    // =========================================================

    [...doc.body.querySelectorAll("*")].forEach(el => {
        const tag = el.tagName.toLowerCase();

        if (
            !inlineTags.has(tag) &&
            !headingTags.has(tag) &&
            !blockTags.has(tag) &&
            tag !== "br"
        ) {
            return;
        }

        // Simpan href sebelum semua atribut dihapus
        let href = null;

        if (tag === "a") {
            href = el.getAttribute("href");
        }

        [...el.attributes].forEach(attr => {
            el.removeAttribute(attr.name);
        });

        if (tag === "a" && href) {
            el.setAttribute("href", href);
        }
    });

    // =========================================================
    // 4. Konversi DOM menjadi teks + HTML formatting
    //
    // <p>  -> newline
    // <br> -> newline
    // heading -> tetap sebagai HTML
    // bold/italic/dll -> tetap sebagai HTML
    // =========================================================

    function renderNode(node, depth = 0) {
        // -----------------------------
        // Text node
        // -----------------------------
        if (node.nodeType === Node.TEXT_NODE) {
            return node.nodeValue || "";
        }

        // -----------------------------
        // Comment
        // -----------------------------
        if (node.nodeType === Node.COMMENT_NODE) {
            return "";
        }

        // Bukan element
        if (node.nodeType !== Node.ELEMENT_NODE) {
            return "";
        }

        const tag = node.tagName.toLowerCase();

        // -----------------------------
        // <br>
        // -----------------------------
        if (tag === "br") {
            return "\n";
        }

        // -----------------------------
        // Isi elemen
        // -----------------------------
        const children = [...node.childNodes]
            .map(child => renderNode(child, depth + 1))
            .join("");

        // -----------------------------
        // Heading
        // -----------------------------
        if (headingTags.has(tag)) {
            return `\n<${tag}>${children.trim()}</${tag}>\n\n`;
        }

        // -----------------------------
        // Inline formatting
        // -----------------------------
        if (inlineTags.has(tag)) {
            if (tag === "a") {
                const href = node.getAttribute("href");

                if (href) {
                    return `<a href="${href}">${children}</a>`;
                }

                return children;
            }

            return `<${tag}>${children}</${tag}>`;
        }

        // -----------------------------
        // Blockquote
        // -----------------------------
        if (tag === "blockquote") {
            return `\n<blockquote>${children.trim()}</blockquote>\n\n`;
        }

        // -----------------------------
        // List
        // -----------------------------
        if (tag === "ul" || tag === "ol") {
            return `\n<${tag}>\n${children.trim()}\n</${tag}>\n\n`;
        }

        // -----------------------------
        // List item
        // -----------------------------
        if (tag === "li") {
            return `<li>${children.trim()}</li>\n`;
        }

        // -----------------------------
        // <p>
        // -----------------------------
        if (tag === "p") {
            const content = children.trim();

            if (!content) {
                return "\n";
            }

            return `\n${content}\n`;
        }

        // -----------------------------
        // Elemen lain:
        // hanya ambil isinya
        // -----------------------------
        return children;
    }

    let result = [...doc.body.childNodes]
        .map(node => renderNode(node))
        .join("");

    // =========================================================
    // 5. Bersihkan whitespace
    // =========================================================

    result = result
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")

        // Buang spasi di akhir baris
        .replace(/[ \t]+\n/g, "\n")

        // Buang spasi berlebihan di awal baris
        .replace(/\n[ \t]+/g, "\n")

        // Maksimal dua baris kosong
        .replace(/\n{3,}/g, "\n\n")

        .trim();

    // =========================================================
    // 6. Deteksi dan normalisasi judul Chapter
    // =========================================================

    const lines = result.split("\n");

    const chapterRegex =
        /^(?:bab|chapter|ch\.?)\s*(\d+)(?:\s*[:\-–—]?\s*(.*))?$/i;

    const specialTitleRegex =
        /^(?:prolog|prologue|epilog|epilogue)\b/i;

    for (let i = 0; i < Math.min(lines.length, 5); i++) {

        const plainText = lines[i]
            .replace(/<[^>]+>/g, "")
            .trim();

        const match = plainText.match(chapterRegex);

        if (match) {
            const number = match[1];
            const title = match[2]
                ? match[2].trim()
                : "";

            lines[i] = title
                ? `<h1>Chapter ${number}: ${title}</h1>`
                : `<h1>Chapter ${number}</h1>`;

            break;
        }

        if (specialTitleRegex.test(plainText)) {
            lines[i] = `<h1>${plainText}</h1>`;
            break;
        }
    }

    return lines
        .join("\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}
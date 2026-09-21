export function suggestLabel(title) {
    const matches = title.match(/[a-zA-Z0-9]+/g);
    if (!matches) return "";

    return matches
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join("")
        .slice(0, 12);
}

export function formatSynopsis(rawText) {
    const paragraphs = rawText
        .split("\n")
        .map(p => p.trim())
        .filter(Boolean);

    if (!paragraphs.length) return "\n<p>-</p>\n";

    return "\n" + paragraphs.map(p => `<p>${p}</p>`).join("\n<br>\n") + "\n";
}

export function formatCharactersSection(charsRaw) {
    const lines = charsRaw
        .split("\n")
        .map(c => c.trim())
        .filter(Boolean);

    if (!lines.length) return "";

    const items = lines.map(line => {
        let name = line;
        let imgUrl = "";

        if (line.includes("|")) {
            const parts = line.split("|");
            name = parts[0].trim();
            imgUrl = parts[1].trim();
        }

        return `    <div class="charalist">
      <div class="charaimg">
    <img alt="${name}" src="${imgUrl}" /></div>
      <strong>${name}</strong>
    </div>`;
    });

    return `

<div id="charactor">
  <h2>Character List</h2>
  <div class="charabox">
${items.join("\n")}
  </div>
</div>
`;
}

export function formatGallerySection(title, urlsRaw) {
    const urls = urlsRaw
        .split("\n")
        .map(u => u.trim())
        .filter(Boolean);

    if (!urls.length) return "";

    const items = urls.map(url =>
        `  <a href="${url}" style="margin-left: 1em; margin-right: 1em;"><img alt="" data-original-height="1500" data-original-width="1000" height="240" src="${url}" width="169" /></a>`
    );

    return `

<div class="bixbox galery"><h2>Gallery ${title}</h2><div class="bigbang" id="galery">
${items.join("\n")}
</div>
</div>
`;
}

export function normalizeLabel(label) {
    return label.replace(/\s+/g, "");
}

export function generateTOCHtml(data) {
    const synopsisHtml = formatSynopsis(data.synopsis);
    const characterSection = formatCharactersSection(data.characters);
    const gallerySection = formatGallerySection(data.title, data.gallery);

    return `<!--thumbnail-->
<div class="separator" style="clear: both; text-align: center;">
<img src="${data.thumbUrl}" /></div>
<!--end thumbnail-->${characterSection}${gallerySection}
<!--info manga-->
<div id="sinopsis">
<div class="judulAlt">
  <b>Judul Alternative</b>
${data.altTitle}
</div>
<div class="descManga">
  <b> Synopsis ${data.title}</b>${synopsisHtml}  </div>
<div class="mangaInfo">
    <div class="infonya">
      <b>Tahun Rilis</b>
      <span> ${data.year} </span>
      </div>
    <div class="infonya author">
      <b>Author</b>
      <span> ${data.author} </span>
      </div>
    <div class="infonya artist">
      <b>Artist</b>
      <span> ${data.artist} </span>
      </div>
    <div class="infonya serial">
      <b>Serialization</b>
      <span> ${data.serial} </span>
      </div>
  </div>
  <div class="lc">${data.label}</div>
</div>

<script type="text/javascript">
var label_chapter = '${data.label}';
<\/script>`;
}

export function generateBloggerLabels(data) {
    const list = [];

    // 1. Kunci Pemanggil Chapter (hanya dari input #tocLabel, BUKAN judul novel)
    if (data.label) {
        list.push(data.label);
    }

    // 2. Genre (multi-select pilihan pengguna)
    if (Array.isArray(data.genres)) {
        data.genres.forEach(genre => {
            if (genre) list.push(genre);
        });
    }

    // 3. Tipe Novel
    if (data.novelType) {
        list.push(data.novelType);
    }

    // 4. Native Language
    if (data.language) {
        list.push(data.language);
    }

    // 5. Volume (opsional: jika ada input angka, format jadi 'Volume [angka]')
    if (data.volume) {
        list.push(`Volume ${data.volume}`);
    }

    // 6. Jumlah Total Chapter (format otomatis jadi 'Chapter [angka]')
    if (data.chapterCount) {
        list.push(`Chapter ${data.chapterCount}`);
    }

    // 7. Status Seri
    if (data.status) {
        list.push(data.status);
    }

    // 8. Rating (desimal dipertahankan persis sesuai input tanpa teks tambahan)
    if (data.rating) {
        list.push(data.rating);
    }

    // 9. Series (selalu teks statis 'Series' di urutan paling akhir)
    list.push("Series");

    // Pembersihan output otomatis:
    // - Trim spasi berlebih
    // - Hapus elemen kosong
    // - Hapus nilai duplikat tanpa mengacak urutan
    const unique = [];
    list.forEach(item => {
        const cleaned = String(item).trim().replace(/\s+/g, " ");
        if (cleaned.length > 0 && !unique.includes(cleaned)) {
            unique.push(cleaned);
        }
    });

    return unique.join(",");
}

export function getTOCData() {
    const value = id => {
        const el = document.getElementById(id);
        return el ? el.value.trim() : "";
    };

    // Ambil daftar genre yang dicentang dari multi-select
    const checkedGenres = [];
    document.querySelectorAll("#genreOptions input[type='checkbox']:checked").forEach(cb => {
        checkedGenres.push(cb.value);
    });

    return {
        // Data lama
        title: value("tocTitle"),
        altTitle: value("tocAltTitle") || "-",
        thumbUrl: value("tocThumb"),
        author: value("tocAuthor") || "-",
        artist: value("tocArtist") || "-",
        year: value("tocYear") || "-",
        serial: value("tocSerial") || "-",
        label: value("tocLabel"),
        characters: value("tocCharacters"),
        synopsis: value("tocSynopsis"),
        gallery: value("tocGallery"),

        // Data baru khusus Label Blogger
        status: value("labelStatus"),
        novelType: value("labelType"),
        chapterCount: value("labelChapterCount"),
        volume: value("labelVolume"),
        rating: value("labelRating"),
        language: value("labelLang"),
        genres: checkedGenres
    };
}

export function resetTOC() {
    const defaults = {
        tocTitle: "",
        tocAltTitle: "",
        tocThumb: "",
        tocAuthor: "",
        tocArtist: "",
        tocYear: "2026",
        tocSerial: "",
        tocLabel: "SaintGal",
        tocCharacters: "",
        tocSynopsis: "",
        tocGallery: "",
        tocOutput: "",
        // Form baru
        labelStatus: "",
        labelType: "",
        labelChapterCount: "",
        labelVolume: "",
        labelRating: "",
        labelLang: "",
        bloggerLabelOutput: ""
    };

    Object.entries(defaults).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) el.value = value;
    });

    // Reset centang genre
    document.querySelectorAll("#genreOptions input[type='checkbox']").forEach(cb => {
        cb.checked = false;
    });

    const trigger = document.getElementById("genreTrigger");
    if (trigger) {
        trigger.textContent = "Pilih Genre...";
        trigger.classList.remove("has-value");
    }
}
/**
 * Membaca teks mentah bebas berbasis key: value dan mengisikannya ke form
 */
export function parseAndApplyMetadata(rawText) {
    if (!rawText || !rawText.trim()) return false;

    // Normalisasi teks
    const lines = rawText.split(/\r?\n/);
    let currentKey = null;
    let synopsisBuffer = [];

    const data = {
        genres: []
    };

    // Daftar kata kunci yang dikenali
    const keyPatterns = [
        { key: "title", regex: /^(?:judul|title|name)\s*[:=]\s*(.*)$/i },
        { key: "altTitle", regex: /^(?:judul\s*alt(?:ernatif)?|alt(?:ernative)?(?:\s*title)?)\s*[:=]\s*(.*)$/i },
        { key: "thumb", regex: /^(?:cover|thumb(?:nail)?|gambar|image)\s*[:=]\s*(.*)$/i },
        { key: "author", regex: /^(?:author|penulis|pengarang)\s*[:=]\s*(.*)$/i },
        { key: "artist", regex: /^(?:artist|ilustrator|illustrator)\s*[:=]\s*(.*)$/i },
        { key: "year", regex: /^(?:tahun(?:\s*rilis)?|year|released)\s*[:=]\s*(.*)$/i },
        { key: "serial", regex: /^(?:serial(?:ization)?|penerbit|publisher)\s*[:=]\s*(.*)$/i },
        { key: "label", regex: /^(?:label|tag|kode)\s*[:=]\s*(.*)$/i },
        { key: "status", regex: /^(?:status)\s*[:=]\s*(.*)$/i },
        { key: "type", regex: /^(?:tipe|type)\s*[:=]\s*(.*)$/i },
        { key: "chapterCount", regex: /^(?:total\s*chapter|chapter(?:s)?)\s*[:=]\s*(.*)$/i },
        { key: "volume", regex: /^(?:vol(?:ume)?)\s*[:=]\s*(.*)$/i },
        { key: "rating", regex: /^(?:rating|score)\s*[:=]\s*(.*)$/i },
        { key: "lang", regex: /^(?:bahasa|language|native(?:\s*language)?)\s*[:=]\s*(.*)$/i },
        { key: "genre", regex: /^(?:genre(?:s)?)\s*[:=]\s*(.*)$/i },
        { key: "synopsis", regex: /^(?:sinopsis|synopsis|deskripsi|description)\s*[:=]?\s*(.*)$/i }
    ];

    for (let line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
            if (currentKey === "synopsis") synopsisBuffer.push("");
            continue;
        }

        // Cek apakah baris ini adalah awal dari suatu key
        let matched = false;
        for (const item of keyPatterns) {
            const m = trimmed.match(item.regex);
            if (m) {
                currentKey = item.key;
                matched = true;
                const val = m[1].trim();

                if (currentKey === "synopsis") {
                    synopsisBuffer = val ? [val] : [];
                } else if (currentKey === "genre") {
                    data.genres = val.split(/[,/|]+/).map(g => g.trim()).filter(Boolean);
                } else {
                    data[currentKey] = val;
                }
                break;
            }
        }

        // Jika bukan key baru dan sebelumnya sedang membaca sinopsis (multi-line)
        if (!matched && currentKey === "synopsis") {
            synopsisBuffer.push(trimmed);
        }
    }

    if (synopsisBuffer.length > 0) {
        data.synopsis = synopsisBuffer.join("\n").trim();
    }

    // Helper untuk mengisi form jika ditemukan datanya
    const setVal = (id, val) => {
        if (val !== undefined && val !== null && val !== "") {
            const el = document.getElementById(id);
            if (el) el.value = val;
        }
    };

    setVal("tocTitle", data.title);
    setVal("tocAltTitle", data.altTitle);
    setVal("tocThumb", data.thumb);
    setVal("tocAuthor", data.author);
    setVal("tocArtist", data.artist);
    setVal("tocYear", data.year);
    setVal("tocSerial", data.serial);
    setVal("tocLabel", data.label);
    setVal("tocSynopsis", data.synopsis);

    // Seleksi dropdown status
    if (data.status) {
        const s = data.status.toLowerCase();
        const sel = document.getElementById("labelStatus");
        if (sel) {
            Array.from(sel.options).forEach(opt => {
                if (opt.value && s.includes(opt.value.toLowerCase())) sel.value = opt.value;
            });
        }
    }

    // Seleksi dropdown tipe novel
    if (data.type) {
        const t = data.type.toLowerCase();
        const sel = document.getElementById("labelType");
        if (sel) {
            if (t.includes("light")) sel.value = "Light Novel";
            else if (t.includes("web")) sel.value = "Web Novel";
            else if (t.includes("fanfic")) sel.value = "Fanfic";
            else if (t.includes("oneshot")) sel.value = "Oneshot";
        }
    }

    // Seleksi dropdown bahasa
    if (data.lang) {
        const l = data.lang.toLowerCase();
        const sel = document.getElementById("labelLang");
        if (sel) {
            if (l.includes("japan") || l.includes("jp")) sel.value = "Japanese";
            else if (l.includes("korea") || l.includes("kr")) sel.value = "Korean";
            else if (l.includes("chin") || l.includes("cn") || l.includes("tiongkok")) sel.value = "Chinese";
        }
    }

    // Ekstrak angka murni untuk chapter, volume, dan rating
    if (data.chapterCount) {
        const m = data.chapterCount.match(/\d+/);
        if (m) setVal("labelChapterCount", m[0]);
    }
    if (data.volume) {
        const m = data.volume.match(/\d+/);
        if (m) setVal("labelVolume", m[0]);
    }
    if (data.rating) {
        const m = data.rating.match(/[\d.]+/);
        if (m) setVal("labelRating", m[0]);
    }

    // Multi-select Genre
    if (data.genres && data.genres.length > 0) {
        const checkboxes = document.querySelectorAll("#genreOptions input[type='checkbox']");
        const matched = [];

        checkboxes.forEach(cb => {
            const isMatch = data.genres.some(g => g.toLowerCase() === cb.value.toLowerCase());
            if (isMatch) {
                cb.checked = true;
                matched.push(cb.value);
            }
        });

        const trigger = document.getElementById("genreTrigger");
        if (trigger && matched.length > 0) {
            trigger.textContent = matched.join(", ");
            trigger.classList.add("has-value");
        }
    }

    // Buat saran label otomatis jika belum ada label di teks masukan tapi ada judul
    if (!data.label && data.title) {
        const suggested = suggestLabel(data.title);
        setVal("tocLabel", suggested);
    }

    return true;
}
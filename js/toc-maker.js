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

export function getTOCData() {
    const value = id => document.getElementById(id).value.trim();

    return {
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
        gallery: value("tocGallery")
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
        tocOutput: ""
    };

    Object.entries(defaults).forEach(([id, value]) => {
        document.getElementById(id).value = value;
    });
}

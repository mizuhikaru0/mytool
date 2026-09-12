export function splitText(content, maxChars) {
    const parts = content.split(/(\n\s*\n|\r\n\s*\r\n)/);
    const chunks = [];
    let currentChunk = [];
    let currentLength = 0;

    for (const part of parts) {
        const partLen = part.length;

        if (partLen > maxChars) {
            const sentences = part.split(/(?<=[.!?…])\s+/);

            for (const sentence of sentences) {
                if (
                    currentLength + sentence.length > maxChars &&
                    currentChunk.length > 0
                ) {
                    chunks.push(currentChunk.join("").trim());
                    currentChunk = [sentence];
                    currentLength = sentence.length;
                } else {
                    currentChunk.push(
                        currentChunk.length > 0 ? " " + sentence : sentence
                    );
                    currentLength += sentence.length;
                }
            }
            continue;
        }

        if (
            currentLength + partLen > maxChars &&
            currentChunk.length > 0
        ) {
            chunks.push(currentChunk.join("").trim());
            currentChunk = [part];
            currentLength = partLen;
        } else {
            currentChunk.push(part);
            currentLength += partLen;
        }
    }

    if (currentChunk.length > 0) {
        chunks.push(currentChunk.join("").trim());
    }

    return chunks.filter(chunk => chunk.trim().length > 0);
}

export function createSplitterState() {
    return {
        chunks: [],
        currentIndex: 0
    };
}

export function renderChunk(state) {
    if (!state.chunks.length) {
        return {
            text: "",
            counter: "Bagian: 0 / 0"
        };
    }

    const chunk = state.chunks[state.currentIndex];

    return {
        text: chunk,
        counter: `Bagian: ${state.currentIndex + 1} / ${state.chunks.length} (${chunk.length} karakter)`
    };
}

export function previousChunk(state) {
    if (state.currentIndex > 0) state.currentIndex--;
}

export function nextChunk(state) {
    if (state.currentIndex < state.chunks.length - 1) {
        state.currentIndex++;
    }
}

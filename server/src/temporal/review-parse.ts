/** Extract MUST FIX bullets for the builder; null when review requires no fixes. */
export function extractMustFixForBuilder(review: string): string | null {
    const trimmed = review.trim();
    if (!trimmed) {
        return null;
    }

    const match = trimmed.match(
        /MUST FIX:\s*([\s\S]*?)(?=\nNICE TO HAVE:|$)/i,
    );
    if (!match) {
        return null;
    }

    const section = match[1].trim();
    if (!section) {
        return null;
    }

    const lines = section
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

    if (lines.length === 0) {
        return null;
    }

    const onlyNone = lines.every((line) =>
        /^-?\s*none\.?$/i.test(line),
    );
    if (onlyNone) {
        return null;
    }

    return section;
}

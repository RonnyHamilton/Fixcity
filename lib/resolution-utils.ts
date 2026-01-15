/**
 * Utility functions for parsing and rendering resolution notes with embedded images
 */

export interface ParsedResolutionNotes {
    text: string;
    imageUrl: string | null;
}

/**
 * Parses resolution notes that may contain embedded base64 image data
 * Format: "Notes text\n\n[Proof Image]: data:image/jpeg;base64,..."
 */
export function parseResolutionNotes(notes: string): ParsedResolutionNotes {
    if (!notes) {
        return { text: '', imageUrl: null };
    }

    // Check for the [Proof Image] marker
    const imageMarker = '[Proof Image]:';
    const markerIndex = notes.indexOf(imageMarker);

    if (markerIndex === -1) {
        // No image embedded, return notes as-is
        return { text: notes, imageUrl: null };
    }

    // Extract text before the marker
    const text = notes.substring(0, markerIndex).trim();

    // Extract the base64 image URL after the marker
    const imageUrlStart = markerIndex + imageMarker.length;
    const imageUrl = notes.substring(imageUrlStart).trim();

    return { text, imageUrl };
}

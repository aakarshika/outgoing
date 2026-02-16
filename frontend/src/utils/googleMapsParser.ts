
export interface Review {
    author: string;
    details?: string;
    rating?: number;
    time?: string;
    text?: string;
}

export interface BusinessDetails {
    name: string;
    anotherName?: string;
    alternativeName?: string;
    rating?: string;
    reviewCount?: string;
    category?: string;
    address?: string;
    phone?: string;
    website?: string;
    reviewSummary?: string[];
    topReviews?: Review[];
    reviewTags?: { label: string; count?: string }[];
}

export function parseGoogleMapsContent(text: string): BusinessDetails {
    if (!text) return { name: '' };

    const lines = text.split('\n').map(l => l.trim());
    const filteredLines = lines.filter(l => l !== '');

    if (filteredLines.length === 0) return { name: '' };

    const result: BusinessDetails = {
        name: filteredLines[0],
        anotherName: filteredLines[1],
        reviewSummary: [],
        topReviews: [],
    };

    // Basic Info Extraction (Lines 1-6)
    let foundRating = false;
    let foundReviewCount = false;

    for (let i = 1; i < Math.min(filteredLines.length, 6); i++) {
        const line = filteredLines[i];

        // Rating (e.g., 4.5)
        if (!foundRating && /^\d\.\d$/.test(line)) {
            result.rating = line;
            foundRating = true;
            continue;
        }

        // Review Count (e.g., (319) or (1,255))
        if (!foundReviewCount && /^\(\d+(,\d+)*\)$/.test(line)) {
            result.reviewCount = line.replace(/[()]/g, '');
            foundReviewCount = true;
            continue;
        }

        // Category (e.g., Hospital· or Park· or just "Wedding venue")
        if (!result.category && (line.includes('·') || (i > 1 && !/^\d\.\d$/.test(line) && !/^\(\d+/.test(line) && line.length < 50))) {
            // If it's line 1 and we haven't found rating/review count yet, it might be alternative name
            if (i === 1 && !/^\d\.\d$/.test(line)) {
                result.alternativeName = line;
            } else {
                result.category = line.replace('·', '');
            }
        }
    }

    // Symbol-based extraction
    for (let i = 0; i < filteredLines.length; i++) {
        const line = filteredLines[i];

        // Address ()
        if (line === '' && i + 1 < filteredLines.length) {
            result.address = filteredLines[i + 1];
        }

        // Phone ()
        if (line === '' && i + 1 < filteredLines.length) {
            const nextLine = filteredLines[i + 1];
            if (/^(\+?\d[\d\s-]{5,})/.test(nextLine)) {
                result.phone = nextLine;
            }
        }

        // Website ()
        if (line === '' && i + 1 < filteredLines.length) {
            const nextLine = filteredLines[i + 1];
            if (nextLine !== 'Add website') {
                result.website = nextLine;
            }
        }
    }

    // Review Summary extraction
    const summaryIndex = filteredLines.indexOf('Review summary');
    if (summaryIndex !== -1) {
        for (let i = summaryIndex + 1; i < filteredLines.length; i++) {
            const line = filteredLines[i];
            if (line === 'Write a review') break;
            if (line.startsWith('"') && line.endsWith('"')) {
                result.reviewSummary?.push(line.replace(/"/g, ''));
            }
        }
    }

    // Review Tags extraction - look for "All" specifically in the Reviews section
    const sortIndex = filteredLines.lastIndexOf('Sort');
    const allIndex = sortIndex !== -1 ? filteredLines.indexOf('All', sortIndex) : -1;

    if (allIndex !== -1) {
        result.reviewTags = [];
        for (let i = allIndex + 1; i < filteredLines.length; i++) {
            const line = filteredLines[i];

            // Heuristic to stop: hit an author (line followed by "review/Local Guide") or "More reviews"
            const nextLine = filteredLines[i + 1] || '';
            if (line.startsWith('More reviews')) break;
            if (line.length > 1 && (nextLine.includes('review') || nextLine.includes('Local Guide'))) break;
            if (line === '') break; // Star symbol also indicates a review

            // If the line is a number, it's likely a count for the previous tag
            if (/^\d+$/.test(line) && result.reviewTags.length > 0) {
                result.reviewTags[result.reviewTags.length - 1].count = line;
            } else if (line !== '' && line !== '' && !line.startsWith('+')) {
                // If it's not a count, it's a new tag label
                result.reviewTags.push({ label: line });
            }
        }
    }

    // Top Reviews extraction
    const reviewsIndex = filteredLines.lastIndexOf('Reviews');
    if (reviewsIndex !== -1) {
        let currentReview: Review | null = null;

        for (let i = reviewsIndex + 1; i < filteredLines.length; i++) {
            const line = filteredLines[i];

            // If we see "More reviews", we are done
            if (line.startsWith('More reviews')) break;

            // Skip common action words
            if (['Share', 'Like', 'Sort', 'All', '', '', ''].includes(line)) continue;

            // Look for author patterns
            // A common pattern after 'Reviews' is: Author Name -> Local Guide... -> Stars block -> Time -> Text

            // Heuristic: A line followed by "reviews" or "review" or "Local Guide" is likely an author
            const isRating = /^\d\.\d$/.test(line);
            const isSymbol = line.length === 1;

            if (!isRating && !isSymbol && i + 1 < filteredLines.length &&
                (filteredLines[i + 1].includes('review') || filteredLines[i + 1].includes('Local Guide'))) {

                if (currentReview) result.topReviews?.push(currentReview);

                currentReview = {
                    author: line,
                    details: filteredLines[i + 1]
                };
                i++; // skip details line
                continue;
            }

            // Stars block usually indicated by  symbols
            if (line === '' && currentReview) {
                let starCount = 1;
                while (i + 1 < filteredLines.length && filteredLines[i + 1] === '') {
                    starCount++;
                    i++;
                }
                currentReview.rating = starCount;

                // Next line is usually time
                if (i + 1 < filteredLines.length) {
                    currentReview.time = filteredLines[i + 1];
                    i++;
                }

                // Next lines might be text
                const textLines = [];
                while (i + 1 < filteredLines.length) {
                    const nextLine = filteredLines[i + 1];
                    const nextNextLine = filteredLines[i + 2] || '';

                    // Stop if we hit an icon or action word
                    if (['', '', '', 'Like', 'Share'].includes(nextLine)) break;

                    // Stop if we hit "More reviews"
                    if (nextLine.startsWith('More reviews')) break;

                    // Stop if we hit a new author (heuristic: nextLine length > 1 and nextNextLine has review/Local Guide)
                    if (nextLine.length > 1 && (nextNextLine.includes('review') || nextNextLine.includes('Local Guide'))) break;

                    textLines.push(nextLine);
                    i++;
                }
                if (textLines.length > 0) {
                    currentReview.text = textLines.join('\n');
                }
            }
        }
        if (currentReview) result.topReviews?.push(currentReview);
    }

    return result;
}

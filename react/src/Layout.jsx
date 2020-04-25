import * as Circuit from './Circuit';

const EXTRA_SMALL_LAYOUT = {
    gateSize: 32,
    horizontalSpacing: 2,
    wireExtension: 2,
    perQubitProbability: {
        fontSize: 14,
        width: 60,
    },
};

const SMALL_LAYOUT = {
    gateSize: 32,
    horizontalSpacing: 8,
    wireExtension: 16,
    perQubitProbability: {
        fontSize: 18,
        width: 70,
    },
};

const MEDIUM_LAYOUT = {
    gateSize: 48,
    horizontalSpacing: 8,
    wireExtension: 16,
    perQubitProbability: {
        fontSize: 18,
        width: 70,
    },
};

const LARGE_LAYOUT = {
    gateSize: 56,
    horizontalSpacing: 8,
    wireExtension: 16,
    perQubitProbability: {
        fontSize: 18,
        width: 70,
    },
};

let selectedLayout = SMALL_LAYOUT;

export const VERTICAL_SPACING = 8;

export function gateSize() {
    return selectedLayout.gateSize;
}
export function horizontalSpacing() {
    return selectedLayout.horizontalSpacing;
}
export function wireExtension() {
    return selectedLayout.wireExtension;
}
export function perQubitProbability() {
    return selectedLayout.perQubitProbability;
}

export function setLayout(circuit) {
    const rows = Circuit.numRows(circuit);
    const columns = Circuit.numColumns(circuit);
    if (rows <= 3 && columns <= 4) {
        selectedLayout = LARGE_LAYOUT;
    } else if (rows <= 4 && columns <= 4) {
        selectedLayout = MEDIUM_LAYOUT;
    } else if (columns === 5) {
        selectedLayout = SMALL_LAYOUT;
    } else {
        selectedLayout = EXTRA_SMALL_LAYOUT;
    }
}

export const WHITE = '#FFFFFF';
export const DARK_GRAY = '#333333';
export const BLUE = '#4B6FEC';
export const STROKE_WIDTH = 1;
// TODO: Move into icons file
export const EMPTY_GATE_RADIUS = 4;
export const GRID_DIV_ID = 'gate-grid';
export const MAX_VIZ_WIDTH = 288;
export const EPSILON = 1e-10;
export const OUTPUT_CORNER_RADIUS = 8;

export const EMPTY_CELL = '-';
export const UNARY_GATES = ['H', 'X', 'Y', 'Z', 'S', 'T', 'R8', 'XH'];
export const BINARY_GATES = ['CX', 'CZ'];

export const WIRE_TRACK = Object.freeze({
    INSIDE: 1 / 3,
    MIDDLE: 1 / 2,
    OUTSIDE: 2 / 3,
});

export const DraggableTypes = {
    GATE: 'gate',
    PROBE: 'probe',
};

// The types of gate that can be rendered are the Unary Gates, the control gate,
// the Binary Gates' action gates (prefixed with ACTION_) and 'Empty'
export const RENDERABLE_GATES = [
    ...UNARY_GATES,
    ...BINARY_GATES.map(gate => `CONTROL_${gate}`),
    ...BINARY_GATES.map(gate => `ACTION_${gate}`),
    EMPTY_CELL,
];

// These are the gates that the user can drag from the palette.
export const PALETTE_GATES = [...UNARY_GATES, ...BINARY_GATES];

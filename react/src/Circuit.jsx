import QuantumCircuit from 'quantum-circuit';
import * as mathjs from 'mathjs';
import { EMPTY_CELL, UNARY_GATES, BINARY_GATES } from './Constants';
import * as Layout from './Layout';

// Gate Operations

export function isBinaryGatePair(cell) {
    return typeof cell !== 'string';
}

export function isBinaryGateName(gateType) {
    return BINARY_GATES.includes(gateType);
}

export function getActionGate(binaryGatePair) {
    return binaryGatePair[0];
}

export function getActionRow(binaryGatePair) {
    return binaryGatePair[1];
}

// Circuit Operations

export function createEmpty(rows, columns) {
    const circuit = [];
    for (let i = 0; i < rows; i++) {
        circuit.push([]);
        for (let j = 0; j < columns; j++) {
            circuit[i].push(EMPTY_CELL);
        }
    }
    return circuit;
}

export function numColumns(circuit) {
    return circuit[0].length;
}

export function numRows(circuit) {
    return circuit.length;
}


export function clone(sourceCircuit) {
    const cloned = [];
    for (let i = 0; i < numRows(sourceCircuit); i++) {
        cloned.push([]);
        for (let j = 0; j < numColumns(sourceCircuit); j++) {
            cloned[i].push(sourceCircuit[i][j]);
        }
    }
    return cloned;
}

function getRowThatControls(row, column, circuit) {
    for (let i = 0; i < numRows(circuit); i++) {
        const cell = circuit[i][column];
        if (isBinaryGatePair(cell) && getActionRow(cell) === row) {
            return i;
        }
    }
    return null;
}

function clearGateThatControls(row, column, circuit) {
    const rowOfControlGate = getRowThatControls(row, column, circuit);
    if (rowOfControlGate != null) {
        circuit[rowOfControlGate][column] = EMPTY_CELL;
    }
    return circuit;
}

function addUnaryGate(row, column, gate, circuit) {
    circuit[row][column] = gate;
    clearGateThatControls(row, column, circuit);
    return circuit;
}

function addBinaryGatePair(row, column, binaryGatePair, circuit) {
    const actionRow = getActionRow(binaryGatePair);
    clearGateThatControls(row, column, circuit);
    clearGateThatControls(actionRow, column, circuit);

    circuit[row][column] = binaryGatePair;
    circuit[actionRow][column] = EMPTY_CELL;
    return circuit;
}

export function addGate(row, column, gate, circuit) {
    const newCircuit = clone(circuit);
    if (isBinaryGatePair(gate)) {
        return addBinaryGatePair(row, column, gate, newCircuit);
    }

    return addUnaryGate(row, column, gate, newCircuit);
}

function isActionGate(row, column, circuit) {
    return getRowThatControls(row, column, circuit) != null;
}

export function getGateAt(row, column, circuit) {
    return circuit[row][column];
}

export function removeGate(row, column, circuit) {
    const newCircuit = clone(circuit);
    newCircuit[row][column] = EMPTY_CELL;
    clearGateThatControls(row, column, newCircuit);
    return newCircuit;
}

function getSimulatorGateName(gate) {
    switch (gate) {
        case 'H':
            return 'h';
        case 'X':
            return 'x';
        case 'XH':
            return 'xh';
        case 'Y':
            return 'y';
        case 'Z':
            return 'z';
        case 'S':
            return 's';
        case 'T':
            return 't';
        case 'R8':
            return 'r8';
        case 'CX':
            return 'cx';
        case 'CZ':
            return 'cz';
        default:
            return 'id';
    }
}


const xhGateSim = new QuantumCircuit(1);
xhGateSim.addGate('x', 0, 0);
xhGateSim.addGate('h', 1, 0);
const xhGateObj = xhGateSim.save();

export function simulate(circuit) {
    const simulator = new QuantumCircuit(numRows(circuit));
    simulator.registerGate('xh', xhGateObj);
    for (let row = 0; row < numRows(circuit); row++) {
        for (let column = 0; column < circuit[row].length; column++) {
            const cell = circuit[row][column];
            if (isBinaryGatePair(cell)) {
                const actionGate = getActionGate(cell);
                const actionRow = getActionRow(cell);
                simulator.addGate(getSimulatorGateName(actionGate), column, [
                    row,
                    actionRow,
                ]);
            } else if (cell !== EMPTY_CELL) {
                simulator.addGate(getSimulatorGateName(cell), column, row);
            }
        }
    }
    simulator.run();
    return simulator;
}

export function isQubitEntangledAfterColumn(row, column, circuit) {
    for (let i = 0; i <= column; i++) {
        if (
            isBinaryGatePair(circuit[row][i])
            || isActionGate(row, i, circuit)
        ) {
            return true;
        }
    }
    return false;
}

// To see how this regex works, go to https://regexr.com/415k3
const stateRegex = /\s*(-?\d\.\d*(?:\+|-)\d\.\d*i)\|(\d+)>\s(\d+\.?\d*)%/;
export function getStateValues(simulator, filterImpossible = false) {
    const stateStrings = simulator
        .stateAsString(filterImpossible)
        .trim()
        .split('\n');
    const stateValues = {};
    stateStrings.forEach((stateString) => {
        const tryMatchState = stateString.match(stateRegex);
        if (tryMatchState !== null) {
            const [, amplitude, state, percent] = tryMatchState;
            stateValues[state.toString()] = {
                amplitude: mathjs.complex(amplitude),
                percent: parseFloat(percent),
            };
        }
    });
    return stateValues;
}

// Validation

const MAX_ROWS = 5;
const MAX_COLUMNS = 6;

function validateCircuitSize({ rows, columns, startingCircuit, successStates }) {
    if (rows < 1 || rows > MAX_ROWS) {
        throw new Error(`You must have between 1 and ${MAX_ROWS} rows.`);
    }
    if (columns < 1 || columns > MAX_COLUMNS) {
        throw new Error(`You must have between 1 and ${MAX_COLUMNS} columns.`);
    }
    if (startingCircuit !== undefined) {
        if (rows !== startingCircuit.length) {
            throw new Error(
                `You've said in your configuration that you have ${rows} rows, but your startingCircuit shows ${
                    startingCircuit.length
                } rows`
            );
        }
        for (let i = 0; i < startingCircuit.length; i++) {
            if (columns !== startingCircuit[i].length) {
                throw new Error(
                    `You've said in your configuration that you have ${columns} columns, but in your startingCircuit in row #${i + 1}, we have a row with ${
                        startingCircuit[i].length
                    } columns`
                );
            }
        }
    }
    if (successStates !== undefined) {
        successStates
            .filter(({ circuit }) => circuit.length > 0)
            .forEach(({ circuit }, successIndex) => {
                if (rows !== circuit.length) {
                    throw new Error(
                        `Success state ${successIndex + 1} has ${circuit.length} rows, but ${rows} rows were expected.`
                    );
                }
                for (let i = 0; i < circuit.length; i++) {
                    if (columns !== circuit[i].length) {
                        throw new Error(
                            `Success state ${successIndex + 1}, row ${i + 1} has ${circuit[i].length} columns, but ${columns} columns were expected.`
                        );
                    }
                }
            });
    }
}

function validateUnaryGate(gate) {
    if (!UNARY_GATES.includes(gate)) {
        throw new Error(`
            Your circuit includes a unary gate of type ${gate}. We don't support that!
            Valid unary gates are: ${UNARY_GATES}.
        `);
    }
}

function validateBinaryGatePair(binaryGatePair, currentColumn, circuit) {
    if (binaryGatePair.length !== 2) {
        throw new Error(`
        Your circuit include a malformed binary gate. It looks like ${binaryGatePair}. We expect binary gates to be in the form [gateType, actionRow].
        Example: ['CX', 2]
        `);
    }
    const gateType = getActionGate(binaryGatePair);
    const actionRow = getActionRow(binaryGatePair);
    if (!isBinaryGateName(gateType)) {
        throw new Error(`
            Your circuit includes a binary gate that looks like ${binaryGatePair}. We don't support that type of gate!
            Valid binary gates are: ${BINARY_GATES}.
        `);
    }
    if (actionRow < 0 || actionRow >= circuit.length) {
        throw new Error(`
        Your control gate of type ${gateType} is trying to connect to wire ${actionRow}, which doesn't exist.
        The rows are 0-indexed, so the top row is 0 and the last row (in this case) is ${circuit.length
            - 1}
        `);
    }
    const actionCell = circuit[actionRow][currentColumn];
    if (actionCell !== EMPTY_CELL) {
        throw new Error(`
            Your control gate in column #${currentColumn} is targeting row #${actionRow}. This cell needs to be empty. It currently contains a ${actionCell}.
        `);
    }
}

function validateCircuit(circuit) {
    for (let i = 0; i < circuit.length; i++) {
        for (let j = 0; j < circuit[i].length; j++) {
            const cell = circuit[i][j];
            if (cell !== EMPTY_CELL) {
                if (isBinaryGatePair(cell)) {
                    validateBinaryGatePair(cell, j, circuit);
                } else {
                    validateUnaryGate(cell);
                }
            }
        }
    }
}

function validateBlackBox({ start, end }, localNumColumns) {
    if (start < 0 || start >= localNumColumns) {
        throw new Error(
            `The start column for your black box must fall between 0 and ${localNumColumns
            - 1}. Currently, it starts at column ${start}`
        );
    }
    if (end < 0 || end >= localNumColumns) {
        throw new Error(
            `The end column for your black box must fall between 0 and ${localNumColumns
            - 1}. Currently, it ends at column ${end}`
        );
    }
    if (end < start) {
        throw new Error(
            `The end column for your black box must be greater than or equal to the start column. Currently, the start column is ${start}, while the end column is earlier, at ${end}.`
        );
    }
}

export function validateConfiguration(config) {
    validateCircuitSize(config);
    if (config.startingCircuit !== undefined) {
        validateCircuit(config.startingCircuit);
    }
    if (config.blackBoxColumns !== undefined) {
        validateBlackBox(config.blackBoxColumns, config.columns);
    }
}

// Layout functions
export function getRowCenters(circuit) {
    const rowCenters = [];
    const gateSize = Layout.gateSize();
    for (let i = 0; i < numRows(circuit); i++) {
        rowCenters.push(
            gateSize / 2 + i * (gateSize + Layout.VERTICAL_SPACING)
        );
    }
    return rowCenters;
}

export function getColumnCenters(circuit) {
    const columnCenters = [];
    const gateSize = Layout.gateSize();
    for (let i = 0; i < numColumns(circuit); i++) {
        columnCenters.push(
            Layout.wireExtension()
            + gateSize / 2
            + i * (gateSize + Layout.horizontalSpacing())
        );
    }
    return columnCenters;
}

export function isControlWireObstructed({ fromRow, toRow }, column, circuit) {
    // BE CLEAR: does this take a renderable circuit or a normal circuit
    // Convert this to take a binary gate pair probably
    for (let row = fromRow + 1; row < toRow; row++) {
        if (
            circuit[row][column] !== '-'
            || isActionGate(row, column, circuit)
        ) {
            return true;
        }
    }
    return false;
}

export function containsJoggedWires(column, circuit) {
    for (let row = 0; row < numRows(circuit); row++) {
        const cell = circuit[row][column];
        if (isBinaryGatePair(cell)) {
            const actionRow = getActionRow(cell);
            const controlWire = {
                fromRow: Math.min(row, actionRow),
                toRow: Math.max(row, actionRow),
            };
            if (isControlWireObstructed(controlWire, column, circuit)) {
                return true;
            }
        }
    }
    return false;
}

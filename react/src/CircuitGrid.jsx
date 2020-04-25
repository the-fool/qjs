import React from 'react';
import styled from 'styled-components';
import * as Colors from './style-constants';
import { RowContainer, ColumnContainer } from './Containers';
import {
    DARK_GRAY,
    STROKE_WIDTH,
    EMPTY_GATE_RADIUS,
    GRID_DIV_ID,
    WIRE_TRACK,
    EMPTY_CELL,
    WHITE,
    OUTPUT_CORNER_RADIUS,
} from './Constants';
import * as Circuit from './Circuit';
import { PerQubitProbability } from './CircuitOutputs';
import { DraggableCell } from './Cell';
import BinaryGateOverlay from './BinaryGateOverlay';
import * as Layout from './Layout';

function totalCircuitWidth(columns) {
    return (
        Layout.wireExtension()
        + Layout.gateSize() * columns
        + Layout.horizontalSpacing() * (columns - 1)
        + Layout.wireExtension()
    );
}

function totalCircuitHeight(rows) {
    return Layout.gateSize() * rows + Layout.VERTICAL_SPACING * (rows - 1);
}

function getCenterOfRow(row) {
    return (
        Layout.gateSize() / 2
        + (Layout.gateSize() + Layout.VERTICAL_SPACING) * row
    );
}

function convertToRenderable(sourceCircuit) {
    const renderableCells = Circuit.clone(sourceCircuit);
    for (let i = 0; i < Circuit.numRows(sourceCircuit); i++) {
        for (let j = 0; j < Circuit.numColumns(sourceCircuit); j++) {
            const cell = sourceCircuit[i][j];
            if (Circuit.isBinaryGatePair(cell)) {
                const actionRow = Circuit.getActionRow(cell);
                const actionGate = Circuit.getActionGate(cell);
                renderableCells[i][j] = `CONTROL_${actionGate}`;
                renderableCells[actionRow][j] = `ACTION_${actionGate}`;
            }
        }
    }
    return renderableCells;
}

function getControlWires(circuit) {
    const controlWires = [];
    for (let i = 0; i < Circuit.numRows(circuit); i++) {
        for (let j = 0; j < Circuit.numColumns(circuit); j++) {
            const cell = circuit[i][j];
            if (Circuit.isBinaryGatePair(cell)) {
                const actionRow = Circuit.getActionRow(cell);
                controlWires.push({
                    column: j,
                    fromRow: Math.min(i, actionRow),
                    toRow: Math.max(i, actionRow),
                });
            }
        }
    }
    return controlWires;
}

function computeStraightPath(fromRow, toRow) {
    const centerLine = Layout.gateSize() / 2;
    return `
        M${centerLine},${getCenterOfRow(fromRow)}
        L${centerLine},${getCenterOfRow(toRow)}
    `;
}

function computeJoggedPath({
    fromRow,
    toRow,
    gutterTrack,
    jogStartTrack,
    jogEndTrack,
}) {
    const xCenterLine = Layout.gateSize() / 2;
    const xGutter = Layout.gateSize() + gutterTrack * Layout.horizontalSpacing();
    const yStart = getCenterOfRow(fromRow);
    const yJogStart = yStart
        + Layout.gateSize() / 2
        + jogStartTrack * Layout.VERTICAL_SPACING;
    const yEnd = getCenterOfRow(toRow);
    const yJogEnd = yEnd
        - Layout.gateSize() / 2
        - Layout.VERTICAL_SPACING
        + jogEndTrack * Layout.VERTICAL_SPACING;
    const cornerRadius = 4;

    return `
        M ${xCenterLine}, ${yStart}
        V ${yJogStart - cornerRadius}
        A ${cornerRadius},${cornerRadius} 0 0,0 ${xCenterLine
        + cornerRadius},${yJogStart}

        H ${xGutter - cornerRadius}
        A ${cornerRadius},${cornerRadius} 0 0,1 ${xGutter},${yJogStart
        + cornerRadius}

        V ${yJogEnd - cornerRadius}
        A ${cornerRadius},${cornerRadius} 0 0,1 ${xGutter
        - cornerRadius},${yJogEnd}

        H ${xCenterLine + cornerRadius}
        A ${cornerRadius},${cornerRadius} 0 0,0 ${xCenterLine},${yJogEnd
        + cornerRadius}

        V ${yEnd}
    `;
}

const StartingQubits = ({ rows, colors }) => (
    <ColumnContainer spacing={Layout.VERTICAL_SPACING}>
        {[...Array(rows)].map((_, i) => {
            const color = colors[i] || 'none';
            return <StartingQubit color={color}>|0⟩</StartingQubit>;
        })}
    </ColumnContainer>
);
function rowLabelStyle(colorName) {
    if (colorName === 'none') {
        return {
            textColor: DARK_GRAY,
            backgroundColor: 'transparent',
        };
    }
    return {
        textColor: WHITE,
        backgroundColor: Colors[colorName],
    };
}

const StartingQubit = styled.div`
    height: 32px;
    margin-top: ${() => (Layout.gateSize() - 32) / 2}px;
    margin-bottom: ${() => Layout.VERTICAL_SPACING + (Layout.gateSize() - 32) / 2}px;
    line-height: 30px;
    width: 24px;
    text-align: center;
    background-color: ${props => rowLabelStyle(props.color).backgroundColor};
    color: ${props => rowLabelStyle(props.color).textColor};
    border-radius: 4px;
    }
`;

const CircuitLayersContainer = styled.div`
    position: relative;
    width: ${props => totalCircuitWidth(props.columns)}px;
    height: ${props => totalCircuitHeight(props.rows)}px;
    > div {
        position: absolute;
    }
`;

const GateGrid = ({
    circuit,
    blackBoxColumns,
    onCellBeginDrag,
    onDropGateOnCell,
    visualizationKey,
}) => {
    const renderableCells = convertToRenderable(circuit);
    return (
        <ColumnContainer spacing={Layout.VERTICAL_SPACING}>
            {renderableCells.map((rowCells, rowIndex) => (
                <CircuitRow
                    cells={rowCells}
                    visualizationKey={visualizationKey}
                    blackBoxColumns={blackBoxColumns}
                    onCellBeginDrag={columnIndex => onCellBeginDrag(rowIndex, columnIndex)
                    }
                    // prettier-ignore
                    onDropGateOnCell={(columnIndex, droppedGate) => (
                        onDropGateOnCell(rowIndex, columnIndex, droppedGate)
                    )
                    }
                />
            ))}
        </ColumnContainer>
    );
};

const QubitLines = ({ rows, columns }) => (
    <ColumnContainer spacing={Layout.VERTICAL_SPACING}>
        {Array(rows).fill(<QubitWire numCells={columns} />)}
    </ColumnContainer>
);

const ControlWires = ({ circuit, blackBoxColumns }) => {
    const controlWires = getControlWires(circuit);
    const empty2DArray = Array.from(
        Array(Circuit.numColumns(circuit)),
        () => []
    );
    const wiresByColumn = controlWires.reduce((accumulator, controlWire) => {
        const isInBlackBox = blackBoxColumns
            && controlWire.column >= blackBoxColumns.start
            && controlWire.column <= blackBoxColumns.end;
        if (!isInBlackBox) {
            accumulator[controlWire.column].push(controlWire);
        }
        return accumulator;
    }, empty2DArray);

    const joggedWiresByColumn = wiresByColumn.map(
        (columnWires, columnIndex) => {
            let joggedColumn = columnWires.map(wire => ({
                obstructed: Circuit.isControlWireObstructed(
                    wire,
                    columnIndex,
                    circuit
                ),
                ...wire,
            }));

            joggedColumn.sort((wire1, wire2) => wire1.fromRow - wire2.fromRow);
            // We only have a maximum of 5 rows. if both wires are obstructed, that means
            // they MUST be obstructing each other. If we had 6 rows, this line
            // would need to change.
            if (
                joggedColumn.length === 2
                && joggedColumn[0].obstructed
                && joggedColumn[1].obstructed
            ) {
                joggedColumn[0].gutterTrack = WIRE_TRACK.OUTSIDE;
                joggedColumn[1].gutterTrack = WIRE_TRACK.INSIDE;

                if (joggedColumn[0].toRow === joggedColumn[1].fromRow + 1) {
                    // The top one comes back in where the bottom one goes out. They'll need to be
                    // offset.
                    joggedColumn[0].jogStartTrack = WIRE_TRACK.MIDDLE;
                    joggedColumn[0].jogEndTrack = WIRE_TRACK.OUTSIDE;
                    joggedColumn[1].jogStartTrack = WIRE_TRACK.INSIDE;
                    joggedColumn[1].jogEndTrack = WIRE_TRACK.MIDDLE;
                } else {
                    joggedColumn[0].jogStartTrack = WIRE_TRACK.MIDDLE;
                    joggedColumn[0].jogEndTrack = WIRE_TRACK.MIDDLE;
                    joggedColumn[1].jogStartTrack = WIRE_TRACK.MIDDLE;
                    joggedColumn[1].jogEndTrack = WIRE_TRACK.MIDDLE;
                }
            } else {
                joggedColumn = joggedColumn.map(wire => ({
                    ...wire,
                    gutterTrack: WIRE_TRACK.MIDDLE,
                    jogStartTrack: WIRE_TRACK.MIDDLE,
                    jogEndTrack: WIRE_TRACK.MIDDLE,
                }));
            }

            return joggedColumn;
        }
    );

    return (
        <WireColumnsGrid>
            {joggedWiresByColumn.map(columnWires => (
                <svg
                    width={Layout.gateSize() + Layout.horizontalSpacing()}
                    height={totalCircuitHeight(Circuit.numRows(circuit))}
                >
                    {columnWires.map((wire) => {
                        if (!wire.obstructed) {
                            return (
                                <StraightWire
                                    fromRow={wire.fromRow}
                                    toRow={wire.toRow}
                                />
                            );
                        }
                        return (
                            <JoggedWire
                                fromRow={wire.fromRow}
                                toRow={wire.toRow}
                                gutterTrack={wire.gutterTrack}
                                jogStartTrack={wire.jogStartTrack}
                                jogEndTrack={wire.jogEndTrack}
                            />
                        );
                    })}
                </svg>
            ))}
        </WireColumnsGrid>
    );
};

const WireColumnsGrid = styled.div`
    display: flex;
    padding-left: ${() => Layout.wireExtension()}px;
    flex-direction: row;
    path {
        stroke: ${DARK_GRAY};
        stroke-width: ${STROKE_WIDTH};
        stroke-linejoin: round;
    }
`;

const StraightWire = ({ fromRow, toRow }) => (
    <path d={computeStraightPath(fromRow, toRow)} />
);

const JoggedWire = ({
    fromRow,
    toRow,
    gutterTrack,
    jogStartTrack,
    jogEndTrack,
}) => (
    <path
        d={computeJoggedPath({
            fromRow,
            toRow,
            gutterTrack,
            jogStartTrack,
            jogEndTrack,
        })}
        fill-opacity="0"
    />
);

const CircuitRow = ({
    cells,
    blackBoxColumns,
    onCellBeginDrag,
    onDropGateOnCell,
    visualizationKey,
}) => (
    <CellRow>
        {cells.map((cell, columnIndex) => {
            let isInBlackBox = false;
            if (blackBoxColumns) {
                isInBlackBox = columnIndex >= blackBoxColumns.start
                    && columnIndex <= blackBoxColumns.end;
            }
            return (
                <DraggableCell
                    visualizationKey={visualizationKey}
                    contents={isInBlackBox ? EMPTY_CELL : cell}
                    draggable={!isInBlackBox}
                    droppable={!isInBlackBox}
                    onBeginDrag={() => onCellBeginDrag(columnIndex)}
                    onDropGate={droppedGate => onDropGateOnCell(columnIndex, droppedGate)
                    }
                />
            );
        })}
    </CellRow>
);

const CellRow = styled(RowContainer).attrs({
    spacing: () => Layout.horizontalSpacing(),
})`
    height: ${() => Layout.gateSize()}px;
    padding-left: ${() => Layout.wireExtension()}px;
    padding-right: ${() => Layout.wireExtension()}px;
`;

const QubitWire = ({ numCells }) => {
    const totalWidth = totalCircuitWidth(numCells);
    const centerY = Layout.gateSize() / 2;

    return (
        <svg width={totalWidth} height={Layout.gateSize()}>
            <symbol id="emptyCell" overflow="visible">
                <circle cx="0" cy="0" r={EMPTY_GATE_RADIUS} fill="#FFFFFF" />
            </symbol>
            <line
                stroke={DARK_GRAY}
                x1="0"
                y1={centerY}
                x2={totalWidth}
                y2={centerY}
            />
        </svg>
    );
};

const BlackBox = ({ start, end, label }) => {
    const numColumns = end - start + 1;
    const width = Layout.gateSize() * numColumns
        + Layout.horizontalSpacing() * (numColumns - 1);
    const leftMargin = Layout.wireExtension()
        + (Layout.gateSize() + Layout.horizontalSpacing()) * start;
    return (
        <div
            style={{
                display: 'flex',
                width,
                height: '100%',
                marginLeft: leftMargin,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: DARK_GRAY,
                color: WHITE,
                fontWeight: 'bold',
                borderRadius: OUTPUT_CORNER_RADIUS,
            }}
        >
            {label}
        </div>
    );
};

export default class CircuitGrid extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            binaryGateMode: null
        }
    }
    enterBinaryGateMode(row, column, actionGate) {
        this.props.handlers.removeGate(row, column);
        this.setState({
            binaryGateMode: {
                controlRow: row,
                column,
                actionGate,
            },
        });
    }

    exitBinaryGateMode() {
        this.setState({ binaryGateMode: null });
    }

    placeBinaryGatePair({ controlRow, column, actionGate }, actionRow) {
        const binaryGatePair = [actionGate, actionRow];
        this.props.handlers.addGate(controlRow, column, binaryGatePair);
        this.exitBinaryGateMode();
    }

    render() {
        const {
            circuit,
            circuitSimulator,
            showPerQubitProbability,
            handlers,
            blackBoxColumns,
            rowColors,
            visualizationKey,
        } = this.props;
        const { binaryGateMode } = this.state;

        return (
            <RowContainer>
                <StartingQubits
                    rows={Circuit.numRows(circuit)}
                    colors={rowColors}
                />
                <CircuitLayersContainer
                    rows={Circuit.numRows(circuit)}
                    columns={Circuit.numColumns(circuit)}
                >
                    <ControlWires
                        circuit={circuit}
                        blackBoxColumns={blackBoxColumns}
                    />
                    <QubitLines
                        rows={Circuit.numRows(circuit)}
                        columns={Circuit.numColumns(circuit)}
                    />
                    <div id={GRID_DIV_ID}>
                        <GateGrid
                            visualizationKey={visualizationKey}
                            circuit={circuit}
                            blackBoxColumns={blackBoxColumns}
                            // prettier-ignore
                            onCellBeginDrag={(rowIndex, columnIndex) => (
                                handlers.removeGate(rowIndex, columnIndex)
                            )
                            }
                            onDropGateOnCell={(
                                rowIndex,
                                columnIndex,
                                droppedGate
                            ) => {
                                // TODO: move this to a function
                                if (Circuit.isBinaryGateName(droppedGate)) {
                                    this.enterBinaryGateMode(
                                        rowIndex,
                                        columnIndex,
                                        droppedGate
                                    );
                                } else {
                                    handlers.addGate(
                                        rowIndex,
                                        columnIndex,
                                        droppedGate
                                    );
                                }
                            }}
                        />
                    </div>
                    {blackBoxColumns ? (
                        <BlackBox
                            start={blackBoxColumns.start}
                            end={blackBoxColumns.end}
                            label={blackBoxColumns.label}
                        />
                    ) : null}
                    {binaryGateMode ? (
                        <BinaryGateOverlay
                            circuit={circuit}
                            activeColumn={binaryGateMode.column}
                            controlRow={binaryGateMode.controlRow}
                            actionGate={binaryGateMode.actionGate}
                            onActionGatePlaced={actionRow => this.placeBinaryGatePair(
                                binaryGateMode,
                                actionRow
                            )
                            }
                            onCanceled={() => this.exitBinaryGateMode()}
                        />
                    ) : null}
                </CircuitLayersContainer>
                {showPerQubitProbability ? (
                    <PerQubitProbability circuitSimulator={circuitSimulator} />
                ) : null}
            </RowContainer>
        );
    }
}

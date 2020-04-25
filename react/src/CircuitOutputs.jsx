import React from 'react';
import * as mathjs from 'mathjs';
import styled from 'styled-components';
import { ColumnContainer, RowContainer } from './Containers';
import * as Circuit from './Circuit';
import * as Amplitude from './Amplitude';
import { BLUE, WHITE, OUTPUT_CORNER_RADIUS } from './Constants';
import * as Layout from './Layout';

const arcDegrees = (6 * Math.PI) / 4;
const arcRadius = 8;
const arcCenter = { x: 9, y: 11 };
const arcStartDegrees = Math.PI / 2 + arcDegrees / 2;
const arcEndDegrees = Math.PI / 2 - arcDegrees / 2;
const arcStart = {
    x: arcCenter.x + arcRadius * Math.cos(arcStartDegrees),
    y: arcCenter.y - arcRadius * Math.sin(arcStartDegrees),
};
const arcEnd = {
    x: arcCenter.x + arcRadius * Math.cos(arcEndDegrees),
    y: arcCenter.y - arcRadius * Math.sin(arcEndDegrees),
};
const innerProbabilityDivSize = 32;

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function toPercent(decimal) {
    return `${Math.round(decimal * 100)}%`;
}

// TODO: Move the little dashboard icon to icons file
const PerQubitProbability = ({ circuitSimulator }) => (
    <ColumnContainer
        style={{
            width: `${Layout.perQubitProbability().width}px`,
            textAlign: 'right',
        }}
        spacing={Layout.VERTICAL_SPACING}
    >
        {Object.values(circuitSimulator.probabilities()).map(probability => (
            <div
                style={{
                    height: `${Layout.gateSize()}px`,
                    padding: `${(Layout.gateSize() - innerProbabilityDivSize)
                        / 2}px 0`,
                }}
            >
                <div
                    style={{
                        color: WHITE,
                        backgroundColor: BLUE,
                        borderRadius: OUTPUT_CORNER_RADIUS,
                        display: 'flex',
                        height: `${innerProbabilityDivSize}px`,
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0 4px',
                    }}
                >
                    <svg
                        style={{
                            display: 'block',
                            width: '18px',
                            height: '18px',
                            stroke: WHITE,
                            fill: 'none',
                        }}
                    >
                        <path
                            d={`M${arcStart.x},${arcStart.y} 
                                A${arcRadius},${arcRadius} 
                                0 1,1 
                                ${arcEnd.x},${arcEnd.y}`}
                        />
                        <line
                            x1={arcCenter.x}
                            y1={arcCenter.y}
                            x2={arcCenter.x + arcRadius}
                            y2={arcCenter.y}
                            transform={`rotate(${lerp(
                                arcStartDegrees,
                                arcEndDegrees,
                                probability
                            )
                                * (180 / Math.PI)
                                * -1}, 
                                ${arcCenter.x}, 
                                ${arcCenter.y})`}
                        />
                    </svg>
                    <div
                        style={{
                            fontSize: `${
                                Layout.perQubitProbability().fontSize
                            }px`,
                        }}
                    >
                        {toPercent(probability)}
                    </div>
                </div>
            </div>
        ))}
    </ColumnContainer>
);

// TODO: Move to constants file as 'output color'? Unless bloch sphere probe moves in here
const backgroundColor = BLUE;
const textColor = WHITE;

// TODO: Figure out the right place to put this
const tableStyle = {
    padding: '8px 16px',
    backgroundColor,
    borderRadius: `${OUTPUT_CORNER_RADIUS}px`,
};

const CheatTable = ({ circuitSimulator }) => {
    const states = Circuit.getStateValues(circuitSimulator, true);
    const rows = Object.keys(states)
        .sort()
        .map(state => [
            <div>({Amplitude.toHTML(states[state].amplitude)})</div>,
            <div>{Amplitude.stateNameToString(state)}</div>,
        ]);

    return (
        <div style={tableStyle}>
            <Table rows={rows} />
        </div>
    );
};

const measurementInterval = 50;
class Histogram extends React.Component {
    constructor(props) {
        super(props);
        this.resetMeasurements(this.props.circuitSimulator);
    }

    componentWillReceiveProps(nextProps) {
        this.resetMeasurements(nextProps.circuitSimulator);
    }

    componentDidMount() {
        this.measurementLoop = window.setInterval(
            () => this.measureCircuit(),
            measurementInterval
        );
    }

    componentWillUnmount() {
        window.clearInterval(this.measurementLoop);
    }

    measureCircuit() {
        const { stateProbabilities } = this.state;
        if (stateProbabilities) {
            const measured = mathjs.pickRandom(
                Object.keys(stateProbabilities),
                Object.values(stateProbabilities)
            );
            this.setState((state) => {
                state.samples[measured]++;
                return state;
            });
        }
    }

    resetMeasurements(circuitSimulator) {
        const allStates = Object.entries(
            Circuit.getStateValues(circuitSimulator)
        ).sort();
        const samples = {};
        const stateProbabilities = {};
        allStates.forEach(([stateName, { amplitude }]) => {
            samples[stateName] = 0;

            // eslint-disable-next-line operator-linebreak
            stateProbabilities[stateName] =
                amplitude.re * amplitude.re + amplitude.im * amplitude.im;
        });
        this.setState({ samples, stateProbabilities });
    }

    getTotalMeasurements() {
        return Object.entries(this.state.samples).reduce(
            (sum, [, numSamples]) => sum + numSamples,
            0
        );
    }

    render() {
        const { samples } = this.state;
        if (!samples) {
            return null;
        }
        const totalMeasurements = this.getTotalMeasurements();
        const rows = Object.keys(samples)
            .sort()
            .map(stateName => [
                <div>{Amplitude.stateNameToString(stateName)}</div>,
                <HistogramBar
                    percentage={samples[stateName] / totalMeasurements}
                    width={60}
                />,
            ]);
        return (
            <div style={tableStyle}>
                <Table rows={rows} />
            </div>
        );
    }
}

const HistogramBar = ({ percentage, width }) => (
    <div
        style={{
            width: `${width}px`,
            border: `1px solid ${textColor}`,
            position: 'relative',
        }}
    >
        <div
            style={{
                left: 0,
                right: `${(1 - percentage) * 100}%`,
                top: 0,
                bottom: 0,
                position: 'absolute',
                backgroundColor: textColor,
            }}
        />
    </div>
);

const Table = ({ rows }) => {
    const numRows = rows.length;
    if (numRows < 8) {
        return <CheatColumn>{rows.flat()}</CheatColumn>;
    }

    return <TwoColumnTable rows={rows} />;
};

const CheatColumn = styled.div`
    display: grid;
    grid-template-columns: auto auto;
    grid-auto-rows: min-content;
    column-gap: 4px;
    row-gap: 4px;
    color: ${textColor};
`;

const TwoColumnTable = ({ rows }) => {
    const halfLength = Math.ceil(rows.length / 2);
    const leftRows = rows.slice(0, halfLength);
    const rightRows = rows.slice(halfLength, rows.length);

    return (
        <RowContainer style={{ fontSize: '16px' }} spacing={8}>
            <CheatColumn>{leftRows.flat()}</CheatColumn>
            <VerticalRule />
            <CheatColumn>{rightRows.flat()}</CheatColumn>
        </RowContainer>
    );
};

const VerticalRule = styled.div`
    width: 1px;
    background-color: ${textColor};
    opacity: 0.4;
`;

export { PerQubitProbability, CheatTable, Histogram };

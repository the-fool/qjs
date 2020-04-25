import React from 'react';
import * as mathjs from 'mathjs';
import {
    STROKE_WIDTH,
    OUTPUT_CORNER_RADIUS,
    BLUE,
    WHITE,
    EPSILON,
} from './Constants';
import * as Circuit from './Circuit';
import * as Amplitude from './Amplitude';
import EntanglementIcon from './EntanglementIcon';
import * as Layout from './Layout';

const ENTANGLED = 'entangled';
const { cos, sin } = mathjs;

const probeDisplayHeight = 90;
const probeDisplayWidth = 120;
const textStyle = {
    fill: WHITE,
    fontSize: 14,
    letterSpacing: '0.3px',
    wordSpacing: '-1px',
};

const BACK_FACING_STYLE = {
    opacity: 0.5,
    strokeDasharray: '3,1',
};

const PERSPECTIVE_ANGLE = mathjs.pi / 16;

const DOT_RADIUS = 3;

// TODO: The entanglement icon and the bloch sphere both use this. Rename it
const SPHERE_RADIUS = 18;

function getBlochAngles(states) {
    const zeroAmplitude = states['0'].amplitude;
    const oneAmplitude = states['1'].amplitude;

    const azimuthal = zeroAmplitude.toPolar().phi - oneAmplitude.toPolar().phi;
    const polar = mathjs.acos(zeroAmplitude.toPolar().r) * 2;
    return { azimuthal, polar };
}

// TODO: Figure out if there's a better way than all these magic numbers. This probably shouldn't
// be svg.
const ProbeDisplay = ({ states }) => {
    let probeContents = null;
    if (states !== ENTANGLED) {
        const blochAngles = getBlochAngles(states);
        probeContents = [
            <BlochSphere
                polarAngle={blochAngles.polar}
                azimuthalAngle={blochAngles.azimuthal}
                offsetX={probeDisplayWidth / 2 - SPHERE_RADIUS}
                offsetY={8}
            />,
            <StateString
                amplitude={states['0'].amplitude}
                state="0"
                x={probeDisplayWidth - 12}
                y={probeDisplayHeight - 26}
            />,
            <StateString
                amplitude={states['1'].amplitude}
                state="1"
                x={probeDisplayWidth - 12}
                y={probeDisplayHeight - 8}
            />,
        ];
    } else {
        probeContents = [
            <EntanglementIcon
                offsetX={probeDisplayWidth / 2 - SPHERE_RADIUS}
                offsetY={8}
            />,
            <text
                style={textStyle}
                text-anchor="end"
                x={probeDisplayWidth - 12}
                y={probeDisplayHeight - 26}
            >
                Entangled State
            </text>,
        ];
    }
    return (
        <svg
            style={{ transform: 'translate(0%, -100%)' }}
            width={probeDisplayWidth}
            height={probeDisplayHeight}
        >
            {/* This is the main rounded rectangle */}
            <rect
                style={{ fill: BLUE, stroke: BLUE }}
                width={probeDisplayWidth}
                height={probeDisplayHeight}
                rx={OUTPUT_CORNER_RADIUS}
                ry={OUTPUT_CORNER_RADIUS}
            />
            {/* This is the bottom left corner */}
            <rect
                style={{ fill: BLUE, stroke: BLUE }}
                x={0}
                y={probeDisplayHeight - OUTPUT_CORNER_RADIUS}
                width={OUTPUT_CORNER_RADIUS}
                height={OUTPUT_CORNER_RADIUS}
            />
            {probeContents}
        </svg>
    );
};

export const StateString = ({
    amplitude, state, x, y,
}) => (
    <text style={textStyle} x={x} y={y} text-anchor="end">
        {Amplitude.toSVG(amplitude)} {Amplitude.stateNameToString(state)}
    </text>
);

// TODO: Move to icons file with Entanglement Icon
export const ProbeIcon = ({ fill, outline, iconColor }) => {
    const outlineStyle = {
        fill,
        stroke: outline,
    };

    const gateSize = Layout.gateSize();
    const SPHERE_RADIUS_LOCAL = gateSize * 0.3;
    const sphereOffset = gateSize / 2 - SPHERE_RADIUS_LOCAL;

    return (
        <svg width={Layout.gateSize()} height={Layout.gateSize()}>
            <circle
                style={outlineStyle}
                cx={gateSize / 2}
                cy={gateSize / 2}
                r={gateSize / 2 - STROKE_WIDTH}
            />
            <UnitSphereOutline
                offsetX={sphereOffset}
                offsetY={sphereOffset}
                color={iconColor}
                radius={SPHERE_RADIUS_LOCAL}
            />
        </svg>
    );
};

function rotateAroundAxis(axis, theta, vector) {
    // function borrowed from
    // https://en.wikipedia.org/wiki/Rotation_matrix#Rotation_matrix_from_axis_and_angle
    const normalized = mathjs.divide(axis, mathjs.norm(axis));
    const ux = normalized.get([0]);
    const uy = normalized.get([1]);
    const uz = normalized.get([2]);

    // prettier-ignore
    const rotMatrix = mathjs.matrix([
        [cos(theta) + ux * ux * (1 - cos(theta)), ux * uy * (1 - cos(theta)) - uz * sin(theta), ux * uz * (1 - cos(theta)) + uy * sin(theta)], // eslint-disable-line max-len
        [uy * ux * (1 - cos(theta)) + uz * sin(theta), cos(theta) + uy * uy * (1 - cos(theta)), uy * uy * (1 - cos(theta)) - ux * sin(theta)], // eslint-disable-line max-len
        [uz * uz * (1 - cos(theta)) - uy * sin(theta), uz * uy * (1 - cos(theta)) + ux * sin(theta), cos(theta) + uz * uz * (1 - cos(theta))], // eslint-disable-line max-len
    ]);
    return mathjs.multiply(rotMatrix, vector);
}

export const BlochSphere = ({
    polarAngle,
    azimuthalAngle,
    offsetX,
    offsetY,
}) => {
    // TODO: Encapsulate
    const x = SPHERE_RADIUS * sin(polarAngle) * cos(azimuthalAngle);
    const y = SPHERE_RADIUS * sin(polarAngle) * sin(azimuthalAngle);
    const z = SPHERE_RADIUS * cos(polarAngle);

    const rotationAxis = mathjs.matrix([-1, 0, 1]);
    const rotated = rotateAroundAxis(
        rotationAxis,
        PERSPECTIVE_ANGLE,
        mathjs.matrix([x, y, z])
    );

    const projectedX = rotated.get([0]);
    const projectedY = rotated.get([2]);
    const isFacingFront = y >= -EPSILON;

    const dotStyle = {
        stroke: WHITE,
        fill: '#FFA048',
        opacity: isFacingFront ? 1 : 0.75,
        strokeDasharray: isFacingFront ? '' : '3,1',
    };
    return (
        <g transform={`translate(${offsetX}, ${offsetY})`}>
            <UnitSphereOutline
                radius={SPHERE_RADIUS}
                offsetX={0}
                offsetY={0}
                color={WHITE}
            />
            <line
                style={isFacingFront ? null : BACK_FACING_STYLE}
                stroke={WHITE}
                x1={SPHERE_RADIUS}
                y1={SPHERE_RADIUS}
                x2={SPHERE_RADIUS + projectedX}
                y2={SPHERE_RADIUS - projectedY}
            />
            <circle
                style={dotStyle}
                cx={SPHERE_RADIUS + projectedX}
                cy={SPHERE_RADIUS - projectedY}
                r={DOT_RADIUS}
            />
        </g>
    );
};

// TODO: Move this to the icon file as well
const UnitSphereOutline = ({
    offsetX, offsetY, radius, color,
}) => {
    const perspectiveRadius = radius * mathjs.sin(PERSPECTIVE_ANGLE);
    return (
        <g
            style={{
                stroke: color,
                fill: 'none',
            }}
            transform={`translate(${offsetX}, ${offsetY})`}
        >
            <path
                style={BACK_FACING_STYLE}
                d={`
                    M ${radius},0
                    A ${perspectiveRadius},${radius} 0 1,1 ${radius},${radius
                    * 2}
                `}
            />
            <path
                style={BACK_FACING_STYLE}
                d={`
                    M 0,${radius}
                    A ${radius},${perspectiveRadius} 0 1,1 ${radius
                    * 2},${radius}
                `}
            />
            <circle cx={radius} cy={radius} r={radius} />
            <path
                d={`
                    M 0,${radius}
                    A ${radius},${perspectiveRadius} 0 1,0 ${radius
                    * 2},${radius}
                `}
            />
            <path
                d={`
                    M ${radius},0
                    A ${perspectiveRadius},${radius} 0 1,0 ${radius},${radius
                    * 2}
                `}
            />
        </g>
    );
};

function clamp(value, min, max) {
    return Math.max(min, Math.min(value, max));
}

function largestElementBelow(list, searchValue) {
    return Math.max(...list.filter(value => value <= searchValue));
}

function measureSingleRow(row, column, circuit) {
    const singleWireCircuit = [[]];
    for (let i = 0; i <= column; i++) {
        singleWireCircuit[0].push(circuit[row][i]);
    }
    const states = Circuit.getStateValues(Circuit.simulate(singleWireCircuit));
    return states;
}

export class BlochSphereProbe extends React.Component {
    constructor() {
        super();
        this.lastProbe = {};
    }

    measureAt(row, column, circuit) {
        // NOTE: If the circuit changes underneath the probe, this won't work.
        // However, that is impossible currently.
        if (row === this.lastProbe.row && column === this.lastProbe.column) {
            return this.lastProbe.states;
        }

        this.lastProbe = { row, column };

        if (!Circuit.isQubitEntangledAfterColumn(row, column, circuit)) {
            this.lastProbe.states = measureSingleRow(row, column, circuit);
            return this.lastProbe.states;
        }

        this.lastProbe.states = ENTANGLED;
        return this.lastProbe.states;
    }

    render() {
        // TODO: Clean this whole nonsense up.
        const { currentPageOffset, gridDivId, circuit } = this.props;

        const gridDiv = document.querySelector(`#${gridDivId}`);
        const gridRect = gridDiv.getBoundingClientRect();

        const rowCenters = Circuit.getRowCenters(circuit);
        const columnCenters = Circuit.getColumnCenters(circuit);

        const boundedPageX = clamp(
            currentPageOffset.x,
            gridRect.left,
            gridRect.right
        );

        const boundedPageY = Math.max(
            currentPageOffset.y,
            gridRect.top + rowCenters[0] + Layout.gateSize() / 2
        );

        const xInCircuit = boundedPageX - gridRect.left;
        const yInCircuit = boundedPageY - gridRect.top;

        const closestRowAboveProbe = largestElementBelow(
            rowCenters,
            yInCircuit - Layout.gateSize() / 2
        );
        const closestColumnBeforeProbe = largestElementBelow(
            columnCenters,
            xInCircuit
        );

        const closestRowIndex = rowCenters.indexOf(closestRowAboveProbe);
        const closestColumnIndex = columnCenters.indexOf(
            closestColumnBeforeProbe
        );

        const states = this.measureAt(
            closestRowIndex,
            closestColumnIndex,
            circuit
        );

        const lineThickness = STROKE_WIDTH * 2;

        const probeSourcePosition = {
            x: boundedPageX - Layout.gateSize() / 2,
            y: boundedPageY - Layout.gateSize() / 2,
        };

        const probeTargetPosition = {
            x: boundedPageX,
            y: gridRect.top + closestRowAboveProbe,
        };
        const lineLength = probeSourcePosition.y - probeTargetPosition.y;

        function placementStyle({ x, y }) {
            return {
                position: 'absolute',
                left: x,
                top: y,
            };
        }

        return (
            <div>
                <div style={placementStyle(probeSourcePosition)}>
                    <ProbeIcon fill={BLUE} outline={BLUE} iconColor={WHITE} />
                </div>
                <div style={placementStyle(probeTargetPosition)}>
                    <ProbeDisplay states={states} />
                </div>
                <svg
                    style={placementStyle(probeTargetPosition)}
                    width={lineThickness}
                    height={lineLength}
                >
                    <line
                        style={{ stroke: BLUE, strokeWidth: lineThickness }}
                        x1={lineThickness / 2}
                        y1={0}
                        x2={lineThickness / 2}
                        y2={lineLength}
                    />
                </svg>
            </div>
        );
    }
}

import React from 'react';
import { DragSource, DropTarget } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import styled from 'styled-components';
import {
    STROKE_WIDTH,
    WHITE,
    BLUE,
    DARK_GRAY,
    EMPTY_GATE_RADIUS,
    EMPTY_CELL,
    DraggableTypes,
} from './Constants';
import * as Layout from './Layout';

class DraggableCell extends React.Component {
    componentDidMount() {
        const { connectDragPreview } = this.props;
        if (connectDragPreview) {
            // Use empty image as a drag preview so browsers don't draw it
            // and we can draw whatever we want on the custom drag layer instead.
            connectDragPreview(getEmptyImage());
        }
    }

    // TODO: Rename draggable to dragEnabled
    render() {
        const {
            contents,
            connectDragSource,
            connectDropTarget,
            isOver,
            draggable,
            droppable,
        } = this.props;
        const shouldBeDraggable = contents !== EMPTY_CELL && draggable;

        const containerStyle = {
            cursor: shouldBeDraggable ? 'grab' : 'auto',
            position: 'relative',
        };

        const dropTargetStyle = {
            backgroundColor: BLUE,
            opacity: isOver && droppable ? 0.5 : 0,
            position: 'absolute',
            zIndex: 1,
            top: 0,
            left: 0,
            height: '100%',
            width: '100%',
        };

        let node = (
            <div
                style={containerStyle}
                className={shouldBeDraggable ? 'android-draggable' : null}
            >
                <div style={dropTargetStyle} />
                <Cell contents={contents} />
            </div>
        );
        if (shouldBeDraggable) {
            node = connectDragSource(node, { dropEffect: 'move' });
        }
        if (droppable) {
            node = connectDropTarget(node);
        }

        return node;
    }
}

const gateSourceSpec = {
    beginDrag: ({ onBeginDrag, contents, visualizationKey }) => {
        if (onBeginDrag) {
            onBeginDrag();
        }
        const gateType = contents
            .replace('ACTION_', '')
            .replace('CONTROL_', '');
        return { gateType, visualizationKey };
    },
    canDrag: props => props.contents !== EMPTY_CELL && props.draggable,
};

const gateTargetSpec = {
    drop: (props, monitor) => {
        if (props.onDropGate) {
            props.onDropGate(monitor.getItem().gateType);
        }
    },
};

function gateSourceCollector(connect) {
    return {
        connectDragSource: connect.dragSource(),
        connectDragPreview: connect.dragPreview(),
    };
}

function gateTargetCollector(connect, monitor) {
    return {
        connectDropTarget: connect.dropTarget(),
        isOver: monitor.isOver(),
    };
}

// NOTE: This is the idiomatic way to hook up drag sources to a component in React.
// I think that is dumb.
const ConnectedDraggableCell = DragSource(
    DraggableTypes.GATE,
    gateSourceSpec,
    gateSourceCollector
)(
    DropTarget(DraggableTypes.GATE, gateTargetSpec, gateTargetCollector)(
        DraggableCell
    )
);

export { ConnectedDraggableCell as DraggableCell };

export const Cell = ({ contents }) => {
    if (contents === EMPTY_CELL) {
        return (
            <BorderlessGate>
                <GateCircle fill={WHITE} />
            </BorderlessGate>
        );
    }
    if (contents.startsWith('CONTROL')) {
        return (
            <BorderlessGate>
                <GateCircle fill={DARK_GRAY} />
            </BorderlessGate>
        );
    }
    if (contents === 'ACTION_CX') {
        return (
            <BorderlessGate>
                <NotGate />
            </BorderlessGate>
        );
    }
    if (contents === 'ACTION_CZ') {
        return <UnaryGate>Z</UnaryGate>;
    }

    return <UnaryGate>{contents}</UnaryGate>;
};

export const BorderlessGate = styled.div`
    width: ${() => Layout.gateSize()}px;
    height: ${() => Layout.gateSize()}px;
    display: flex;
    align-items: center;
    justify-content: center;
`;

const UnaryGate = styled.div`
    width: ${() => Layout.gateSize()}px;
    height: ${() => Layout.gateSize()}px;
    border: ${STROKE_WIDTH}px solid ${DARK_GRAY};
    background-color: #ffffff;
    color: ${DARK_GRAY};

    display: flex;
    align-items: center;
    justify-content: center;
`;

// TODO Move to icons file
export const GateCircle = ({ fill }) => (
    <svg
        width={EMPTY_GATE_RADIUS * 2 + STROKE_WIDTH * 2}
        height={EMPTY_GATE_RADIUS * 2 + STROKE_WIDTH * 2}
    >
        <circle
            cx={EMPTY_GATE_RADIUS + STROKE_WIDTH}
            cy={EMPTY_GATE_RADIUS + STROKE_WIDTH}
            r={EMPTY_GATE_RADIUS}
            stroke={DARK_GRAY}
            fill={fill}
        />
    </svg>
);

const NOT_GATE_RADIUS = 8;
// TODO Move to icons file
const NotGate = () => (
    <svg
        width={NOT_GATE_RADIUS * 2 + STROKE_WIDTH * 2}
        height={NOT_GATE_RADIUS * 2 + STROKE_WIDTH * 2}
        style={{ stroke: DARK_GRAY }}
    >
        <circle
            cx={NOT_GATE_RADIUS + STROKE_WIDTH}
            cy={NOT_GATE_RADIUS + STROKE_WIDTH}
            r={NOT_GATE_RADIUS}
            fill={WHITE}
        />
        //Vertical line
        <line
            x1={NOT_GATE_RADIUS + STROKE_WIDTH}
            y1={STROKE_WIDTH}
            x2={NOT_GATE_RADIUS + STROKE_WIDTH}
            y2={NOT_GATE_RADIUS * 2 + STROKE_WIDTH}
        />
        //Horizontal line
        <line
            x1={STROKE_WIDTH}
            y1={NOT_GATE_RADIUS + STROKE_WIDTH}
            x2={NOT_GATE_RADIUS * 2 + STROKE_WIDTH}
            y2={NOT_GATE_RADIUS + STROKE_WIDTH}
        />
    </svg>
);

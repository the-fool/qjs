import React from 'react';
import { DragSource } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { RowContainer, ColumnContainer } from './Containers';
import { DraggableCell } from './Cell';
import { ProbeIcon } from './BlochSphereProbe';
import { DraggableTypes, BLUE, WHITE, MAX_VIZ_WIDTH } from './Constants';
import * as Layout from './Layout';

const ElementPalette = ({ gates, shouldShowProbe, visualizationKey, onDragProbe }) => {
    const spacing = 8;
    const maxGatesPerRow = Math.floor(MAX_VIZ_WIDTH / (Layout.gateSize() + spacing));
    const numRows = Math.ceil(gates.length / maxGatesPerRow);
    const gatesPerRow = Math.ceil(gates.length / numRows);

    const rows = [];
    // Note: I think I overengineered this.
    // TODO: Name this code
    for (let i = 0; i < numRows; i++) {
        const beginningIndex = i * gatesPerRow;
        const endIndex = Math.min((i + 1) * gatesPerRow, gates.length);
        const gatesInRow = gates.slice(beginningIndex, endIndex);
        rows.push(
            <RowContainer spacing={spacing}>
                {gatesInRow.map(gate => (
                    <DraggableCell visualizationKey={visualizationKey} contents={gate} draggable />
                ))}
            </RowContainer>
        );
    }

    return (
        <ColumnContainer style={{ alignItems: 'center' }} spacing={spacing}>
            {rows}
            {shouldShowProbe ? (
                <DraggableProbeSource
                    visualizationKey={visualizationKey}
                    onBeginDrag={onDragProbe}
                />
            ) : null}
        </ColumnContainer>
    );
};

class ProbeSource extends React.Component {
    componentDidMount() {
        const { connectDragPreview } = this.props;
        if (connectDragPreview) {
            // Use empty image as a drag preview so browsers don't draw it
            // and we can draw the probe on the custom drag layer instead.
            connectDragPreview(getEmptyImage());
        }
    }

    render() {
        const { connectDragSource, isDragging } = this.props;
        const fillColor = !isDragging ? BLUE : '#E7E7E7';
        const outlineColor = !isDragging ? WHITE : '#777777';
        const cursorStyle = { cursor: 'grab' };
        // We set the height manually because for some reason,
        // the browser was adding an extra 5 px below it.
        return connectDragSource(
            <div className="android-draggable" style={{ height: `${Layout.gateSize()}px`, ...cursorStyle }}>
                <ProbeIcon fill={fillColor} outline={outlineColor} iconColor={outlineColor} />
            </div>
        );
    }
}

const probeSourceSpec = {
    // The probe doesn't really carry any information -- there's only one kind of probe.
    // We do pass the visualizationKey so that we know which
    // instance of QuantumCircuit we're connecting to.
    beginDrag: ({ onBeginDrag, visualizationKey }) => {
        if (onBeginDrag) {
            onBeginDrag();
        }
        return { visualizationKey };
    },
};

function probeSourceCollector(connect, monitor) {
    return {
        connectDragSource: connect.dragSource(),
        connectDragPreview: connect.dragPreview(),
        isDragging: monitor.isDragging(),
    };
}

const DraggableProbeSource = DragSource(
    DraggableTypes.PROBE,
    probeSourceSpec,
    probeSourceCollector
)(ProbeSource);

export default ElementPalette;

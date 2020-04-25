import React from 'react';
import { DragLayer } from 'react-dnd';
import { DraggableTypes } from './Constants';
import { Cell } from './Cell';
import { BlochSphereProbe } from './BlochSphereProbe';
import * as Layout from './Layout';

const layerStyles = {
    position: 'fixed',
    pointerEvents: 'none',
    zIndex: 100,
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
};

function positionPreview(props) {
    const { currentPageOffset } = props;
    if (!currentPageOffset) {
        return {
            display: 'none',
        };
    }

    let { x, y } = currentPageOffset;
    x -= Layout.gateSize() / 2;
    y -= Layout.gateSize() / 2;
    const transform = `translate(${x}px, ${y}px)`;
    return {
        transform,
        WebkitTransform: transform,
    };
}

class CustomDragLayer extends React.Component {
    // eslint-disable-next-line class-methods-use-this
    renderProbe({ circuit, currentPageOffset, gridDivId }) {
        return (
            <BlochSphereProbe
                circuit={circuit}
                currentPageOffset={currentPageOffset}
                gridDivId={gridDivId}
            />
        );
    }

    render() {
        const {
            item, itemType, isDragging, visualizationKey,
        } = this.props;
        const dragCameFromThisInstance = item && item.visualizationKey === visualizationKey;
        if (!isDragging || !dragCameFromThisInstance) {
            return null;
        }

        let renderedDragPreview = null;
        switch (itemType) {
            case DraggableTypes.GATE:
                renderedDragPreview = (
                    <div style={positionPreview(this.props)}>
                        <Cell contents={item.gateType} />
                    </div>
                );
                break;
            case DraggableTypes.PROBE:
                renderedDragPreview = this.renderProbe(this.props);
                break;
            default:
                throw new Error(`Unknown draggable type ${itemType}`);
        }

        return <div style={layerStyles}>{renderedDragPreview}</div>;
    }
}

function collect(monitor) {
    return {
        item: monitor.getItem(),
        itemType: monitor.getItemType(),
        currentPageOffset: monitor.getClientOffset(),
        isDragging: monitor.isDragging(),
    };
}

export default DragLayer(collect)(CustomDragLayer);

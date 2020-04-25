import React from 'react';
import styled from 'styled-components';
import { RowContainer, ColumnContainer } from './Containers';
// eslint-disable-next-line object-curly-newline
import { WHITE, BLUE, DARK_GRAY, STROKE_WIDTH } from './Constants';
import * as Circuit from './Circuit';
import { Cell, BorderlessGate, GateCircle } from './Cell';
import * as Layout from './Layout';

class BinaryGateOverlay extends React.Component {
    constructor(props) {
        super(props);
        // We have to cache this if we want to ensure that we can remove the event listener.
        this.cachedOnCanceled = this.props.onCanceled;
    }

    componentDidMount() {
        document.body.addEventListener('click', this.cachedOnCanceled);
    }

    componentWillUnmount() {
        document.body.removeEventListener('click', this.cachedOnCanceled);
    }

    render() {
        const {
            circuit,
            activeColumn,
            controlRow,
            actionGate,
            onActionGatePlaced,
        } = this.props;
        const numColumns = Circuit.numColumns(circuit);
        const numRows = Circuit.numRows(circuit);
        const columns = [];

        for (let i = 0; i < numColumns; i++) {
            if (i !== activeColumn) {
                columns.push(
                    <MaskColumn
                        width={Layout.gateSize() + Layout.horizontalSpacing()}
                    />
                );
            } else {
                columns.push(
                    <ActiveColumn
                        controlRow={controlRow}
                        numRows={numRows}
                        onActionGatePlaced={onActionGatePlaced}
                        containsJoggedWires={Circuit.containsJoggedWires(
                            activeColumn,
                            circuit
                        )}
                    />
                );
            }
        }

        return (
            <RowContainer style={{ height: '100%' }}>
                <MaskColumn width={Layout.wireExtension()} />
                {columns}
                <MaskColumn
                    width={Layout.wireExtension() - Layout.horizontalSpacing()}
                />
                <FloatingActionGate gateType={actionGate} />
            </RowContainer>
        );
    }
}

const MaskColumn = styled.div`
    background-color: ${WHITE};
    width: ${props => props.width}px;
    opacity: 0.75;
`;

const ActiveColumn = ({
    controlRow,
    numRows,
    onActionGatePlaced,
    containsJoggedWires,
}) => {
    const highlightedWidth = containsJoggedWires
        ? Layout.gateSize() + Layout.horizontalSpacing()
        : Layout.gateSize();
    const rows = [...Array(numRows)].map((_, index) => {
        if (controlRow === index) {
            return (
                <BorderlessGate>
                    <GateCircle fill={BLUE} />
                </BorderlessGate>
            );
        }

        // TODO: Encapsulate this somewhere.
        let topMargin = 0;
        let bottomMargin = 0;

        if (index !== 0) {
            topMargin += Layout.VERTICAL_SPACING / 2;
        }
        if (index !== numRows - 1) {
            bottomMargin += Layout.VERTICAL_SPACING / 2;
        }
        if (index === controlRow - 1) {
            bottomMargin += Layout.VERTICAL_SPACING / 2;
        }
        if (index === controlRow + 1) {
            topMargin += Layout.VERTICAL_SPACING / 2;
        }
        return (
            <ActionGateCandidate
                topMargin={topMargin}
                bottomMargin={bottomMargin}
                onClick={() => onActionGatePlaced(index)}
            />
        );
    });

    const activeColumn = (
        <ColumnContainer
            style={{
                width: highlightedWidth,
                outline: `${STROKE_WIDTH}px solid ${DARK_GRAY}`,
                outlineOffset: `-${STROKE_WIDTH}px`,
            }}
        >
            {rows}
        </ColumnContainer>
    );

    if (containsJoggedWires) {
        return (
            <RowContainer>
                {activeColumn}
                <MaskColumn width={Layout.horizontalSpacing()} />
            </RowContainer>
        );
    }

    return activeColumn;
};

class FloatingActionGate extends React.Component {
    constructor(props) {
        super(props);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.state.mousePosition = { x: -999, y: -999 };
    }

    handleMouseMove(event) {
        this.setState({
            mousePosition: { x: event.clientX, y: event.clientY },
        });
    }

    componentDidMount() {
        document.body.addEventListener('mousemove', this.handleMouseMove);
    }

    componentWillUnmount() {
        document.body.removeEventListener('mousemove', this.handleMouseMove);
    }

    render() {
        const { x, y } = this.state.mousePosition;
        const style = {
            position: 'fixed',
            pointerEvents: 'none',
            left: x - Layout.gateSize() / 2,
            top: y - Layout.gateSize() / 2,
            zIndex: 3,
        };
        return (
            <div style={style}>
                <Cell contents={this.props.gateType} />
            </div>
        );
    }
}

class ActionGateCandidate extends React.Component {
    // TODO: Note here that the clickable area and the highlighted area are not the same
    // Probably renaming marginTop and marginBottom would help.
    constructor() {
        super();
        this.state.hovered = false;
        this.handleMouseEnter = this.handleMouseEnter.bind(this);
        this.handleMouseLeave = this.handleMouseLeave.bind(this);
    }

    componentDidMount() {
        this.target.addEventListener('mouseenter', this.handleMouseEnter);
        this.target.addEventListener('mouseleave', this.handleMouseLeave);
    }

    componentWillUnmount() {
        this.target.removeEventListener('mouseenter', this.handleMouseEnter);
        this.target.removeEventListener('mouseleave', this.handleMouseLeave);
    }

    handleMouseEnter() {
        this.setState({ hovered: true });
    }

    handleMouseLeave(event) {
        if (event.relatedTarget !== this.target) {
            this.setState({ hovered: false });
        }
    }

    render() {
        const { hovered } = this.state;
        const { topMargin, bottomMargin, onClick } = this.props;
        const hoverStyle = {
            backgroundColor: BLUE,
            opacity: hovered ? 0.5 : 0,
            height: Layout.gateSize(),
            width: Layout.gateSize(),
            marginTop: topMargin,
            pointerEvents: 'none',
            zIndex: 1,
        };

        const targetHeight = topMargin + Layout.gateSize() + bottomMargin;
        return (
            <div
                style={{
                    height: targetHeight,
                    zIndex: 2,
                }}
                ref={(target) => {
                    this.target = target;
                }}
                onClick={onClick}
            >
                <div style={hoverStyle} />
            </div>
        );
    }
}

export default BinaryGateOverlay;

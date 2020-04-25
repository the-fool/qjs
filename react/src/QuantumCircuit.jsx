import React, {Component} from 'react';
import styled from 'styled-components';
import * as Circuit from './Circuit';
import ElementPalette from './ElementPalette';
import { CheatTable, Histogram } from './CircuitOutputs';
import CircuitGrid from './CircuitGrid';
import { ColumnContainer } from './Containers';
import CustomDragLayer from './CustomDragLayer';
// import getGlobalDragDropContext from './GlobalDragDropContext';
import { DARK_GRAY, STROKE_WIDTH, GRID_DIV_ID } from './Constants';
import * as Layout from './Layout';

const AppStyles = styled.div`
    user-select: none;
    font-family: Times New Roman;
    font-size: 18px;
    color: ${DARK_GRAY};
    line {
        stroke-width: ${STROKE_WIDTH};
    }
`;

function compareCircuits(circuitA, circuitB) {
    return JSON.stringify(circuitA) === JSON.stringify(circuitB);
}

class QuantumCircuit extends Component {
    constructor(props) {
        super(props);
        console.log(this)
        console.log(React)
        this.state = {}
        const { startingCircuit, interactiveSolvableType } = this.props;
        if (props.userState && this.validateUserState(props.userState)) {
            this.state.circuit = Circuit.clone(props.userState.circuit);
        } else {
            this.state.circuit = Circuit.clone(startingCircuit);
        }
        this.addGate = this.addGate.bind(this);
        this.removeGate = this.removeGate.bind(this);
        Layout.setLayout(this.state.circuit);

        // Interactives API
        if (props.solvableConfig) {
            this.isInteractiveSolvable = true;
            this.solvableType = interactiveSolvableType || 'submittable';
            this.solvableCallbacks = props.solvableConfig.callbacks;
            this.state.hasBeenSolved = props.solvableConfig.hasBeenSolved;
            this.state.guessedWrong = false;
            if (!props.successStates || props.successStates.length === 0) {
                throw new Error(
                    'One or more success states are required for interactive Quantum Circuit solvables'
                );
            }
            this.updateSolvableContainer();
        }
    }

    /**
     * Determine if the user's state is incompatible with the current config. This can happen if
     * the config or the target visualization has been changed since the user last submitted the
     * attempt.
     * @param {Object} userState
     */
    validateUserState(userState) {
        if (userState.circuit) {
            const mismatchedCircuitDimensions =
                userState.circuit.length > 0 &&
                (userState.circuit.length !== this.props.startingCircuit.length ||
                    userState.circuit[0].length !== this.props.startingCircuit[0].length);
            if (mismatchedCircuitDimensions) {
                return false;
            }
            for (let i = 0; i < userState.circuit.length; i += 1) {
                for (let j = 0; j < userState.circuit[i].length; j += 1) {
                    const gate = userState.circuit[i][j];
                    if (gate.length === 2) {
                        // e.g. gate => ['CZ', 1]
                        if (this.props.allowedGates.indexOf(gate[0]) < 0) {
                            return false;
                        }
                    } else if (gate !== '-' && this.props.allowedGates.indexOf(gate) < 0) {
                        // e.g. gate => 'X'
                        return false;
                    }
                }
            }
            return true;
        }

        return false;
    }

    isUnchanged() {
        return compareCircuits(this.props.startingCircuit, this.state.circuit);
    }

    isSolved() {
        if (this.props.successStates && this.props.successStates.length) {
            for (let i = 0; i < this.props.successStates.length; i += 1) {
                if (compareCircuits(this.props.successStates[i].circuit, this.state.circuit)) {
                    return true;
                }
            }
        }
        return false;
    }

    resetPressed() {
        this.setState({
            circuit: Circuit.clone(this.props.startingCircuit),
        });
    }

    checkAnswerPressed() {
        if (this.solvableType === 'submittable') {
            this.setState({ hasBeenSolved: this.isSolved(), guessedWrong: !this.isSolved() });
            this.solvableCallbacks.saveState(this.state, this.isSolved());
        }
    }

    updateSolvableContainer() {
        const DEFAULT_CAPTION = 'Drag gates onto the circuit';
        const SUCCESS_CAPTION = '🎊 You got it!';
        const FAILURE_CAPTION = '\u{1F914} Try that again.';
        if (this.state.hasBeenSolved) {
            this.solvableCallbacks.setCaption(SUCCESS_CAPTION);
        } else if (this.state.guessedWrong) {
            this.solvableCallbacks.setCaption(FAILURE_CAPTION);
        } else {
            this.solvableCallbacks.setCaption(DEFAULT_CAPTION);
        }
        if (this.isUnchanged()) {
            this.solvableCallbacks.setResetButtonEnabled(false);
            if (this.solvableType === 'submittable') {
                this.solvableCallbacks.setSubmitButtonEnabled(false);
            }
        } else {
            this.solvableCallbacks.setResetButtonEnabled(true);
            if (this.solvableType === 'submittable') {
                this.solvableCallbacks.setSubmitButtonEnabled(true);
            }
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.solvableCallbacks) {
            this.updateSolvableContainer();
        }
        if (compareCircuits(this.state.circuit, prevState.circuit)) {
            return;
        }
        if (this.solvableType === 'auto-check') {
            if (this.isSolved()) {
                this.setState({ hasBeenSolved: true });
            }
            this.solvableCallbacks.saveState(this.state, this.isSolved());
        } else if (this.solvableType === 'submittable') {
            this.solvableCallbacks.saveState(this.state);
        }
    }

    render() {
        const { circuit } = this.state;
        const { visualizationKey, blackBoxColumns, rowColors } = this.props;
        const circuitSimulator = Circuit.simulate(circuit);

        return (
            <AppStyles>
                <CustomDragLayer
                    visualizationKey={visualizationKey}
                    gridDivId={GRID_DIV_ID}
                    circuit={circuit}
                />
                <ColumnContainer spacing={2 * Layout.VERTICAL_SPACING} style={{ alignItems: 'center' }}>
                    <CircuitGrid
                        visualizationKey={visualizationKey}
                        circuit={circuit}
                        circuitSimulator={circuitSimulator}
                        blackBoxColumns={blackBoxColumns}
                        showPerQubitProbability={this.shouldShowPerQubitProbability()}
                        rowColors={rowColors}
                        handlers={{
                            addGate: this.addGate,
                            removeGate: this.removeGate,
                        }}
                    />
                    <ElementPalette
                        gates={this.props.allowedGates}
                        shouldShowProbe={this.shouldShowBlochSphereProbe()}
                        visualizationKey={visualizationKey}
                        onDragProbe={this.onDragProbe}
                    />
                    {this.shouldShowCheatTable() ?
                        <CheatTable circuitSimulator={circuitSimulator} /> : null}
                    {this.shouldShowHistogram() ?
                        <Histogram circuitSimulator={circuitSimulator} /> : null}
                </ColumnContainer>
            </AppStyles>
        );
    }

    addGate(row, column, gate) {
        this.setState(state => ({
            circuit: Circuit.addGate(row, column, gate, state.circuit),
        }));
        this.trackChangeEvent();
    }

    removeGate(row, column) {
        this.setState(state => ({
            circuit: Circuit.removeGate(row, column, state.circuit),
        }));
        this.trackChangeEvent();
    }

    onDragProbe() {
        // For whatever reason, react-dnd wasn't showing the Drag Probe on the first drag
        // (see BP-21731). It wasn't rendering the CustomDragLayer, potentially because it
        // needed a forced update. This should fix that.
        this.setState({});
    };

    trackChangeEvent() {
    }

    shouldShowBlochSphereProbe() {
        return this.props.circuitOutputs.includes('BlochSphereProbe');
    }

    shouldShowPerQubitProbability() {
        return this.props.circuitOutputs.includes('PerQubitProbability');
    }

    shouldShowHistogram() {
        return this.props.circuitOutputs.includes('Histogram');
    }

    shouldShowCheatTable() {
        return this.props.circuitOutputs.includes('CheatTable');
    }

    getConfigValue() {
        return {
            circuit: this.state.circuit.slice(),
        };
    }
}

export default QuantumCircuit;

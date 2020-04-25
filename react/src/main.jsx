import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { DndProvider } from 'react-dnd';
import MultiBackend from 'react-dnd-multi-backend';
import HTML5toTouch from 'react-dnd-multi-backend/dist/esm/HTML5toTouch'; // or any other pipeline
import {
    validateConfiguration,
    createEmpty,
} from './Circuit';
import { PALETTE_GATES } from './Constants';
import ErrorMessage from './ErrorMessage';
import QuantumCircuit from './QuantumCircuit';

export function createQuantumCircuit(
    element,
    visualizationKey,
    config,
    userState,
    solvableConfig,
    slug
) {
    try {
        validateConfiguration(config);
    } catch (error) {
        return ReactDOM.render(<ErrorMessage>{error.message}</ErrorMessage>, element);
    }

    if (config.startingCircuit === undefined) {
        config.startingCircuit = createEmpty(config.rows, config.columns);
    }

    if (config.allowedGates === undefined) {
        config.allowedGates = PALETTE_GATES;
    }

    if (config.rowColors === undefined) {
        config.rowColors = [];
    }

    ReactDOM.render(
        <DndProvider backend={MultiBackend} options={HTML5toTouch}>
            <QuantumCircuit
                circuitOutputs={config.circuitOutputs}
                allowedGates={config.allowedGates}
                startingCircuit={config.startingCircuit}
                blackBoxColumns={config.blackBoxColumns}
                rowColors={config.rowColors}
                interactiveSolvableType={config.interactiveSolvableType}
                successStates={config.successStates}
                visualizationKey={visualizationKey}
                userState={userState}
                solvableConfig={solvableConfig}
                interactiveSlug={slug}
            />
        </DndProvider>,
        element
    );
}

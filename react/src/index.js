import { createQuantumCircuit } from './main.jsx';

function initInteractive(interactiveConfig, solvableConfig) {
    const element = document.getElementById(interactiveConfig.visualizationKey);
    element.innerHTML = '';

    return createQuantumCircuit(
        element,
        interactiveConfig.visualizationKey,
        interactiveConfig.data,
        interactiveConfig.userState || {},
        solvableConfig,
        interactiveConfig.slug
    );
}

export default {
    createInteractive: interactiveConfig => initInteractive(interactiveConfig, false),
    createInteractiveSolvable: (interactiveConfig, solvableConfig) =>
        initInteractive(interactiveConfig, solvableConfig),
};
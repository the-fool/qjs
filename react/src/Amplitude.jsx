// eslint-disable-next-line no-unused-vars
import React from 'react';
import * as mathjs from 'mathjs';

// eslint-disable-next-line camelcas/e
function amplitudeWithout_i(amplitude) {
    const sign = amplitude.im < 0 ? '-' : '+';
    return `${amplitude.re.toFixed(2)} ${sign} ${mathjs.abs(amplitude.im).toFixed(2)}`;
}

export function toSVG(amplitude) {
    return (
        <tspan>
            {amplitudeWithout_i(amplitude)}
            <tspan font-style="italic">i</tspan>
        </tspan>
    );
}

export function toHTML(amplitude) {
    return (
        <span>
            {amplitudeWithout_i(amplitude)}
            <i>i</i>
        </span>
    );
}

export function stateNameToString(state) {
    return `|${state}⟩`;
}

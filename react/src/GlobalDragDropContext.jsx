import MultiBackend from 'react-dnd-multi-backend';
import HTML5toTouch from 'react-dnd-multi-backend/dist/esm/HTML5toTouch';
import { DragDropContext } from 'preact-dnd';

export default function getGlobalDragDropContext() {
    if (!window.dragDropContext) {
        window.dragDropContext = DragDropContext(MultiBackend(HTML5toTouch));
    }
    return window.dragDropContext;
}

import { Tool } from './Tool.js';
import { state } from '../state.js';

export class SelectTool extends Tool {
    onMouseDown(e, coords) {
        state.selectedIds = [];
        state.isSelectingArea = true;
        state.selectionBox = { x1: coords.x, y1: coords.y, x2: coords.x, y2: coords.y };
    }

    onMouseMove(e, coords) {
        if (!state.isSelectingArea) return;
        
        state.selectionBox.x2 = coords.x;
        state.selectionBox.y2 = coords.y;
    }

    onMouseUp(e, coords) {
        if (!state.isSelectingArea) return;
        
        const r = {
            x: Math.min(state.selectionBox.x1, state.selectionBox.x2),
            y: Math.min(state.selectionBox.y1, state.selectionBox.y2),
            w: Math.abs(state.selectionBox.x2 - state.selectionBox.x1),
            h: Math.abs(state.selectionBox.y2 - state.selectionBox.y1)
        };

        const isMultiSelect = e.ctrlKey || e.shiftKey;
        const newSelections = [];

        state.entities.forEach(en => {
            const isContained = en.x >= r.x &&
                en.x + en.w <= r.x + r.w &&
                en.y >= r.y &&
                en.y + en.h <= r.y + r.h;

            if (isContained) {
                newSelections.push(en.id);
            }
        });

        if (isMultiSelect) {
            state.selectedIds = [...new Set([...state.selectedIds, ...newSelections])];
        } else {
            state.selectedIds = newSelections;
        }
        
        state.isSelectingArea = false;
    }
}

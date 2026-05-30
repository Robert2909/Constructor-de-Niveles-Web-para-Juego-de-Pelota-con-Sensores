import { Tool } from './Tool.js';
import { state, saveState } from '../state.js';
import { Entity } from '../entities.js';
import { checkSmartGuides, updateSelectionStats } from '../utils.js';

export class BlockTool extends Tool {
    onMouseDown(e, coords) {
        state.selectedIds = [];
        state.isSelectingArea = true;
        state.selectionBox = { x1: coords.x, y1: coords.y, x2: coords.x, y2: coords.y };
    }

    onMouseMove(e, coords) {
        if (!state.isSelectingArea) return;
        
        state.selectionBox.x2 = coords.x;
        state.selectionBox.y2 = coords.y;

        const sx = state.snapToGrid ? state.gridSizeX : 1;
        const sy = state.snapToGrid ? state.gridSizeY : 1;
        const x = Math.min(state.selectionBox.x1, state.selectionBox.x2);
        const y = Math.min(state.selectionBox.y1, state.selectionBox.y2);
        const w = Math.abs(state.selectionBox.x2 - state.selectionBox.x1);
        const h = Math.abs(state.selectionBox.y2 - state.selectionBox.y1);

        const rect = {
            x: this.snap(x, sx),
            y: this.snap(y, sy),
            w: this.snap(w, sx),
            h: this.snap(h, sy)
        };
        const snapped = checkSmartGuides(rect);
        state.tempRect = { ...rect, x: snapped.x, y: snapped.y };
        updateSelectionStats();
    }

    onMouseUp(e, coords) {
        if (!state.isSelectingArea) return;
        
        if (state.tempRect && state.tempRect.w > 0 && state.tempRect.h > 0) {
            saveState();
            let { x, y, w, h } = state.tempRect;

            if (state.currentTool === 'start') {
                w = state.gridSizeX;
                h = state.gridSizeY;
            }

            state.entities.push(new Entity(state.currentTool, x, y, w, h));
        }
        
        state.isSelectingArea = false;
        state.tempRect = null;
    }
}

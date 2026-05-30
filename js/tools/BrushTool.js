import { Tool } from './Tool.js';
import { state, saveState } from '../state.js';
import { Entity } from '../entities.js';
import { optimizeEntities } from '../utils.js';

export class BrushTool extends Tool {
    onMouseDown(e, coords) {
        state.selectedIds = [];
        state.isSelectingArea = true; // flag to allow dragging mouse
        this.manager.didBrushPaint = false;
        
        saveState();
        this.paint(coords);
    }

    onMouseMove(e, coords) {
        if (!state.isSelectingArea) return;
        this.paint(coords);
    }

    onMouseUp(e, coords) {
        if (!state.isSelectingArea) return;
        
        if (this.manager.didBrushPaint) {
            optimizeEntities();
        }
        
        state.isSelectingArea = false;
        this.manager.didBrushPaint = false;
    }
    
    paint(coords) {
        const sx = state.gridSizeX;
        const sy = state.gridSizeY;
        const px = this.snap(coords.x, sx);
        const py = this.snap(coords.y, sy);

        const exists = state.entities.find(en =>
            en.x === px && en.y === py && en.w === sx && en.h === sy && en.type === state.currentTool
        );

        if (!exists) {
            state.entities.push(new Entity(state.currentTool, px, py, sx, sy));
            this.manager.didBrushPaint = true;
        }
    }
}

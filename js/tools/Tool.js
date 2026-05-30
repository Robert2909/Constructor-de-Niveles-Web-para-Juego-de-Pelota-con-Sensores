import { state, saveState } from '../state.js';
import { updateJSON, updateProperties, updateSelectionStats } from '../utils.js';

export class Tool {
    constructor(manager) {
        this.manager = manager;
    }
    
    onMouseDown(e, coords) {}
    onMouseMove(e, coords) {}
    onMouseUp(e, coords) {}
    onKeyDown(e) {}
    
    // Helper to snap to grid
    snap(val, size) {
        return Math.round(val / size) * size;
    }
}

import { state, saveState } from '../state.js';
import { getCanvasCoords, checkSmartGuides, updateProperties, updateSelectionStats, updateJSON } from '../utils.js';

export class ToolManager {
    constructor(canvas, renderFunc) {
        this.canvas = canvas;
        this.renderFunc = renderFunc;
        this.tools = {};
        this.currentTool = null;
        this.didBrushPaint = false;
        
        // Universal states
        this.isPanning = false;
        this.panStart = null;
        
        this._bindEvents();
    }
    
    registerTool(name, tool) {
        this.tools[name] = tool;
    }
    
    setTool(name) {
        if(this.tools[name]) {
            this.currentTool = this.tools[name];
        }
    }

    _bindEvents() {
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('mouseup', (e) => this.onMouseUp(e));
    }

    onMouseDown(e) {
        const coords = getCanvasCoords(e, this.canvas);
        this.didBrushPaint = false;

        // 1. PANNING (Middle Click)
        if (e.button === 1) {
            state.isPanning = true;
            state.panStart = { x: e.clientX, y: e.clientY };
            return;
        }

        // 2. RESIZING
        if (state.selectedIds.length === 1) {
            const en = state.entities.find(en => en.id === state.selectedIds[0]);
            const handle = en.getHandleCoords().find(h => {
                const size = 10 / state.view.zoom;
                return Math.abs(coords.x - h.x) < size && Math.abs(coords.y - h.y) < size;
            });
            if (handle) {
                state.isResizing = true;
                state.resizeHandle = handle.type;
                saveState();
                return;
            }
        }

        // 3. DRAGGING / UNIVERSAL SELECTION
        const clicked = [...state.entities].reverse().find(en =>
            coords.x >= en.x && coords.x <= en.x + en.w &&
            coords.y >= en.y && coords.y <= en.y + en.h
        );

        if (clicked) {
            const isMultiSelect = e.ctrlKey || e.shiftKey;
            if (!isMultiSelect && !state.selectedIds.includes(clicked.id)) {
                state.selectedIds = [clicked.id];
            } else if (isMultiSelect) {
                if (state.selectedIds.includes(clicked.id)) {
                    state.selectedIds = state.selectedIds.filter(id => id !== clicked.id);
                } else {
                    state.selectedIds.push(clicked.id);
                }
            }
            state.isDragging = true;
            state.dragStart = coords;
            saveState();
        } else {
            // 4. DELEGATE TO SPECIFIC TOOL
            if (this.currentTool) {
                this.currentTool.onMouseDown(e, coords);
            }
        }
        
        updateProperties();
        this.renderFunc();
    }

    onMouseMove(e) {
        const coords = getCanvasCoords(e, this.canvas);

        if (state.isPanning) {
            state.view.offsetX += (e.clientX - state.panStart.x);
            state.view.offsetY += (e.clientY - state.panStart.y);
            state.panStart = { x: e.clientX, y: e.clientY };
            this.renderFunc();
            return;
        }

        if (state.isDragging) {
            this._handleUniversalDrag(coords);
            return;
        }

        if (state.isResizing && state.selectedIds.length === 1) {
            this._handleUniversalResize(coords);
            return;
        }

        // Delegate to tool
        if (this.currentTool && state.isSelectingArea) {
            this.currentTool.onMouseMove(e, coords);
            this.renderFunc();
        }
        
        // Info de coordenadas
        const info = document.getElementById('coordInfo');
        if (info) {
            if (e.target === this.canvas) {
                info.style.display = 'block';
                info.textContent = `X: ${Math.round(coords.x)}, Y: ${Math.round(coords.y)}`;
            } else {
                info.style.display = 'none';
            }
        }

        this._updateCursor(coords);
    }

    onMouseUp(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.closest('.sidebar') || e.target.closest('header')) {
            this._resetState();
            return;
        }

        const coords = getCanvasCoords(e, this.canvas);
        
        if (this.currentTool && state.isSelectingArea) {
            this.currentTool.onMouseUp(e, coords);
        }

        this._resetState();
        updateProperties();
        updateJSON();
        this.renderFunc();
    }

    _handleUniversalDrag(coords) {
        const dx = coords.x - state.dragStart.x;
        const dy = coords.y - state.dragStart.y;
        const sx = state.snapToGrid ? state.gridSizeX : 1;
        const sy = state.snapToGrid ? state.gridSizeY : 1;

        const stepX = Math.round(dx / sx) * sx;
        const stepY = Math.round(dy / sy) * sy;

        if (stepX !== 0 || stepY !== 0) {
            const selected = state.entities.filter(en => state.selectedIds.includes(en.id));
            const oldPositions = selected.map(en => ({ id: en.id, x: en.x, y: en.y }));

            let newPositions = selected.map(en => {
                let nx = en.x + dx;
                let ny = en.y + dy;
                if (state.snapToGrid) {
                    nx = Math.round(nx / sx) * sx;
                    ny = Math.round(ny / sy) * sy;
                }
                return { id: en.id, x: nx, y: ny, w: en.w, h: en.h };
            });

            let minX = Math.min(...newPositions.map(p => p.x));
            let minY = Math.min(...newPositions.map(p => p.y));
            let maxX = Math.max(...newPositions.map(p => p.x + p.w));
            let maxY = Math.max(...newPositions.map(p => p.y + p.h));

            let clampOffsetX = 0;
            let clampOffsetY = 0;

            if (minX < 0) clampOffsetX = -minX;
            else if (maxX > state.width) clampOffsetX = state.width - maxX;

            if (minY < 0) clampOffsetY = -minY;
            else if (maxY > state.height) clampOffsetY = state.height - maxY;

            minX += clampOffsetX;
            minY += clampOffsetY;
            maxX += clampOffsetX;
            maxY += clampOffsetY;

            const groupRect = { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
            const snapped = checkSmartGuides(groupRect);

            let magOffsetX = snapped.x - minX;
            let magOffsetY = snapped.y - minY;

            if (minX + magOffsetX < 0 || maxX + magOffsetX > state.width) magOffsetX = 0;
            if (minY + magOffsetY < 0 || maxY + magOffsetY > state.height) magOffsetY = 0;

            let actualMoveX = 0;
            let actualMoveY = 0;

            newPositions.forEach(pos => {
                const en = selected.find(e => e.id === pos.id);
                const oldPos = oldPositions.find(e => e.id === pos.id);

                en.x = pos.x + clampOffsetX + magOffsetX;
                en.y = pos.y + clampOffsetY + magOffsetY;

                actualMoveX = en.x - oldPos.x;
                actualMoveY = en.y - oldPos.y;
            });

            if (actualMoveX !== 0) state.dragStart.x += actualMoveX;
            if (actualMoveY !== 0) state.dragStart.y += actualMoveY;
        }
        updateSelectionStats();
        updateProperties();
        this.renderFunc();
    }

    _handleUniversalResize(coords) {
        const en = state.entities.find(e => e.id === state.selectedIds[0]);
        const sx = state.gridSizeX;
        const sy = state.gridSizeY;
        const cx = Math.round(coords.x / sx) * sx;
        const cy = Math.round(coords.y / sy) * sy;

        const right = en.x + en.w;
        const bottom = en.y + en.h;

        if (state.resizeHandle.includes('e')) {
            let newW = Math.max(sx, Math.round((cx - en.x) / sx) * sx);
            if (en.x + newW > state.width) newW = state.width - en.x;
            en.w = newW;
        }
        if (state.resizeHandle.includes('s')) {
            let newH = Math.max(sy, Math.round((cy - en.y) / sy) * sy);
            if (en.y + newH > state.height) newH = state.height - en.y;
            en.h = newH;
        }

        if (state.resizeHandle.includes('w')) {
            const newX = Math.max(0, Math.min(right - sx, Math.round(cx / sx) * sx));
            en.x = newX;
            en.w = right - newX;
        }
        if (state.resizeHandle.includes('n')) {
            const newY = Math.max(0, Math.min(bottom - sy, Math.round(cy / sy) * sy));
            en.y = newY;
            en.h = bottom - newY;
        }

        const snapped = checkSmartGuides(en);

        if (state.resizeHandle.includes('w')) {
            en.x = snapped.x;
            en.w = right - en.x;
        } else if (state.resizeHandle.includes('e')) {
            const activeXGuide = state.activeGuides.x.find(g => Math.abs((en.x + en.w) - g.pos) < 15);
            if (activeXGuide) en.w = activeXGuide.pos - en.x;
        }

        if (state.resizeHandle.includes('n')) {
            en.y = snapped.y;
            en.h = bottom - en.y;
        } else if (state.resizeHandle.includes('s')) {
            const activeYGuide = state.activeGuides.y.find(g => Math.abs((en.y + en.h) - g.pos) < 15);
            if (activeYGuide) en.h = activeYGuide.pos - en.y;
        }

        updateSelectionStats();
        updateProperties();
        this.renderFunc();
    }

    _updateCursor(coords) {
        if (state.selectedIds.length === 1 && !state.isDragging && !state.isResizing && !state.isPanning) {
            const en = state.entities.find(e => e.id === state.selectedIds[0]);
            const handles = en.getHandleCoords();
            const size = 10 / state.view.zoom;
            const overHandle = handles.find(h =>
                Math.abs(coords.x - h.x) < size && Math.abs(coords.y - h.y) < size
            );

            if (overHandle) {
                const cursorMap = {
                    nw: 'nwse-resize', n: 'ns-resize', ne: 'nesw-resize',
                    e: 'ew-resize', se: 'nwse-resize', s: 'ns-resize',
                    sw: 'nesw-resize', w: 'ew-resize'
                };
                this.canvas.style.cursor = cursorMap[overHandle.type];
            } else {
                this.canvas.style.cursor = 'crosshair';
            }
        } else if (!state.isResizing) {
            this.canvas.style.cursor = 'crosshair';
        }
    }

    _resetState() {
        state.isDragging = false;
        state.isResizing = false;
        state.isSelectingArea = false;
        state.isPanning = false;
        state.tempRect = null;
        state.activeGuides = { x: [], y: [] }; 
    }
}

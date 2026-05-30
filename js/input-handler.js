import { state, saveState } from './state.js';
import { getCanvasCoords, updateProperties, updateJSON, showOSD } from './utils.js';
import { BASE_WIDTH, BASE_HEIGHT } from './constants.js';
import { toggleRulerFamily } from './rulers.js';

import { ToolManager } from './tools/ToolManager.js';
import { SelectTool } from './tools/SelectTool.js';
import { BlockTool } from './tools/BlockTool.js';
import { BrushTool } from './tools/BrushTool.js';

let toolManager = null;

export function initInputHandlers(canvas, renderFunc) {
    // Bloquear zoom nativo de navegador (Pinch/Ctrl+Scroll) en toda la página
    window.addEventListener('wheel', (e) => {
        if (e.ctrlKey) {
            e.preventDefault();
        }
    }, { passive: false });

    // Instanciar el nuevo sistema de herramientas
    toolManager = new ToolManager(canvas, renderFunc);
    toolManager.registerTool('select', new SelectTool(toolManager));
    toolManager.registerTool('block', new BlockTool(toolManager));
    toolManager.registerTool('brush', new BrushTool(toolManager));

    // Determinar la herramienta activa inicial
    updateActiveTool();

    // Evento de zoom con rueda de ratón (lo dejamos a nivel global)
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const coords = getCanvasCoords(e, canvas);
        const oldZoom = state.view.zoom;

        if (e.ctrlKey) {
            const zoomFactor = Math.exp(-e.deltaY * 0.0015);
            state.view.zoom = Math.min(Math.max(state.view.zoom * zoomFactor, 0.1), 5.0);

            state.view.offsetX -= coords.x * state.view.baseZoom * (state.view.zoom - oldZoom);
            state.view.offsetY -= coords.y * state.view.baseZoom * (state.view.zoom - oldZoom);

            const label = document.getElementById('zoomLabel');
            if (label) label.textContent = `${Math.round(state.view.zoom * 100)}%`;
        } else if (e.shiftKey) {
            state.view.offsetX -= e.deltaY * 0.5;
        } else {
            state.view.offsetY -= e.deltaY * 0.5;
        }
        renderFunc();
    }, { passive: false });
}

// Llama a esto cuando el usuario cambie `state.currentTool` o `state.isBrushMode`
export function updateActiveTool() {
    if (!toolManager) return;

    if (state.currentTool === 'select') {
        toolManager.setTool('select');
    } else {
        if (state.isBrushMode) {
            toolManager.setTool('brush');
        } else {
            toolManager.setTool('block');
        }
    }
}

export function initKeyboardHandlers(renderFunc) {
    window.addEventListener('keydown', (e) => {
        // Bloquear zoom nativo de navegador por teclado
        if (e.ctrlKey && (e.key === '+' || e.key === '-' || e.key === '0' || e.key === '=')) {
            e.preventDefault();
        }

        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        // Interceptar Hard Reset (Ctrl + Shift + R o Ctrl + F5 o Shift + F5)
        if ((e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'r') || 
            (e.ctrlKey && e.key === 'F5') || 
            (e.shiftKey && e.key === 'F5')) {
            localStorage.removeItem('levelEditorAutoSave');
            console.log('Hard reset detectado. Memoria local borrada.');
            return;
        }

        // Hotkeys de teclado para alternar familias de reglas (2-8)
        if (!e.ctrlKey && !e.altKey && !e.metaKey && ['2', '3', '4', '5', '6', '7', '8'].includes(e.key)) {
            let base = null;
            if (e.key === '2' || e.key === '4' || e.key === '8') base = 2;
            if (e.key === '3' || e.key === '6') base = 3;
            if (e.key === '5') base = 5;
            if (e.key === '7') base = 7;

            if (base !== null) {
                e.preventDefault();
                toggleRulerFamily(base, renderFunc);
            }
        }

        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (state.selectedIds.length > 0) {
                saveState();
                state.entities = state.entities.filter(en => !state.selectedIds.includes(en.id));
                state.selectedIds = [];
                updateProperties(); updateJSON(); renderFunc();
            }
        }

        if (e.key === 'Escape') {
            if (state.selectedIds.length > 0) {
                state.selectedIds = [];
            } else if (state.currentTool !== 'select') {
                state.currentTool = 'select';
                document.querySelectorAll('.tool-btn').forEach(b => {
                    b.classList.remove('active');
                    if (b.dataset.type === 'select') b.classList.add('active');
                });
                updateActiveTool();
            }
            state.isSelectingArea = false; state.tempRect = null;
            updateProperties(); renderFunc();
        }

        if (e.ctrlKey && (e.key === 'a' || e.key === 'e')) {
            e.preventDefault();
            state.selectedIds = state.entities.map(en => en.id);
            updateProperties(); renderFunc();
        }

        if (e.ctrlKey && e.key === 'c') {
            state.clipboard = state.entities
                .filter(en => state.selectedIds.includes(en.id))
                .map(en => en.clone(0));
        }

        if (e.ctrlKey && e.key === 'v') {
            if (state.clipboard.length > 0) {
                saveState();
                const offset = 20;
                const news = state.clipboard.map(en => {
                    const clone = en.clone(offset);
                    clone.x = Math.max(0, Math.min(BASE_WIDTH - clone.w, clone.x));
                    clone.y = Math.max(0, Math.min(BASE_HEIGHT - clone.h, clone.y));
                    return clone;
                });
                state.entities.push(...news);
                state.selectedIds = news.map(en => en.id);
                state.clipboard = news.map(en => en.clone(0));
                updateJSON(); renderFunc();
            }
        }

        // FLECHAS
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
            const sx = state.gridSizeX;
            const sy = state.gridSizeY;
            const selected = state.entities.filter(en => state.selectedIds.includes(en.id));
            if (selected.length === 0) return;

            let dx = 0, dy = 0;
            if (e.key === 'ArrowUp') dy = -sy;
            if (e.key === 'ArrowDown') dy = sy;
            if (e.key === 'ArrowLeft') dx = -sx;
            if (e.key === 'ArrowRight') dx = sx;

            const newPositions = selected.map(en => {
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

            if (minX >= 0 && maxX <= state.width && minY >= 0 && maxY <= state.height) {
                saveState();
                newPositions.forEach(pos => {
                    const en = selected.find(e => e.id === pos.id);
                    en.x = pos.x;
                    en.y = pos.y;
                });
                // Note: No more updateSelectionStats here directly as it's from utils.js
                // but actually updateSelectionStats is in utils.js! Yes.
                updateProperties();
                updateJSON();
                renderFunc();
            }
        }

        // Ctrl + S: Alternar Snap
        if (e.ctrlKey && e.key.toLowerCase() === 's') {
            e.preventDefault();
            state.snapToGrid = !state.snapToGrid;

            document.querySelectorAll('[data-action="snap"]').forEach(btn => {
                const isBtnOn = btn.id === 'snapOn';
                btn.classList.toggle('active', isBtnOn === state.snapToGrid);
            });

            showOSD('MODO DE MOVIMIENTO', state.snapToGrid ? 'Modo Rejilla' : 'Modo Libre', state.snapToGrid ? '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/></svg>' : '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>');
            renderFunc();
            return;
        }

        // Ctrl + D: Alternar entre Modo Bloque (Áreas) y Modo Pincel (Dibujo/Pintura)
        if (e.ctrlKey && e.key.toLowerCase() === 'd') {
            e.preventDefault();
            state.isBrushMode = !state.isBrushMode;

            const currentMode = state.isBrushMode ? 'brush' : 'block';
            document.querySelectorAll('[data-mode]').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.mode === currentMode);
            });

            showOSD('MODO DE CONSTRUCCIÓN', state.isBrushMode ? 'Modo Pincel' : 'Modo Bloque', state.isBrushMode ? '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>' : '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>');
            
            updateActiveTool();
            renderFunc();
            return;
        }
    });
}

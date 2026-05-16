import { state, saveState } from './js/state.js';
import { Entity } from './js/entities.js';
import { render } from './js/renderer.js';
import { initInputHandlers, initKeyboardHandlers } from './js/input-handler.js';
import { centerLevel, updateProperties, updateJSON, transformSelection } from './js/utils.js';

const canvas = document.getElementById('editorCanvas');
const ctx = canvas.getContext('2d');

// --- WRAPPERS ---
function callRender() { render(canvas, ctx); }

function undo() {
    if (state.undoStack.length > 0) {
        state.redoStack.push(JSON.stringify(state.entities));
        const last = state.undoStack.pop();
        state.entities = JSON.parse(last).map(e => new Entity(e.type, e.x, e.y, e.w, e.h));
        state.selectedIds = [];
        updateProperties(); updateJSON(); callRender();
    }
}

function redo() {
    if (state.redoStack.length > 0) {
        state.undoStack.push(JSON.stringify(state.entities));
        const next = state.redoStack.pop();
        state.entities = JSON.parse(next).map(e => new Entity(e.type, e.x, e.y, e.w, e.h));
        state.selectedIds = [];
        updateProperties(); updateJSON(); callRender();
    }
}

// --- CONFIGURACIÓN DE UI ---
document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        // El botón de perímetro es una acción, no una herramienta persistente
        if (btn.id === 'btnPerimeter') return;

        const isAlreadyActive = state.currentTool === btn.dataset.type;
        document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
        if (isAlreadyActive && btn.dataset.type !== 'select') {
            state.currentTool = 'select';
            document.querySelector('.tool-btn[data-type="select"]')?.classList.add('active');
        } else {
            btn.classList.add('active');
            state.currentTool = btn.dataset.type;
        }
        updateProperties();
        callRender();
    });

    btn.addEventListener('dragstart', (e) => {
        if (!btn.dataset.type || btn.dataset.type === 'select') {
            e.preventDefault();
            return;
        }
        e.dataTransfer.setData('text/plain', btn.dataset.type);
    });
});

canvas.addEventListener('dragover', e => e.preventDefault());
canvas.addEventListener('drop', (e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('text/plain');
    const validTypes = ['wall', 'hazard', 'goal', 'start'];
    if (!validTypes.includes(type)) return;
    
    // Usar la función de coordenadas del módulo para consistencia
    const rect = canvas.getBoundingClientRect();
    const rx = (e.clientX - rect.left - state.view.offsetX) / state.view.zoom;
    const ry = (e.clientY - rect.top - state.view.offsetY) / state.view.zoom;
    
    const sx = state.snapToGrid ? state.gridSizeX : 1;
    const sy = state.snapToGrid ? state.gridSizeY : 1;
    
    let w = Math.max(sx, 40);
    let h = Math.max(sy, 40);
    
    // INICIO Y META: Siempre un solo bloque de grid
    if (type === 'start' || type === 'goal') {
        w = sx;
        h = sy;
    }

    const fx = Math.max(0, Math.min(800 - w, Math.round(rx / sx) * sx));
    const fy = Math.max(0, Math.min(480 - h, Math.round(ry / sy) * sy));

    saveState();
    const news = new Entity(type, fx, fy, w, h);
    state.entities.push(news);
    state.selectedIds = [news.id];
    
    updateProperties(); 
    updateJSON(); 
    callRender();
});

// Botones Maestros
document.getElementById('btnExport')?.addEventListener('click', () => {
    const data = document.getElementById('jsonOutput').value;
    const levelId = document.getElementById('levelIdInput').value;
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `level_${levelId}.json`;
    a.click();
    URL.revokeObjectURL(url);
});

document.getElementById('btnOpenImport')?.addEventListener('click', () => {
    document.getElementById('modalImport').classList.remove('hidden');
});

document.getElementById('btnCloseModal')?.addEventListener('click', () => {
    document.getElementById('modalImport').classList.add('hidden');
});

document.getElementById('btnDoImport')?.addEventListener('click', () => {
    const json = document.getElementById('txtImportJson').value;
    try {
        const data = JSON.parse(json);
        if (data.entities) {
            saveState();
            state.entities = data.entities.map(e => new Entity(e.type, e.x, e.y, e.w, e.h));
            if (data.levelId) document.getElementById('levelIdInput').value = data.levelId;
            state.selectedIds = [];
            updateProperties(); updateJSON(); callRender();
            document.getElementById('modalImport').classList.add('hidden');
        }
    } catch (e) { alert('JSON inválido'); }
});

// Otros controles
function updateZoomUI() {
    const label = document.getElementById('zoomLabel');
    if (label) label.textContent = `${Math.round(state.view.zoom * 100)}%`;
}

document.getElementById('resetZoom')?.addEventListener('click', () => {
    centerLevel(canvas);
    updateZoomUI();
    callRender();
});

document.getElementById('zoomIn')?.addEventListener('click', () => {
    state.view.zoom = Math.min(state.view.zoom * 1.2, 5.0);
    updateZoomUI();
    callRender();
});

document.getElementById('zoomOut')?.addEventListener('click', () => {
    state.view.zoom = Math.max(state.view.zoom * 0.8, 0.1);
    updateZoomUI();
    callRender();
});

document.getElementById('btnCopy')?.addEventListener('click', () => {
    const area = document.getElementById('jsonOutput');
    if (area) {
        area.select(); document.execCommand('copy');
        const btn = document.getElementById('btnCopy');
        btn.textContent = '¡Copiado!';
        setTimeout(() => btn.textContent = 'COPIAR AL PORTAPAPELES', 2000);
    }
});

['propX', 'propY', 'propW', 'propH'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', (e) => {
        if (state.selectedIds.length === 1) {
            const en = state.entities.find(e => e.id === state.selectedIds[0]);
            const val = parseInt(e.target.value) || 0;
            if (id === 'propX') en.x = val; if (id === 'propY') en.y = val;
            if (id === 'propW') en.w = Math.max(1, val); if (id === 'propH') en.h = Math.max(1, val);
            updateJSON(); callRender();
        }
    });
});

document.getElementById('snapOn')?.addEventListener('click', () => {
    state.snapToGrid = true;
    document.getElementById('snapOn').classList.add('active');
    document.getElementById('snapOff').classList.remove('active');
    callRender();
});

document.getElementById('snapOff')?.addEventListener('click', () => {
    state.snapToGrid = false;
    document.getElementById('snapOff').classList.add('active');
    document.getElementById('snapOn').classList.remove('active');
    callRender();
});

document.getElementById('modeBlock')?.addEventListener('click', () => {
    state.isBrushMode = false;
    document.getElementById('modeBlock').classList.add('active');
    document.getElementById('modeBrush').classList.remove('active');
});

document.getElementById('modeBrush')?.addEventListener('click', () => {
    state.isBrushMode = true;
    document.getElementById('modeBrush').classList.add('active');
    document.getElementById('modeBlock').classList.remove('active');
});

document.getElementById('gridSize')?.addEventListener('input', e => {
    state.gridSize = parseInt(e.target.value) || 20;
    callRender();
});

document.getElementById('gridCols')?.addEventListener('input', e => {
    state.cols = parseInt(e.target.value) || 40;
    callRender();
});

document.getElementById('gridRows')?.addEventListener('input', e => {
    state.rows = parseInt(e.target.value) || 24;
    callRender();
});

document.getElementById('btnPerimeter')?.addEventListener('click', () => {
    saveState();
    const sx = state.gridSizeX;
    const sy = state.gridSizeY;
    const w = state.width;
    const h = state.height;
    
    const borders = [
        new Entity('hazard', 0, 0, w, sy), // Top
        new Entity('hazard', 0, h - sy, w, sy), // Bottom
        new Entity('hazard', 0, sy, sx, h - (sy * 2)), // Left
        new Entity('hazard', w - sx, sy, sx, h - (sy * 2)) // Right
    ];
    
    state.entities.push(...borders);
    updateJSON();
    callRender();
});

document.getElementById('levelIdInput')?.addEventListener('input', updateJSON);

// Transformaciones
['mirrorH', 'mirrorV', 'rotateL', 'rotateR'].forEach(action => {
    document.getElementById(action)?.addEventListener('click', () => {
        transformSelection(action);
        updateProperties();
        callRender();
    });
});

// Eliminar desde el panel
document.getElementById('btnDelete')?.addEventListener('click', () => {
    if (state.selectedIds.length > 0) {
        saveState();
        state.entities = state.entities.filter(en => !state.selectedIds.includes(en.id));
        state.selectedIds = [];
        updateProperties();
        callRender();
    }
});

// Escuchar Undo/Redo (Ctrl+Z / Ctrl+Y)
window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.ctrlKey && e.key === 'z') undo();
    if (e.ctrlKey && e.key === 'y') redo();
});

// --- INICIALIZACIÓN ---
initInputHandlers(canvas, callRender);
initKeyboardHandlers(callRender);

window.addEventListener('resize', () => {
    canvas.width = document.getElementById('canvas-container').clientWidth;
    canvas.height = document.getElementById('canvas-container').clientHeight;
    callRender();
});

// Arrancar
canvas.width = document.getElementById('canvas-container').clientWidth;
canvas.height = document.getElementById('canvas-container').clientHeight;
centerLevel(canvas);
updateJSON();
callRender();

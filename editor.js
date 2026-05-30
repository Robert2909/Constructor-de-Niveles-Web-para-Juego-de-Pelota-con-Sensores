import { state, saveState } from './js/state.js';
import { Entity } from './js/entities.js';
import { render } from './js/renderer.js';
import { initInputHandlers, initKeyboardHandlers } from './js/input-handler.js';
import { centerLevel, updateProperties, updateJSON, transformSelection, scaleSelection, optimizeEntities, showOSD, bringSelectionToFront, sendSelectionToBack, alignSelection, distributeSelection, getLevelJSON } from './js/utils.js';
import { updateRulers, initRulerListeners } from './js/rulers.js';

const canvas = document.getElementById('editorCanvas');
const ctx = canvas.getContext('2d');

// --- WRAPPERS ---
function callRender() {
    render(canvas, ctx);
    updateRulers();
}

function undo() {
    if (state.undoStack.length > 0) {
        const levelInput = document.getElementById('levelIdInput');
        const themeInput = document.getElementById('themeInput');

        state.redoStack.push(JSON.stringify({
            entities: state.entities,
            width: state.width,
            height: state.height,
            levelId: levelInput ? levelInput.value : 1,
            theme: themeInput ? themeInput.value : 'industrial'
        }));

        const last = state.undoStack.pop();
        const data = JSON.parse(last);

        // Determinar si es formato antiguo (array) o nuevo (objeto completo)
        let entitiesData = Array.isArray(data) ? data : data.entities;

        if (!Array.isArray(data)) {
            if (data.width !== undefined) {
                state.width = data.width;
                const wi = document.getElementById('levelWidthInput');
                if (wi) wi.value = data.width;
            }
            if (data.height !== undefined) {
                state.height = data.height;
                const hi = document.getElementById('levelHeightInput');
                if (hi) hi.value = data.height;
            }
            if (data.levelId !== undefined) {
                const li = document.getElementById('levelIdInput');
                if (li) li.value = data.levelId;
            }
            if (data.theme !== undefined) {
                const ti = document.getElementById('themeInput');
                if (ti) ti.value = data.theme;
            }
        }

        state.entities = entitiesData.map(e => {
            const en = new Entity(e.type, e.x, e.y, e.w, e.h);
            en.id = e.id; // Preservar el ID original para no romper selecciones
            if (e.portalId !== undefined) en.checkpointIndex = e.portalId;
            else if (e.checkpointIndex !== undefined) en.checkpointIndex = e.checkpointIndex;
            if (e.linkId !== undefined) en.linkId = e.linkId;
            if (e.duration !== undefined) en.duration = e.duration;
            if (e.dx !== undefined) en.dx = e.dx;
            if (e.dy !== undefined) en.dy = e.dy;
            if (e.speed !== undefined) en.speed = e.speed;
            if (e.switchMode !== undefined) en.switchMode = e.switchMode;
            if (e.gateType !== undefined) en.gateType = e.gateType;
            if (e.inputLinkIds !== undefined) en.inputLinkIds = e.inputLinkIds;
            if (e.outputLinkId !== undefined) en.outputLinkId = e.outputLinkId;
            if (e.bossType !== undefined) en.bossType = e.bossType;
            if (e.health !== undefined) en.health = e.health;
            if (e.phases !== undefined) en.phases = e.phases;
            if (e.attackDensity !== undefined) en.attackDensity = e.attackDensity;
            if (e.attackFrequency !== undefined) en.attackFrequency = e.attackFrequency;
            if (e.specialAttackFrequency !== undefined) en.specialAttackFrequency = e.specialAttackFrequency;
            if (e.name !== undefined) en.name = e.name;
            return en;
        });
        state.selectedIds = [];
        updateProperties(); updateJSON(); callRender();
    }
}

function redo() {
    if (state.redoStack.length > 0) {
        const levelInput = document.getElementById('levelIdInput');
        const themeInput = document.getElementById('themeInput');

        state.undoStack.push(JSON.stringify({
            entities: state.entities,
            width: state.width,
            height: state.height,
            levelId: levelInput ? levelInput.value : 1,
            theme: themeInput ? themeInput.value : 'industrial'
        }));

        const next = state.redoStack.pop();
        const data = JSON.parse(next);

        let entitiesData = Array.isArray(data) ? data : data.entities;

        if (!Array.isArray(data)) {
            if (data.width !== undefined) {
                state.width = data.width;
                const wi = document.getElementById('levelWidthInput');
                if (wi) wi.value = data.width;
            }
            if (data.height !== undefined) {
                state.height = data.height;
                const hi = document.getElementById('levelHeightInput');
                if (hi) hi.value = data.height;
            }
            if (data.levelId !== undefined) {
                const li = document.getElementById('levelIdInput');
                if (li) li.value = data.levelId;
            }
            if (data.theme !== undefined) {
                const ti = document.getElementById('themeInput');
                if (ti) ti.value = data.theme;
            }
        }

        state.entities = entitiesData.map(e => {
            const en = new Entity(e.type, e.x, e.y, e.w, e.h);
            en.id = e.id;
            if (e.portalId !== undefined) en.checkpointIndex = e.portalId;
            else if (e.checkpointIndex !== undefined) en.checkpointIndex = e.checkpointIndex;
            if (e.linkId !== undefined) en.linkId = e.linkId;
            if (e.duration !== undefined) en.duration = e.duration;
            if (e.dx !== undefined) en.dx = e.dx;
            if (e.dy !== undefined) en.dy = e.dy;
            if (e.speed !== undefined) en.speed = e.speed;
            if (e.switchMode !== undefined) en.switchMode = e.switchMode;
            if (e.gateType !== undefined) en.gateType = e.gateType;
            if (e.inputLinkIds !== undefined) en.inputLinkIds = e.inputLinkIds;
            if (e.outputLinkId !== undefined) en.outputLinkId = e.outputLinkId;
            if (e.bossType !== undefined) en.bossType = e.bossType;
            if (e.health !== undefined) en.health = e.health;
            if (e.phases !== undefined) en.phases = e.phases;
            if (e.attackDensity !== undefined) en.attackDensity = e.attackDensity;
            if (e.attackFrequency !== undefined) en.attackFrequency = e.attackFrequency;
            if (e.specialAttackFrequency !== undefined) en.specialAttackFrequency = e.specialAttackFrequency;
            if (e.name !== undefined) en.name = e.name;
            return en;
        });
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
    const validTypes = ['wall', 'hazard', 'checkpoint', 'switch', 'gate', 'goal', 'start', 'moving_wall', 'moving_hazard', 'spinning_hazard', 'logic_gate', 'wind_zone', 'speed_pad', 'boss'];
    if (!validTypes.includes(type)) return;

    // Usar la función de coordenadas del módulo para consistencia
    const rect = canvas.getBoundingClientRect();
    const rx = (e.clientX - rect.left - state.view.offsetX) / state.view.zoom;
    const ry = (e.clientY - rect.top - state.view.offsetY) / state.view.zoom;

    const sx = state.snapToGrid ? state.gridSizeX : 1;
    const sy = state.snapToGrid ? state.gridSizeY : 1;

    let w = Math.max(sx, 40);
    let h = Math.max(sy, 40);

    // INICIO: Siempre un solo bloque de grid
    if (type === 'start') {
        w = sx;
        h = sy;
    }

    const fx = Math.max(0, Math.min(state.width - w, Math.round(rx / sx) * sx));
    const fy = Math.max(0, Math.min(state.height - h, Math.round(ry / sy) * sy));

    saveState();
    const news = new Entity(type, fx, fy, w, h);
    state.entities.push(news);
    state.selectedIds = [news.id];

    updateProperties();
    updateJSON();
    callRender();
});

// Botones Maestros
document.getElementById('btnCopyJSON')?.addEventListener('click', () => {
    const data = getLevelJSON();
    navigator.clipboard.writeText(data).then(() => {
        showOSD('PORTAPAPELES', 'JSON de Nivel Copiado', '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>');
    });
});

document.getElementById('btnExport')?.addEventListener('click', () => {
    const data = getLevelJSON();
    const levelId = document.getElementById('levelIdInput').value || 1;
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `level_${levelId}.json`;
    a.click();
    URL.revokeObjectURL(url);
});

// NUEVO: Funcionalidad de Limpiar Entorno
document.getElementById('btnClear')?.addEventListener('click', () => {
    saveState();
    state.entities = [];
    state.selectedIds = [];

    // Reset global properties
    state.width = 1920;
    state.height = 1080;

    const levelInput = document.getElementById('levelIdInput');
    if (levelInput) levelInput.value = 1;

    const themeInput = document.getElementById('themeInput');
    if (themeInput) themeInput.value = 'industrial';

    const widthInput = document.getElementById('levelWidthInput');
    if (widthInput) widthInput.value = 1920;

    const heightInput = document.getElementById('levelHeightInput');
    if (heightInput) heightInput.value = 1080;

    updateJSON();
    callRender();
    showOSD('ENTORNO', 'Lienzo Limpiado (Ctrl+Z para deshacer)', '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>');
});

// NUEVO: Funcionalidad de Guardado Manual
document.getElementById('btnSave')?.addEventListener('click', () => {
    saveToLocalStorage();
    showOSD('SISTEMA', 'Progreso Guardado', '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>');
});

function saveToLocalStorage() {
    const data = getLevelJSON();
    localStorage.setItem('levelBuilderSave', data);
}

// Auto-guardado cada 30 segundos
setInterval(() => {
    saveToLocalStorage();
}, 30000);

document.getElementById('levelWidthInput')?.addEventListener('input', (e) => {
    state.width = parseInt(e.target.value) || 1920;
    updateJSON();
    callRender();
});

document.getElementById('levelHeightInput')?.addEventListener('input', (e) => {
    state.height = parseInt(e.target.value) || 1080;
    updateJSON();
    callRender();
});

document.getElementById('presetDimensions')?.addEventListener('change', (e) => {
    const val = e.target.value;
    if (val) {
        saveState();
        const [w, h] = val.split('x').map(Number);
        state.width = w;
        state.height = h;
        const wi = document.getElementById('levelWidthInput');
        if (wi) wi.value = w;
        const hi = document.getElementById('levelHeightInput');
        if (hi) hi.value = h;
        
        updateJSON();
        callRender();
        e.target.value = ''; // Reset select
    }
});

document.getElementById('presetGrids')?.addEventListener('change', (e) => {
    const blockSize = parseInt(e.target.value);
    if (blockSize) {
        saveState();
        // Calculamos las columnas y filas óptimas para encajar bloques de X píxeles
        const cols = Math.max(1, Math.round(state.width / blockSize));
        const rows = Math.max(1, Math.round(state.height / blockSize));
        
        state.cols = cols;
        state.rows = rows;
        const ci = document.getElementById('gridCols');
        if (ci) ci.value = cols;
        const ri = document.getElementById('gridRows');
        if (ri) ri.value = rows;
        
        updateJSON();
        callRender();
        e.target.value = ''; // Reset select
    }
});

document.getElementById('btnOpenImport')?.addEventListener('click', async () => {
    try {
        const text = await navigator.clipboard.readText();
        const data = JSON.parse(text);
        if (data && data.entities) {
            const textarea = document.getElementById('txtImportJson');
            if (textarea) textarea.value = text;
            document.getElementById('btnDoImport')?.click();
            return; // JSON válido detectado en portapapeles, fin de la ejecución
        }
    } catch (e) {
        // Falla silenciosa si no hay texto, si el usuario no dio permiso o si el JSON es inválido
    }

    // Fallback: abrir modal manualmente
    document.getElementById('modalImport').classList.remove('hidden');
    const textarea = document.getElementById('txtImportJson');
    if (textarea) {
        textarea.value = '';
        setTimeout(() => textarea.focus(), 50);
    }
});

const closeImportModal = () => {
    document.getElementById('modalImport').classList.add('hidden');
    document.getElementById('txtImportJson')?.blur();
};

document.getElementById('btnCloseModal')?.addEventListener('click', closeImportModal);

document.getElementById('btnDoImport')?.addEventListener('click', () => {
    const json = document.getElementById('txtImportJson').value;
    try {
        const data = JSON.parse(json);
        if (data.entities) {
            saveState();
            state.entities = data.entities.map(e => {
                const en = new Entity(e.type, e.x, e.y, e.w, e.h);
                // Copiar dinámicamente cualquier propiedad extra (Evita tener que hardcodearlas)
                for (const key in e) {
                    if (['type', 'x', 'y', 'w', 'h', 'id'].includes(key)) continue;
                    en[key] = e[key];
                }
                // Compatibilidad con versiones anteriores para portalId
                if (e.portalId !== undefined && e.type === 'portal') {
                    en.checkpointIndex = e.portalId;
                    delete en.portalId;
                }
                return en;
            });
            if (data.levelId) document.getElementById('levelIdInput').value = data.levelId;

            // Importar tema si existe
            const themeInput = document.getElementById('themeInput');
            if (themeInput) {
                themeInput.value = data.theme || 'industrial';
            }

            // Importar dimensiones de nivel si existen
            if (data.width) {
                state.width = parseInt(data.width) || 1920;
                const widthInput = document.getElementById('levelWidthInput');
                if (widthInput) widthInput.value = state.width;
            } else {
                state.width = 1920;
                const widthInput = document.getElementById('levelWidthInput');
                if (widthInput) widthInput.value = 1920;
            }
            if (data.height) {
                state.height = parseInt(data.height) || 1080;
                const heightInput = document.getElementById('levelHeightInput');
                if (heightInput) heightInput.value = state.height;
            } else {
                state.height = 1080;
                const heightInput = document.getElementById('levelHeightInput');
                if (heightInput) heightInput.value = 1080;
            }

            // Importar rejilla si existe
            if (data.gridCols) {
                state.cols = parseInt(data.gridCols) || 96;
                const ci = document.getElementById('gridCols');
                if (ci) ci.value = state.cols;
            }
            if (data.gridRows) {
                state.rows = parseInt(data.gridRows) || 54;
                const ri = document.getElementById('gridRows');
                if (ri) ri.value = state.rows;
            }

            state.selectedIds = [];
            centerLevel(canvas);
            updateProperties(); updateJSON(); callRender();
            closeImportModal();
            showOSD('SISTEMA', 'Nivel Importado Correctamente', '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>');
        }
    } catch (e) {
        showOSD('ERROR', 'JSON inválido', '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>');
    }
});

// Atajos de teclado para la modal de importación
window.addEventListener('keydown', (e) => {
    const modal = document.getElementById('modalImport');
    if (modal && !modal.classList.contains('hidden')) {
        if (e.key === 'Escape') {
            closeImportModal();
            e.preventDefault();
        }
    }
});

document.getElementById('txtImportJson')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        document.getElementById('btnDoImport')?.click();
    }
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

['propX', 'propY', 'propW', 'propH'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    // Guardar estado al enfocar para capturar el valor ANTES del cambio
    el.addEventListener('focus', () => saveState());

    el.addEventListener('input', (e) => {
        if (state.selectedIds.length === 1) {
            const en = state.entities.find(e => e.id === state.selectedIds[0]);
            const val = parseInt(e.target.value) || 0;
            if (id === 'propX') en.x = val;
            if (id === 'propY') en.y = val;
            if (id === 'propW') en.w = Math.max(1, val);
            if (id === 'propH') en.h = Math.max(1, val);
            updateJSON();
            callRender();
        }
    });
});

document.getElementById('snapOn')?.addEventListener('click', () => {
    state.snapToGrid = true;
    document.getElementById('snapOn').classList.add('active');
    document.getElementById('snapOff').classList.remove('active');
    showOSD('MODO DE MOVIMIENTO', 'Modo Rejilla', '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/></svg>');
    callRender();
});

document.getElementById('snapOff')?.addEventListener('click', () => {
    state.snapToGrid = false;
    document.getElementById('snapOff').classList.add('active');
    document.getElementById('snapOn').classList.remove('active');
    showOSD('MODO DE MOVIMIENTO', 'Modo Libre', '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>');
    callRender();
});

document.getElementById('modeBlock')?.addEventListener('click', () => {
    state.isBrushMode = false;
    document.getElementById('modeBlock').classList.add('active');
    document.getElementById('modeBrush').classList.remove('active');
    showOSD('MODO DE CONSTRUCCIÓN', 'Modo Bloque', '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>');
});

document.getElementById('modeBrush')?.addEventListener('click', () => {
    state.isBrushMode = true;
    document.getElementById('modeBrush').classList.add('active');
    document.getElementById('modeBlock').classList.remove('active');
    showOSD('MODO DE CONSTRUCCIÓN', 'Modo Pincel', '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>');
});

document.getElementById('gridCols')?.addEventListener('input', e => {
    state.cols = parseInt(e.target.value) || 48;
    callRender();
});

document.getElementById('gridRows')?.addEventListener('input', e => {
    state.rows = parseInt(e.target.value) || 27;
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
document.getElementById('themeInput')?.addEventListener('change', () => {
    callRender();
});

// Transformaciones
['mirrorH', 'mirrorV', 'rotateL', 'rotateR'].forEach(action => {
    document.getElementById(action)?.addEventListener('click', () => {
        saveState();
        transformSelection(action);
        updateProperties();
        callRender();
    });
});

document.getElementById('bringToFront')?.addEventListener('click', () => {
    saveState();
    bringSelectionToFront();
    updateProperties();
    callRender();
});

document.getElementById('sendToBack')?.addEventListener('click', () => {
    saveState();
    sendSelectionToBack();
    updateProperties();
    callRender();
});

// Alinear
const alignMappings = {
    'alignLeft': 'left',
    'alignCenterX': 'centerX',
    'alignRight': 'right',
    'alignTop': 'top',
    'alignCenterY': 'centerY',
    'alignBottom': 'bottom'
};

Object.entries(alignMappings).forEach(([btnId, type]) => {
    document.getElementById(btnId)?.addEventListener('click', () => {
        if (state.selectedIds.length < 2) return;
        saveState();
        alignSelection(type);
        updateProperties();
        callRender();
    });
});

// Distribución
document.getElementById('distributeH')?.addEventListener('click', () => {
    saveState();
    distributeSelection('horizontal');
    updateProperties();
    callRender();
});

document.getElementById('distributeV')?.addEventListener('click', () => {
    saveState();
    distributeSelection('vertical');
    updateProperties();
    callRender();
});

document.getElementById('btnApplyScale')?.addEventListener('click', (e) => {
    // 1. Capturar los valores actuales del DOM inmediatamente
    const inputW = document.getElementById('targetScaleW');
    const inputH = document.getElementById('targetScaleH');

    // Usamos parseFloat para ser más precisos si es necesario, aunque parseInt suele bastar
    const w = parseInt(inputW.value);
    const h = parseInt(inputH.value);

    if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
        state.isScaling = true;

        // 2. Quitar foco para limpiar la UI
        if (document.activeElement instanceof HTMLInputElement) {
            document.activeElement.blur();
        }

        saveState();
        scaleSelection(w, h);
        state.isScaling = false;

        // 3. Refrescar TODO para confirmar visualmente
        updateProperties();
        callRender();
    }
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
    if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        undo();
    }
    if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        redo();
    }
});

// --- INICIALIZACIÓN ---
async function init() {
    initInputHandlers(canvas, callRender);
    initKeyboardHandlers(callRender);
    initRulerListeners(callRender);

    // Control + G para guardar manualmente
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && (e.key === 'g' || e.key === 'G')) {
            e.preventDefault();
            saveToLocalStorage();
            showOSD('SISTEMA', 'Progreso Guardado', '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>');
        }
    });

    window.addEventListener('resize', () => {
        const area = document.querySelector('.canvas-area');
        canvas.width = area.clientWidth;
        canvas.height = area.clientHeight;
        callRender();
    });

    const area = document.querySelector('.canvas-area');
    canvas.width = area.clientWidth;
    canvas.height = area.clientHeight;

    try {
        const savedLevel = localStorage.getItem('levelBuilderSave');
        if (savedLevel) {
            const data = JSON.parse(savedLevel);
            if (data.entities) {
                state.entities = data.entities.map(e => {
                    const en = new Entity(e.type, e.x, e.y, e.w, e.h);
                    if (e.portalId !== undefined) en.checkpointIndex = e.portalId;
                    else if (e.checkpointIndex !== undefined) en.checkpointIndex = e.checkpointIndex;
                    if (e.linkId !== undefined) en.linkId = e.linkId;
                    if (e.duration !== undefined) en.duration = e.duration;
                    if (e.dx !== undefined) en.dx = e.dx;
                    if (e.dy !== undefined) en.dy = e.dy;
                    if (e.speed !== undefined) en.speed = e.speed;
                    if (e.switchMode !== undefined) en.switchMode = e.switchMode;
                    if (e.gateType !== undefined) en.gateType = e.gateType;
                    if (e.inputLinkIds !== undefined) en.inputLinkIds = e.inputLinkIds;
                    if (e.outputLinkId !== undefined) en.outputLinkId = e.outputLinkId;
                    if (e.bossType !== undefined) en.bossType = e.bossType;
                    if (e.health !== undefined) en.health = e.health;
                    if (e.phases !== undefined) en.phases = e.phases;
                    if (e.attackDensity !== undefined) en.attackDensity = e.attackDensity;
                    if (e.attackFrequency !== undefined) en.attackFrequency = e.attackFrequency;
                    if (e.specialAttackFrequency !== undefined) en.specialAttackFrequency = e.specialAttackFrequency;
                    if (e.name !== undefined) en.name = e.name;
                    return en;
                });
                if (data.levelId) document.getElementById('levelIdInput').value = data.levelId;
                if (data.theme) document.getElementById('themeInput').value = data.theme;
                if (data.width) {
                    state.width = parseInt(data.width) || 1920;
                    document.getElementById('levelWidthInput').value = state.width;
                }
                if (data.height) {
                    state.height = parseInt(data.height) || 1080;
                    document.getElementById('levelHeightInput').value = state.height;
                }
            }
            console.log('Nivel restaurado desde memoria local.');
            showOSD('RECUPERADO', 'Progreso anterior restaurado', '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>');
        }
    } catch (e) { }

    centerLevel(canvas);

    // Cargar temas centralizados de forma asíncrona
    try {
        const response = await fetch('themes.json');
        if (response.ok) {
            const data = await response.json();
            // Sobrescribir los temas de estado reactivos con la configuración centralizada actualizada
            state.themes = data;
            console.log('Temas dinámicos cargados correctamente desde themes.json');
        }
    } catch (e) {
        console.warn('Ejecución local o temas.json inaccesible. Usando base de temas de respaldo offline en state.js.');
    }

    updateJSON();

    // Iniciar loop de animación continua para efectos visuales (cables de señales fluyendo, metas pulsando, etc.)
    function animate() {
        callRender();
        requestAnimationFrame(animate);
    }
    animate();
}

init();

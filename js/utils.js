import { state } from './state.js';
import { BASE_WIDTH, BASE_HEIGHT } from './constants.js';

export function getCanvasCoords(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left);
    const y = (e.clientY - rect.top);
    
    return {
        x: (x - state.view.offsetX) / state.view.zoom,
        y: (y - state.view.offsetY) / state.view.zoom
    };
}

export function centerLevel(canvas) {
    state.view.zoom = 1.0;
    state.view.offsetX = (canvas.width - BASE_WIDTH) / 2;
    state.view.offsetY = (canvas.height - BASE_HEIGHT) / 2;
}

export function updateJSON() {
    const output = document.getElementById('jsonOutput');
    const levelInput = document.getElementById('levelIdInput');
    const sidebar = document.querySelector('.sidebar.right');
    const props = document.getElementById('propertiesPanel');
    if (!output || !levelInput || !sidebar || !props) return;
    
    const data = { 
        levelId: parseInt(levelInput.value) || 1, 
        entities: state.entities.map(en => ({ 
            type: en.type, x: Math.round(en.x), y: Math.round(en.y), w: Math.round(en.w), h: Math.round(en.h) 
        })) 
    };
    output.value = JSON.stringify(data, null, 2);
    
    // MEDICIÓN EN TIEMPO REAL
    output.style.height = '120px';
    const sidebarHeight = sidebar.clientHeight;
    const headerHeight = sidebar.querySelector('.sidebar-header').offsetHeight;
    const propsHeight = props.offsetHeight;
    const btnCopyHeight = document.getElementById('btnCopy').offsetHeight;
    const availableSpace = sidebarHeight - headerHeight - propsHeight - btnCopyHeight - 20;
    const contentHeight = output.scrollHeight + 5;
    const targetHeight = Math.min(availableSpace, contentHeight);
    output.style.height = Math.max(120, targetHeight) + 'px';
}

export function updateProperties() {
    const controls = document.getElementById('selection-controls');
    const noSelection = document.getElementById('no-selection');
    const transformPanel = document.getElementById('transform-panel');
    if (!controls || !noSelection) return;

    if (state.selectedIds.length > 0) {
        transformPanel?.classList.remove('disabled-ui');
        if (state.selectedIds.length === 1) {
            document.getElementById('propertiesPanel')?.classList.remove('hidden');
            noSelection.classList.add('hidden');
            controls.classList.remove('hidden');
            const en = state.entities.find(e => e.id === state.selectedIds[0]);
            if (en) {
                document.getElementById('propType').textContent = en.type.toUpperCase();
                document.getElementById('propX').value = Math.round(en.x);
                document.getElementById('propY').value = Math.round(en.y);
                document.getElementById('propW').value = Math.round(en.w);
                document.getElementById('propH').value = Math.round(en.h);
            }
        } else {
            controls.classList.add('hidden');
            noSelection.classList.remove('hidden');
            noSelection.textContent = `${state.selectedIds.length} objetos seleccionados`;
        }
    } else {
        transformPanel?.classList.add('disabled-ui');
        controls.classList.add('hidden');
        noSelection.classList.remove('hidden');
        noSelection.textContent = "Selecciona un objeto para editar";
    }
    
    updateSelectionStats();
    updateJSON();
}

export function updateSelectionStats() {
    const statsPanel = document.getElementById('selectionStats');
    const statW = document.getElementById('statW');
    const statH = document.getElementById('statH');
    if (!statsPanel || !statW || !statH) return;

    // Prioridad 1: Si estamos dibujando algo nuevo (tempRect)
    if (state.tempRect && state.tempRect.w > 0) {
        statsPanel.classList.remove('hidden');
        const blocksW = Math.round(state.tempRect.w / state.gridSizeX * 100) / 100;
        const blocksH = Math.round(state.tempRect.h / state.gridSizeY * 100) / 100;
        statW.textContent = `Anchura: ${blocksW} bloques`;
        statH.textContent = `Altura: ${blocksH} bloques`;
        return;
    }

    // Prioridad 2: Si hay elementos seleccionados
    if (state.selectedIds.length === 0) {
        statsPanel.classList.add('hidden');
        return;
    }

    statsPanel.classList.remove('hidden');
    
    const selected = state.entities.filter(en => state.selectedIds.includes(en.id));
    const minX = Math.min(...selected.map(en => en.x));
    const minY = Math.min(...selected.map(en => en.y));
    const maxX = Math.max(...selected.map(en => en.x + en.w));
    const maxY = Math.max(...selected.map(en => en.y + en.h));
    
    const totalW = maxX - minX;
    const totalH = maxY - minY;

    const blocksW = Math.round(totalW / state.gridSizeX * 100) / 100;
    const blocksH = Math.round(totalH / state.gridSizeY * 100) / 100;

    statW.textContent = `Anchura: ${blocksW} bloques`;
    statH.textContent = `Altura: ${blocksH} bloques`;
}

export function transformSelection(action) {
    if (state.selectedIds.length === 0) return;
    
    const selected = state.entities.filter(en => state.selectedIds.includes(en.id));
    const sx = state.gridSizeX;
    const sy = state.gridSizeY;

    // 1. Calcular Bounding Box del grupo
    const minX = Math.min(...selected.map(en => en.x));
    const minY = Math.min(...selected.map(en => en.y));
    const maxX = Math.max(...selected.map(en => en.x + en.w));
    const maxY = Math.max(...selected.map(en => en.y + en.h));
    
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    selected.forEach(en => {
        if (action === 'mirrorH') {
            const dist = en.x + en.w / 2 - cx;
            en.x = cx - dist - en.w / 2;
        } else if (action === 'mirrorV') {
            const dist = en.y + en.h / 2 - cy;
            en.y = cy - dist - en.h / 2;
        } else if (action === 'rotateR' || action === 'rotateL') {
            const dir = action === 'rotateR' ? 1 : -1;
            const rx = en.x + en.w / 2 - cx;
            const ry = en.y + en.h / 2 - cy;
            
            const nx = -ry * dir;
            const ny = rx * dir;
            
            const oldW = en.w;
            en.w = en.h;
            en.h = oldW;
            
            en.x = cx + nx - en.w / 2;
            en.y = cy + ny - en.h / 2;
        }
        
        // Ajuste fino al grid tras transformación
        if (state.snapToGrid) {
            en.x = Math.round(en.x / sx) * sx;
            en.y = Math.round(en.y / sy) * sy;
            en.w = Math.round(en.w / sx) * sx;
            en.h = Math.round(en.h / sy) * sy;
        }
    });
}

export function optimizeEntities() {
    if (state.entities.length < 2) return;
    
    const typesToOptimize = ['wall', 'hazard'];
    let finalEntities = state.entities.filter(en => !typesToOptimize.includes(en.type));
    
    typesToOptimize.forEach(type => {
        let group = state.entities.filter(en => en.type === type);
        if (group.length === 0) return;

        // Fusión Horizontal
        group.sort((a, b) => a.y - b.y || a.x - b.x);
        let hMerged = [];
        group.forEach(en => {
            let prev = hMerged[hMerged.length - 1];
            if (prev && prev.y === en.y && prev.h === en.h && prev.x + prev.w === en.x) {
                prev.w += en.w;
            } else {
                hMerged.push(en);
            }
        });

        // Fusión Vertical
        hMerged.sort((a, b) => a.x - b.x || a.y - b.y);
        let vMerged = [];
        hMerged.forEach(en => {
            let prev = vMerged[vMerged.length - 1];
            if (prev && prev.x === en.x && prev.w === en.w && prev.y + prev.h === en.y) {
                prev.h += en.h;
            } else {
                vMerged.push(en);
            }
        });
        finalEntities.push(...vMerged);
    });
    state.entities = finalEntities;
}

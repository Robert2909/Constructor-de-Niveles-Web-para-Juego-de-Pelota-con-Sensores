import { state } from './state.js';
import { BASE_WIDTH, BASE_HEIGHT } from './constants.js';
import { Entity } from './entities.js';

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
    const container = document.getElementById('canvas-container');
    if (!container) return;

    const cw = container.clientWidth;
    const ch = container.clientHeight;
    
    // Calcular el zoom necesario para que todo el mapa (1920x1080) quepa en el contenedor
    // Dejamos un pequeño margen del 10% para que no toque los bordes
    const zoomX = cw / state.width;
    const zoomY = ch / state.height;
    const fitZoom = Math.min(zoomX, zoomY) * 0.90;
    
    state.view.zoom = Math.max(0.1, fitZoom);
    
    // Centrar exactamente
    state.view.offsetX = (cw - state.width * state.view.zoom) / 2;
    state.view.offsetY = (ch - state.height * state.view.zoom) / 2;
    
    // Actualizar la etiqueta de zoom en la UI si existe
    const label = document.getElementById('zoomLabel');
    if (label) label.textContent = `${Math.round(state.view.zoom * 100)}%`;
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
    if (state.entities.length === 0) return;

    const typesToOptimize = ['wall', 'hazard'];
    let finalOptimized = [];
    
    // 1. Separar no optimizables
    let others = state.entities.filter(en => !typesToOptimize.includes(en.type));
    let toProcess = state.entities.filter(en => typesToOptimize.includes(en.type));

    typesToOptimize.forEach(type => {
        let items = toProcess.filter(en => en.type === type);
        if (items.length === 0) return;

        // Crear un mapa de celdas ocupadas para este tipo
        // Usamos coordenadas de rejilla (indices) para facilitar la expansión
        const sx = state.gridSizeX;
        const sy = state.gridSizeY;
        const grid = {}; // clave: "col,row"

        items.forEach(en => {
            const colStart = Math.round(en.x / sx);
            const rowStart = Math.round(en.y / sy);
            const colSpan = Math.round(en.w / sx);
            const rowSpan = Math.round(en.h / sy);

            for (let c = colStart; c < colStart + colSpan; c++) {
                for (let r = rowStart; r < rowStart + rowSpan; r++) {
                    grid[`${c},${r}`] = true;
                }
            }
        });

        const visited = new Set();
        const cols = state.cols;
        const rows = state.rows;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const key = `${c},${r}`;
                if (grid[key] && !visited.has(key)) {
                    // Encontramos el inicio de un posible rectángulo
                    let width = 0;
                    let height = 0;

                    // 1. Expandir a la derecha todo lo posible
                    while ((c + width) < cols && grid[`${c + width},${r}`] && !visited.has(`${c + width},${r}`)) {
                        width++;
                    }

                    // 2. Expandir hacia abajo la tira completa
                    let canExpandDown = true;
                    while (canExpandDown && (r + height) < rows) {
                        for (let i = 0; i < width; i++) {
                            const downKey = `${c + i},${r + height}`;
                            if (!grid[downKey] || visited.has(downKey)) {
                                canExpandDown = false;
                                break;
                            }
                        }
                        if (canExpandDown) height++;
                    }

                    // Marcar celdas como visitadas
                    for (let i = 0; i < width; i++) {
                        for (let j = 0; j < height; j++) {
                            visited.add(`${c + i},${r + j}`);
                        }
                    }

                    // Crear la entidad optimizada
                    finalOptimized.push(new Entity(type, c * sx, r * sy, width * sx, height * sy));
                }
            }
        }
    });

    state.entities = [...others, ...finalOptimized];
    updateJSON();
}

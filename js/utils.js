import { state } from './state.js';
import { BASE_WIDTH, BASE_HEIGHT } from './constants.js';
import { Entity } from './entities.js';

export function getCanvasCoords(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left);
    const y = (e.clientY - rect.top);
    
    return {
        x: (x - state.view.offsetX) / (state.view.zoom * state.view.baseZoom),
        y: (y - state.view.offsetY) / (state.view.zoom * state.view.baseZoom)
    };
}

export function centerLevel(canvas) {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    const cw = container.clientWidth;
    const ch = container.clientHeight;
    
    // Calculamos el zoom que hace que el mapa quepa (con 10% de margen)
    const zoomX = cw / state.width;
    const zoomY = ch / state.height;
    state.view.baseZoom = Math.min(zoomX, zoomY) * 0.90;
    
    // El zoom relativo del usuario vuelve a ser 1.0 (que visualmente se ve como "ajustado")
    state.view.zoom = 1.0;
    
    // Centrar exactamente
    state.view.offsetX = (cw - state.width * (state.view.zoom * state.view.baseZoom)) / 2;
    state.view.offsetY = (ch - state.height * (state.view.zoom * state.view.baseZoom)) / 2;
    
    // Actualizar la etiqueta de zoom (ahora dirá 100%)
    const label = document.getElementById('zoomLabel');
    if (label) label.textContent = `100%`;
}

export function updateJSON() {
    // Obsoleto: ya no hay panel de JSON en la interfaz
}

export function getLevelJSON() {
    const levelInput = document.getElementById('levelIdInput');
    const data = { 
        levelId: levelInput ? (parseInt(levelInput.value) || 1) : 1, 
        entities: state.entities.map(en => ({ 
            type: en.type, 
            x: Math.round(en.x), 
            y: Math.round(en.y), 
            w: Math.round(en.w), 
            h: Math.round(en.h) 
        })) 
    };
    return JSON.stringify(data, null, 2);
}

export function updateProperties() {
    const propType = document.getElementById('propType');
    const inputs = ['propX', 'propY', 'propW', 'propH'].map(id => document.getElementById(id));
    const btnDelete = document.getElementById('btnDelete');
    const transformPanel = document.getElementById('transform-panel');
    
    if (!propType || !btnDelete) return;

    if (state.selectedIds.length === 1) {
        transformPanel?.classList.remove('disabled-ui');
        const en = state.entities.find(e => e.id === state.selectedIds[0]);
        if (en) {
            propType.textContent = en.type.toUpperCase();
            inputs.forEach(input => {
                if (input) {
                    input.disabled = false;
                    input.type = "number";
                }
            });
            btnDelete.disabled = false;
            
            document.getElementById('propX').value = Math.round(en.x);
            document.getElementById('propY').value = Math.round(en.y);
            document.getElementById('propW').value = Math.round(en.w);
            document.getElementById('propH').value = Math.round(en.h);
        }
    } else {
        // Múltiple selección o ninguna
        propType.textContent = state.selectedIds.length > 1 ? `${state.selectedIds.length} OBJETOS` : "---";
        inputs.forEach(input => {
            if (input) {
                input.disabled = true;
                input.type = "text";
                input.value = "---";
            }
        });
        btnDelete.disabled = state.selectedIds.length === 0;
        
        if (state.selectedIds.length > 0) {
            transformPanel?.classList.remove('disabled-ui');
        } else {
            transformPanel?.classList.add('disabled-ui');
        }
    }
    
    updateSelectionStats();
    updateJSON();
}

export function updateSelectionStats() {
    const statsPanel = document.getElementById('selectionStats');
    const statW = document.getElementById('statW');
    const statH = document.getElementById('statH');
    const inputScaleW = document.getElementById('targetScaleW');
    const inputScaleH = document.getElementById('targetScaleH');
    
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
        if (inputScaleW && inputScaleH) {
            inputScaleW.disabled = true;
            inputScaleH.disabled = true;
            inputScaleW.type = "text";
            inputScaleH.type = "text";
            inputScaleW.value = "---";
            inputScaleH.value = "---";
        }
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

    // NUEVO: Rellenar inputs de escala de forma inteligente
    const isFocused = document.activeElement === inputScaleW || document.activeElement === inputScaleH;
    const selectionKey = state.selectedIds.sort().join(',');
    const selectionChanged = selectionKey !== state.lastSelectionKey;
    
    if (inputScaleW && inputScaleH && !state.isScaling) {
        inputScaleW.disabled = false;
        inputScaleH.disabled = false;
        
        // Solo sobrescribimos si:
        // 1. La selección ha cambiado (nuevo objeto seleccionado)
        // 2. El input está vacío o tiene el placeholder '---'
        // 3. NO está enfocado (para no interrumpir la escritura)
        // 4. Pero si la selección cambió, reseteamos siempre para mostrar lo nuevo
        const currentW = Math.round(totalW);
        const currentH = Math.round(totalH);

        if (selectionChanged || state.isDragging || state.isResizing || (!isFocused && (inputScaleW.value === "" || inputScaleW.value === "---"))) {
            inputScaleW.type = "number";
            inputScaleH.type = "number";
            inputScaleW.value = currentW;
            inputScaleH.value = currentH;
        }
    }
    
    state.lastSelectionKey = selectionKey;
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

export function scaleSelection(targetW, targetH) {
    if (state.selectedIds.length === 0) return;
    
    const selected = state.entities.filter(en => state.selectedIds.includes(en.id));
    const sx = state.gridSizeX;
    const sy = state.gridSizeY;

    // 1. Calcular Bounding Box actual
    const minX = Math.min(...selected.map(en => en.x));
    const minY = Math.min(...selected.map(en => en.y));
    const maxX = Math.max(...selected.map(en => en.x + en.w));
    const maxY = Math.max(...selected.map(en => en.y + en.h));
    
    const currentW = maxX - minX;
    const currentH = maxY - minY;

    if (currentW === 0 || currentH === 0) return;

    // 2. Factores de escala en unidades de rejilla para consistencia absoluta
    const gridW = currentW / sx;
    const gridH = currentH / sy;
    const targetGridW = Math.round(targetW / sx);
    const targetGridH = Math.round(targetH / sy);
    
    const fGX = targetGridW / gridW;
    const fGY = targetGridH / gridH;

    selected.forEach(en => {
        if (state.snapToGrid) {
            // Trabajamos puramente en "unidades de bloque"
            const uX = (en.x - minX) / sx;
            const uY = (en.y - minY) / sy;
            const uW = en.w / sx;
            const uH = en.h / sy;

            // Escalamos y redondeamos las unidades, no los píxeles
            const newUX = Math.round(uX * fGX);
            const newUY = Math.round(uY * fGY);
            const newUW = Math.round(uW * fGX);
            const newUH = Math.round(uH * fGY);

            // Convertimos de vuelta a píxeles
            en.x = minX + (newUX * sx);
            en.y = minY + (newUY * sy);
            en.w = Math.max(sx, newUW * sx);
            en.h = Math.max(sy, newUH * sy);
        } else {
            // Escalado libre (píxel a píxel)
            const fX = targetW / currentW;
            const fY = targetH / currentH;
            const relX = en.x - minX;
            const relY = en.y - minY;
            
            const rawX1 = minX + (relX * fX);
            const rawY1 = minY + (relY * fY);
            const rawX2 = minX + (relX + en.w) * fX;
            const rawY2 = minY + (relY + en.h) * fY;

            en.x = rawX1;
            en.y = rawY1;
            en.w = Math.max(1, rawX2 - rawX1);
            en.h = Math.max(1, rawY2 - rawY1);
        }
    });

    updateProperties();
    updateJSON();
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

function gcd(a, b) {
    return b ? gcd(b, a % b) : a;
}

export function checkSmartGuides(rect) {
    state.activeGuides = { x: [], y: [] };
    if (!rect) return rect;
    
    const threshold = 15; // Píxeles de proximidad para visualización
    const snapThreshold = 5; // Píxeles para magnetismo real (suavizado)

    const divisions = [
        { div: 2, color: 'rgba(59, 130, 246, 0.7)', base: 2 }, // Azul
        { div: 3, color: 'rgba(234, 179, 8, 0.7)', base: 3 },  // Amarillo
        { div: 6, color: 'rgba(234, 179, 8, 0.7)', base: 3 },  // Amarillo
        { div: 4, color: 'rgba(239, 68, 68, 0.7)', base: 2 },  // Rojo
        { div: 8, color: 'rgba(239, 68, 68, 0.7)', base: 2 },  // Rojo
        { div: 5, color: 'rgba(168, 85, 247, 0.7)', base: 5 }  // Morado
    ];

    let snappedX = rect.x;
    let snappedY = rect.y;

    const checkAxis = (val, axis, offset = 0) => {
        const totalSize = axis === 'x' ? state.width : state.height;
        divisions.forEach(({ div, color, base }) => {
            // Ignorar por completo si la familia correspondiente está desactivada
            if (!state.rulerFamilies[base]) return;

            for (let i = 1; i < div; i++) {
                // Evitar duplicados de guías mediante el máximo común divisor
                if (gcd(i, div) > 1) continue;

                const guidePos = (totalSize / div) * i;
                const diff = Math.abs(val - guidePos);
                
                if (diff < threshold) {
                    state.activeGuides[axis].push({ 
                        pos: guidePos, 
                        color, 
                        label: `${i}/${div}` 
                    });
                    
                    // Aplicar magnetismo (snap) si estamos muy cerca
                    if (diff < snapThreshold) {
                        if (axis === 'x') snappedX = guidePos - offset;
                        else snappedY = guidePos - offset;
                    }
                }
            }
        });
    };

    // Revisar Izquierda, Centro, Derecha
    checkAxis(rect.x, 'x', 0);
    checkAxis(rect.x + rect.w / 2, 'x', rect.w / 2);
    checkAxis(rect.x + rect.w, 'x', rect.w);

    // Arriba, Centro, Abajo
    checkAxis(rect.y, 'y', 0);
    checkAxis(rect.y + rect.h / 2, 'y', rect.h / 2);
    checkAxis(rect.y + rect.h, 'y', rect.h);

    // Guardar posición central para las etiquetas en el renderer
    state.lastInteractionPos = {
        x: rect.x + rect.w / 2,
        y: rect.y + rect.h / 2
    };

    return { x: snappedX, y: snappedY };
}

export function showOSD(title, value, icon) {
    let container = document.getElementById('osd-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'osd-container';
        document.body.appendChild(container);
    }
    
    // Limpiar OSDs anteriores para evitar acumulación
    container.innerHTML = '';
    
    const toast = document.createElement('div');
    toast.className = 'osd-toast';
    toast.innerHTML = `
        <div class="osd-icon">${icon}</div>
        <div class="osd-title">${title}</div>
        <div class="osd-value">${value}</div>
    `;
    
    container.appendChild(toast);
    
    // Forzar reflow para animación
    toast.offsetHeight;
    
    toast.classList.add('show');
    
    // Desaparecer después de 1 segundo
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 250);
    }, 1000);
}

export function bringSelectionToFront() {
    if (state.selectedIds.length === 0) return;
    const selected = [];
    const unselected = [];
    state.entities.forEach(en => {
        if (state.selectedIds.includes(en.id)) {
            selected.push(en);
        } else {
            unselected.push(en);
        }
    });
    state.entities = [...unselected, ...selected];
    updateJSON();
}

export function sendSelectionToBack() {
    if (state.selectedIds.length === 0) return;
    const selected = [];
    const unselected = [];
    state.entities.forEach(en => {
        if (state.selectedIds.includes(en.id)) {
            selected.push(en);
        } else {
            unselected.push(en);
        }
    });
    state.entities = [...selected, ...unselected];
    updateJSON();
}

export function alignSelection(alignmentType) {
    if (state.selectedIds.length < 2) return;
    
    const selected = state.entities.filter(en => state.selectedIds.includes(en.id));
    const sx = state.gridSizeX;
    const sy = state.gridSizeY;
    
    // Bounding Box
    const minX = Math.min(...selected.map(en => en.x));
    const minY = Math.min(...selected.map(en => en.y));
    const maxX = Math.max(...selected.map(en => en.x + en.w));
    const maxY = Math.max(...selected.map(en => en.y + en.h));
    
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    
    selected.forEach(en => {
        if (alignmentType === 'left') {
            en.x = minX;
        } else if (alignmentType === 'centerX') {
            en.x = cx - en.w / 2;
        } else if (alignmentType === 'right') {
            en.x = maxX - en.w;
        } else if (alignmentType === 'top') {
            en.y = minY;
        } else if (alignmentType === 'centerY') {
            en.y = cy - en.h / 2;
        } else if (alignmentType === 'bottom') {
            en.y = maxY - en.h;
        }
        
        // Ajustar al grid
        if (state.snapToGrid) {
            en.x = Math.round(en.x / sx) * sx;
            en.y = Math.round(en.y / sy) * sy;
        }
    });
    updateJSON();
}

export function distributeSelection(direction) {
    const selected = state.entities.filter(en => state.selectedIds.includes(en.id));
    if (selected.length < 3) {
        showOSD('DISTRIBUCIÓN', 'Selecciona al menos 3 objetos', '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>');
        return;
    }
    
    const sx = state.gridSizeX;
    const sy = state.gridSizeY;
    
    if (direction === 'horizontal') {
        const sorted = [...selected].sort((a, b) => a.x - b.x);
        const N = sorted.length;
        const L_right = sorted[0].x + sorted[0].w;
        const R_left = sorted[N - 1].x;
        const middleW = sorted.slice(1, N - 1).reduce((sum, en) => sum + en.w, 0);
        const Span = R_left - L_right;
        const G = (Span - middleW) / (N - 1);
        
        for (let i = 1; i < N - 1; i++) {
            sorted[i].x = sorted[i - 1].x + sorted[i - 1].w + G;
            if (state.snapToGrid) {
                sorted[i].x = Math.round(sorted[i].x / sx) * sx;
            }
        }
    } else if (direction === 'vertical') {
        const sorted = [...selected].sort((a, b) => a.y - b.y);
        const N = sorted.length;
        const T_bottom = sorted[0].y + sorted[0].h;
        const B_top = sorted[N - 1].y;
        const middleH = sorted.slice(1, N - 1).reduce((sum, en) => sum + en.h, 0);
        const Span = B_top - T_bottom;
        const G = (Span - middleH) / (N - 1);
        
        for (let i = 1; i < N - 1; i++) {
            sorted[i].y = sorted[i - 1].y + sorted[i - 1].h + G;
            if (state.snapToGrid) {
                sorted[i].y = Math.round(sorted[i].y / sy) * sy;
            }
        }
    }
    updateJSON();
}



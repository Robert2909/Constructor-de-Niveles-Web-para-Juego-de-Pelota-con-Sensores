import { state } from '../state.js';

export function getCanvasCoords(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left);
    const y = (e.clientY - rect.top);

    return {
        x: (x - state.view.offsetX) / (state.view.zoom * state.view.baseZoom),
        y: (y - state.view.offsetY) / (state.view.zoom * state.view.baseZoom)
    };
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
        { div: 5, color: 'rgba(168, 85, 247, 0.7)', base: 5 }, // Morado
        { div: 7, color: 'rgba(146, 64, 14, 0.7)', base: 7 }   // Café
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

import { state, saveState } from './state.js';
import { getCanvasCoords, updateProperties, updateJSON, centerLevel, optimizeEntities, updateSelectionStats, checkSmartGuides } from './utils.js';
import { BASE_WIDTH, BASE_HEIGHT } from './constants.js';
import { Entity } from './entities.js';

export function initInputHandlers(canvas, renderFunc) {
    const ctx = canvas.getContext('2d');
    
    // Variable para rastrear si se pintó algo en este trazo
    let didBrushPaint = false;

    canvas.addEventListener('mousedown', (e) => {
        const coords = getCanvasCoords(e, canvas);
        didBrushPaint = false;
        
        if (e.button === 1) { // Click central (Pan)
            state.isPanning = true;
            state.panStart = { x: e.clientX, y: e.clientY };
            return;
        }

        // 0. Revisar manejadores de redimensionamiento (si hay algo seleccionado)
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

        // 1. SIEMPRE intentar seleccionar si clicamos una entidad (independiente de la herramienta)
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
            // 2. Si no clicamos nada, decidimos qué hacer según la herramienta
            if (state.currentTool === 'select') {
                state.selectedIds = [];
                state.isSelectingArea = true;
                state.selectionBox = { x1: coords.x, y1: coords.y, x2: coords.x, y2: coords.y };
            } else {
                // Modo Construcción: Deseleccionar y empezar área o pincel
                state.selectedIds = [];
                state.isSelectingArea = true;
                state.selectionBox = { x1: coords.x, y1: coords.y, x2: coords.x, y2: coords.y };
                
                if (state.isBrushMode) {
                    saveState();
                    const sx = state.gridSizeX;
                    const sy = state.gridSizeY;
                    const px = Math.round(coords.x / sx) * sx;
                    const py = Math.round(coords.y / sy) * sy;
                    state.entities.push(new Entity(state.currentTool, px, py, sx, sy));
                    didBrushPaint = true;
                }
            }
        }
        updateProperties();
        renderFunc();
    });

    window.addEventListener('mousemove', (e) => {
        const coords = getCanvasCoords(e, canvas);

        if (state.isPanning) {
            state.view.offsetX += (e.clientX - state.panStart.x);
            state.view.offsetY += (e.clientY - state.panStart.y);
            state.panStart = { x: e.clientX, y: e.clientY };
            renderFunc();
            return;
        }

        if (state.isSelectingArea) {
            if (state.isBrushMode && state.currentTool !== 'select') {
                // MODO PINCEL
                const sx = state.gridSizeX;
                const sy = state.gridSizeY;
                const px = Math.round(coords.x / sx) * sx;
                const py = Math.round(coords.y / sy) * sy;
                
                // Evitar duplicados en el mismo punto para el mismo tipo
                const exists = state.entities.find(en => 
                    en.x === px && en.y === py && en.w === sx && en.h === sy && en.type === state.currentTool
                );
                
                if (!exists) {
                    state.entities.push(new Entity(state.currentTool, px, py, sx, sy));
                    didBrushPaint = true;
                }
            } else {
                // MODO ÁREA
                state.selectionBox.x2 = coords.x;
                state.selectionBox.y2 = coords.y;
                
                if (state.currentTool !== 'select') {
                    const sx = state.snapToGrid ? state.gridSizeX : 1;
                    const sy = state.snapToGrid ? state.gridSizeY : 1;
                    const x = Math.min(state.selectionBox.x1, state.selectionBox.x2);
                    const y = Math.min(state.selectionBox.y1, state.selectionBox.y2);
                    const w = Math.abs(state.selectionBox.x2 - state.selectionBox.x1);
                    const h = Math.abs(state.selectionBox.y2 - state.selectionBox.y1);
                    
                    const rect = {
                        x: Math.round(x / sx) * sx,
                        y: Math.round(y / sy) * sy,
                        w: Math.round(w / sx) * sx,
                        h: Math.round(h / sy) * sy
                    };
                    const snapped = checkSmartGuides(rect);
                    state.tempRect = { ...rect, x: snapped.x, y: snapped.y };
                    updateSelectionStats();
                }
            }
            renderFunc();
        }
        // ... (resto de mousemove igual)

        if (state.isDragging) {
            const dx = coords.x - state.dragStart.x;
            const dy = coords.y - state.dragStart.y;
            const sx = state.snapToGrid ? state.gridSizeX : 1;
            const sy = state.snapToGrid ? state.gridSizeY : 1;
            
            const stepX = Math.round(dx / sx) * sx;
            const stepY = Math.round(dy / sy) * sy;

            if (stepX !== 0 || stepY !== 0) {
                const selected = state.entities.filter(en => state.selectedIds.includes(en.id));
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
                    // Calcular bounding box del grupo para las guías y magnetismo
                    const groupRect = {
                        x: minX, y: minY,
                        w: maxX - minX, h: maxY - minY
                    };
                    const snapped = checkSmartGuides(groupRect);
                    
                    // Aplicar el desfase del magnetismo a todas las entidades del grupo
                    const offsetX = snapped.x - minX;
                    const offsetY = snapped.y - minY;

                    newPositions.forEach(pos => {
                        const en = selected.find(e => e.id === pos.id);
                        en.x = pos.x + offsetX;
                        en.y = pos.y + offsetY;
                    });

                    state.dragStart = coords;
                }
            }
            updateSelectionStats();
            renderFunc();
        }

        if (state.isResizing && state.selectedIds.length === 1) {
            const en = state.entities.find(e => e.id === state.selectedIds[0]);
            const sx = state.gridSizeX;
            const sy = state.gridSizeY;
            const cx = Math.round(coords.x / sx) * sx;
            const cy = Math.round(coords.y / sy) * sy;

            // Guardar bordes opuestos antes de modificar
            const right = en.x + en.w;
            const bottom = en.y + en.h;

            if (state.resizeHandle.includes('e')) en.w = Math.max(sx, Math.round((cx - en.x) / sx) * sx);
            if (state.resizeHandle.includes('s')) en.h = Math.max(sy, Math.round((cy - en.y) / sy) * sy);
            
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

            // Aplicar Magnetismo (Snap to Guides)
            const snapped = checkSmartGuides(en);
            
            // Ajustar según el tirador activo para no deformar o mover el lado equivocado
            if (state.resizeHandle.includes('w')) {
                en.x = snapped.x;
                en.w = right - en.x;
            } else if (state.resizeHandle.includes('e')) {
                // Para el borde derecho, checkSmartGuides devuelve un snapped.x que haría que el borde derecho toque la guía
                // si es que el borde derecho fue el que activó la guía.
                // Sin embargo, para redimensionar el ancho, necesitamos calcular el nuevo ancho.
                // f(x) = guidePos - en.x
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
            renderFunc();
        }
        
        // Info de coordenadas
        const info = document.getElementById('coordInfo');
        if (info) info.textContent = `X: ${Math.round(coords.x)}, Y: ${Math.round(coords.y)}`;

        // DETECCIÓN DE CURSOR PARA REDIMENSIONAMIENTO
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
                canvas.style.cursor = cursorMap[overHandle.type];
            } else {
                canvas.style.cursor = 'crosshair';
            }
        }
    });

    window.addEventListener('mouseup', (e) => {
        if (state.isSelectingArea) {
            if (state.currentTool === 'select') {
                const r = {
                    x: Math.min(state.selectionBox.x1, state.selectionBox.x2),
                    y: Math.min(state.selectionBox.y1, state.selectionBox.y2),
                    w: Math.abs(state.selectionBox.x2 - state.selectionBox.x1),
                    h: Math.abs(state.selectionBox.y2 - state.selectionBox.y1)
                };

                const isMultiSelect = e.ctrlKey || e.shiftKey;
                const newSelections = [];

                state.entities.forEach(en => {
                    // CONDICIÓN ESTRICTA: Contenido al 100%
                    const isContained = en.x >= r.x && 
                                      en.x + en.w <= r.x + r.w && 
                                      en.y >= r.y && 
                                      en.y + en.h <= r.y + r.h;
                    
                    if (isContained) {
                        newSelections.push(en.id);
                    }
                });

                if (isMultiSelect) {
                    state.selectedIds = [...new Set([...state.selectedIds, ...newSelections])];
                } else {
                    state.selectedIds = newSelections;
                }
            } else if (state.tempRect && state.tempRect.w > 0 && state.tempRect.h > 0) {
                saveState();
                let { x, y, w, h } = state.tempRect;
                
                // INICIO Y META: Siempre de un solo bloque (tamaño grid)
                if (state.currentTool === 'start' || state.currentTool === 'goal') {
                    w = state.gridSizeX;
                    h = state.gridSizeY;
                }
                
                state.entities.push(new Entity(state.currentTool, x, y, w, h));
            }
        }
        
        if (didBrushPaint) {
            optimizeEntities();
        }
        
        state.isDragging = false;
        state.isResizing = false;
        state.isSelectingArea = false;
        state.isPanning = false;
        state.tempRect = null;
        state.activeGuides = { x: [], y: [] }; // Limpiar guías
        updateProperties();
        updateJSON();
        renderFunc();
    });

    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const coords = getCanvasCoords(e, canvas);
        const oldZoom = state.view.zoom;
        
        if (e.ctrlKey) {
            // ZOOM HACIA EL CURSOR
            const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
            state.view.zoom = Math.min(Math.max(state.view.zoom * zoomFactor, 0.1), 5.0);
            
            // Re-calcular offsets para mantener el cursor en el mismo sitio
            state.view.offsetX -= coords.x * (state.view.zoom - oldZoom);
            state.view.offsetY -= coords.y * (state.view.zoom - oldZoom);
            
            const label = document.getElementById('zoomLabel');
            if (label) label.textContent = `Zoom: ${Math.round(state.view.zoom * 100)}%`;
        } else if (e.shiftKey) {
            state.view.offsetX -= e.deltaY * 0.5;
        } else {
            state.view.offsetY -= e.deltaY * 0.5;
        }
        renderFunc();
    }, { passive: false });
}

export function initKeyboardHandlers(renderFunc) {
    window.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

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
                updateJSON(); renderFunc();
            }
        }
        // Ctrl + S: Alternar Snap
        if (e.ctrlKey && e.key.toLowerCase() === 's') {
            e.preventDefault();
            state.snapToGrid = !state.snapToGrid;
            
            // Sincronizar visualmente usando el nuevo data-action
            document.querySelectorAll('[data-action="snap"]').forEach(btn => {
                const isBtnOn = btn.id === 'snapOn';
                btn.classList.toggle('active', isBtnOn === state.snapToGrid);
            });
            
            renderFunc();
            return;
        }

        // Ctrl + D: Alternar entre Modo Bloque (Áreas) y Modo Pincel (Dibujo/Pintura)
        if (e.ctrlKey && e.key.toLowerCase() === 'd') {
            e.preventDefault();
            
            // 1. Cambiar el modo de dibujo, NO la herramienta
            state.isBrushMode = !state.isBrushMode;
            
            // 2. Sincronizar visualmente los botones de modo superior
            const currentMode = state.isBrushMode ? 'brush' : 'block';
            document.querySelectorAll('[data-mode]').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.mode === currentMode);
            });
            
            renderFunc();
            return;
        }
    });
}

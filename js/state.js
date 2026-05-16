export const state = {
    entities: [],
    selectedIds: [],
    currentTool: 'wall',
    
    // Cámara
    view: {
        zoom: 1.0,
        offsetX: 0,
        offsetY: 0
    },
    
    // Interacción
    isDragging: false,
    isResizing: false,
    isSelectingArea: false,
    isPanning: false,
    dragStart: { x: 0, y: 0 },
    panStart: { x: 0, y: 0 },
    selectionBox: { x1: 0, y1: 0, x2: 0, y2: 0 },
    resizeHandle: null,
    tempRect: null,
    
    // Configuración del Mundo Fijo (Aspect Ratio Estándar)
    width: 800,
    height: 480,
    cols: 40,
    rows: 24,
    
    // El tamaño de rejilla ahora es calculado
    get gridSizeX() { return this.width / this.cols; },
    get gridSizeY() { return this.height / this.rows; },
    
    // Opciones
    snapToGrid: true,
    isBrushMode: false,
    
    // Historial y Clipboard
    undoStack: [],
    redoStack: [],
    clipboard: []
};

export function saveState() {
    state.undoStack.push(JSON.stringify(state.entities));
    state.redoStack = [];
    if (state.undoStack.length > 50) state.undoStack.shift();
}

// Nota: Las funciones de undo/redo se conectarán en el main para evitar referencias circulares
// o se exportarán si son puras.

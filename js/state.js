export const state = {
    entities: [],
    selectedIds: [],
    currentTool: 'wall',
    
    // Cámara
    view: {
        zoom: 1.0,
        baseZoom: 1.0, // El zoom que hace que el mapa quepa perfecto
        offsetX: 0,
        offsetY: 0
    },
    
    // Interacción
    isDragging: false,
    isResizing: false,
    isSelectingArea: false,
    isPanning: false,
    isScaling: false,
    dragStart: { x: 0, y: 0 },
    panStart: { x: 0, y: 0 },
    selectionBox: { x1: 0, y1: 0, x2: 0, y2: 0 },
    resizeHandle: null,
    tempRect: null,
    activeGuides: { x: [], y: [] }, // Guías de alineación activas
    lastInteractionPos: { x: 0, y: 0 }, // Para posicionar etiquetas guía
    lastSelectionKey: '', // Para rastrear cambios en la selección
    
    // Configuración del Mundo Fijo (Full HD Standard)
    width: 1920,
    height: 1080,
    cols: 96,
    rows: 54,
    
    // El tamaño de rejilla ahora es calculado
    get gridSizeX() { return this.width / this.cols; },
    get gridSizeY() { return this.height / this.rows; },
    
    // Opciones
    snapToGrid: true,
    isBrushMode: false,
    rulerFamilies: {
        2: true,
        3: true,
        5: true,
        7: true
    },
    
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

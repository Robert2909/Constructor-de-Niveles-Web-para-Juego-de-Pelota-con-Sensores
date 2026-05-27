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
    clipboard: [],

    // Base de datos de Temas centralizada (con fallbacks locales para modo sin servidor)
    themes: {
        industrial: {
            bgColor: "#121212",
            wall: "#333333",
            hazard: "#E57373",
            goal: "#81C784",
            ball: "#FFFFFF",
            trail: "#44FFFFFF",
            start: "#FFFFFF",
            blob1: "#1A1A1A",
            blob2: "#161616",
            blob3: "#151515",
            checkpoint: "#64B5F6",
            switch: "#FFD54F",
            gate: "#90A4AE",
            boxColor: "#FFB74D",
            boxBg: "#2A2015",
            logicGateColor: "#9575CD",
            logicGateBg: "#1E1A2A"
        },
        volcano: {
            bgColor: "#1A0905",
            wall: "#2C1610",
            hazard: "#FF5722",
            goal: "#FFE082",
            ball: "#FFEB3B",
            trail: "#33FF5722",
            start: "#FFEB3B",
            blob1: "#2E110A",
            blob2: "#230C07",
            blob3: "#1F0804",
            checkpoint: "#00E676",
            switch: "#FFEB3B",
            gate: "#A1887F",
            boxColor: "#FF7043",
            boxBg: "#21100B",
            logicGateColor: "#AB47BC",
            logicGateBg: "#1D0A1C"
        },
        neon: {
            bgColor: "#0A0915",
            wall: "#1B1947",
            hazard: "#FF007F",
            goal: "#00FF66",
            ball: "#00F2FF",
            trail: "#3300F2FF",
            start: "#00F2FF",
            blob1: "#15112E",
            blob2: "#0B1D2A",
            blob3: "#1E0920",
            checkpoint: "#E040FB",
            switch: "#FFFF00",
            gate: "#3D5AFE",
            boxColor: "#00F2FF",
            boxBg: "#08162B",
            logicGateColor: "#E040FB",
            logicGateBg: "#180826"
        },
        forest: {
            bgColor: "#0D1611",
            wall: "#243328",
            hazard: "#8D6E63",
            goal: "#AED581",
            ball: "#E8F5E9",
            trail: "#22E8F5E9",
            start: "#E8F5E9",
            blob1: "#13231B",
            blob2: "#171F14",
            blob3: "#0A1D13",
            checkpoint: "#4DB6AC",
            switch: "#FFB74D",
            gate: "#795548",
            boxColor: "#8D6E63",
            boxBg: "#211510",
            logicGateColor: "#26A69A",
            logicGateBg: "#0B1E1B"
        }
    }
};

export function saveState() {
    state.undoStack.push(JSON.stringify(state.entities));
    state.redoStack = [];
    if (state.undoStack.length > 50) state.undoStack.shift();
    
    // Auto-save
    try {
        localStorage.setItem('levelEditorAutoSave', JSON.stringify(state.entities));
    } catch(e) {}
}

// Nota: Las funciones de undo/redo se conectarán en el main para evitar referencias circulares
// o se exportarán si son puras.

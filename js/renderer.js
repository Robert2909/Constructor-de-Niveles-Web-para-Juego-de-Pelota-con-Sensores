import { state } from './state.js';
import { BASE_WIDTH, BASE_HEIGHT, COLORS } from './constants.js';

export function render(canvas, ctx) {
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const totalZoom = state.view.zoom * state.view.baseZoom;

    ctx.save();
    ctx.translate(state.view.offsetX, state.view.offsetY);
    ctx.scale(totalZoom, totalZoom);

    // 1. Fondo del Nivel (Límites reales)
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, state.width, state.height);

    // 2. Rejilla
    drawGrid(ctx, totalZoom);

    // 3. Entidades
    state.entities.forEach(en => {
        en.draw(ctx);

        // Indicador de selección
        if (state.selectedIds.includes(en.id)) {
            ctx.strokeStyle = COLORS.selectionBorder;
            ctx.lineWidth = 2 / totalZoom;
            ctx.strokeRect(en.x, en.y, en.w, en.h);

            // Dibujar 8 manejadores de redimensionamiento
            drawResizeHandles(ctx, en, totalZoom);
        }
    });

    // 4. Caja de selección de área (SOLO en modo selección)
    if (state.isSelectingArea && state.currentTool === 'select') {
        ctx.fillStyle = COLORS.selection;
        ctx.strokeStyle = COLORS.selectionBorder;
        ctx.lineWidth = 1 / totalZoom;
        const { x1, y1, x2, y2 } = state.selectionBox;
        ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
    }

    // 5. Rectángulo temporal (Construcción Fiel)
    if (state.tempRect && state.currentTool !== 'select') {
        const toolColor = COLORS[state.currentTool] || '#ffffff';
        ctx.fillStyle = toolColor;
        ctx.globalAlpha = 0.4; // Transparencia para el preview
        ctx.fillRect(state.tempRect.x, state.tempRect.y, state.tempRect.w, state.tempRect.h);

        // Borde del preview
        ctx.strokeStyle = toolColor;
        ctx.lineWidth = 2 / totalZoom;
        ctx.globalAlpha = 0.8;
        ctx.strokeRect(state.tempRect.x, state.tempRect.y, state.tempRect.w, state.tempRect.h);

        ctx.globalAlpha = 1.0; // Resetear transparencia
    }

    // 6. Guías de alineación inteligentes (Smart Guides)
    state.activeGuides.x.forEach(guide => {
        ctx.strokeStyle = guide.color;
        ctx.lineWidth = 1 / totalZoom;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(guide.pos, 0);
        ctx.lineTo(guide.pos, state.height);
        ctx.stroke();
        ctx.setLineDash([]);

        // Dibujar etiqueta de fracción cerca de la interacción
        ctx.fillStyle = guide.color;
        ctx.font = `bold ${14 / totalZoom}px Outfit`;
        // Posicionar Y cerca del cursor pero con un offset
        const labelY = state.lastInteractionPos.y - (30 / totalZoom);
        ctx.fillText(guide.label, guide.pos + (5 / totalZoom), labelY);
    });

    state.activeGuides.y.forEach(guide => {
        ctx.strokeStyle = guide.color;
        ctx.lineWidth = 1 / totalZoom;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(0, guide.pos);
        ctx.lineTo(state.width, guide.pos);
        ctx.stroke();
        ctx.setLineDash([]);

        // Dibujar etiqueta de fracción cerca de la interacción
        ctx.fillStyle = guide.color;
        ctx.font = `bold ${14 / totalZoom}px Outfit`;
        // Posicionar X cerca del cursor
        const labelX = state.lastInteractionPos.x + (20 / totalZoom);
        ctx.fillText(guide.label, labelX, guide.pos - (5 / totalZoom));
    });

    ctx.restore();

    // 6. Límites visuales del canvas (Overlay de zona muerta)
    // (Opcional, pero ayuda a ver dónde termina el nivel real)
}

function drawGrid(ctx, totalZoom) {
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 0.5 / totalZoom;
    ctx.beginPath();
    
    // Líneas Verticales (Columnas)
    for (let x = 0; x <= state.width; x += state.gridSizeX) {
        ctx.moveTo(x, 0); ctx.lineTo(x, state.height);
    }
    
    // Líneas Horizontales (Filas)
    for (let y = 0; y <= state.height; y += state.gridSizeY) {
        ctx.moveTo(0, y); ctx.lineTo(state.width, y);
    }
    
    ctx.stroke();
}

function drawResizeHandles(ctx, en, totalZoom) {
    const size = 6 / totalZoom;
    ctx.fillStyle = COLORS.selectionBorder;
    en.getHandleCoords().forEach(h => {
        ctx.fillRect(h.x - size / 2, h.y - size / 2, size, size);
    });
}

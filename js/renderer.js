import { state } from './state.js';
import { BASE_WIDTH, BASE_HEIGHT, COLORS } from './constants.js';

export function render(canvas, ctx) {
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(state.view.offsetX, state.view.offsetY);
    ctx.scale(state.view.zoom, state.view.zoom);

    // 1. Fondo del Nivel (Límites reales)
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, state.width, state.height);

    // 2. Rejilla
    drawGrid(ctx);

    // 3. Entidades
    state.entities.forEach(en => {
        en.draw(ctx);

        // Indicador de selección
        if (state.selectedIds.includes(en.id)) {
            ctx.strokeStyle = COLORS.selectionBorder;
            ctx.lineWidth = 2 / state.view.zoom;
            ctx.strokeRect(en.x, en.y, en.w, en.h);

            // Dibujar 8 manejadores de redimensionamiento
            drawResizeHandles(ctx, en);
        }
    });

    // 4. Caja de selección de área (SOLO en modo selección)
    if (state.isSelectingArea && state.currentTool === 'select') {
        ctx.fillStyle = COLORS.selection;
        ctx.strokeStyle = COLORS.selectionBorder;
        ctx.lineWidth = 1 / state.view.zoom;
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
        ctx.lineWidth = 2 / state.view.zoom;
        ctx.globalAlpha = 0.8;
        ctx.strokeRect(state.tempRect.x, state.tempRect.y, state.tempRect.w, state.tempRect.h);

        ctx.globalAlpha = 1.0; // Resetear transparencia
    }

    ctx.restore();

    // 6. Límites visuales del canvas (Overlay de zona muerta)
    // (Opcional, pero ayuda a ver dónde termina el nivel real)
}

function drawGrid(ctx) {
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 0.5 / state.view.zoom;
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

function drawResizeHandles(ctx, en) {
    const size = 6 / state.view.zoom;
    ctx.fillStyle = COLORS.selectionBorder;
    en.getHandleCoords().forEach(h => {
        ctx.fillRect(h.x - size / 2, h.y - size / 2, size, size);
    });
}

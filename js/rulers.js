import { state } from './state.js';

export function updateRulers() {
    const canvasH = document.getElementById('rulerH');
    const canvasV = document.getElementById('rulerV');
    if (!canvasH || !canvasV) return;

    const ctxH = canvasH.getContext('2d');
    const ctxV = canvasV.getContext('2d');

    // Ajustar resolución de los canvas de las reglas
    const hRect = canvasH.parentElement.getBoundingClientRect();
    const vRect = canvasV.parentElement.getBoundingClientRect();

    if (canvasH.width !== hRect.width) canvasH.width = hRect.width;
    if (canvasH.height !== hRect.height) canvasH.height = 30;
    if (canvasV.width !== 30) canvasV.width = 30;
    if (canvasV.height !== vRect.height) canvasV.height = vRect.height;

    const totalZoom = state.view.zoom * state.view.baseZoom;

    // Limpiar
    ctxH.clearRect(0, 0, canvasH.width, canvasH.height);
    ctxV.clearRect(0, 0, canvasV.width, canvasV.height);

    // Fondo sutil
    ctxH.fillStyle = '#1a1a1a';
    ctxH.fillRect(0, 0, canvasH.width, canvasH.height);
    ctxV.fillStyle = '#1a1a1a';
    ctxV.fillRect(0, 0, canvasV.width, canvasV.height);

    // Dibujar marcadores de subdivisión (2, 3, 4, 5)
    drawMarkers(ctxH, 'h', totalZoom);
    drawMarkers(ctxV, 'v', totalZoom);
}

function drawMarkers(ctx, type, zoom) {
    const isH = type === 'h';
    const totalSize = isH ? state.width : state.height;
    const offset = isH ? state.view.offsetX : state.view.offsetY;

    ctx.font = '800 10px Outfit';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Definimos las divisiones que el usuario pidió
    const divisions = [
        { div: 2, color: '#3498db' }, // Mitad
        { div: 3, color: '#2ecc71' }, // Tercios
        { div: 4, color: '#f1c40f' }, // Cuartos
        { div: 5, color: '#e74c3c' }  // Quintos
    ];

    divisions.forEach(({ div, color }) => {
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;

        for (let i = 1; i < div; i++) {
            // Evitar duplicados (ej: 2/4 es lo mismo que 1/2)
            if (div === 4 && i === 2) continue;

            const posInLevel = (totalSize / div) * i;
            const posInCanvas = posInLevel * zoom + offset;
            const fractionText = `${i}/${div}`;

            // Solo dibujar si está visible en la regla
            if (posInCanvas >= 0 && posInCanvas <= (isH ? ctx.canvas.width : ctx.canvas.height)) {
                if (isH) {
                    // Marca vertical en la regla horizontal
                    ctx.beginPath();
                    ctx.moveTo(posInCanvas, 20);
                    ctx.lineTo(posInCanvas, 30);
                    ctx.stroke();
                    ctx.fillText(fractionText, posInCanvas, 10);
                } else {
                    // Marca horizontal en la regla vertical
                    ctx.beginPath();
                    ctx.moveTo(20, posInCanvas);
                    ctx.lineTo(30, posInCanvas);
                    ctx.stroke();
                    ctx.fillText(fractionText, 10, posInCanvas);
                }
            }
        }
    });

    // Dibujar marcas de inicio y fin (0 y Max)
    ctx.fillStyle = '#888';
    ctx.strokeStyle = '#444';
    [0, totalSize].forEach(val => {
        const pos = val * zoom + offset;
        if (isH) {
            ctx.fillText(val.toString(), pos, 10);
            ctx.beginPath(); ctx.moveTo(pos, 20); ctx.lineTo(pos, 30); ctx.stroke();
        } else {
            ctx.fillText(val.toString(), 10, pos);
            ctx.beginPath(); ctx.moveTo(20, pos); ctx.lineTo(30, pos); ctx.stroke();
        }
    });
}

import { state } from './state.js';
import { showOSD } from './utils.js';

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

    // Dibujar marcadores de subdivisión
    drawMarkers(ctxH, 'h', totalZoom);
    drawMarkers(ctxV, 'v', totalZoom);
}

function gcd(a, b) {
    return b ? gcd(b, a % b) : a;
}

function drawMarkers(ctx, type, zoom) {
    const isH = type === 'h';
    const totalSize = isH ? state.width : state.height;
    const offset = isH ? state.view.offsetX : state.view.offsetY;

    ctx.font = '800 10px Outfit';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Definimos las divisiones que el usuario pidió con la paleta premium
    const divisions = [
        { div: 2, color: '#3b82f6' }, // Azul
        { div: 3, color: '#eab308' }, // Amarillo
        { div: 6, color: '#eab308' }, // Amarillo
        { div: 4, color: '#ef4444' }, // Rojo
        { div: 8, color: '#ef4444' }, // Rojo
        { div: 5, color: '#a855f7' }, // Morado
        { div: 7, color: '#92400e' }  // Café
    ];

    divisions.forEach(({ div, color }) => {
        // Encontrar familia base (2, 3, 5 o 7)
        let base = 2;
        if (div === 3 || div === 6) base = 3;
        if (div === 5) base = 5;
        if (div === 7) base = 7;

        const isEnabled = state.rulerFamilies[base];

        // Si está deshabilitado, se dibuja como un "fantasma" sutil
        ctx.fillStyle = isEnabled ? color : 'rgba(255, 255, 255, 0.12)';
        ctx.strokeStyle = isEnabled ? color : 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 1;

        for (let i = 1; i < div; i++) {
            // Evitar duplicados matemáticamente mediante el máximo común divisor (GCD)
            if (gcd(i, div) > 1) continue;

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
                    if (isEnabled) ctx.stroke();
                    ctx.fillText(fractionText, posInCanvas, 10);
                } else {
                    // Marca horizontal en la regla vertical
                    ctx.beginPath();
                    ctx.moveTo(20, posInCanvas);
                    ctx.lineTo(30, posInCanvas);
                    if (isEnabled) ctx.stroke();
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

// Inicializar clics en las reglas métricas
export function initRulerListeners(renderFunc) {
    const canvasH = document.getElementById('rulerH');
    const canvasV = document.getElementById('rulerV');
    if (!canvasH || !canvasV) return;

    const getClickBase = (isH, clickPos) => {
        const totalZoom = state.view.zoom * state.view.baseZoom;
        const totalSize = isH ? state.width : state.height;
        const offset = isH ? state.view.offsetX : state.view.offsetY;

        const divisions = [
            { div: 2, base: 2 },
            { div: 3, base: 3 },
            { div: 6, base: 3 },
            { div: 4, base: 2 },
            { div: 8, base: 2 },
            { div: 5, base: 5 },
            { div: 7, base: 7 }
        ];

        for (const { div, base } of divisions) {
            for (let i = 1; i < div; i++) {
                if (gcd(i, div) > 1) continue;

                const posInLevel = (totalSize / div) * i;
                const posInCanvas = posInLevel * totalZoom + offset;

                // Captura clics dentro de una vecindad de 16px para máxima comodidad
                if (Math.abs(clickPos - posInCanvas) <= 16) {
                    return { base, label: `${i}/${div}` };
                }
            }
        }
        return null;
    };

    const handleRulerClick = (isH, event) => {
        const rect = event.target.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;
        const clickPos = isH ? clickX : clickY;

        const clicked = getClickBase(isH, clickPos);
        if (clicked) {
            const { base, label } = clicked;
            toggleRulerFamily(base, renderFunc);
        }
    };

    canvasH.addEventListener('mousedown', (e) => handleRulerClick(true, e));
    canvasV.addEventListener('mousedown', (e) => handleRulerClick(false, e));
}

// Función compartida para alternar la familia de medidas (usada por clics y hotkeys)
export function toggleRulerFamily(base, renderFunc) {
    state.rulerFamilies[base] = !state.rulerFamilies[base];

    const isEnabled = state.rulerFamilies[base];
    const statusText = isEnabled ? 'ACTIVADA' : 'DESACTIVADA';
    const subtitle = `Familia del ${base} (${statusText.toLowerCase()})`;

    let icon = '';
    if (base === 2) {
        icon = '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/></svg>';
    } else if (base === 3) {
        icon = '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#eab308" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>';
    } else if (base === 5) {
        icon = '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
    } else if (base === 7) {
        icon = '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#92400e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l7.8 3.76 2.57 8.3-4.5 7.44h-7.74l-4.5-7.44 2.57-8.3z"/></svg>';
    }

    showOSD('REGLA MÉTRICA', subtitle, icon);
    updateRulers();
    renderFunc();
}

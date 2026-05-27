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
    const themeInput = document.getElementById('themeInput');
    const selectedTheme = themeInput ? themeInput.value : 'industrial';
    const activeTheme = state.themes[selectedTheme] || state.themes.industrial;
    ctx.fillStyle = activeTheme.bgColor;
    ctx.fillRect(0, 0, state.width, state.height);

    // 2. Rejilla
    drawGrid(ctx, totalZoom);

    // 2.5. Conexiones Lógicas de linkId (Cables de señales fluidas)
    drawLogicalConnections(ctx, totalZoom);
    drawPortalConnections(ctx, totalZoom);

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

function routeBezier(t, r, totalZoom, channelHash) {
    const mx = (t.x + r.x) / 2;
    const my = (t.y + r.y) / 2;
    const dx = r.x - t.x;
    const dy = r.y - t.y;
    const len = Math.sqrt(dx * dx + dy * dy);

    if (len <= 20) {
        return { cx: mx, cy: my, isStraight: true };
    }

    const perpX = -dy / len;
    const perpY = dx / len;

    // Distribución natural de canales paralelos para evitar encimamiento perfecto
    const channelSpread = ((channelHash % 5) - 2) * 15; // spreads to -30, -15, 0, 15, 30

    // Opciones de curvatura probadas en orden de preferencia (menor arco primero)
    const archOptions = [
        0 + channelSpread,
        40 + channelSpread,
        -40 + channelSpread,
        80 + channelSpread,
        -80 + channelSpread,
        120 + channelSpread,
        -120 + channelSpread
    ];

    let bestArch = archOptions[0];
    let minIntersections = Infinity;

    for (let arch of archOptions) {
        const cx = mx + perpX * arch;
        const cy = my + perpY * arch;

        // Evaluar colisiones muestreando 4 puntos a lo largo de la curva
        let intersections = 0;
        const samples = [0.2, 0.4, 0.6, 0.8];
        
        for (let sVal of samples) {
            const px = (1 - sVal) * (1 - sVal) * t.x + 2 * (1 - sVal) * sVal * cx + sVal * sVal * r.x;
            const py = (1 - sVal) * (1 - sVal) * t.y + 2 * (1 - sVal) * sVal * cy + sVal * sVal * r.y;

            // Comprobar colisión con otras entidades (excepto origen y destino)
            for (let en of state.entities) {
                if (en.id === t.entity.id || en.id === r.entity.id) continue;
                
                // Margen de seguridad para no chocar
                const margin = 10;
                if (px >= en.x - margin && px <= en.x + en.w + margin &&
                    py >= en.y - margin && py <= en.y + en.h + margin) {
                    intersections++;
                }
            }
        }

        if (intersections < minIntersections) {
            minIntersections = intersections;
            bestArch = arch;
            if (intersections === 0) break; // ¡Ruta óptima libre de colisiones encontrada!
        }
    }

    return {
        cx: mx + perpX * bestArch,
        cy: my + perpY * bestArch,
        isStraight: Math.abs(bestArch) < 5
    };
}

function drawLogicalConnections(ctx, totalZoom) {
    const channels = {};

    state.entities.forEach(en => {
        // --- TRANSMISORES (Salidas de Señal) ---
        let txChannel = null;
        let txX = en.x + en.w / 2;
        let txY = en.y + en.h / 2;

        if (en.type === 'switch' && en.linkId) {
            txChannel = String(en.linkId).trim();
        } else if (en.type === 'logic_gate' && en.outputLinkId) {
            txChannel = String(en.outputLinkId).trim();
            txX = en.x + en.w * 0.5;
            txY = en.y + en.h; // Pin de salida inferior
        } else if (en.type === 'timer' && en.outputLinkId) {
            txChannel = String(en.outputLinkId).trim();
            txX = en.x + en.w * 0.5;
            txY = en.y + en.h; // Salida por abajo
        }

        if (txChannel) {
            if (!channels[txChannel]) channels[txChannel] = { transmitters: [], receivers: [] };
            channels[txChannel].transmitters.push({
                id: en.id,
                x: txX,
                y: txY,
                entity: en
            });
        }

        // --- RECEPTORES (Entradas de Señal) ---
        if (en.type === 'logic_gate' && en.inputLinkIds) {
            const inputs = String(en.inputLinkIds).split(',').map(s => s.trim()).filter(Boolean);
            inputs.forEach((ch, idx) => {
                if (ch) {
                    if (!channels[ch]) channels[ch] = { transmitters: [], receivers: [] };
                    channels[ch].receivers.push({
                        id: en.id,
                        x: en.x + en.w * (inputs.length === 1 ? 0.5 : (idx === 0 ? 0.25 : 0.75)), // Pin de entrada centrado si es único
                        y: en.y,
                        entity: en
                    });
                }
            });
        } else if (en.type === 'timer' && en.linkId) {
            const ch = String(en.linkId).trim();
            if (ch) {
                if (!channels[ch]) channels[ch] = { transmitters: [], receivers: [] };
                channels[ch].receivers.push({
                    id: en.id,
                    x: en.x + en.w * 0.5,
                    y: en.y, // Entrada por arriba
                    entity: en
                });
            }
        } else {
            const isReceiver = ['gate', 'moving_wall', 'moving_hazard', 'spinning_hazard', 'boss'].includes(en.type);
            if (isReceiver && en.linkId) {
                const ch = String(en.linkId).trim();
                if (ch) {
                    if (!channels[ch]) channels[ch] = { transmitters: [], receivers: [] };
                    channels[ch].receivers.push({
                        id: en.id,
                        x: en.x + en.w / 2,
                        y: en.y + en.h / 2,
                        entity: en
                    });
                }
            }
        }
    });

    Object.keys(channels).forEach(ch => {
        const { transmitters, receivers } = channels[ch];
        if (transmitters.length === 0 && receivers.length === 0) return;

        // Generar color HSL neon altamente contrastado usando la proporción áurea (Golden Angle)
        let hash = 0;
        for (let i = 0; i < ch.length; i++) {
            hash = ch.charCodeAt(i) + ((hash << 5) - hash);
        }
        hash = Math.abs(hash);
        const hue = (hash * 137.5) % 360;
        const baseColor = `hsl(${hue}, 95%, 65%)`;

        // Determinar si algún elemento conectado a este canal está seleccionado
        const isChannelSelected = transmitters.some(t => state.selectedIds.includes(t.id)) ||
                                  receivers.some(r => state.selectedIds.includes(r.id));

        transmitters.forEach(t => {
            receivers.forEach(r => {
                // Trazar ruta inteligente con evasión de colisiones
                const route = routeBezier(t, r, totalZoom, hash);
                const cx = route.cx;
                const cy = route.cy;

                // --- 1. DIBUJAR CABLE DE FONDO (Base/Sombra del circuito) ---
                ctx.save();
                if (isChannelSelected) {
                    ctx.strokeStyle = baseColor;
                    ctx.lineWidth = 4 / totalZoom;
                    ctx.globalAlpha = 0.4;
                    ctx.shadowColor = baseColor;
                    ctx.shadowBlur = 10;
                } else {
                    ctx.strokeStyle = baseColor;
                    ctx.lineWidth = 1.5 / totalZoom;
                    ctx.globalAlpha = 0.25;
                }
                
                ctx.beginPath();
                ctx.moveTo(t.x, t.y);
                if (route.isStraight) {
                    ctx.lineTo(r.x, r.y);
                } else {
                    ctx.quadraticCurveTo(cx, cy, r.x, r.y);
                }
                ctx.stroke();
                ctx.restore();

                // --- 2. DIBUJAR CORRIENTE ELÉCTRICA DE FLUJO ---
                ctx.save();
                ctx.strokeStyle = baseColor;
                ctx.lineWidth = (isChannelSelected ? 2.5 : 1.0) / totalZoom;
                ctx.globalAlpha = isChannelSelected ? 0.95 : 0.4;
                
                // Línea punteada en movimiento continuo
                ctx.setLineDash([8 / totalZoom, 12 / totalZoom]);
                ctx.lineDashOffset = -Date.now() / 25;

                ctx.beginPath();
                ctx.moveTo(t.x, t.y);
                if (route.isStraight) {
                    ctx.lineTo(r.x, r.y);
                } else {
                    ctx.quadraticCurveTo(cx, cy, r.x, r.y);
                }
                ctx.stroke();
                ctx.restore();

                // --- 3. CHISPAS ELÉCTRICAS FLUIDAS (Se dibujan en canales seleccionados para indicar dirección) ---
                if (isChannelSelected) {
                    ctx.save();
                    ctx.fillStyle = '#FFFFFF';
                    ctx.shadowColor = baseColor;
                    ctx.shadowBlur = 6;
                    
                    const sparkCount = 3;
                    const timeOffset = (Date.now() / 1500) % 1.0;
                    
                    for (let i = 0; i < sparkCount; i++) {
                        const tVal = (timeOffset + i / sparkCount) % 1.0;
                        
                        // Ubicación de la chispa (la fórmula de Bezier cuadrática se reduce a interpolación lineal si es recta)
                        const px = (1 - tVal) * (1 - tVal) * t.x + 2 * (1 - tVal) * tVal * cx + tVal * tVal * r.x;
                        const py = (1 - tVal) * (1 - tVal) * t.y + 2 * (1 - tVal) * tVal * cy + tVal * tVal * r.y;
                        
                        ctx.beginPath();
                        ctx.arc(px, py, 3.5 / totalZoom, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    ctx.restore();
                }

                // --- 4. INDICADOR CIRCULAR EN EL RECEPTOR ---
                if (isChannelSelected) {
                    ctx.save();
                    ctx.fillStyle = baseColor;
                    ctx.beginPath();
                    ctx.arc(r.x, r.y, 4.5 / totalZoom, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            });
        });
    });
}

function drawPortalConnections(ctx, totalZoom) {
    const portals = state.entities.filter(en => en.type === 'portal');
    const portalGroups = {};

    portals.forEach(p => {
        const id = p.checkpointIndex || 0;
        if (!portalGroups[id]) portalGroups[id] = [];
        portalGroups[id].push(p);
    });

    Object.keys(portalGroups).forEach(id => {
        const list = portalGroups[id];
        if (list.length < 2) return;

        for (let i = 0; i < list.length; i++) {
            for (let j = i + 1; j < list.length; j++) {
                const p1 = list[i];
                const p2 = list[j];

                const c1x = p1.x + p1.w / 2;
                const c1y = p1.y + p1.h / 2;
                const c2x = p2.x + p2.w / 2;
                const c2y = p2.y + p2.h / 2;

                ctx.save();
                ctx.strokeStyle = 'rgba(0, 242, 254, 0.4)';
                ctx.lineWidth = 2 / totalZoom;
                ctx.setLineDash([4 / totalZoom, 6 / totalZoom]);
                ctx.lineDashOffset = Date.now() / 60;

                const isSelected = state.selectedIds.includes(p1.id) || state.selectedIds.includes(p2.id);
                if (isSelected) {
                    ctx.strokeStyle = 'rgba(0, 242, 254, 0.95)';
                    ctx.lineWidth = 3.5 / totalZoom;
                    ctx.shadowColor = '#00F2FF';
                    ctx.shadowBlur = 10;
                }

                ctx.beginPath();
                ctx.moveTo(c1x, c1y);
                ctx.lineTo(c2x, c2y);
                ctx.stroke();
                ctx.restore();
            }
        }
    });
}

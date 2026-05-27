import { state } from '../state.js';

function hexToHSL(hex) {
    hex = hex.replace('#', '');
    let r = parseInt(hex.substring(0, 2), 16) / 255;
    let g = parseInt(hex.substring(2, 4), 16) / 255;
    let b = parseInt(hex.substring(4, 6), 16) / 255;
    
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h, s, l) {
    s /= 100;
    l /= 100;
    let c = (1 - Math.abs(2 * l - 1)) * s;
    let x = c * (1 - Math.abs((h / 60) % 2 - 1));
    let m = l - c/2;
    let r = 0, g = 0, b = 0;
    
    if (0 <= h && h < 60) { r = c; g = x; b = 0; }
    else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
    else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
    else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
    else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
    else if (300 <= h && h < 360) { r = c; g = 0; b = x; }

    let rHex = Math.round((r + m) * 255).toString(16).padStart(2, '0');
    let gHex = Math.round((g + m) * 255).toString(16).padStart(2, '0');
    let bHex = Math.round((b + m) * 255).toString(16).padStart(2, '0');
    return `#${rHex}${gHex}${bHex}`;
}

function getProceduralColor(baseHex, linkId) {
    if (!linkId) return baseHex;
    let hash = 0;
    const s = String(linkId);
    for (let i = 0; i < s.length; i++) {
        hash = s.charCodeAt(i) + ((hash << 5) - hash);
    }
    hash = Math.abs(hash);
    const hsl = hexToHSL(baseHex);
    const hueShift = (hash % 12) * 30; // 12 pasos distintos de 30 grados
    hsl.h = (hsl.h + hueShift) % 360;
    return hslToHex(hsl.h, hsl.s, hsl.l);
}

export function drawEntity(entity, ctx) {
    const themeInput = document.getElementById('themeInput');
    const selectedTheme = themeInput ? themeInput.value : 'industrial';
    const activeTheme = state.themes[selectedTheme] || state.themes.industrial;

    const color = activeTheme[entity.type] || '#fff';
    
    switch (entity.type) {
        case 'start': {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(entity.x + entity.w/2, entity.y + entity.h/2, Math.min(entity.w, entity.h)/2, 0, Math.PI*2);
            ctx.fill();
            
            ctx.strokeStyle = 'rgba(255,255,255,0.8)';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            ctx.fillStyle = '#121212';
            ctx.font = 'bold 9px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('INICIO', entity.x + entity.w/2, entity.y + entity.h/2);
            break;
        }

        case 'goal': {
            const isSelected = state.selectedIds.includes(entity.id);
            const pulse = isSelected ? (0.85 + 0.15 * Math.sin(Date.now() / 200)) : 1.0;
            ctx.fillStyle = color;
            ctx.fillRect(entity.x, entity.y, entity.w, entity.h);
            
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1.5 * pulse;
            ctx.strokeRect(entity.x + 3, entity.y + 3, entity.w - 6, entity.h - 6);
            
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.font = 'bold 10px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('META', entity.x + entity.w/2, entity.y + entity.h/2);
            break;
        }

        case 'checkpoint': {
            const isSelected = state.selectedIds.includes(entity.id);
            const pulse = isSelected ? (0.8 + 0.2 * Math.sin(Date.now() / 250)) : 1.0;
            
            if (isSelected) {
                ctx.fillStyle = `rgba(100, 181, 246, ${0.4 * pulse})`;
                ctx.fillRect(entity.x, entity.y, entity.w, entity.h);
                
                ctx.strokeStyle = color;
                ctx.lineWidth = 4 * pulse;
                ctx.strokeRect(entity.x, entity.y, entity.w, entity.h);
            } else {
                ctx.fillStyle = 'rgba(100, 181, 246, 0.12)';
                ctx.fillRect(entity.x, entity.y, entity.w, entity.h);
                
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.setLineDash([4, 4]);
                ctx.strokeRect(entity.x, entity.y, entity.w, entity.h);
                ctx.setLineDash([]);
            }
            
            const cx = entity.x + entity.w/2;
            const cy = entity.y + entity.h/2;
            const labelText = '✓';
            ctx.fillStyle = isSelected ? '#fff' : color;
            ctx.font = 'bold 18px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(labelText, cx, cy);
            break;
        }

        case 'switch': {
            const switchColor = getProceduralColor(activeTheme.switch || '#FFD54F', entity.linkId);
            ctx.fillStyle = 'rgba(255,255,255,0.03)';
            ctx.fillRect(entity.x, entity.y, entity.w, entity.h);
            
            ctx.strokeStyle = switchColor;
            ctx.lineWidth = 2;
            ctx.strokeRect(entity.x, entity.y, entity.w, entity.h);
            
            ctx.fillStyle = switchColor;
            ctx.beginPath();
            ctx.arc(entity.x + entity.w/2, entity.y + entity.h/2, Math.min(entity.w, entity.h)*0.25, 0, Math.PI*2);
            ctx.fill();
            
            if (entity.linkId) {
                ctx.fillStyle = '#121212';
                ctx.font = 'bold 9px Outfit, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(entity.linkId, entity.x + entity.w/2, entity.y + entity.h/2);
            } else {
                ctx.fillStyle = '#121212';
                ctx.font = 'bold 8px Outfit, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('SW', entity.x + entity.w/2, entity.y + entity.h/2);
            }
            break;
        }

        case 'gate': {
            const gateColor = getProceduralColor(activeTheme.gate || '#90A4AE', entity.linkId);
            ctx.fillStyle = 'rgba(255,255,255,0.02)';
            ctx.fillRect(entity.x, entity.y, entity.w, entity.h);
            
            ctx.strokeStyle = gateColor;
            ctx.lineWidth = 2.5;
            ctx.strokeRect(entity.x, entity.y, entity.w, entity.h);
            
            ctx.strokeStyle = gateColor;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            const spacing = 12;
            for (let offset = -entity.h; offset < entity.w; offset += spacing) {
                const xStart = entity.x + Math.max(0, offset);
                const yStart = entity.y + Math.max(0, -offset);
                const xEnd = entity.x + Math.min(entity.w, offset + entity.h);
                const yEnd = entity.y + Math.min(entity.h, -offset + entity.w);
                if (xStart < xEnd && yStart < yEnd) {
                    ctx.moveTo(xStart, yStart);
                    ctx.lineTo(xEnd, yEnd);
                }
            }
            ctx.stroke();

            if (entity.linkId) {
                ctx.beginPath();
                ctx.arc(entity.x + entity.w/2, entity.y + entity.h/2, 9, 0, Math.PI*2);
                ctx.fillStyle = '#121212';
                ctx.fill();
                
                ctx.strokeStyle = gateColor;
                ctx.lineWidth = 1;
                ctx.stroke();
                
                ctx.fillStyle = gateColor;
                ctx.font = 'bold 10px Outfit, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(entity.linkId, entity.x + entity.w/2, entity.y + entity.h/2);
            }
            break;
        }

        case 'box': {
            const boxColor = activeTheme.boxColor || '#4FC3F7';
            const boxBg = activeTheme.boxBg || '#152238';
            
            ctx.fillStyle = boxBg;
            ctx.fillRect(entity.x, entity.y, entity.w, entity.h);
            
            ctx.strokeStyle = boxColor;
            ctx.lineWidth = 2.5;
            ctx.strokeRect(entity.x, entity.y, entity.w, entity.h);
            
            ctx.strokeStyle = boxColor;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(entity.x + 5, entity.y + 5);
            ctx.lineTo(entity.x + entity.w - 5, entity.y + entity.h - 5);
            ctx.moveTo(entity.x + entity.w - 5, entity.y + 5);
            ctx.lineTo(entity.x + 5, entity.y + entity.h - 5);
            ctx.stroke();
            
            const innerSize = Math.min(entity.w, entity.h) * 0.4;
            const cx = entity.x + entity.w / 2;
            const cy = entity.y + entity.h / 2;
            ctx.strokeStyle = boxColor;
            ctx.lineWidth = 1;
            ctx.strokeRect(cx - innerSize/2, cy - innerSize/2, innerSize, innerSize);
            break;
        }

        case 'logic_gate': {
            const gateColor = activeTheme.logicGateColor || '#9575CD';
            const gateBg = activeTheme.logicGateBg || '#1A1A1A';
            
            ctx.fillStyle = gateBg;
            ctx.fillRect(entity.x, entity.y, entity.w, entity.h);
            
            ctx.strokeStyle = gateColor;
            ctx.lineWidth = 2;
            ctx.strokeRect(entity.x, entity.y, entity.w, entity.h);
            
            const pinW = 4;
            const pinH = 6;
            
            ctx.fillStyle = '#757575';
            if (entity.gateType === 'NOT') {
                ctx.fillRect(entity.x + entity.w * 0.5 - pinW/2, entity.y - pinH/2, pinW, pinH);
            } else {
                ctx.fillRect(entity.x + entity.w * 0.25 - pinW/2, entity.y - pinH/2, pinW, pinH);
                ctx.fillRect(entity.x + entity.w * 0.75 - pinW/2, entity.y - pinH/2, pinW, pinH);
            }
            
            ctx.fillStyle = gateColor;
            ctx.fillRect(entity.x + entity.w * 0.5 - pinW/2, entity.y + entity.h - pinH/2, pinW, pinH);

            ctx.fillStyle = gateColor;
            ctx.font = 'bold 12px Outfit, monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(entity.gateType || 'AND', entity.x + entity.w/2, entity.y + entity.h/2);
            break;
        }

        case 'moving_wall': {
            const isSelected = state.selectedIds.includes(entity.id);
            let drawX = entity.x;
            let drawY = entity.y;
            
            if (isSelected) {
                const period = entity.speed || 2;
                const cycleMs = period * 1000;
                const angle = ((Date.now() % cycleMs) / cycleMs) * 2 * Math.PI;
                const factor = 0.5 - 0.5 * Math.cos(angle);
                drawX += (entity.dx || 0) * factor;
                drawY += (entity.dy || 0) * factor;
            }

            const dx = entity.dx || 0;
            const dy = entity.dy || 0;
            if (dx !== 0 || dy !== 0) {
                ctx.save();
                ctx.strokeStyle = isSelected ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.12)';
                ctx.lineWidth = isSelected ? 1.5 : 1.0;
                ctx.setLineDash([4, 4]);
                ctx.beginPath();
                ctx.moveTo(entity.x + entity.w/2, entity.y + entity.h/2);
                ctx.lineTo(entity.x + entity.w/2 + dx, entity.y + entity.h/2 + dy);
                ctx.stroke();
                
                ctx.fillStyle = isSelected ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)';
                ctx.fillRect(entity.x + dx, entity.y + dy, entity.w, entity.h);
                ctx.strokeStyle = isSelected ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.08)';
                ctx.strokeRect(entity.x + dx, entity.y + dy, entity.w, entity.h);
                ctx.restore();
            }

            const wallColor = activeTheme.wall || '#333333';
            ctx.fillStyle = wallColor;
            ctx.fillRect(drawX, drawY, entity.w, entity.h);
            
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(drawX, drawY, entity.w, entity.h);
            
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            const spacingWall = 12;
            for (let offset = -entity.h; offset < entity.w; offset += spacingWall) {
                const xStart = drawX + Math.max(0, offset);
                const yStart = drawY + Math.max(0, -offset);
                const xEnd = drawX + Math.min(entity.w, offset + entity.h);
                const yEnd = drawY + Math.min(entity.h, -offset + entity.w);
                if (xStart < xEnd && yStart < yEnd) {
                    ctx.moveTo(xStart, yStart);
                    ctx.lineTo(xEnd, yEnd);
                }
            }
            ctx.stroke();
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.font = 'bold 9px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('MURO MÓVIL', drawX + entity.w/2, drawY + entity.h/2);
            break;
        }

        case 'moving_hazard': {
            const isSelected = state.selectedIds.includes(entity.id);
            let drawX = entity.x;
            let drawY = entity.y;
            
            if (isSelected) {
                const period = entity.speed || 2;
                const cycleMs = period * 1000;
                const angle = ((Date.now() % cycleMs) / cycleMs) * 2 * Math.PI;
                const factor = 0.5 - 0.5 * Math.cos(angle);
                drawX += (entity.dx || 0) * factor;
                drawY += (entity.dy || 0) * factor;
            }

            const dx = entity.dx || 0;
            const dy = entity.dy || 0;
            if (dx !== 0 || dy !== 0) {
                ctx.save();
                ctx.strokeStyle = isSelected ? 'rgba(255, 87, 34, 0.5)' : 'rgba(255, 87, 34, 0.15)';
                ctx.lineWidth = isSelected ? 1.5 : 1.0;
                ctx.setLineDash([4, 4]);
                ctx.beginPath();
                ctx.moveTo(entity.x + entity.w/2, entity.y + entity.h/2);
                ctx.lineTo(entity.x + entity.w/2 + dx, entity.y + entity.h/2 + dy);
                ctx.stroke();
                
                ctx.fillStyle = isSelected ? 'rgba(229, 115, 115, 0.08)' : 'rgba(229, 115, 115, 0.03)';
                ctx.fillRect(entity.x + dx, entity.y + dy, entity.w, entity.h);
                ctx.strokeStyle = isSelected ? 'rgba(229, 115, 115, 0.25)' : 'rgba(229, 115, 115, 0.08)';
                ctx.strokeRect(entity.x + dx, entity.y + dy, entity.w, entity.h);
                ctx.restore();
            }

            const hazardColor = activeTheme.hazard || '#FF5722';
            ctx.fillStyle = hazardColor;
            ctx.fillRect(drawX, drawY, entity.w, entity.h);
            
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(drawX, drawY, entity.w, entity.h);
            
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            const spacingHazard = 12;
            for (let offset = -entity.h; offset < entity.w; offset += spacingHazard) {
                const xStart = drawX + Math.max(0, offset);
                const yStart = drawY + Math.max(0, -offset);
                const xEnd = drawX + Math.min(entity.w, offset + entity.h);
                const yEnd = drawY + Math.min(entity.h, -offset + entity.w);
                if (xStart < xEnd && yStart < yEnd) {
                    ctx.moveTo(xStart, yStart);
                    ctx.lineTo(xEnd, yEnd);
                }
            }
            ctx.stroke();
            
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 9px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('LAVA MÓVIL', drawX + entity.w/2, drawY + entity.h/2);
            break;
        }

        case 'spinning_hazard': {
            const isSelected = state.selectedIds.includes(entity.id);
            const hazardColor = activeTheme.hazard || '#FF5722';
            const cx = entity.x + entity.w/2;
            const cy = entity.y + entity.h/2;
            const r = Math.min(entity.w, entity.h)/2;
            
            ctx.fillStyle = hazardColor;
            ctx.beginPath();
            const teeth = 12;
            const timeAngle = isSelected ? ((Date.now() / 150) % (Math.PI * 2)) : 0;
            for (let i = 0; i < teeth * 2; i++) {
                const angle = (i / teeth) * Math.PI + timeAngle;
                const dist = (i % 2 === 0) ? r : r * 0.72;
                const tx = cx + Math.cos(angle) * dist;
                const ty = cy + Math.sin(angle) * dist;
                if (i === 0) ctx.moveTo(tx, ty);
                else ctx.lineTo(tx, ty);
            }
            ctx.closePath();
            ctx.fill();
            
            ctx.fillStyle = '#121212';
            ctx.beginPath();
            ctx.arc(cx, cy, r * 0.25, 0, Math.PI*2);
            ctx.fill();
            
            ctx.strokeStyle = 'rgba(255,255,255,0.7)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            break;
        }

        case 'wind_zone': {
            const isSelected = state.selectedIds.includes(entity.id);
            ctx.save();
            ctx.fillStyle = 'rgba(0, 229, 255, 0.08)';
            ctx.fillRect(entity.x, entity.y, entity.w, entity.h);
            
            ctx.strokeStyle = 'rgba(0, 229, 255, 0.4)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([6, 6]);
            ctx.strokeRect(entity.x, entity.y, entity.w, entity.h);
            
            const forceX = entity.dx || 0;
            const forceY = entity.dy || 0;
            const len = Math.sqrt(forceX*forceX + forceY*forceY);
            if (len > 0) {
                const dirX = forceX / len;
                const dirY = forceY / len;
                const timeOffset = isSelected ? ((Date.now() % 2000) / 2000) : 0;
                
                ctx.strokeStyle = 'rgba(0, 229, 255, 0.3)';
                ctx.lineWidth = 1.5;
                ctx.setLineDash([]);
                
                const lineCount = Math.max(3, Math.min(10, Math.floor((entity.w * entity.h) / 20000)));
                for (let k = 0; k < lineCount; k++) {
                    const seedX = (Math.floor(entity.x) * (k + 1)) % 100 / 100;
                    const seedY = (Math.floor(entity.y) * (k + 3)) % 100 / 100;
                    const startPosX = entity.x + seedX * entity.w;
                    const startPosY = entity.y + seedY * entity.h;
                    const travelDistance = 50;
                    
                    const progress = isSelected ? ((timeOffset + k / lineCount) % 1.0) : 0.5;
                    const offsetX = dirX * progress * travelDistance;
                    const offsetY = dirY * progress * travelDistance;
                    
                    const lx1 = startPosX + offsetX;
                    const ly1 = startPosY + offsetY;
                    const lx2 = lx1 + dirX * 15;
                    const ly2 = ly1 + dirY * 15;
                    
                    if (lx1 >= entity.x && lx1 <= entity.x + entity.w && ly1 >= entity.y && ly1 <= entity.y + entity.h &&
                        lx2 >= entity.x && lx2 <= entity.x + entity.w && ly2 >= entity.y && ly2 <= entity.y + entity.h) {
                        ctx.beginPath();
                        ctx.moveTo(lx1, ly1);
                        ctx.lineTo(lx2, ly2);
                        ctx.stroke();
                    }
                }
            }
            
            ctx.fillStyle = 'rgba(0, 229, 255, 0.8)';
            ctx.font = 'bold 9px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`VIENTO (${forceX}, ${forceY})`, entity.x + entity.w/2, entity.y + entity.h/2);
            ctx.restore();
            break;
        }

        case 'speed_pad': {
            const isSelected = state.selectedIds.includes(entity.id);
            ctx.save();
            ctx.fillStyle = 'rgba(255, 234, 0, 0.12)';
            ctx.fillRect(entity.x, entity.y, entity.w, entity.h);
            
            ctx.strokeStyle = 'rgba(255, 234, 0, 0.6)';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(entity.x, entity.y, entity.w, entity.h);
            
            const boostX = entity.dx || 0;
            const boostY = entity.dy || 0;
            const len = Math.sqrt(boostX*boostX + boostY*boostY);
            if (len > 0) {
                const dirX = boostX / len;
                const dirY = boostY / len;
                const perpX = -dirY;
                const perpY = dirX;
                const timeOffset = isSelected ? ((Date.now() % 1000) / 1000) : 0;
                
                ctx.strokeStyle = 'rgba(255, 234, 0, 0.5)';
                ctx.lineWidth = 2.5;
                ctx.lineCap = 'round';
                
                for (let step = 0; step < 3; step++) {
                    const progress = isSelected ? ((timeOffset + step / 3) % 1.0) : (step / 2);
                    const cx = entity.x + entity.w * 0.5 + dirX * (progress - 0.5) * entity.w * 0.7;
                    const cy = entity.y + entity.h * 0.5 + dirY * (progress - 0.5) * entity.h * 0.7;
                    const size = Math.min(entity.w, entity.h) * 0.2;
                    
                    const tipX = cx + dirX * size;
                    const tipY = cy + dirY * size;
                    const wing1X = cx - dirX * size * 0.5 + perpX * size;
                    const wing1Y = cy - dirY * size * 0.5 + perpY * size;
                    const wing2X = cx - dirX * size * 0.5 - perpX * size;
                    const wing2Y = cy - dirY * size * 0.5 - perpY * size
                     
                    if (tipX >= entity.x && tipX <= entity.x + entity.w && tipY >= entity.y && tipY <= entity.y + entity.h) {
                        ctx.beginPath();
                        ctx.moveTo(wing1X, wing1Y);
                        ctx.lineTo(tipX, tipY);
                        ctx.lineTo(wing2X, wing2Y);
                        ctx.stroke();
                    }
                }
            }
            
            ctx.fillStyle = 'rgba(255, 234, 0, 0.9)';
            ctx.font = 'bold 9px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('SPEED PAD', entity.x + entity.w/2, entity.y + entity.h - 10);
            ctx.restore();
            break;
        }

        case 'boss': {
            const isSelected = state.selectedIds.includes(entity.id);
            ctx.save();
            const cx = entity.x + entity.w/2;
            const cy = entity.y + entity.h/2;
            const rx = entity.w/2;
            const ry = entity.h/2;
            
            ctx.beginPath();
            ctx.moveTo(cx, cy - ry);
            ctx.lineTo(cx + rx, cy);
            ctx.lineTo(cx, cy + ry);
            ctx.lineTo(cx - rx, cy);
            ctx.closePath();
            
            ctx.fillStyle = '#1B1A24';
            ctx.fill();
            
            ctx.strokeStyle = '#FF1744';
            ctx.lineWidth = 3;
            ctx.stroke();
            
            const pulse = isSelected ? (0.8 + 0.2 * Math.sin(Date.now() / 150)) : 1.0;
            ctx.fillStyle = '#FF1744';
            ctx.beginPath();
            ctx.arc(cx, cy, rx * 0.3 * pulse, 0, Math.PI*2);
            ctx.fill();
            
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 9px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('JEFE/BOSS', cx, cy - ry * 0.6);
            if (entity.linkId) {
                ctx.fillStyle = '#FF8A80';
                ctx.fillText(`ID: ${entity.linkId}`, cx, cy + ry * 0.6);
            }
            ctx.restore();
            break;
        }

        case 'timer': {
            const isSelected = state.selectedIds.includes(entity.id);
            ctx.fillStyle = '#2B2B2B';
            ctx.fillRect(entity.x, entity.y, entity.w, entity.h);
            
            ctx.strokeStyle = '#FFB74D';
            ctx.lineWidth = isSelected ? 3 : 2;
            ctx.strokeRect(entity.x, entity.y, entity.w, entity.h);

            ctx.fillStyle = '#FFB74D';
            ctx.font = 'bold 9px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`TIMER (${entity.duration || 2}s)`, entity.x + entity.w/2, entity.y + 12);

            ctx.fillStyle = '#fff';
            ctx.font = '7px Outfit, sans-serif';
            if (entity.linkId) {
                ctx.fillText(`In: ${entity.linkId}`, entity.x + entity.w/2, entity.y + entity.h/2);
            }
            if (entity.outputLinkId) {
                ctx.fillText(`Out: ${entity.outputLinkId}`, entity.x + entity.w/2, entity.y + entity.h - 12);
            }
            break;
        }

        case 'portal': {
            const isSelected = state.selectedIds.includes(entity.id);
            const cx = entity.x + entity.w/2;
            const cy = entity.y + entity.h/2;
            const baseRadius = Math.min(entity.w, entity.h)/2;
            const pulse = isSelected ? (0.9 + 0.1 * Math.sin(Date.now() / 200)) : 1.0;
            const r = baseRadius * pulse;

            ctx.strokeStyle = '#4facfe';
            ctx.lineWidth = isSelected ? 4 : 2.5;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI*2);
            ctx.stroke();

            ctx.fillStyle = 'rgba(0, 242, 254, 0.18)';
            ctx.beginPath();
            ctx.arc(cx, cy, r * 0.7, 0, Math.PI*2);
            ctx.fill();

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 11px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(entity.checkpointIndex || '0', cx, cy);
            
            ctx.fillStyle = '#4facfe';
            ctx.font = 'bold 8px Outfit, sans-serif';
            ctx.fillText('PORTAL', cx, cy - r * 0.4);
            break;
        }

        default: {
            ctx.fillStyle = color;
            ctx.fillRect(entity.x, entity.y, entity.w, entity.h);
            
            ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            ctx.lineWidth = 1;
            ctx.strokeRect(entity.x, entity.y, entity.w, entity.h);
            break;
        }
    }
}

import { state } from '../../state.js';
import { getProceduralColor } from '../colorUtils.js';

export function drawGate(ctx, entity, color, activeTheme) {

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
    
}

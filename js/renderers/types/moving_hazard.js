import { state } from '../../state.js';

export function drawMovingHazard(ctx, entity, color, activeTheme) {

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
    
}

import { state } from '../../state.js';

export function drawSpeedPad(ctx, entity, color, activeTheme) {

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
    
}

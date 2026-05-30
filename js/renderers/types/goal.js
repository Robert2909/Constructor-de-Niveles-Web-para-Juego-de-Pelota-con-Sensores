import { state } from '../../state.js';

export function drawGoal(ctx, entity, color, activeTheme) {

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
    
}

import { state } from '../../state.js';

export function drawCheckpoint(ctx, entity, color, activeTheme) {

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
    
}

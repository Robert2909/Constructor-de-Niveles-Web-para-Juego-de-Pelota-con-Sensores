import { state } from '../../state.js';

export function drawTimer(ctx, entity, color, activeTheme) {

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
    
}

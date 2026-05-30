import { state } from '../../state.js';
import { getProceduralColor } from '../colorUtils.js';

export function drawSwitch(ctx, entity, color, activeTheme) {

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
    
}

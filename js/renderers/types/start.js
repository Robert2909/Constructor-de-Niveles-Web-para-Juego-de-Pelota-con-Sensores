import { state } from '../../state.js';

export function drawStart(ctx, entity, color, activeTheme) {

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
    
}

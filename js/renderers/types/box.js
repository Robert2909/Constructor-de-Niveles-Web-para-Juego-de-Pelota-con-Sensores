import { state } from '../../state.js';

export function drawBox(ctx, entity, color, activeTheme) {

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
    
}

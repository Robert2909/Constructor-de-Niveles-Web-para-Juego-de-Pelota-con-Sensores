import { state } from '../../state.js';

export function drawLogicGate(ctx, entity, color, activeTheme) {

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
    
}

import { state } from '../../state.js';

export function drawBoss(ctx, entity, color, activeTheme) {

    const isSelected = state.selectedIds.includes(entity.id);
    ctx.save();
    const cx = entity.x + entity.w/2;
    const cy = entity.y + entity.h/2;
    const rx = entity.w/2;
    const ry = entity.h/2;
    
    ctx.beginPath();
    ctx.moveTo(cx, cy - ry);
    ctx.lineTo(cx + rx, cy);
    ctx.lineTo(cx, cy + ry);
    ctx.lineTo(cx - rx, cy);
    ctx.closePath();
    
    ctx.fillStyle = '#1B1A24';
    ctx.fill();
    
    ctx.strokeStyle = '#FF1744';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    const pulse = isSelected ? (0.8 + 0.2 * Math.sin(Date.now() / 150)) : 1.0;
    ctx.fillStyle = '#FF1744';
    ctx.beginPath();
    ctx.arc(cx, cy, rx * 0.3 * pulse, 0, Math.PI*2);
    ctx.fill();
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 9px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('JEFE/BOSS', cx, cy - ry * 0.6);
    if (entity.linkId) {
        ctx.fillStyle = '#FF8A80';
        ctx.fillText(`ID: ${entity.linkId}`, cx, cy + ry * 0.6);
    }
    ctx.restore();
    
}

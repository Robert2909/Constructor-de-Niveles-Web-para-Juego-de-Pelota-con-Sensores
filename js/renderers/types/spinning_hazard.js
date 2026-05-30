import { state } from '../../state.js';

export function drawSpinningHazard(ctx, entity, color, activeTheme) {

    const isSelected = state.selectedIds.includes(entity.id);
    const hazardColor = activeTheme.hazard || '#FF5722';
    const cx = entity.x + entity.w/2;
    const cy = entity.y + entity.h/2;
    const r = Math.min(entity.w, entity.h)/2;
    
    ctx.fillStyle = hazardColor;
    ctx.beginPath();
    const teeth = 12;
    const timeAngle = isSelected ? ((Date.now() / 150) % (Math.PI * 2)) : 0;
    for (let i = 0; i < teeth * 2; i++) {
        const angle = (i / teeth) * Math.PI + timeAngle;
        const dist = (i % 2 === 0) ? r : r * 0.72;
        const tx = cx + Math.cos(angle) * dist;
        const ty = cy + Math.sin(angle) * dist;
        if (i === 0) ctx.moveTo(tx, ty);
        else ctx.lineTo(tx, ty);
    }
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#121212';
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.25, 0, Math.PI*2);
    ctx.fill();
    
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
}

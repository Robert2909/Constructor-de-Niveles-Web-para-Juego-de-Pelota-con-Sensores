import { state } from '../../state.js';

export function drawPortal(ctx, entity, color, activeTheme) {

    const isSelected = state.selectedIds.includes(entity.id);
    const cx = entity.x + entity.w/2;
    const cy = entity.y + entity.h/2;
    const baseRadius = Math.min(entity.w, entity.h)/2;
    const pulse = isSelected ? (0.9 + 0.1 * Math.sin(Date.now() / 200)) : 1.0;
    const r = baseRadius * pulse;

    ctx.strokeStyle = '#4facfe';
    ctx.lineWidth = isSelected ? 4 : 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI*2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(0, 242, 254, 0.18)';
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.7, 0, Math.PI*2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(entity.checkpointIndex || '0', cx, cy);
    
    ctx.fillStyle = '#4facfe';
    ctx.font = 'bold 8px Outfit, sans-serif';
    ctx.fillText('PORTAL', cx, cy - r * 0.4);
    
}

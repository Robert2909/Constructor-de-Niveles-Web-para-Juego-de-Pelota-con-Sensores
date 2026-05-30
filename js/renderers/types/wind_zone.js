import { state } from '../../state.js';

export function drawWindZone(ctx, entity, color, activeTheme) {

    const isSelected = state.selectedIds.includes(entity.id);
    ctx.save();
    ctx.fillStyle = 'rgba(0, 229, 255, 0.08)';
    ctx.fillRect(entity.x, entity.y, entity.w, entity.h);
    
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]);
    ctx.strokeRect(entity.x, entity.y, entity.w, entity.h);
    
    const forceX = entity.dx || 0;
    const forceY = entity.dy || 0;
    const len = Math.sqrt(forceX*forceX + forceY*forceY);
    if (len > 0) {
        const dirX = forceX / len;
        const dirY = forceY / len;
        const timeOffset = isSelected ? ((Date.now() % 2000) / 2000) : 0;
        
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([]);
        
        const lineCount = Math.max(3, Math.min(10, Math.floor((entity.w * entity.h) / 20000)));
        for (let k = 0; k < lineCount; k++) {
            const seedX = (Math.floor(entity.x) * (k + 1)) % 100 / 100;
            const seedY = (Math.floor(entity.y) * (k + 3)) % 100 / 100;
            const startPosX = entity.x + seedX * entity.w;
            const startPosY = entity.y + seedY * entity.h;
            const travelDistance = 50;
            
            const progress = isSelected ? ((timeOffset + k / lineCount) % 1.0) : 0.5;
            const offsetX = dirX * progress * travelDistance;
            const offsetY = dirY * progress * travelDistance;
            
            const lx1 = startPosX + offsetX;
            const ly1 = startPosY + offsetY;
            const lx2 = lx1 + dirX * 15;
            const ly2 = ly1 + dirY * 15;
            
            if (lx1 >= entity.x && lx1 <= entity.x + entity.w && ly1 >= entity.y && ly1 <= entity.y + entity.h &&
                lx2 >= entity.x && lx2 <= entity.x + entity.w && ly2 >= entity.y && ly2 <= entity.y + entity.h) {
                ctx.beginPath();
                ctx.moveTo(lx1, ly1);
                ctx.lineTo(lx2, ly2);
                ctx.stroke();
            }
        }
    }
    
    ctx.fillStyle = 'rgba(0, 229, 255, 0.8)';
    ctx.font = 'bold 9px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`VIENTO (${forceX}, ${forceY})`, entity.x + entity.w/2, entity.y + entity.h/2);
    ctx.restore();
    
}

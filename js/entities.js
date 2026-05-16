import { COLORS } from './constants.js';

export class Entity {
    constructor(type, x, y, w, h) {
        this.id = Date.now() + Math.random();
        this.type = type;
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }

    draw(ctx) {
        ctx.fillStyle = COLORS[this.type] || '#fff';
        ctx.fillRect(this.x, this.y, this.w, this.h);
        
        // Bordes sutiles
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x, this.y, this.w, this.h);
    }

    clone(offset = 0) {
        return new Entity(this.type, this.x + offset, this.y + offset, this.w, this.h);
    }

    getHandleCoords() {
        return [
            { x: this.x, y: this.y, type: 'nw' },
            { x: this.x + this.w/2, y: this.y, type: 'n' },
            { x: this.x + this.w, y: this.y, type: 'ne' },
            { x: this.x + this.w, y: this.y + this.h/2, type: 'e' },
            { x: this.x + this.w, y: this.y + this.h, type: 'se' },
            { x: this.x + this.w/2, y: this.y + this.h, type: 's' },
            { x: this.x, y: this.y + this.h, type: 'sw' },
            { x: this.x, y: this.y + this.h/2, type: 'w' }
        ];
    }
}

import { state } from './state.js';
import { drawEntity } from './renderers/entityRenderers.js';

export class Entity {
    constructor(type, x, y, w, h) {
        this.id = Date.now() + Math.random();
        this.type = type;
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        
        if (type === 'switch') {
            this.switchMode = 'toggle';
        }
        if (type === 'logic_gate') {
            this.gateType = 'AND';
            this.inputLinkIds = '';
            this.outputLinkId = '';
        }
        if (type === 'wind_zone') {
            this.dx = 0;
            this.dy = -1.5;
        }
        if (type === 'speed_pad') {
            this.dx = 15;
            this.dy = 0;
        }
        if (type === 'boss') {
            this.linkId = '';
            this.bossType = 'scatter';
            this.health = 5;
            this.phases = 2;
            this.speed = 150;
            this.attackDensity = 3;
            this.attackFrequency = 2.0;
            this.specialAttackFrequency = 3;
        }
        if (type === 'timer') {
            this.linkId = '';
            this.outputLinkId = '';
            this.duration = 2.0;
        }
        if (type === 'portal') {
            this.checkpointIndex = 1;
        }
    }

    draw(ctx) {
        drawEntity(this, ctx);
    }

    clone(offset = 0) {
        const c = new Entity(this.type, this.x + offset, this.y + offset, this.w, this.h);
        for (const key in this) {
            if (['type', 'x', 'y', 'w', 'h', 'id'].includes(key)) continue;
            c[key] = this[key];
        }
        return c;
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

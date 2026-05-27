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
        if (this.checkpointIndex !== undefined) c.checkpointIndex = this.checkpointIndex;
        if (this.linkId !== undefined) c.linkId = this.linkId;
        if (this.duration !== undefined) c.duration = this.duration;
        if (this.dx !== undefined) c.dx = this.dx;
        if (this.dy !== undefined) c.dy = this.dy;
        if (this.speed !== undefined) c.speed = this.speed;
        if (this.switchMode !== undefined) c.switchMode = this.switchMode;
        if (this.gateType !== undefined) c.gateType = this.gateType;
        if (this.inputLinkIds !== undefined) c.inputLinkIds = this.inputLinkIds;
        if (this.outputLinkId !== undefined) c.outputLinkId = this.outputLinkId;
        if (this.bossType !== undefined) c.bossType = this.bossType;
        if (this.health !== undefined) c.health = this.health;
        if (this.phases !== undefined) c.phases = this.phases;
        if (this.attackDensity !== undefined) c.attackDensity = this.attackDensity;
        if (this.attackFrequency !== undefined) c.attackFrequency = this.attackFrequency;
        if (this.specialAttackFrequency !== undefined) c.specialAttackFrequency = this.specialAttackFrequency;
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

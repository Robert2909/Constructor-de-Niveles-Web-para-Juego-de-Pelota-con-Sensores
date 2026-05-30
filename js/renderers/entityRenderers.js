import { state } from '../state.js';
import { drawStart } from './types/start.js';
import { drawGoal } from './types/goal.js';
import { drawCheckpoint } from './types/checkpoint.js';
import { drawSwitch } from './types/switch.js';
import { drawGate } from './types/gate.js';
import { drawBox } from './types/box.js';
import { drawLogicGate } from './types/logic_gate.js';
import { drawMovingWall } from './types/moving_wall.js';
import { drawMovingHazard } from './types/moving_hazard.js';
import { drawSpinningHazard } from './types/spinning_hazard.js';
import { drawWindZone } from './types/wind_zone.js';
import { drawSpeedPad } from './types/speed_pad.js';
import { drawBoss } from './types/boss.js';
import { drawTimer } from './types/timer.js';
import { drawPortal } from './types/portal.js';

const renderers = {
    'start': drawStart,
    'goal': drawGoal,
    'checkpoint': drawCheckpoint,
    'switch': drawSwitch,
    'gate': drawGate,
    'box': drawBox,
    'logic_gate': drawLogicGate,
    'moving_wall': drawMovingWall,
    'moving_hazard': drawMovingHazard,
    'spinning_hazard': drawSpinningHazard,
    'wind_zone': drawWindZone,
    'speed_pad': drawSpeedPad,
    'boss': drawBoss,
    'timer': drawTimer,
    'portal': drawPortal,
};

export function drawEntity(entity, ctx) {
    const themeInput = document.getElementById('themeInput');
    const selectedTheme = themeInput ? themeInput.value : 'industrial';
    const activeTheme = state.themes[selectedTheme] || state.themes.industrial;

    const color = activeTheme[entity.type] || '#fff';
    
    if (renderers[entity.type]) {
        renderers[entity.type](ctx, entity, color, activeTheme);
    } else {
        ctx.fillStyle = color;
        ctx.fillRect(entity.x, entity.y, entity.w, entity.h);
        
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        ctx.strokeRect(entity.x, entity.y, entity.w, entity.h);
    }
}

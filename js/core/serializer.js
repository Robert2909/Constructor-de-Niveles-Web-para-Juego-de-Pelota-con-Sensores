import { state } from '../state.js';
import { BASE_WIDTH, BASE_HEIGHT } from '../constants.js';

export function updateJSON() {
    // Obsoleto: ya no hay panel de JSON en la interfaz
}

export function getLevelJSON() {
    const levelInput = document.getElementById('levelIdInput');
    const themeInput = document.getElementById('themeInput');
    const data = {
        levelId: levelInput ? (parseInt(levelInput.value) || 1) : 1,
        theme: themeInput ? themeInput.value : 'industrial',
        width: state.width,
        height: state.height,
        gridCols: state.cols,
        gridRows: state.rows,
        entities: state.entities.map(en => {
            const out = {
                type: en.type,
                x: Math.round(en.x),
                y: Math.round(en.y),
                w: Math.round(en.w),
                h: Math.round(en.h)
            };
            
            // Exportar dinámicamente cualquier propiedad extra (Evita tener que hardcodearlas)
            for (const key in en) {
                if (['type', 'x', 'y', 'w', 'h', 'id'].includes(key)) continue;
                if (en[key] === undefined || en[key] === null || en[key] === '') continue; // Omitir vacíos
                out[key] = en[key];
            }
            
            // Compatibilidad con portalId en exportación
            if (out.checkpointIndex !== undefined && out.type === 'portal') {
                out.portalId = out.checkpointIndex;
                delete out.checkpointIndex;
            }
            
            return out;
        })
    };
    return JSON.stringify(data, null, 4);
}


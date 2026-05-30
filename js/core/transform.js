import { state, saveState } from '../state.js';
import { updateProperties, updateJSON, updateSelectionStats } from '../utils.js';
import { Entity } from '../entities.js';

export function transformSelection(action) {
    if (state.selectedIds.length === 0) return;

    const selected = state.entities.filter(en => state.selectedIds.includes(en.id));
    const sx = state.gridSizeX;
    const sy = state.gridSizeY;

    // 1. Calcular Bounding Box del grupo
    const minX = Math.min(...selected.map(en => en.x));
    const minY = Math.min(...selected.map(en => en.y));
    const maxX = Math.max(...selected.map(en => en.x + en.w));
    const maxY = Math.max(...selected.map(en => en.y + en.h));

    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    selected.forEach(en => {
        if (action === 'mirrorH') {
            const dist = en.x + en.w / 2 - cx;
            en.x = cx - dist - en.w / 2;
        } else if (action === 'mirrorV') {
            const dist = en.y + en.h / 2 - cy;
            en.y = cy - dist - en.h / 2;
        } else if (action === 'rotateR' || action === 'rotateL') {
            const dir = action === 'rotateR' ? 1 : -1;
            const rx = en.x + en.w / 2 - cx;
            const ry = en.y + en.h / 2 - cy;

            const nx = -ry * dir;
            const ny = rx * dir;

            const oldW = en.w;
            en.w = en.h;
            en.h = oldW;

            en.x = cx + nx - en.w / 2;
            en.y = cy + ny - en.h / 2;
        }

        // Ajuste fino al grid tras transformación
        if (state.snapToGrid) {
            en.x = Math.round(en.x / sx) * sx;
            en.y = Math.round(en.y / sy) * sy;
            en.w = Math.round(en.w / sx) * sx;
            en.h = Math.round(en.h / sy) * sy;
        }
    });
}

export function scaleSelection(targetW, targetH) {
    if (state.selectedIds.length === 0) return;

    const selected = state.entities.filter(en => state.selectedIds.includes(en.id));
    const sx = state.gridSizeX;
    const sy = state.gridSizeY;

    // 1. Calcular Bounding Box actual
    const minX = Math.min(...selected.map(en => en.x));
    const minY = Math.min(...selected.map(en => en.y));
    const maxX = Math.max(...selected.map(en => en.x + en.w));
    const maxY = Math.max(...selected.map(en => en.y + en.h));

    const currentW = maxX - minX;
    const currentH = maxY - minY;

    if (currentW === 0 || currentH === 0) return;

    // 2. Factores de escala en unidades de rejilla para consistencia absoluta
    const gridW = currentW / sx;
    const gridH = currentH / sy;
    const targetGridW = Math.round(targetW / sx);
    const targetGridH = Math.round(targetH / sy);

    const fGX = targetGridW / gridW;
    const fGY = targetGridH / gridH;

    selected.forEach(en => {
        if (state.snapToGrid) {
            // Trabajamos puramente en "unidades de bloque"
            const uX = (en.x - minX) / sx;
            const uY = (en.y - minY) / sy;
            const uW = en.w / sx;
            const uH = en.h / sy;

            // Escalamos y redondeamos las unidades, no los píxeles
            const newUX = Math.round(uX * fGX);
            const newUY = Math.round(uY * fGY);
            const newUW = Math.round(uW * fGX);
            const newUH = Math.round(uH * fGY);

            // Convertimos de vuelta a píxeles
            en.x = minX + (newUX * sx);
            en.y = minY + (newUY * sy);
            en.w = Math.max(sx, newUW * sx);
            en.h = Math.max(sy, newUH * sy);
        } else {
            // Escalado libre (píxel a píxel)
            const fX = targetW / currentW;
            const fY = targetH / currentH;
            const relX = en.x - minX;
            const relY = en.y - minY;

            const rawX1 = minX + (relX * fX);
            const rawY1 = minY + (relY * fY);
            const rawX2 = minX + (relX + en.w) * fX;
            const rawY2 = minY + (relY + en.h) * fY;

            en.x = rawX1;
            en.y = rawY1;
            en.w = Math.max(1, rawX2 - rawX1);
            en.h = Math.max(1, rawY2 - rawY1);
        }
    });

    updateProperties();
    updateJSON();
}

export function bringSelectionToFront() {
    if (state.selectedIds.length === 0) return;
    const selected = [];
    const unselected = [];
    state.entities.forEach(en => {
        if (state.selectedIds.includes(en.id)) {
            selected.push(en);
        } else {
            unselected.push(en);
        }
    });
    state.entities = [...unselected, ...selected];
    updateJSON();
}

export function sendSelectionToBack() {
    if (state.selectedIds.length === 0) return;
    const selected = [];
    const unselected = [];
    state.entities.forEach(en => {
        if (state.selectedIds.includes(en.id)) {
            selected.push(en);
        } else {
            unselected.push(en);
        }
    });
    state.entities = [...selected, ...unselected];
    updateJSON();
}

export function alignSelection(alignmentType) {
    if (state.selectedIds.length < 2) return;

    const selected = state.entities.filter(en => state.selectedIds.includes(en.id));
    const sx = state.gridSizeX;
    const sy = state.gridSizeY;

    // Bounding Box
    const minX = Math.min(...selected.map(en => en.x));
    const minY = Math.min(...selected.map(en => en.y));
    const maxX = Math.max(...selected.map(en => en.x + en.w));
    const maxY = Math.max(...selected.map(en => en.y + en.h));

    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    selected.forEach(en => {
        if (alignmentType === 'left') {
            en.x = minX;
        } else if (alignmentType === 'centerX') {
            en.x = cx - en.w / 2;
        } else if (alignmentType === 'right') {
            en.x = maxX - en.w;
        } else if (alignmentType === 'top') {
            en.y = minY;
        } else if (alignmentType === 'centerY') {
            en.y = cy - en.h / 2;
        } else if (alignmentType === 'bottom') {
            en.y = maxY - en.h;
        }

        // Ajustar al grid
        if (state.snapToGrid) {
            en.x = Math.round(en.x / sx) * sx;
            en.y = Math.round(en.y / sy) * sy;
        }
    });
    updateJSON();
}

export function distributeSelection(direction) {
    const selected = state.entities.filter(en => state.selectedIds.includes(en.id));
    if (selected.length < 3) {
        showOSD('DISTRIBUCIÓN', 'Selecciona al menos 3 objetos', '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>');
        return;
    }

    const sx = state.gridSizeX;
    const sy = state.gridSizeY;

    if (direction === 'horizontal') {
        const sorted = [...selected].sort((a, b) => a.x - b.x);
        const N = sorted.length;
        const L_right = sorted[0].x + sorted[0].w;
        const R_left = sorted[N - 1].x;
        const middleW = sorted.slice(1, N - 1).reduce((sum, en) => sum + en.w, 0);
        const Span = R_left - L_right;
        const G = (Span - middleW) / (N - 1);

        for (let i = 1; i < N - 1; i++) {
            sorted[i].x = sorted[i - 1].x + sorted[i - 1].w + G;
            if (state.snapToGrid) {
                sorted[i].x = Math.round(sorted[i].x / sx) * sx;
            }
        }
    } else if (direction === 'vertical') {
        const sorted = [...selected].sort((a, b) => a.y - b.y);
        const N = sorted.length;
        const T_bottom = sorted[0].y + sorted[0].h;
        const B_top = sorted[N - 1].y;
        const middleH = sorted.slice(1, N - 1).reduce((sum, en) => sum + en.h, 0);
        const Span = B_top - T_bottom;
        const G = (Span - middleH) / (N - 1);

        for (let i = 1; i < N - 1; i++) {
            sorted[i].y = sorted[i - 1].y + sorted[i - 1].h + G;
            if (state.snapToGrid) {
                sorted[i].y = Math.round(sorted[i].y / sy) * sy;
            }
        }
    }
    updateJSON();
}


import { state } from './state.js';
import { BASE_WIDTH, BASE_HEIGHT } from './constants.js';
import { Entity } from './entities.js';

export function getCanvasCoords(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left);
    const y = (e.clientY - rect.top);

    return {
        x: (x - state.view.offsetX) / (state.view.zoom * state.view.baseZoom),
        y: (y - state.view.offsetY) / (state.view.zoom * state.view.baseZoom)
    };
}

export function centerLevel(canvas) {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    const cw = container.clientWidth;
    const ch = container.clientHeight;

    // Calculamos el zoom que hace que el mapa quepa (con 10% de margen)
    const zoomX = cw / state.width;
    const zoomY = ch / state.height;
    state.view.baseZoom = Math.min(zoomX, zoomY) * 0.90;

    // El zoom relativo del usuario vuelve a ser 1.0 (que visualmente se ve como "ajustado")
    state.view.zoom = 1.0;

    // Centrar exactamente
    state.view.offsetX = (cw - state.width * (state.view.zoom * state.view.baseZoom)) / 2;
    state.view.offsetY = (ch - state.height * (state.view.zoom * state.view.baseZoom)) / 2;

    // Actualizar la etiqueta de zoom (ahora dirá 100%)
    const label = document.getElementById('zoomLabel');
    if (label) label.textContent = `100%`;
}

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

export function updateProperties() {
    const propType = document.getElementById('propType');
    const inputs = ['propX', 'propY', 'propW', 'propH'].map(id => document.getElementById(id));
    const btnDelete = document.getElementById('btnDelete');
    const transformPanel = document.getElementById('transform-panel');

    if (!propType || !btnDelete) return;

    if (state.selectedIds.length === 1) {
        transformPanel?.classList.remove('disabled-ui');
        const en = state.entities.find(e => e.id === state.selectedIds[0]);
        if (en) {
            propType.textContent = en.type.toUpperCase();
            inputs.forEach(input => {
                if (input) {
                    input.disabled = false;
                    input.type = "number";
                }
            });
            btnDelete.disabled = false;

            document.getElementById('propX').value = Math.round(en.x);
            document.getElementById('propY').value = Math.round(en.y);
            document.getElementById('propW').value = Math.round(en.w);
            document.getElementById('propH').value = Math.round(en.h);

            // Inyectar paneles específicos por tipo
            const extraPanel = document.getElementById('extra-properties');
            if (extraPanel) {
                extraPanel.innerHTML = ''; // Limpiar previo

                if (en.type === 'checkpoint') {
                    const group = document.createElement('div');
                    group.className = 'control-group';
                    group.style.marginTop = '10px';
                    group.innerHTML = `
                        <label>Índice del Checkpoint (Orden)</label>
                        <input type="number" step="1" id="propCpIndex" class="styled-input" value="${en.checkpointIndex !== undefined ? en.checkpointIndex : 0}">
                    `;
                    extraPanel.appendChild(group);

                    document.getElementById('propCpIndex').addEventListener('input', (e) => {
                        en.checkpointIndex = parseInt(e.target.value) || 0;
                        updateJSON();
                    });
                } else if (en.type === 'switch') {
                    const groupMode = document.createElement('div');
                    groupMode.className = 'control-group';
                    groupMode.style.marginTop = '10px';
                    groupMode.innerHTML = `
                        <label>Modo de Activación</label>
                        <select id="propSwitchMode" class="styled-input" style="padding: 4px; border-radius: 4px; background: #252525; color: white; border: 1px solid #444; width: 100%;">
                            <option value="toggle" ${en.switchMode === 'toggle' ? 'selected' : ''}>Alternar (Toggle)</option>
                            <option value="hold" ${en.switchMode === 'hold' || en.switchMode === 'pressure' ? 'selected' : ''}>Mantener (Hold)</option>
                            <option value="latch" ${en.switchMode === 'latch' ? 'selected' : ''}>Permanente (Latch)</option>
                            <option value="pulse" ${en.switchMode === 'pulse' ? 'selected' : ''}>Impulso (Pulse)</option>
                        </select>
                    `;
                    extraPanel.appendChild(groupMode);

                    const group = document.createElement('div');
                    group.className = 'control-group';
                    group.style.marginTop = '10px';
                    group.innerHTML = `
                        <label>Canal de Salida (outputLinkId)</label>
                        <input type="text" id="propLinkId" class="styled-input" value="${en.linkId || ''}">
                    `;
                    extraPanel.appendChild(group);

                    document.getElementById('propSwitchMode').addEventListener('change', (e) => {
                        en.switchMode = e.target.value;
                        updateJSON();
                    });
                    document.getElementById('propLinkId').addEventListener('input', (e) => {
                        en.linkId = e.target.value || '';
                        updateJSON();
                    });
                } else if (en.type === 'gate') {
                    const group1 = document.createElement('div');
                    group1.className = 'control-group';
                    group1.style.marginTop = '10px';
                    group1.innerHTML = `
                        <label>Canal de Entrada (inputLinkId)</label>
                        <input type="text" id="propLinkId" class="styled-input" value="${en.linkId || ''}">
                    `;
                    extraPanel.appendChild(group1);

                    const group2 = document.createElement('div');
                    group2.className = 'control-group';
                    group2.style.marginTop = '10px';
                    group2.innerHTML = `
                        <label>Duración Apertura (segs, 0 = perm.)</label>
                        <input type="number" step="0.1" id="propDuration" class="styled-input" value="${en.duration !== undefined ? en.duration : 0}">
                    `;
                    extraPanel.appendChild(group2);

                    document.getElementById('propLinkId').addEventListener('input', (e) => {
                        en.linkId = e.target.value || '';
                        updateJSON();
                    });
                    document.getElementById('propDuration').addEventListener('input', (e) => {
                        en.duration = parseFloat(e.target.value) || 0;
                        updateJSON();
                    });
                } else if (en.type === 'moving_wall' || en.type === 'moving_hazard') {
                    const groupLink = document.createElement('div');
                    groupLink.className = 'control-group';
                    groupLink.style.marginTop = '10px';
                    groupLink.innerHTML = `
                        <label>Canal de Activación (opcional)</label>
                        <input type="text" id="propLinkId" class="styled-input" value="${en.linkId || ''}" placeholder="Siempre activo">
                    `;
                    extraPanel.appendChild(groupLink);

                    const groupDX = document.createElement('div');
                    groupDX.className = 'control-group';
                    groupDX.style.marginTop = '10px';
                    groupDX.innerHTML = `
                        <label>Desplazamiento X (dx)</label>
                        <input type="number" step="10" id="propDX" class="styled-input" value="${en.dx !== undefined ? en.dx : 0}">
                    `;
                    extraPanel.appendChild(groupDX);

                    const groupDY = document.createElement('div');
                    groupDY.className = 'control-group';
                    groupDY.style.marginTop = '10px';
                    groupDY.innerHTML = `
                        <label>Desplazamiento Y (dy)</label>
                        <input type="number" step="10" id="propDY" class="styled-input" value="${en.dy !== undefined ? en.dy : 0}">
                    `;
                    extraPanel.appendChild(groupDY);

                    const groupSpeed = document.createElement('div');
                    groupSpeed.className = 'control-group';
                    groupSpeed.style.marginTop = '10px';
                    groupSpeed.innerHTML = `
                        <label>Duración Ciclo (segs)</label>
                        <input type="number" step="0.1" id="propSpeed" class="styled-input" value="${en.speed !== undefined ? en.speed : 2.0}">
                    `;
                    extraPanel.appendChild(groupSpeed);

                    document.getElementById('propDX').addEventListener('input', (e) => {
                        en.dx = parseFloat(e.target.value) || 0;
                        updateJSON();
                    });
                    document.getElementById('propDY').addEventListener('input', (e) => {
                        en.dy = parseFloat(e.target.value) || 0;
                        updateJSON();
                    });
                    document.getElementById('propSpeed').addEventListener('input', (e) => {
                        en.speed = parseFloat(e.target.value) || 2.0;
                        updateJSON();
                    });
                    document.getElementById('propLinkId').addEventListener('input', (e) => {
                        en.linkId = e.target.value || '';
                        updateJSON();
                    });
                } else if (en.type === 'logic_gate') {
                    // Auto-sanitizar NOT al seleccionar para que no cargue múltiples entradas accidentales
                    if (en.gateType === 'NOT' && en.inputLinkIds && en.inputLinkIds.includes(',')) {
                        en.inputLinkIds = en.inputLinkIds.split(',')[0].trim();
                    }

                    const groupGateType = document.createElement('div');
                    groupGateType.className = 'control-group';
                    groupGateType.style.marginTop = '10px';
                    groupGateType.innerHTML = `
                        <label>Operación Lógica</label>
                        <select id="propGateType" class="styled-input" style="padding: 4px; border-radius: 4px; background: #252525; color: white; border: 1px solid #444; width: 100%;">
                            <option value="AND" ${en.gateType === 'AND' ? 'selected' : ''}>AND (Todos activos)</option>
                            <option value="OR" ${en.gateType === 'OR' ? 'selected' : ''}>OR (Al menos uno)</option>
                            <option value="NOT" ${en.gateType === 'NOT' ? 'selected' : ''}>NOT (Inversor)</option>
                        </select>
                    `;
                    extraPanel.appendChild(groupGateType);

                    const groupInputs = document.createElement('div');
                    groupInputs.className = 'control-group';
                    groupInputs.style.marginTop = '10px';
                    const inputsLabel = en.gateType === 'NOT' ? 'Canal de Entrada (Inversor NOT)' : 'Canales de Entrada (Ej: A, B)';
                    groupInputs.innerHTML = `
                        <label>${inputsLabel}</label>
                        <input type="text" id="propInputLinkIds" class="styled-input" value="${en.inputLinkIds || ''}">
                    `;
                    extraPanel.appendChild(groupInputs);

                    const groupOutput = document.createElement('div');
                    groupOutput.className = 'control-group';
                    groupOutput.style.marginTop = '10px';
                    groupOutput.innerHTML = `
                        <label>Canal de Salida (outputLinkId)</label>
                        <input type="text" id="propOutputLinkId" class="styled-input" value="${en.outputLinkId || ''}">
                    `;
                    extraPanel.appendChild(groupOutput);

                    document.getElementById('propGateType').addEventListener('change', (e) => {
                        en.gateType = e.target.value;
                        if (en.gateType === 'NOT') {
                            if (en.inputLinkIds && en.inputLinkIds.includes(',')) {
                                en.inputLinkIds = en.inputLinkIds.split(',')[0].trim();
                            }
                            const inputField = document.getElementById('propInputLinkIds');
                            if (inputField) {
                                inputField.value = en.inputLinkIds || '';
                                const label = inputField.previousElementSibling;
                                if (label) {
                                    label.textContent = 'Canal de Entrada (Inversor NOT)';
                                }
                            }
                        } else {
                            const inputField = document.getElementById('propInputLinkIds');
                            if (inputField) {
                                const label = inputField.previousElementSibling;
                                if (label) {
                                    label.textContent = 'Canales de Entrada (Ej: A, B)';
                                }
                            }
                        }
                        updateJSON();
                    });
                    document.getElementById('propInputLinkIds').addEventListener('input', (e) => {
                        let val = e.target.value || '';
                        if (en.gateType === 'NOT') {
                            if (val.includes(',')) {
                                val = val.split(',')[0].trim();
                                e.target.value = val;
                            }
                        }
                        en.inputLinkIds = val;
                        updateJSON();
                    });
                    document.getElementById('propOutputLinkId').addEventListener('input', (e) => {
                        en.outputLinkId = e.target.value || '';
                        updateJSON();
                    });
                } else if (en.type === 'wind_zone') {
                    const groupFX = document.createElement('div');
                    groupFX.className = 'control-group';
                    groupFX.style.marginTop = '10px';
                    groupFX.innerHTML = `
                        <label>Fuerza X (Fuerza constante en X)</label>
                        <input type="number" step="0.5" id="propFX" class="styled-input" value="${en.dx !== undefined ? en.dx : 0}">
                    `;
                    extraPanel.appendChild(groupFX);

                    const groupFY = document.createElement('div');
                    groupFY.className = 'control-group';
                    groupFY.style.marginTop = '10px';
                    groupFY.innerHTML = `
                        <label>Fuerza Y (Fuerza constante en Y)</label>
                        <input type="number" step="0.5" id="propFY" class="styled-input" value="${en.dy !== undefined ? en.dy : -1.5}">
                    `;
                    extraPanel.appendChild(groupFY);

                    document.getElementById('propFX').addEventListener('input', (e) => {
                        en.dx = parseFloat(e.target.value) || 0;
                        updateJSON();
                    });
                    document.getElementById('propFY').addEventListener('input', (e) => {
                        en.dy = parseFloat(e.target.value) || 0;
                        updateJSON();
                    });
                } else if (en.type === 'speed_pad') {
                    const groupBX = document.createElement('div');
                    groupBX.className = 'control-group';
                    groupBX.style.marginTop = '10px';
                    groupBX.innerHTML = `
                        <label>Impulso X (Boost X)</label>
                        <input type="number" step="1" id="propBX" class="styled-input" value="${en.dx !== undefined ? en.dx : 15}">
                    `;
                    extraPanel.appendChild(groupBX);

                    const groupBY = document.createElement('div');
                    groupBY.className = 'control-group';
                    groupBY.style.marginTop = '10px';
                    groupBY.innerHTML = `
                        <label>Impulso Y (Boost Y)</label>
                        <input type="number" step="1" id="propBY" class="styled-input" value="${en.dy !== undefined ? en.dy : 0}">
                    `;
                    extraPanel.appendChild(groupBY);

                    document.getElementById('propBX').addEventListener('input', (e) => {
                        en.dx = parseFloat(e.target.value) || 0;
                        updateJSON();
                    });
                    document.getElementById('propBY').addEventListener('input', (e) => {
                        en.dy = parseFloat(e.target.value) || 0;
                        updateJSON();
                    });
                } else if (en.type === 'timer') {
                    const groupIn = document.createElement('div');
                    groupIn.className = 'control-group';
                    groupIn.style.marginTop = '10px';
                    groupIn.innerHTML = `
                        <label>Canal de Entrada (inputLinkId)</label>
                        <input type="text" id="propLinkId" class="styled-input" value="${en.linkId || ''}">
                    `;
                    extraPanel.appendChild(groupIn);

                    const groupOut = document.createElement('div');
                    groupOut.className = 'control-group';
                    groupOut.style.marginTop = '10px';
                    groupOut.innerHTML = `
                        <label>Canal de Salida (outputLinkId)</label>
                        <input type="text" id="propOutputLinkId" class="styled-input" value="${en.outputLinkId || ''}">
                    `;
                    extraPanel.appendChild(groupOut);

                    const groupDur = document.createElement('div');
                    groupDur.className = 'control-group';
                    groupDur.style.marginTop = '10px';
                    groupDur.innerHTML = `
                        <label>Duración Temporizador (segs)</label>
                        <input type="number" step="0.1" id="propDuration" class="styled-input" value="${en.duration !== undefined ? en.duration : 2.0}">
                    `;
                    extraPanel.appendChild(groupDur);

                    document.getElementById('propLinkId').addEventListener('input', (e) => {
                        en.linkId = e.target.value || '';
                        updateJSON();
                    });
                    document.getElementById('propOutputLinkId').addEventListener('input', (e) => {
                        en.outputLinkId = e.target.value || '';
                        updateJSON();
                    });
                    document.getElementById('propDuration').addEventListener('input', (e) => {
                        en.duration = parseFloat(e.target.value) || 2.0;
                        updateJSON();
                    });
                } else if (en.type === 'portal') {
                    const groupPortal = document.createElement('div');
                    groupPortal.className = 'control-group';
                    groupPortal.style.marginTop = '10px';
                    groupPortal.innerHTML = `
                        <label>Número de Portal (Enlace por Número)</label>
                        <input type="number" step="1" id="propCpIndex" class="styled-input" value="${en.checkpointIndex !== undefined ? en.checkpointIndex : 1}">
                    `;
                    extraPanel.appendChild(groupPortal);

                    document.getElementById('propCpIndex').addEventListener('input', (e) => {
                        en.checkpointIndex = parseInt(e.target.value) || 1;
                        updateJSON();
                    });
                } else if (en.type === 'boss') {
                    const groupBoss = document.createElement('div');
                    groupBoss.className = 'control-group';
                    groupBoss.style.marginTop = '10px';
                    groupBoss.innerHTML = `
                        <label>Señal de Daño (inputLinkId)</label>
                        <input type="text" id="propLinkId" class="styled-input" value="${en.linkId || ''}" placeholder="ID del interruptor/compuerta">
                        
                        <label style="margin-top:10px; display:block;">Nombre del Jefe</label>
                        <input type="text" id="propBossName" class="styled-input" value="${en.name || ''}" placeholder="Ej: Asmodeus">

                        
                        <label style="margin-top:10px; display:block;">Estilo de Combate (Tipo)</label>
                        <select id="propBossType" class="styled-input">
                            <option value="scatter" ${en.bossType === 'scatter' ? 'selected' : ''}>Dispersor Caótico (Scatter)</option>
                            <option value="tracker" ${en.bossType === 'tracker' ? 'selected' : ''}>Cazador Preciso (Tracker)</option>
                            <option value="spinner" ${en.bossType === 'spinner' ? 'selected' : ''}>Hélice Mortal (Spinner)</option>
                        </select>
                        
                        <label style="margin-top:10px; display:block;">Puntos de Vida (Golpes)</label>
                        <input type="number" step="1" id="propHealth" class="styled-input" value="${en.health !== undefined ? en.health : 5}">
                        
                        <label style="margin-top:10px; display:block;">Fases de Dificultad</label>
                        <input type="number" step="1" id="propPhases" class="styled-input" value="${en.phases !== undefined ? en.phases : 2}">
                        
                        <label style="margin-top:10px; display:block;">Velocidad de Movimiento (px/s)</label>
                        <input type="number" step="1" id="propSpeed" class="styled-input" value="${en.speed !== undefined ? en.speed : 150}">
                        
                        <label style="margin-top:10px; display:block;">Densidad de Ataque</label>
                        <input type="number" step="1" id="propAttackDensity" class="styled-input" value="${en.attackDensity !== undefined ? en.attackDensity : 3}">
                        
                        <label style="margin-top:10px; display:block;">Frecuencia de Ataque (Segundos)</label>
                        <input type="number" step="0.1" id="propAttackFrequency" class="styled-input" value="${en.attackFrequency !== undefined ? en.attackFrequency : 2.0}">
                        
                        <label style="margin-top:10px; display:block;">Ataques Normales para Especial</label>
                        <input type="number" step="1" id="propSpecialAttackFrequency" class="styled-input" value="${en.specialAttackFrequency !== undefined ? en.specialAttackFrequency : 3}">
                    `;
                    extraPanel.appendChild(groupBoss);

                    document.getElementById('propLinkId').addEventListener('input', (e) => {
                        en.linkId = e.target.value || '';
                        updateJSON();
                    });
                    document.getElementById('propBossName').addEventListener('input', (e) => {
                        en.name = e.target.value || '';
                        updateJSON();
                    });
                    document.getElementById('propBossType').addEventListener('change', (e) => {
                        en.bossType = e.target.value;
                        updateJSON();
                    });
                    document.getElementById('propHealth').addEventListener('input', (e) => {
                        en.health = parseInt(e.target.value) || 5;
                        updateJSON();
                    });
                    document.getElementById('propPhases').addEventListener('input', (e) => {
                        en.phases = parseInt(e.target.value) || 2;
                        updateJSON();
                    });
                    document.getElementById('propSpeed').addEventListener('input', (e) => {
                        en.speed = parseFloat(e.target.value) || 150;
                        updateJSON();
                    });
                    document.getElementById('propAttackDensity').addEventListener('input', (e) => {
                        en.attackDensity = parseInt(e.target.value) || 3;
                        updateJSON();
                    });
                    document.getElementById('propAttackFrequency').addEventListener('input', (e) => {
                        en.attackFrequency = parseFloat(e.target.value) || 2.0;
                        updateJSON();
                    });
                    document.getElementById('propSpecialAttackFrequency').addEventListener('input', (e) => {
                        en.specialAttackFrequency = parseInt(e.target.value) || 3;
                        updateJSON();
                    });
                }
            }
        }
    } else {
        // Múltiple selección o ninguna
        const extraPanel = document.getElementById('extra-properties');
        if (extraPanel) extraPanel.innerHTML = '';

        propType.textContent = state.selectedIds.length > 1 ? `${state.selectedIds.length} OBJETOS` : "---";
        inputs.forEach(input => {
            if (input) {
                input.disabled = true;
                input.type = "text";
                input.value = "---";
            }
        });
        btnDelete.disabled = state.selectedIds.length === 0;

        if (state.selectedIds.length > 0) {
            transformPanel?.classList.remove('disabled-ui');
        } else {
            transformPanel?.classList.add('disabled-ui');
        }
    }

    updateSelectionStats();
    updateJSON();
}

export function updateSelectionStats() {
    const statsPanel = document.getElementById('selectionStats');
    const statW = document.getElementById('statW');
    const statH = document.getElementById('statH');
    const inputScaleW = document.getElementById('targetScaleW');
    const inputScaleH = document.getElementById('targetScaleH');

    if (!statsPanel || !statW || !statH) return;

    // Prioridad 1: Si estamos dibujando algo nuevo (tempRect)
    if (state.tempRect && state.tempRect.w > 0) {
        statsPanel.classList.remove('hidden');
        const blocksW = Math.round(state.tempRect.w / state.gridSizeX * 100) / 100;
        const blocksH = Math.round(state.tempRect.h / state.gridSizeY * 100) / 100;
        statW.textContent = `Anchura: ${blocksW} bloques`;
        statH.textContent = `Altura: ${blocksH} bloques`;
        return;
    }

    // Prioridad 2: Si hay elementos seleccionados
    if (state.selectedIds.length === 0) {
        statsPanel.classList.add('hidden');
        if (inputScaleW && inputScaleH) {
            inputScaleW.disabled = true;
            inputScaleH.disabled = true;
            inputScaleW.type = "text";
            inputScaleH.type = "text";
            inputScaleW.value = "---";
            inputScaleH.value = "---";
        }
        return;
    }

    statsPanel.classList.remove('hidden');

    const selected = state.entities.filter(en => state.selectedIds.includes(en.id));
    const minX = Math.min(...selected.map(en => en.x));
    const minY = Math.min(...selected.map(en => en.y));
    const maxX = Math.max(...selected.map(en => en.x + en.w));
    const maxY = Math.max(...selected.map(en => en.y + en.h));

    const totalW = maxX - minX;
    const totalH = maxY - minY;

    const blocksW = Math.round(totalW / state.gridSizeX * 100) / 100;
    const blocksH = Math.round(totalH / state.gridSizeY * 100) / 100;

    statW.textContent = `Anchura: ${blocksW} bloques`;
    statH.textContent = `Altura: ${blocksH} bloques`;

    // NUEVO: Rellenar inputs de escala de forma inteligente
    const isFocused = document.activeElement === inputScaleW || document.activeElement === inputScaleH;
    const selectionKey = state.selectedIds.sort().join(',');
    const selectionChanged = selectionKey !== state.lastSelectionKey;

    if (inputScaleW && inputScaleH && !state.isScaling) {
        inputScaleW.disabled = false;
        inputScaleH.disabled = false;

        // Solo sobrescribimos si:
        // 1. La selección ha cambiado (nuevo objeto seleccionado)
        // 2. El input está vacío o tiene el placeholder '---'
        // 3. NO está enfocado (para no interrumpir la escritura)
        // 4. Pero si la selección cambió, reseteamos siempre para mostrar lo nuevo
        const currentW = Math.round(totalW);
        const currentH = Math.round(totalH);

        if (selectionChanged || state.isDragging || state.isResizing || (!isFocused && (inputScaleW.value === "" || inputScaleW.value === "---"))) {
            inputScaleW.type = "number";
            inputScaleH.type = "number";
            inputScaleW.value = currentW;
            inputScaleH.value = currentH;
        }
    }

    state.lastSelectionKey = selectionKey;
}

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

export function optimizeEntities() {
    if (state.entities.length === 0) return;

    const typesToOptimize = ['wall', 'hazard'];
    let finalOptimized = [];

    // 1. Separar no optimizables
    let others = state.entities.filter(en => !typesToOptimize.includes(en.type));
    let toProcess = state.entities.filter(en => typesToOptimize.includes(en.type));

    typesToOptimize.forEach(type => {
        let items = toProcess.filter(en => en.type === type);
        if (items.length === 0) return;

        // Crear un mapa de celdas ocupadas para este tipo
        // Usamos coordenadas de rejilla (indices) para facilitar la expansión
        const sx = state.gridSizeX;
        const sy = state.gridSizeY;
        const grid = {}; // clave: "col,row"

        items.forEach(en => {
            const colStart = Math.round(en.x / sx);
            const rowStart = Math.round(en.y / sy);
            const colSpan = Math.round(en.w / sx);
            const rowSpan = Math.round(en.h / sy);

            for (let c = colStart; c < colStart + colSpan; c++) {
                for (let r = rowStart; r < rowStart + rowSpan; r++) {
                    grid[`${c},${r}`] = true;
                }
            }
        });

        const visited = new Set();
        const cols = state.cols;
        const rows = state.rows;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const key = `${c},${r}`;
                if (grid[key] && !visited.has(key)) {
                    // Encontramos el inicio de un posible rectángulo
                    let width = 0;
                    let height = 0;

                    // 1. Expandir a la derecha todo lo posible
                    while ((c + width) < cols && grid[`${c + width},${r}`] && !visited.has(`${c + width},${r}`)) {
                        width++;
                    }

                    // 2. Expandir hacia abajo la tira completa
                    let canExpandDown = true;
                    while (canExpandDown && (r + height) < rows) {
                        for (let i = 0; i < width; i++) {
                            const downKey = `${c + i},${r + height}`;
                            if (!grid[downKey] || visited.has(downKey)) {
                                canExpandDown = false;
                                break;
                            }
                        }
                        if (canExpandDown) height++;
                    }

                    // Marcar celdas como visitadas
                    for (let i = 0; i < width; i++) {
                        for (let j = 0; j < height; j++) {
                            visited.add(`${c + i},${r + j}`);
                        }
                    }

                    // Crear la entidad optimizada
                    finalOptimized.push(new Entity(type, c * sx, r * sy, width * sx, height * sy));
                }
            }
        }
    });

    state.entities = [...others, ...finalOptimized];
    updateJSON();
}

function gcd(a, b) {
    return b ? gcd(b, a % b) : a;
}

export function checkSmartGuides(rect) {
    state.activeGuides = { x: [], y: [] };
    if (!rect) return rect;

    const threshold = 15; // Píxeles de proximidad para visualización
    const snapThreshold = 5; // Píxeles para magnetismo real (suavizado)

    const divisions = [
        { div: 2, color: 'rgba(59, 130, 246, 0.7)', base: 2 }, // Azul
        { div: 3, color: 'rgba(234, 179, 8, 0.7)', base: 3 },  // Amarillo
        { div: 6, color: 'rgba(234, 179, 8, 0.7)', base: 3 },  // Amarillo
        { div: 4, color: 'rgba(239, 68, 68, 0.7)', base: 2 },  // Rojo
        { div: 8, color: 'rgba(239, 68, 68, 0.7)', base: 2 },  // Rojo
        { div: 5, color: 'rgba(168, 85, 247, 0.7)', base: 5 }, // Morado
        { div: 7, color: 'rgba(146, 64, 14, 0.7)', base: 7 }   // Café
    ];

    let snappedX = rect.x;
    let snappedY = rect.y;

    const checkAxis = (val, axis, offset = 0) => {
        const totalSize = axis === 'x' ? state.width : state.height;
        divisions.forEach(({ div, color, base }) => {
            // Ignorar por completo si la familia correspondiente está desactivada
            if (!state.rulerFamilies[base]) return;

            for (let i = 1; i < div; i++) {
                // Evitar duplicados de guías mediante el máximo común divisor
                if (gcd(i, div) > 1) continue;

                const guidePos = (totalSize / div) * i;
                const diff = Math.abs(val - guidePos);

                if (diff < threshold) {
                    state.activeGuides[axis].push({
                        pos: guidePos,
                        color,
                        label: `${i}/${div}`
                    });

                    // Aplicar magnetismo (snap) si estamos muy cerca
                    if (diff < snapThreshold) {
                        if (axis === 'x') snappedX = guidePos - offset;
                        else snappedY = guidePos - offset;
                    }
                }
            }
        });
    };

    // Revisar Izquierda, Centro, Derecha
    checkAxis(rect.x, 'x', 0);
    checkAxis(rect.x + rect.w / 2, 'x', rect.w / 2);
    checkAxis(rect.x + rect.w, 'x', rect.w);

    // Arriba, Centro, Abajo
    checkAxis(rect.y, 'y', 0);
    checkAxis(rect.y + rect.h / 2, 'y', rect.h / 2);
    checkAxis(rect.y + rect.h, 'y', rect.h);

    // Guardar posición central para las etiquetas en el renderer
    state.lastInteractionPos = {
        x: rect.x + rect.w / 2,
        y: rect.y + rect.h / 2
    };

    return { x: snappedX, y: snappedY };
}

export function showOSD(title, value, icon) {
    let container = document.getElementById('osd-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'osd-container';
        document.body.appendChild(container);
    }

    // Limpiar OSDs anteriores para evitar acumulación
    container.innerHTML = '';

    const toast = document.createElement('div');
    toast.className = 'osd-toast';
    toast.innerHTML = `
        <div class="osd-icon">${icon}</div>
        <div class="osd-title">${title}</div>
        <div class="osd-value">${value}</div>
    `;

    container.appendChild(toast);

    // Forzar reflow para animación
    toast.offsetHeight;

    toast.classList.add('show');

    // Desaparecer después de 1 segundo
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 250);
    }, 1000);
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



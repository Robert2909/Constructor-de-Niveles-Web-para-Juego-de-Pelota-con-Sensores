import { state } from '../state.js';
import { updateJSON } from '../utils.js';

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


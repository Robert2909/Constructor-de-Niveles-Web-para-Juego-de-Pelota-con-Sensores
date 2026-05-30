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
                        <label>Índice (Orden)</label>
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
                        <label>Canal de Salida</label>
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
                    const row = document.createElement('div');
                    row.className = 'control-row';
                    row.style.marginTop = '10px';
                    row.innerHTML = `
                        <div class="control-group">
                            <label>Entrada (Link)</label>
                            <input type="text" id="propLinkId" class="styled-input" value="${en.linkId || ''}">
                        </div>
                        <div class="control-group">
                            <label>Duración (0=perm)</label>
                            <input type="number" step="0.1" id="propDuration" class="styled-input" value="${en.duration !== undefined ? en.duration : 0}">
                        </div>
                    `;
                    extraPanel.appendChild(row);

                    document.getElementById('propLinkId').addEventListener('input', (e) => {
                        en.linkId = e.target.value || '';
                        updateJSON();
                    });
                    document.getElementById('propDuration').addEventListener('input', (e) => {
                        en.duration = parseFloat(e.target.value) || 0;
                        updateJSON();
                    });
                } else if (en.type === 'moving_wall' || en.type === 'moving_hazard') {
                    const row1 = document.createElement('div');
                    row1.className = 'control-row';
                    row1.style.marginTop = '10px';
                    row1.innerHTML = `
                        <div class="control-group">
                            <label>Despl. X (dx)</label>
                            <input type="number" step="10" id="propDX" class="styled-input" value="${en.dx !== undefined ? en.dx : 0}">
                        </div>
                        <div class="control-group">
                            <label>Despl. Y (dy)</label>
                            <input type="number" step="10" id="propDY" class="styled-input" value="${en.dy !== undefined ? en.dy : 0}">
                        </div>
                    `;
                    extraPanel.appendChild(row1);
                    
                    const row2 = document.createElement('div');
                    row2.className = 'control-row';
                    row2.style.marginTop = '10px';
                    row2.innerHTML = `
                        <div class="control-group">
                            <label>Ciclo (segs)</label>
                            <input type="number" step="0.1" id="propSpeed" class="styled-input" value="${en.speed !== undefined ? en.speed : 2.0}">
                        </div>
                        <div class="control-group">
                            <label>Activación (Link)</label>
                            <input type="text" id="propLinkId" class="styled-input" value="${en.linkId || ''}">
                        </div>
                    `;
                    extraPanel.appendChild(row2);

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
                    if (en.gateType === 'NOT' && en.inputLinkIds && en.inputLinkIds.includes(',')) {
                        en.inputLinkIds = en.inputLinkIds.split(',')[0].trim();
                    }

                    const groupGateType = document.createElement('div');
                    groupGateType.className = 'control-group';
                    groupGateType.style.marginTop = '10px';
                    groupGateType.innerHTML = `
                        <label>Operación Lógica</label>
                        <select id="propGateType" class="styled-input" style="padding: 4px; border-radius: 4px; background: #252525; color: white; border: 1px solid #444; width: 100%;">
                            <option value="AND" ${en.gateType === 'AND' ? 'selected' : ''}>AND (Todos)</option>
                            <option value="OR" ${en.gateType === 'OR' ? 'selected' : ''}>OR (Al menos uno)</option>
                            <option value="NOT" ${en.gateType === 'NOT' ? 'selected' : ''}>NOT (Inversor)</option>
                        </select>
                    `;
                    extraPanel.appendChild(groupGateType);

                    const rowInputs = document.createElement('div');
                    rowInputs.className = 'control-row';
                    rowInputs.style.marginTop = '10px';
                    const inputsLabel = en.gateType === 'NOT' ? 'Entrada (Link)' : 'Entradas (Links)';
                    rowInputs.innerHTML = `
                        <div class="control-group">
                            <label id="labelInputLinks">${inputsLabel}</label>
                            <input type="text" id="propInputLinkIds" class="styled-input" value="${en.inputLinkIds || ''}">
                        </div>
                        <div class="control-group">
                            <label>Salida (Link)</label>
                            <input type="text" id="propOutputLinkId" class="styled-input" value="${en.outputLinkId || ''}">
                        </div>
                    `;
                    extraPanel.appendChild(rowInputs);

                    document.getElementById('propGateType').addEventListener('change', (e) => {
                        en.gateType = e.target.value;
                        if (en.gateType === 'NOT') {
                            if (en.inputLinkIds && en.inputLinkIds.includes(',')) {
                                en.inputLinkIds = en.inputLinkIds.split(',')[0].trim();
                            }
                            const inputField = document.getElementById('propInputLinkIds');
                            if (inputField) {
                                inputField.value = en.inputLinkIds || '';
                                document.getElementById('labelInputLinks').textContent = 'Entrada (Link)';
                            }
                        } else {
                            const inputField = document.getElementById('propInputLinkIds');
                            if (inputField) {
                                document.getElementById('labelInputLinks').textContent = 'Entradas (Links)';
                            }
                        }
                        updateJSON();
                    });
                    document.getElementById('propInputLinkIds').addEventListener('input', (e) => {
                        let val = e.target.value || '';
                        if (en.gateType === 'NOT' && val.includes(',')) {
                            val = val.split(',')[0].trim();
                            e.target.value = val;
                        }
                        en.inputLinkIds = val;
                        updateJSON();
                    });
                    document.getElementById('propOutputLinkId').addEventListener('input', (e) => {
                        en.outputLinkId = e.target.value || '';
                        updateJSON();
                    });
                } else if (en.type === 'wind_zone') {
                    const row = document.createElement('div');
                    row.className = 'control-row';
                    row.style.marginTop = '10px';
                    row.innerHTML = `
                        <div class="control-group">
                            <label>Fuerza X</label>
                            <input type="number" step="0.5" id="propFX" class="styled-input" value="${en.dx !== undefined ? en.dx : 0}">
                        </div>
                        <div class="control-group">
                            <label>Fuerza Y</label>
                            <input type="number" step="0.5" id="propFY" class="styled-input" value="${en.dy !== undefined ? en.dy : -1.5}">
                        </div>
                    `;
                    extraPanel.appendChild(row);
                    document.getElementById('propFX').addEventListener('input', (e) => { en.dx = parseFloat(e.target.value) || 0; updateJSON(); });
                    document.getElementById('propFY').addEventListener('input', (e) => { en.dy = parseFloat(e.target.value) || 0; updateJSON(); });
                } else if (en.type === 'speed_pad') {
                    const row = document.createElement('div');
                    row.className = 'control-row';
                    row.style.marginTop = '10px';
                    row.innerHTML = `
                        <div class="control-group">
                            <label>Boost X</label>
                            <input type="number" step="1" id="propBX" class="styled-input" value="${en.dx !== undefined ? en.dx : 15}">
                        </div>
                        <div class="control-group">
                            <label>Boost Y</label>
                            <input type="number" step="1" id="propBY" class="styled-input" value="${en.dy !== undefined ? en.dy : 0}">
                        </div>
                    `;
                    extraPanel.appendChild(row);
                    document.getElementById('propBX').addEventListener('input', (e) => { en.dx = parseFloat(e.target.value) || 0; updateJSON(); });
                    document.getElementById('propBY').addEventListener('input', (e) => { en.dy = parseFloat(e.target.value) || 0; updateJSON(); });
                } else if (en.type === 'timer') {
                    const row1 = document.createElement('div');
                    row1.className = 'control-row';
                    row1.style.marginTop = '10px';
                    row1.innerHTML = `
                        <div class="control-group">
                            <label>Entrada (Link)</label>
                            <input type="text" id="propLinkId" class="styled-input" value="${en.linkId || ''}">
                        </div>
                        <div class="control-group">
                            <label>Salida (Link)</label>
                            <input type="text" id="propOutputLinkId" class="styled-input" value="${en.outputLinkId || ''}">
                        </div>
                    `;
                    extraPanel.appendChild(row1);

                    const groupDur = document.createElement('div');
                    groupDur.className = 'control-group';
                    groupDur.style.marginTop = '10px';
                    groupDur.innerHTML = `
                        <label>Duración Temporizador (segs)</label>
                        <input type="number" step="0.1" id="propDuration" class="styled-input" value="${en.duration !== undefined ? en.duration : 2.0}">
                    `;
                    extraPanel.appendChild(groupDur);

                    document.getElementById('propLinkId').addEventListener('input', (e) => { en.linkId = e.target.value || ''; updateJSON(); });
                    document.getElementById('propOutputLinkId').addEventListener('input', (e) => { en.outputLinkId = e.target.value || ''; updateJSON(); });
                    document.getElementById('propDuration').addEventListener('input', (e) => { en.duration = parseFloat(e.target.value) || 2.0; updateJSON(); });
                } else if (en.type === 'portal') {
                    const groupPortal = document.createElement('div');
                    groupPortal.className = 'control-group';
                    groupPortal.style.marginTop = '10px';
                    groupPortal.innerHTML = `
                        <label>Número de Portal</label>
                        <input type="number" step="1" id="propCpIndex" class="styled-input" value="${en.checkpointIndex !== undefined ? en.checkpointIndex : 1}">
                    `;
                    extraPanel.appendChild(groupPortal);
                    document.getElementById('propCpIndex').addEventListener('input', (e) => { en.checkpointIndex = parseInt(e.target.value) || 1; updateJSON(); });
                } else if (en.type === 'boss') {
                    const groupBossType = document.createElement('div');
                    groupBossType.className = 'control-group';
                    groupBossType.style.marginTop = '10px';
                    groupBossType.innerHTML = `
                        <label>Estilo de Combate</label>
                        <select id="propBossType" class="styled-input" style="padding: 4px; border-radius: 4px; background: #252525; color: white; border: 1px solid #444; width: 100%;">
                            <option value="scatter" ${en.bossType === 'scatter' ? 'selected' : ''}>Dispersor Caótico</option>
                            <option value="tracker" ${en.bossType === 'tracker' ? 'selected' : ''}>Cazador Preciso</option>
                            <option value="spinner" ${en.bossType === 'spinner' ? 'selected' : ''}>Hélice Mortal</option>
                        </select>
                    `;
                    extraPanel.appendChild(groupBossType);

                    const row1 = document.createElement('div');
                    row1.className = 'control-row';
                    row1.style.marginTop = '10px';
                    row1.innerHTML = `
                        <div class="control-group">
                            <label>Daño (Input)</label>
                            <input type="text" id="propLinkId" class="styled-input" value="${en.linkId || ''}">
                        </div>
                        <div class="control-group">
                            <label>Nombre</label>
                            <input type="text" id="propBossName" class="styled-input" value="${en.name || ''}">
                        </div>
                    `;
                    extraPanel.appendChild(row1);

                    const row2 = document.createElement('div');
                    row2.className = 'control-row';
                    row2.style.marginTop = '10px';
                    row2.innerHTML = `
                        <div class="control-group">
                            <label>Vida (PV)</label>
                            <input type="number" step="1" id="propHealth" class="styled-input" value="${en.health !== undefined ? en.health : 5}">
                        </div>
                        <div class="control-group">
                            <label>Fases</label>
                            <input type="number" step="1" id="propPhases" class="styled-input" value="${en.phases !== undefined ? en.phases : 2}">
                        </div>
                    `;
                    extraPanel.appendChild(row2);

                    const row3 = document.createElement('div');
                    row3.className = 'control-row';
                    row3.style.marginTop = '10px';
                    row3.innerHTML = `
                        <div class="control-group">
                            <label>Velocidad</label>
                            <input type="number" step="1" id="propSpeed" class="styled-input" value="${en.speed !== undefined ? en.speed : 150}">
                        </div>
                        <div class="control-group">
                            <label>Densidad Atq.</label>
                            <input type="number" step="1" id="propAttackDensity" class="styled-input" value="${en.attackDensity !== undefined ? en.attackDensity : 3}">
                        </div>
                    `;
                    extraPanel.appendChild(row3);

                    const row4 = document.createElement('div');
                    row4.className = 'control-row';
                    row4.style.marginTop = '10px';
                    row4.innerHTML = `
                        <div class="control-group">
                            <label>Frecuencia Atq.</label>
                            <input type="number" step="0.1" id="propAttackFrequency" class="styled-input" value="${en.attackFrequency !== undefined ? en.attackFrequency : 2.0}">
                        </div>
                        <div class="control-group">
                            <label>Golpes x Especial</label>
                            <input type="number" step="1" id="propSpecialAttackFrequency" class="styled-input" value="${en.specialAttackFrequency !== undefined ? en.specialAttackFrequency : 3}">
                        </div>
                    `;
                    extraPanel.appendChild(row4);

                    document.getElementById('propLinkId').addEventListener('input', (e) => { en.linkId = e.target.value || ''; updateJSON(); });
                    document.getElementById('propBossName').addEventListener('input', (e) => { en.name = e.target.value || ''; updateJSON(); });
                    document.getElementById('propBossType').addEventListener('change', (e) => { en.bossType = e.target.value; updateJSON(); });
                    document.getElementById('propHealth').addEventListener('input', (e) => { en.health = parseInt(e.target.value) || 5; updateJSON(); });
                    document.getElementById('propPhases').addEventListener('input', (e) => { en.phases = parseInt(e.target.value) || 2; updateJSON(); });
                    document.getElementById('propSpeed').addEventListener('input', (e) => { en.speed = parseFloat(e.target.value) || 150; updateJSON(); });
                    document.getElementById('propAttackDensity').addEventListener('input', (e) => { en.attackDensity = parseInt(e.target.value) || 3; updateJSON(); });
                    document.getElementById('propAttackFrequency').addEventListener('input', (e) => { en.attackFrequency = parseFloat(e.target.value) || 2.0; updateJSON(); });
                    document.getElementById('propSpecialAttackFrequency').addEventListener('input', (e) => { en.specialAttackFrequency = parseInt(e.target.value) || 3; updateJSON(); });
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


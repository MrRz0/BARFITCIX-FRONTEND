/**
 * @file salas.js
 * @description Módulo JavaScript para la gestión de salas en la sección
 * de configuración de la aplicación BarFitCIX. Permite listar, agregar,
 * editar y eliminar salas, así como habilitarlas/deshabilitarlas,
 * persistiendo los datos en localStorage a través del DataManager.
 * @author [Tu Nombre/Nombre de la Empresa]
 * @date 2025-06-11
 */

/**
 * @global DataManager - Instancia global del módulo de gestión de datos.
 * @global showCustomAlert - Función global para mostrar alertas personalizadas.
 * @global showCustomConfirm - Función global para mostrar confirmaciones personalizadas.
 */

// Array local para trabajar con las salas
let roomsData = [];
// Variable para almacenar el ID de la sala actualmente seleccionada para edición
let currentRoomId = null;

/**
 * @function loadRooms
 * @description Carga las salas desde el DataManager (localStorage) y actualiza
 * la tabla de salas en la interfaz.
 */
function loadRooms() {
    roomsData = DataManager.getSalas();
    updateRoomsTable();
}

/**
 * @function updateRoomsTable
 * @description Renderiza y actualiza la tabla de salas en la página
 * 'configuracion.html'.
 */
function updateRoomsTable() {
    const tbody = document.getElementById('salasTableBody');
    if (!tbody) {
        console.error("salasTableBody no encontrado. Asegúrate de estar en configuracion.html.");
        return;
    }

    tbody.innerHTML = ''; // Limpiar la tabla antes de renderizar
    if (roomsData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No hay salas registradas.</td></tr>';
        return;
    }

    roomsData.forEach(room => {
        const row = document.createElement('tr');
        row.dataset.roomId = room.id; // Almacena el ID de la sala en el dataset de la fila
        // Hacer la fila clickeable para edición
        row.addEventListener('click', () => editRoom(room.id));

        const isChecked = room.habilitada ? 'checked' : '';
        row.innerHTML = `
            <td>${room.nombre}</td>
            <td>${room.capacidadMesas}</td>
            <td>
                <div class="form-check form-switch d-inline-block">
                    <input class="form-check-input" type="checkbox" id="toggleRoom${room.id}" ${isChecked}
                           onchange="toggleRoomStatus(${room.id}, this.checked)">
                    <label class="form-check-label visually-hidden" for="toggleRoom${room.id}">Habilitar Sala</label>
                </div>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-delete btn-sm" onclick="event.stopPropagation(); deleteRoom(${room.id})" title="Eliminar">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

/**
 * @function clearRoomForm
 * @description Limpia los campos del formulario de sala y restablece el estado.
 */
function clearRoomForm() {
    document.getElementById('roomName').value = '';
    document.getElementById('roomTablesCapacity').value = '0';
    currentRoomId = null; // Reiniciar el ID de la sala actual
    document.getElementById('roomStatusCheckbox').checked = true; // Por defecto, una nueva sala está habilitada
    document.getElementById('roomCardHeader').textContent = 'NUEVA SALA';
}

/**
 * @function editRoom
 * @description Carga los datos de una sala existente en el formulario para su edición.
 * @param {number} id - El ID de la sala a editar.
 */
function editRoom(id) {
    const room = roomsData.find(r => r.id === id);
    if (room) {
        document.getElementById('roomCardHeader').textContent = 'EDITAR SALA';
        document.getElementById('roomName').value = room.nombre;
        document.getElementById('roomTablesCapacity').value = room.capacidadMesas;
        document.getElementById('roomStatusCheckbox').checked = room.habilitada;
        currentRoomId = room.id; // Almacenar el ID para saber que estamos editando
    } else {
        showCustomAlert('Error', 'Sala no encontrada para editar.');
    }
}

/**
 * @function saveRoom
 * @description Guarda una nueva sala o actualiza una existente.
 * Valida los campos y persiste los datos en localStorage.
 * También gestiona la creación/actualización de mesas asociadas.
 */
async function saveRoom() {
    const roomName = document.getElementById('roomName').value.trim();
    const roomTablesCapacity = parseInt(document.getElementById('roomTablesCapacity').value);
    const roomEnabled = document.getElementById('roomStatusCheckbox').checked;

    if (!roomName) {
        showCustomAlert('Validación', 'Por favor ingrese un nombre para la sala.');
        return;
    }
    if (isNaN(roomTablesCapacity) || roomTablesCapacity < 0) { // Permitir 0 mesas
        showCustomAlert('Validación', 'La capacidad de mesas debe ser un número positivo o cero.');
        return;
    }

    let allMesas = DataManager.getMesas();
    let newRoomId = currentRoomId; // Usar el ID existente si estamos editando

    if (currentRoomId) { // Edición de sala
        const index = roomsData.findIndex(r => r.id === currentRoomId);
        if (index !== -1) {
            // Verificar si el nombre de la sala ya existe en otra sala
            const existingRoomByName = roomsData.find(r => r.nombre.toLowerCase() === roomName.toLowerCase() && r.id !== currentRoomId);
            if (existingRoomByName) {
                showCustomAlert('Error', `Ya existe una sala con el nombre '${roomName}'.`);
                return;
            }

            const oldCapacity = roomsData[index].capacidadMesas;
            roomsData[index] = {
                id: currentRoomId,
                nombre: roomName,
                capacidadMesas: roomTablesCapacity,
                habilitada: roomEnabled
            };
            DataManager.saveSalas(roomsData);
            showCustomAlert('Éxito', `Sala '${roomName}' actualizada exitosamente.`);

            // --- Lógica para ajustar mesas existentes ---
            if (roomTablesCapacity > oldCapacity) {
                // Añadir nuevas mesas
                for (let i = oldCapacity + 1; i <= roomTablesCapacity; i++) {
                    allMesas.push({
                        id: (currentRoomId * 100) + i, // ID único para la mesa
                        numero: i,
                        idSala: currentRoomId,
                        estado: 'disponible',
                        tiempoOcupada: 0,
                        timerId: null
                    });
                }
            } else if (roomTablesCapacity < oldCapacity) {
                // Eliminar mesas si la capacidad disminuye. Eliminamos las últimas mesas.
                // Considerar si hay pedidos activos en esas mesas antes de eliminar en un sistema real.
                allMesas = allMesas.filter(mesa => !(mesa.idSala === currentRoomId && mesa.numero > roomTablesCapacity));
            }
            DataManager.saveMesas(allMesas); // Guardar cambios en las mesas
        } else {
            showCustomAlert('Error', 'No se pudo encontrar la sala para actualizar.');
        }
    } else { // Nueva sala
        // Verificar si el nombre de la sala ya existe
        if (roomsData.some(r => r.nombre.toLowerCase() === roomName.toLowerCase())) {
            showCustomAlert('Error', `Ya existe una sala con el nombre '${roomName}'.`);
            return;
        }

        newRoomId = roomsData.length > 0 ? Math.max(...roomsData.map(r => r.id)) + 1 : 1;
        roomsData.push({
            id: newRoomId,
            nombre: roomName,
            capacidadMesas: roomTablesCapacity,
            habilitada: roomEnabled
        });
        DataManager.saveSalas(roomsData);
        showCustomAlert('Éxito', `Sala '${roomName}' agregada exitosamente.`);

        // --- Lógica para crear mesas para la nueva sala ---
        for (let i = 1; i <= roomTablesCapacity; i++) {
            allMesas.push({
                id: (newRoomId * 100) + i, // ID único para la mesa
                numero: i,
                idSala: newRoomId,
                estado: 'disponible',
                tiempoOcupada: 0,
                timerId: null
            });
        }
        DataManager.saveMesas(allMesas); // Guardar las nuevas mesas
    }

    updateRoomsTable();
    clearRoomForm();
}

/**
 * @function deleteRoom
 * @description Elimina una sala de la lista previa confirmación.
 * También se debe considerar la eliminación de mesas asociadas o su reasignación.
 * Para esta implementación, eliminaremos las mesas asociadas para simplificar.
 * @param {number} id - El ID de la sala a eliminar.
 */
async function deleteRoom(id) {
    const room = roomsData.find(r => r.id === id);
    if (!room) {
        showCustomAlert('Error', 'Sala no encontrada.');
        return;
    }

    const confirmDelete = await showCustomConfirm('Confirmar Eliminación', `¿Está seguro de eliminar la sala '${room.nombre}'? Esta acción también eliminará todas las mesas asociadas a esta sala.`);
    if (confirmDelete) {
        // Eliminar la sala del array de salas
        roomsData = roomsData.filter(r => r.id !== id);
        DataManager.saveSalas(roomsData);

        // Eliminar las mesas asociadas a esta sala del DataManager
        let allMesas = DataManager.getMesas();
        allMesas = allMesas.filter(mesa => mesa.idSala !== id);
        DataManager.saveMesas(allMesas);

        updateRoomsTable();
        showCustomAlert('Éxito', `Sala '${room.nombre}' y sus mesas asociadas eliminadas exitosamente.`);
        clearRoomForm(); // Limpiar el formulario después de eliminar
    }
}

/**
 * @function toggleRoomStatus
 * @description Cambia el estado de habilitado/deshabilitado de una sala
 * y lo persiste en localStorage.
 * @param {number} id - El ID de la sala.
 * @param {boolean} isChecked - El nuevo estado de habilitación (true/false).
 */
function toggleRoomStatus(id, isChecked) {
    const room = roomsData.find(r => r.id === id);
    if (room) {
        room.habilitada = isChecked;
        DataManager.saveSalas(roomsData);
        showCustomAlert('Estado Actualizado', `Sala '${room.nombre}' ${isChecked ? 'habilitada' : 'deshabilitada'}.`);
        // No es necesario actualizar la tabla, el checkbox ya refleja el cambio
    }
}

// --- Event Listeners Específicos para la Página de Salas ---

document.addEventListener("DOMContentLoaded", () => {
    // Cargar las salas al cargar la página
    loadRooms();

    // Listener para el botón "NUEVO" para limpiar el formulario
    const newRoomBtn = document.querySelector('#salas .btn-secondary'); // Botón "NUEVO"
    if (newRoomBtn) {
        newRoomBtn.addEventListener('click', clearRoomForm);
    }

    // Listener para el botón "GUARDAR"
    const saveRoomBtn = document.querySelector('#salas .btn-primary.flex-fill'); // Botón "GUARDAR"
    if (saveRoomBtn) {
        saveRoomBtn.addEventListener('click', saveRoom);
    }

    // Listener para el botón "ELIMINAR" en el formulario
    const deleteRoomFormBtn = document.querySelector('#salas .btn-danger'); // Botón "ELIMINAR" en el formulario
    if (deleteRoomFormBtn) {
        deleteRoomFormBtn.addEventListener('click', async () => {
            if (currentRoomId) {
                await deleteRoom(currentRoomId);
            } else {
                showCustomAlert('Información', 'No hay ninguna sala seleccionada para eliminar.');
            }
        });
    }

    // Listeners para los botones de +/- mesas en el formulario
    const decreaseTablesBtn = document.querySelector('#salas .input-group .btn-danger');
    const increaseTablesBtn = document.querySelector('#salas .input-group .btn-success');
    const roomTablesCapacityInput = document.getElementById('roomTablesCapacity');

    if (decreaseTablesBtn && increaseTablesBtn && roomTablesCapacityInput) {
        decreaseTablesBtn.addEventListener('click', () => {
            let currentValue = parseInt(roomTablesCapacityInput.value);
            if (currentValue > 0) {
                roomTablesCapacityInput.value = currentValue - 1;
            }
        });
        increaseTablesBtn.addEventListener('click', () => {
            let currentValue = parseInt(roomTablesCapacityInput.value);
            roomTablesCapacityInput.value = currentValue + 1;
        });
    }
});

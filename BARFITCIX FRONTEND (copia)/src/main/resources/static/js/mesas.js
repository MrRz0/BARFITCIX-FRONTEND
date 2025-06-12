/**
 * @file mesas.js
 * @description Módulo JavaScript para la gestión de mesas en la aplicación BarFitCIX.
 * Se encarga de la renderización dinámica de las mesas, la gestión de su estado
 * (disponible/ocupada), el control de temporizadores, la selección interactiva
 * (clic, ctrl+clic, long press) y la redirección a la página de pedidos.
 * Los datos se persisten en localStorage a través del DataManager.
 * @author [Tu Nombre/Nombre de la Empresa]
 * @date 2025-06-11
 */

/**
 * @global DataManager - Instancia global del módulo de gestión de datos.
 * @global showCustomAlert - Función global para mostrar alertas personalizadas.
 * @global showCustomConfirm - Función global para mostrar confirmaciones personalizadas.
 */

// Arrays locales para trabajar con mesas y salas
let allMesas = [];
let allSalas = [];
// Array para almacenar los IDs de las mesas seleccionadas
let selectedTables = [];
// Variables para el control de "long press" en dispositivos táctiles
let longPressTimer;
const longPressDuration = 500; // milisegundos
let isLongPressActive = false; // Variable para controlar si un long press ha ocurrido

/**
 * @function loadTables
 * @description Carga las mesas y salas desde el DataManager (localStorage)
 * y actualiza la cuadrícula de mesas en la interfaz. También inicializa los temporizadores.
 */
function loadTables() {
    allMesas = DataManager.getMesas();
    allSalas = DataManager.getSalas();
    renderTablesGrid();
    startAllTableTimers(); // Reinicia los temporizadores para mesas ocupadas al cargar
    updateButtons(); // Asegura que los botones estén en el estado correcto al cargar
}

/**
 * @function renderTablesGrid
 * @description Renderiza la cuadrícula de mesas en 'mesas.html' basándose en los datos cargados.
 * Las mesas de salas deshabilitadas no se mostrarán.
 */
function renderTablesGrid() {
    const tablesGridContainer = document.querySelector('.tables-grid');
    if (!tablesGridContainer) {
        console.error("tables-grid container no encontrado. Asegúrate de estar en mesas.html.");
        return;
    }

    tablesGridContainer.innerHTML = ''; // Limpiar el contenedor antes de renderizar

    // Filtrar mesas para mostrar solo las de salas habilitadas
    const enabledRoomIds = allSalas.filter(sala => sala.habilitada).map(sala => sala.id);
    const mesasToShow = allMesas.filter(mesa => enabledRoomIds.includes(mesa.idSala));

    if (mesasToShow.length === 0) {
        tablesGridContainer.innerHTML = '<p class="text-center text-muted col-12">No hay mesas disponibles en salas habilitadas.</p>';
        return;
    }

    mesasToShow.forEach(mesa => {
        const tableCard = document.createElement('div');
        tableCard.classList.add('table-card');
        tableCard.dataset.tableNumber = mesa.numero; // Número de mesa
        tableCard.dataset.tableId = mesa.id; // ID único de la mesa
        tableCard.dataset.roomId = mesa.idSala; // ID de la sala a la que pertenece

        // Asignar clases de estado visual
        tableCard.classList.add(mesa.estado); // 'disponible' o 'ocupada'

        tableCard.innerHTML = `
            <div class="table-icon">
                <i class="bi bi-circle"></i>
            </div>
            <div><strong>MESA N°${mesa.numero}</strong></div>
            <div class="table-timer">${formatTime(mesa.tiempoOcupada)}</div>
        `;

        // Añadir listeners para la interacción (mouse y touch)
        tableCard.addEventListener('mousedown', (event) => {
            if (event.button === 0) { // Solo clic izquierdo
                handleTableMouseDown(tableCard, mesa.id, event);
            }
        });
        tableCard.addEventListener('mouseup', (event) => {
            if (event.button === 0) { // Solo clic izquierdo
                handleTableMouseUp(tableCard, mesa.id, event);
            }
        });
        tableCard.addEventListener('contextmenu', (event) => {
            // Prevenir el menú contextual en long press para touch
            if ('ontouchstart' in window) {
                event.preventDefault();
            }
        });
        tableCard.addEventListener('touchstart', (event) => {
            handleTableMouseDown(tableCard, mesa.id, event);
        }, { passive: true }); // Usar passive para no bloquear el scroll
        tableCard.addEventListener('touchend', (event) => {
            clearTimeout(longPressTimer); // Limpiar el temporizador de long press
            if (!isLongPressActive && event.cancelable) {
                // Simular un clic para el tap corto si no fue un long press
                const simulatedEvent = new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                    detail: 1, // Indicar que es un clic simple
                    ctrlKey: event.ctrlKey || false // Propagar ctrlKey si existe
                });
                tableCard.dispatchEvent(simulatedEvent);
            }
            isLongPressActive = false; // Resetear el estado de long press
            event.preventDefault(); // Prevenir el clic fantasma si se usó long press
        }, { passive: false }); // Usar passive: false para permitir preventDefault en touchend
        tableCard.addEventListener('touchmove', handleTableMove, { passive: true }); // Usar passive para no bloquear el scroll


        tablesGridContainer.appendChild(tableCard);
    });
}

/**
 * @function formatTime
 * @description Formatea el tiempo en segundos a HH:MM:SS.
 * @param {number} totalSeconds - El tiempo total en segundos.
 * @returns {string} El tiempo formateado.
 */
function formatTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * @function startTableTimer
 * @description Inicia o reanuda el temporizador para una mesa específica.
 * @param {number} mesaId - El ID único de la mesa.
 */
function startTableTimer(mesaId) {
    const mesa = allMesas.find(m => m.id === mesaId);
    if (!mesa || mesa.estado !== 'ocupada') {
        console.log(`No se puede iniciar el temporizador para la mesa ${mesaId}. Estado: ${mesa ? mesa.estado : 'No encontrada'}`);
        return;
    }

    // Limpiar cualquier temporizador existente para esta mesa
    if (mesa.timerId) {
        clearInterval(mesa.timerId);
    }

    // Encontrar el elemento del temporizador en el DOM
    const timerElement = document.querySelector(`.table-card[data-table-id="${mesaId}"] .table-timer`);
    if (!timerElement) {
        console.error(`Elemento de temporizador no encontrado para la mesa ID: ${mesaId}`);
        return;
    }

    // Asegurarse de que el tiempo inicial sea el guardado
    timerElement.textContent = formatTime(mesa.tiempoOcupada);

    mesa.timerId = setInterval(() => {
        mesa.tiempoOcupada++;
        timerElement.textContent = formatTime(mesa.tiempoOcupada);
        // Guardar el estado de la mesa con el tiempo actualizado en localStorage periódicamente
        // Ojo: esto puede ser intensivo, se puede optimizar para guardar menos frecuentemente
        DataManager.saveMesas(allMesas);
    }, 1000);
    DataManager.saveMesas(allMesas); // Guardar el timerId (aunque no es persistente directamente, útil para clearInterval)
}

/**
 * @function startAllTableTimers
 * @description Inicia los temporizadores para todas las mesas que estén en estado 'ocupada'.
 */
function startAllTableTimers() {
    allMesas.forEach(mesa => {
        if (mesa.estado === 'ocupada' && mesa.tiempoOcupada > 0) {
            startTableTimer(mesa.id);
        } else if (mesa.estado === 'disponible') {
            // Asegurarse de que el temporizador esté a 00:00:00 visualmente
            const timerElement = document.querySelector(`.table-card[data-table-id="${mesa.id}"] .table-timer`);
            if (timerElement) {
                timerElement.textContent = '00:00:00';
            }
        }
    });
}

/**
 * @function stopTableTimer
 * @description Detiene el temporizador para una mesa específica.
 * @param {number} mesaId - El ID único de la mesa.
 */
function stopTableTimer(mesaId) {
    const mesa = allMesas.find(m => m.id === mesaId);
    if (mesa && mesa.timerId) {
        clearInterval(mesa.timerId);
        mesa.timerId = null; // Limpiar el ID del intervalo
        DataManager.saveMesas(allMesas);
    }
}

/**
 * @function updateTableStatus
 * @description Actualiza el estado visual y de datos de una mesa (disponible/ocupada).
 * @param {number} mesaId - El ID único de la mesa.
 * @param {string} newStatus - El nuevo estado ('disponible' o 'ocupada').
 * @param {boolean} resetTimer - Si se debe reiniciar el temporizador a 0.
 */
function updateTableStatus(mesaId, newStatus, resetTimer = false) {
    const mesa = allMesas.find(m => m.id === mesaId);
    if (mesa) {
        mesa.estado = newStatus;
        if (newStatus === 'ocupada') {
            const tableCard = document.querySelector(`.table-card[data-table-id="${mesaId}"]`);
            if (tableCard) {
                tableCard.classList.remove('disponible');
                tableCard.classList.add('ocupada');
            }
            if (resetTimer) mesa.tiempoOcupada = 0; // Solo reiniciar si se pide explícitamente
            startTableTimer(mesa.id); // Iniciar/reanudar el temporizador
        } else if (newStatus === 'disponible') {
            stopTableTimer(mesa.id);
            mesa.tiempoOcupada = 0; // Reiniciar siempre el tiempo al estar disponible
            const tableCard = document.querySelector(`.table-card[data-table-id="${mesaId}"]`);
            if (tableCard) {
                tableCard.classList.remove('ocupada');
                tableCard.classList.add('disponible');
                const timerElement = tableCard.querySelector('.table-timer');
                if (timerElement) timerElement.textContent = '00:00:00';
            }
        }
        DataManager.saveMesas(allMesas);
    }
}


/**
 * @function handleTableMouseDown
 * @description Comienza el temporizador para detectar un "mantener presionado" (long press).
 * @param {HTMLElement} element - El elemento DOM de la tarjeta de la mesa.
 * @param {number} mesaId - El ID único de la mesa.
 * @param {Event} event - El evento (mouse o touch) que disparó la función.
 */
function handleTableMouseDown(element, mesaId, event) {
    // No iniciar long press si la mesa no está habilitada (por sala)
    const mesa = allMesas.find(m => m.id === mesaId);
    const sala = allSalas.find(s => s.id === mesa.idSala);
    if (!sala || !sala.habilitada) return;

    // Solo si es un dispositivo táctil O si no estamos en modo Ctrl (para evitar conflicto en PC)
    if ('ontouchstart' in window || !event.ctrlKey) {
        longPressTimer = setTimeout(() => {
            isLongPressActive = true;
            // Si no hay nada seleccionado, la primera pulsación larga lo selecciona
            if (selectedTables.length === 0) {
                clearSelection(); // Asegurarse de que no haya nada accidentalmente seleccionado
                selectedTables.push(mesaId);
                element.classList.add('selected');
            } else if (selectedTables.length > 0 && !selectedTables.includes(mesaId)) {
                // Si ya hay selección y la actual no está, agregarla
                selectedTables.push(mesaId);
                element.classList.add('selected');
            } else if (selectedTables.length > 0 && selectedTables.includes(mesaId)) {
                // Si ya está seleccionada, la long press la deselecciona
                const index = selectedTables.indexOf(mesaId);
                selectedTables.splice(index, 1);
                element.classList.remove('selected');
            }
            updateButtons();
            // showCustomAlert('Selección', 'Modo de selección múltiple activado.'); // Opcional: feedback visual
        }, longPressDuration);
    }
}

/**
 * @function handleTableMouseUp
 * @description Finaliza el evento de clic/toque, limpiando el temporizador de long press
 * y ejecutando la selección si no fue un long press.
 * @param {HTMLElement} element - El elemento DOM de la tarjeta de la mesa.
 * @param {number} mesaId - El ID único de la mesa.
 * @param {Event} event - El evento (mouse o touch) que disparó la función.
 */
function handleTableMouseUp(element, mesaId, event) {
    clearTimeout(longPressTimer);

    const mesa = allMesas.find(m => m.id === mesaId);
    const sala = allSalas.find(s => s.id === mesa.idSala);
    if (!sala || !sala.habilitada) return; // No permitir interacción si la sala está deshabilitada

    // event.detail === 2 es doble click
    if (!isLongPressActive && event.detail !== 2) {
        toggleTableSelection(element, mesaId, event);
    } else if (event.detail === 2) { // Doble clic (o doble tap simulado)
        goToOrder(mesaId); // Doble clic va directo al pedido
        clearSelection(); // Limpiar selección al ir a pedido
    }
    // Si fue un long press, la selección ya se manejó en handleTableMouseDown
    isLongPressActive = false; // Resetear el estado de long press
}

/**
 * @function handleTableMove
 * @description Cancela el long press si el mouse/dedo se mueve significativamente.
 */
function handleTableMove() {
    clearTimeout(longPressTimer);
    isLongPressActive = false; // Asegura que el modo long press se desactive si hay movimiento
}


/**
 * @function toggleTableSelection
 * @description Gestiona la selección de una mesa (clic normal o Ctrl+clic en PC, tap o long press en móvil).
 * @param {HTMLElement} element - El elemento DOM de la tarjeta de la mesa.
 * @param {number} mesaId - El ID único de la mesa.
 * @param {Event} event - El evento (mouse o touch) que disparó la función.
 */
function toggleTableSelection(element, mesaId, event) {
    const mesa = allMesas.find(m => m.id === mesaId);
    const sala = allSalas.find(s => s.id === mesa.idSala);
    if (!sala || !sala.habilitada) {
        showCustomAlert('Información', 'Esta sala está deshabilitada.');
        return;
    }

    if (event.ctrlKey) { // En PC, si Ctrl está presionado
        const index = selectedTables.indexOf(mesaId);
        if (index > -1) {
            selectedTables.splice(index, 1);
            element.classList.remove('selected');
        } else {
            selectedTables.push(mesaId);
            element.classList.add('selected');
        }
    } else { // Clic normal en PC o tap corto en móvil
        clearSelection(); // Deseleccionar todo lo demás
        selectedTables.push(mesaId);
        element.classList.add('selected');
    }
    updateButtons();
}

/**
 * @function updateButtons
 * @description Actualiza la visibilidad y estado de los botones "Tomar Pedido" y "Unir Mesas"
 * basándose en la cantidad de mesas seleccionadas.
 */
function updateButtons() {
    const orderBtn = document.getElementById('orderBtn');
    const joinBtn = document.getElementById('joinTablesBtn');

    if (!orderBtn || !joinBtn) return;

    if (selectedTables.length === 1) {
        orderBtn.style.display = 'inline-block';
        joinBtn.style.display = 'none';
    } else if (selectedTables.length > 1) {
        orderBtn.style.display = 'inline-block';
        joinBtn.style.display = 'inline-block';
    } else {
        orderBtn.style.display = 'none';
        joinBtn.style.display = 'none';
    }
}

/**
 * @function goToOrderSelected
 * @description Redirige a la página de pedido para la primera mesa seleccionada.
 */
function goToOrderSelected() {
    if (selectedTables.length >= 1) {
        window.location.href = `/pedido/${selectedTables[0]}`; // Pasar el ID de la mesa
        clearSelection(); // Limpiar la selección después de la acción
    } else {
        showCustomAlert('Información', 'Por favor, selecciona al menos una mesa para tomar pedido.');
    }
}

/**
 * @function goToOrder
 * @description Redirige a la página de pedido para una mesa específica.
 * @param {number} mesaId - El ID único de la mesa.
 */
function goToOrder(mesaId) {
    window.location.href = `/pedido/${mesaId}`; // Pasar el ID de la mesa
    clearSelection(); // Limpiar la selección después de la acción
}

/**
 * @function joinTables
 * @description Une las mesas seleccionadas, marcándolas como ocupadas.
 */
async function joinTables() {
    if (selectedTables.length > 1) {
        const confirmJoin = await showCustomConfirm('Confirmar Unión', `¿Está seguro de unir las mesas: ${selectedTables.map(id => `Mesa N°${allMesas.find(m => m.id === id).numero}`).join(', ')}?`);
        if (confirmJoin) {
            selectedTables.forEach(mesaId => {
                // Al unir, marcar la mesa como ocupada y reiniciar el temporizador
                updateTableStatus(mesaId, 'ocupada', true);
            });
            showCustomAlert('Éxito', `Mesas unidas y marcadas como ocupadas: ${selectedTables.map(id => `Mesa N°${allMesas.find(m => m.id === id).numero}`).join(', ')}`);
            clearSelection();
            renderTablesGrid(); // Re-renderizar para reflejar el estado visual si es necesario
        }
    } else {
        showCustomAlert('Información', "Selecciona al menos dos mesas para unir.");
    }
}

/**
 * @function clearSelection
 * @description Deselecciona todas las mesas actualmente seleccionadas y oculta los botones de acción.
 */
function clearSelection() {
    const selectedElements = document.querySelectorAll('.table-card.selected');
    selectedElements.forEach(element => {
        element.classList.remove('selected');
    });
    selectedTables = [];
    updateButtons();
    isLongPressActive = false; // Asegura que el modo long press se desactive
}

// --- Event Listeners Específicos para la Página de Mesas ---

document.addEventListener("DOMContentLoaded", () => {
    // Cargar todas las mesas y salas al cargar la página
    loadTables();

    // Listener para el botón "Tomar Pedido"
    const orderBtn = document.getElementById('orderBtn');
    if (orderBtn) {
        orderBtn.addEventListener('click', goToOrderSelected);
    }

    // Listener para el botón "Unir Mesas"
    const joinBtn = document.getElementById('joinTablesBtn');
    if (joinBtn) {
        joinBtn.addEventListener('click', joinTables);
    }

    // Listener para el botón "Volver a Salas" (asegura que limpie la selección si se vuelve)
    const backToRoomsBtn = document.querySelector('.content-area .btn-secondary');
    if (backToRoomsBtn) {
        backToRoomsBtn.addEventListener('click', clearSelection);
    }
});

// Exponer funciones necesarias para otras partes del código si fuera necesario
// window.updateTableStatus = updateTableStatus; // Para que otras páginas puedan cambiar el estado de las mesas

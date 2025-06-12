/**
 * @file resumen-pedido.js
 * @description Módulo JavaScript para la página de resumen de pedido y pago fraccionado
 * en la aplicación BarFitCIX. Permite visualizar los detalles de un pedido,
 * finalizarlo (cambiando el estado de la mesa), y procesar pagos fraccionados.
 * @author [Tu Nombre/Nombre de la Empresa]
 * @date 2025-06-11
 */

/**
 * @global DataManager - Instancia global del módulo de gestión de datos.
 * @global showCustomAlert - Función global para mostrar alertas personalizadas.
 * @global showCustomConfirm - Función global para mostrar confirmaciones personalizadas.
 */

// Objeto para almacenar el pedido actual que se está visualizando
let currentOrderSummary = null;
// Array para gestionar las personas en el pago fraccionado
let splitPaymentPeople = [];

/**
 * @function getOrderIdFromUrl
 * @description Extrae el ID del pedido de la URL actual.
 * @returns {number|null} El ID del pedido o null si no se encuentra.
 */
function getOrderIdFromUrl() {
    const pathParts = window.location.pathname.split('/');
    const orderIdIndex = pathParts.indexOf('resumen-pedido') + 1;
    if (orderIdIndex > 0 && pathParts[orderIdIndex]) {
        return parseInt(pathParts[orderIdIndex]);
    }
    return null;
}

/**
 * @function loadOrderSummary
 * @description Carga los detalles de un pedido específico desde el DataManager
 * y los muestra en la interfaz.
 */
function loadOrderSummary() {
    const orderId = getOrderIdFromUrl();
    if (!orderId) {
        showCustomAlert('Error', 'ID de pedido no encontrado en la URL.');
        // Opcional: redirigir a historial-pedidos
        // window.location.href = '/historial-pedidos';
        return;
    }

    const allPedidos = DataManager.getPedidos();
    currentOrderSummary = allPedidos.find(p => p.id === orderId);

    if (!currentOrderSummary) {
        showCustomAlert('Error', `Pedido con ID ${orderId} no encontrado.`);
        // window.location.href = '/historial-pedidos';
        return;
    }

    // Llenar la información del pedido
    const sala = DataManager.getSalas().find(s => s.id === currentOrderSummary.idSala);
    const mesa = DataManager.getMesas().find(m => m.id === currentOrderSummary.idMesa);

    document.getElementById('resumenClienteNombre').value = currentOrderSummary.atendidoPor || 'N/A'; // Usar atendidoPor como cliente de ejemplo
    document.getElementById('resumenClienteDNI').value = '---'; // No tenemos DNI en el modelo
    document.getElementById('resumenSalaNombre').value = sala ? sala.nombre : 'N/A';
    document.getElementById('resumenMesaNumero').value = mesa ? mesa.numero : currentOrderSummary.numeroMesa || 'N/A';
    document.getElementById('resumenFechaHora').value = currentOrderSummary.fecha;
    document.getElementById('totalPedidoAmount').value = `S/. ${currentOrderSummary.total.toFixed(2)}`;

    renderOrderItemsSummaryTable();
    updateFinalizeButtonState(); // Actualizar estado del botón Finalizar
}

/**
 * @function renderOrderItemsSummaryTable
 * @description Renderiza la tabla de ítems del pedido en la página de resumen.
 */
function renderOrderItemsSummaryTable() {
    const tbody = document.getElementById('resumenOrderItemsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    if (currentOrderSummary.items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No hay ítems en este pedido.</td></tr>';
        return;
    }

    currentOrderSummary.items.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>S/. ${item.price.toFixed(2)}</td>
            <td>S/. ${item.subtotal.toFixed(2)}</td>
            <td>${item.comment ? item.comment : 'Sin comentario'}</td>
        `;
        tbody.appendChild(row);
    });
}

/**
 * @function finalizeOrder
 * @description Marca el pedido actual como 'FINALIZADO' y actualiza el estado de la mesa.
 */
async function finalizeOrder() {
    if (!currentOrderSummary) {
        showCustomAlert('Error', 'No hay un pedido cargado para finalizar.');
        return;
    }

    const confirmFinalize = await showCustomConfirm('Confirmar Finalización', `¿Está seguro de finalizar el pedido N°${currentOrderSummary.id} (Mesa N°${currentOrderSummary.numeroMesa})?`);
    if (confirmFinalize) {
        const allPedidos = DataManager.getPedidos();
        const orderIndex = allPedidos.findIndex(p => p.id === currentOrderSummary.id);
        if (orderIndex !== -1) {
            allPedidos[orderIndex].estado = 'FINALIZADO';
            DataManager.savePedidos(allPedidos);
            currentOrderSummary.estado = 'FINALIZADO'; // Actualizar el objeto en memoria también

            // Actualizar el estado de la mesa asociada: disponible y temporizador a 0
            let mesas = DataManager.getMesas();
            const mesaIndex = mesas.findIndex(m => m.id === currentOrderSummary.idMesa);
            if (mesaIndex !== -1) {
                mesas[mesaIndex].estado = 'disponible';
                mesas[mesaIndex].tiempoOcupada = 0;
                // Si mesas.js está cargado y exporta updateTableStatus, usarla:
                if (typeof updateTableStatus === 'function') { // Check if the function is global
                    updateTableStatus(currentOrderSummary.idMesa, 'disponible', true);
                } else {
                    // Fallback si updateTableStatus no es global, solo guardar los datos
                    DataManager.saveMesas(mesas);
                }
            }

            showCustomAlert('Pedido Finalizado', `El pedido N°${currentOrderSummary.id} para la Mesa N°${currentOrderSummary.numeroMesa} ha sido finalizado.`);
            updateFinalizeButtonState(); // Deshabilitar el botón una vez finalizado
        } else {
            showCustomAlert('Error', 'No se pudo encontrar el pedido para finalizar.');
        }
    }
}

/**
 * @function updateFinalizeButtonState
 * @description Habilita o deshabilita el botón de finalizar pedido según el estado del pedido.
 */
function updateFinalizeButtonState() {
    const finalizeBtn = document.getElementById('finalizeOrderBtn');
    if (finalizeBtn && currentOrderSummary) {
        finalizeBtn.disabled = currentOrderSummary.estado === 'FINALIZADO';
    }
}


// --- Funciones de Pago Fraccionado ---

/**
 * @function openSplitPaymentModal
 * @description Inicializa y abre el modal de pago fraccionado.
 */
function openSplitPaymentModal() {
    if (!currentOrderSummary) {
        showCustomAlert('Error', 'No hay un pedido cargado para pago fraccionado.');
        return;
    }
    if (currentOrderSummary.estado === 'FINALIZADO') {
        showCustomAlert('Información', 'Este pedido ya ha sido finalizado. No se puede procesar el pago fraccionado.');
        return;
    }

    let totalAmount = currentOrderSummary.total || 0;

    document.getElementById('splitTotalAmount').value = `S/. ${totalAmount.toFixed(2)}`;
    document.getElementById('numPeopleSplit').value = '1'; // Reset a 1 persona por defecto
    splitPaymentPeople = []; // Limpiar personas previas
    updateSplitPaymentRows(); // Generar la primera fila
    const modal = new bootstrap.Modal(document.getElementById('splitPaymentModal'));
    modal.show();
}

/**
 * @function changeSplitPeople
 * @description Modifica el número de personas para el pago fraccionado y actualiza las filas.
 * @param {number} change - El cambio a aplicar (ej. 1 para incrementar, -1 para decrementar).
 */
function changeSplitPeople(change) {
    const numPeopleInput = document.getElementById('numPeopleSplit');
    let currentNum = parseInt(numPeopleInput.value) || 1;
    currentNum += change;
    if (currentNum < 1) currentNum = 1;
    numPeopleInput.value = currentNum;
    updateSplitPaymentRows();
}

/**
 * @function updateSplitPaymentRows
 * @description Renderiza las filas de entrada para cada persona en el modal de pago fraccionado.
 */
function updateSplitPaymentRows() {
    const numPeople = parseInt(document.getElementById('numPeopleSplit').value);
    const splitPaymentRowsContainer = document.getElementById('splitPaymentRows');
    splitPaymentRowsContainer.innerHTML = '';

    let totalAmount = currentOrderSummary.total || 0;
    const amountPerPerson = (totalAmount / numPeople).toFixed(2);

    splitPaymentPeople = []; // Resetear el array de personas al cambiar el número

    for (let i = 0; i < numPeople; i++) {
        const rowDiv = document.createElement('div');
        rowDiv.classList.add('row', 'mb-3', 'align-items-center');
        rowDiv.innerHTML = `
            <div class="col-md-5">
                <input type="text" class="form-control" placeholder="Nombre Persona ${i + 1}" id="personName${i}" value="Persona ${i + 1}">
            </div>
            <div class="col-md-5">
                <div class="input-group">
                    <span class="input-group-text">S/.</span>
                    <input type="number" class="form-control person-amount" value="${amountPerPerson}" step="0.01">
                </div>
            </div>
            <div class="col-md-2">
                <button class="btn btn-sm btn-info w-100" onclick="generateIndividualBoleta(${i})">Boleta</button>
            </div>
        `;
        splitPaymentRowsContainer.appendChild(rowDiv);
        splitPaymentPeople.push({
            name: `Persona ${i + 1}`, // Nombre inicial
            amount: parseFloat(amountPerPerson)
        });
    }
    // Añadir listener para validar montos cuando se cambian los inputs
    document.querySelectorAll('#splitPaymentRows .person-amount').forEach(input => {
        input.addEventListener('input', validateSplitAmounts);
    });
    validateSplitAmounts(); // Ejecutar validación inicial
}

/**
 * @function validateSplitAmounts
 * @description Valida que la suma de los montos individuales en el pago fraccionado
 * coincida con el total del pedido, mostrando una advertencia si hay diferencia.
 */
function validateSplitAmounts() {
    let totalPedido = currentOrderSummary.total || 0;
    let currentSum = 0;
    const amountInputs = document.querySelectorAll('#splitPaymentRows .person-amount');

    amountInputs.forEach(input => {
        currentSum += parseFloat(input.value) || 0;
    });

    const diff = Math.abs(totalPedido - currentSum);
    const footer = document.querySelector('#splitPaymentModal .modal-footer');
    let warningElement = document.getElementById('splitAmountWarning');

    if (diff > 0.01) { // Pequeña tolerancia para errores de flotante
        if (!warningElement) {
            warningElement = document.createElement('div');
            warningElement.id = 'splitAmountWarning';
            warningElement.classList.add('alert', 'alert-warning', 'w-100', 'text-center', 'mb-2');
            footer.insertBefore(warningElement, footer.firstChild);
        }
        warningElement.textContent = `La suma de los pagos (${currentSum.toFixed(2)}) no coincide con el total del pedido (${totalPedido.toFixed(2)}). Diferencia: ${diff.toFixed(2)}`;
    } else {
        if (warningElement) {
            warningElement.remove();
        }
    }
}

/**
 * @function processSplitPayment
 * @description Procesa los pagos fraccionados, valida los montos y finaliza el pedido.
 */
async function processSplitPayment() {
    let totalPedido = currentOrderSummary.total || 0;
    let currentSum = 0;
    const amountInputs = document.querySelectorAll('#splitPaymentRows .person-amount');
    const nameInputs = document.querySelectorAll('#splitPaymentRows input[type="text"]');

    splitPaymentPeople = []; // Reiniciar para capturar los valores actuales
    amountInputs.forEach((input, index) => {
        const name = nameInputs[index].value || `Persona ${index + 1}`;
        const amount = parseFloat(input.value) || 0;
        splitPaymentPeople.push({ name, amount });
        currentSum += amount;
    });

    const diff = Math.abs(totalPedido - currentSum);

    if (diff > 0.01) {
        showCustomAlert('Error de Pago', `Error: La suma de los pagos (${currentSum.toFixed(2)}) no coincide con el total del pedido (${totalPedido.toFixed(2)}). Ajusta los montos.`);
        return;
    }

    let confirmationMessage = "Se procesarán los siguientes pagos:\n";
    splitPaymentPeople.forEach(p => {
        confirmationMessage += `- ${p.name}: S/. ${p.amount.toFixed(2)}\n`;
    });
    confirmationMessage += "\n¿Confirmar pagos y finalizar pedido?";

    const confirmProcess = await showCustomConfirm('Confirmar Pagos', confirmationMessage);
    if (confirmProcess) {
        // Finalizar el pedido si los pagos son correctos
        const allPedidos = DataManager.getPedidos();
        const orderIndex = allPedidos.findIndex(p => p.id === currentOrderSummary.id);
        if (orderIndex !== -1) {
            allPedidos[orderIndex].estado = 'FINALIZADO';
            DataManager.savePedidos(allPedidos);
            currentOrderSummary.estado = 'FINALIZADO'; // Actualizar el objeto en memoria

            // Actualizar el estado de la mesa asociada: disponible y temporizador a 0
            let mesas = DataManager.getMesas();
            const mesaIndex = mesas.findIndex(m => m.id === currentOrderSummary.idMesa);
            if (mesaIndex !== -1) {
                mesas[mesaIndex].estado = 'disponible';
                mesas[mesaIndex].tiempoOcupada = 0;
                if (typeof updateTableStatus === 'function') {
                    updateTableStatus(currentOrderSummary.idMesa, 'disponible', true);
                } else {
                    DataManager.saveMesas(mesas);
                }
            }
            showCustomAlert('Pagos Procesados', 'Pagos procesados exitosamente y pedido finalizado.');
            const modal = bootstrap.Modal.getInstance(document.getElementById('splitPaymentModal'));
            modal.hide();
            updateFinalizeButtonState(); // Deshabilitar el botón de finalizar
        } else {
            showCustomAlert('Error', 'No se pudo encontrar el pedido para procesar pagos.');
        }
    }
}

/**
 * @function generateIndividualBoleta
 * @description Simula la generación de una boleta individual para una persona en el pago fraccionado.
 * @param {number} personIndex - El índice de la persona en el array splitPaymentPeople.
 */
function generateIndividualBoleta(personIndex) {
    const nameInput = document.getElementById(`personName${personIndex}`);
    const amountInput = document.querySelectorAll('#splitPaymentRows .person-amount')[personIndex];

    const personName = nameInput.value || `Persona ${personIndex + 1}`;
    const personAmount = parseFloat(amountInput.value) || 0;

    showCustomAlert('Generando Boleta', `Generando boleta para ${personName} por S/. ${personAmount.toFixed(2)}. (Simulado)`);
}


// --- Event Listeners Específicos para la Página de Resumen de Pedido ---

document.addEventListener("DOMContentLoaded", () => {
    // Cargar los detalles del pedido al cargar la página
    loadOrderSummary();

    // Listener para el botón "FINALIZAR"
    const finalizeOrderBtn = document.getElementById('finalizeOrderBtn');
    if (finalizeOrderBtn) {
        finalizeOrderBtn.addEventListener('click', finalizeOrder);
    }

    // Listener para el botón "PAGO FRACCIONADO"
    const splitPaymentModalBtn = document.querySelector('[data-bs-target="#splitPaymentModal"]');
    if (splitPaymentModalBtn) {
        splitPaymentModalBtn.addEventListener('click', openSplitPaymentModal);
    }

    // Listener para el botón de "Procesar Pagos" dentro del modal de pago fraccionado
    const processSplitPaymentBtn = document.querySelector('#splitPaymentModal .btn-primary');
    if (processSplitPaymentBtn) {
        processSplitPaymentBtn.addEventListener('click', processSplitPayment);
    }
});

/**
 * @file pedido.js
 * @description Módulo JavaScript para la creación y gestión de pedidos en la aplicación BarFitCIX.
 * Permite añadir platos al pedido, modificar cantidades, gestionar comentarios por ítem,
 * y guardar el pedido, persistiendo los datos en localStorage a través del DataManager.
 * @author [Tu Nombre/Nombre de la Empresa]
 * @date 2025-06-11
 */

/**
 * @global DataManager - Instancia global del módulo de gestión de datos.
 * @global showCustomAlert - Función global para mostrar alertas personalizadas.
 * @global showCustomConfirm - Función global para mostrar confirmaciones personalizadas.
 */

// Array para almacenar los ítems del pedido actual
let orderItems = [];
// Variable para almacenar el ID de la mesa asociada a este pedido
let currentTableId = null;
// Variable para almacenar el ID del pedido si estamos editando uno existente
let currentOrderId = null;
// Objeto para almacenar el ítem del pedido actualmente seleccionado en la tabla
let selectedOrderItem = null;
// Elemento HTML de la fila actualmente seleccionada en la tabla
let selectedOrderRowElement = null;

/**
 * @function getMesaIdFromUrl
 * @description Extrae el ID de la mesa de la URL actual.
 * @returns {number|null} El ID de la mesa o null si no se encuentra.
 */
function getMesaIdFromUrl() {
    const pathParts = window.location.pathname.split('/');
    const mesaIdIndex = pathParts.indexOf('pedido') + 1;
    if (mesaIdIndex > 0 && pathParts[mesaIdIndex]) {
        return parseInt(pathParts[mesaIdIndex]);
    }
    return null;
}

/**
 * @function loadOrderData
 * @description Carga los platos disponibles y, si es un pedido existente, sus ítems.
 */
function loadOrderData() {
    // Si la URL contiene un ID de mesa, lo usamos.
    currentTableId = getMesaIdFromUrl();

    // Podemos buscar si ya existe un pedido PENDIENTE para esta mesa
    const allPedidos = DataManager.getPedidos();
    const existingPendingOrder = allPedidos.find(p => p.idMesa === currentTableId && p.estado === 'PENDIENTE');

    if (existingPendingOrder) {
        currentOrderId = existingPendingOrder.id;
        orderItems = existingPendingOrder.items;
        showCustomAlert('Pedido Pendiente', `Se ha cargado un pedido pendiente para la Mesa N°${currentTableId}.`);
    } else {
        // Si no hay pedido pendiente, inicializar como un nuevo pedido
        orderItems = [];
        currentOrderId = null; // Asegurarse de que no estamos en modo edición de un pedido
    }

    updateOrderTable();
    updateTotal();
    updateMenuPanel(); // Renderiza los platos disponibles del menú
    updateOrderSummaryInfo(); // Actualiza la info de la mesa/sala en la interfaz
}

/**
 * @function updateOrderSummaryInfo
 * @description Actualiza la información de la mesa y sala en el encabezado del pedido.
 */
function updateOrderSummaryInfo() {
    const tableIdDisplay = document.getElementById('pedidoMesaId');
    const salaNameDisplay = document.getElementById('pedidoSalaNombre');

    if (!tableIdDisplay || !salaNameDisplay) return;

    const mesa = DataManager.getMesas().find(m => m.id === currentTableId);
    if (mesa) {
        const sala = DataManager.getSalas().find(s => s.id === mesa.idSala);
        tableIdDisplay.textContent = `N°${mesa.numero}`;
        salaNameDisplay.textContent = sala ? sala.nombre : 'Desconocida';
    } else {
        tableIdDisplay.textContent = 'N/A';
        salaNameDisplay.textContent = 'N/A';
    }
}


/**
 * @function updateMenuPanel
 * @description Renderiza los platos disponibles en el panel de menú.
 */
function updateMenuPanel() {
    const menuItemsContainer = document.querySelector('.menu-items');
    if (!menuItemsContainer) return;

    menuItemsContainer.innerHTML = '';
    const availablePlatos = DataManager.getPlatos();

    if (availablePlatos.length === 0) {
        menuItemsContainer.innerHTML = '<p class="text-center text-muted col-12">No hay platos disponibles.</p>';
        return;
    }

    availablePlatos.forEach(plato => {
        const menuItemDiv = document.createElement('div');
        menuItemDiv.classList.add('menu-item');
        menuItemDiv.dataset.platoId = plato.id; // Usar el ID del plato
        menuItemDiv.dataset.name = plato.nombre;
        menuItemDiv.dataset.price = plato.precio.toFixed(2);

        menuItemDiv.innerHTML = `
            <div>
                <div><strong>${plato.nombre}</strong></div>
                <div class="text-muted">S/. ${plato.precio.toFixed(2)}</div>
            </div>
            <button class="btn btn-sm btn-primary" onclick="addMenuItem(this)">
                <i class="bi bi-plus"></i>
            </button>
        `;
        menuItemsContainer.appendChild(menuItemDiv);
    });
}


/**
 * @function addMenuItem
 * @description Agrega un plato del menú al pedido actual o incrementa su cantidad.
 * @param {HTMLElement} button - El botón "agregar" que fue clickeado.
 */
function addMenuItem(button) {
    const menuItem = button.closest('.menu-item');
    const platoId = parseInt(menuItem.dataset.platoId);
    const name = menuItem.dataset.name;
    const price = parseFloat(menuItem.dataset.price);

    const existingItem = orderItems.find(item => item.platoId === platoId);

    if (existingItem) {
        existingItem.quantity += 1;
        existingItem.subtotal = existingItem.quantity * existingItem.price;
    } else {
        orderItems.push({
            platoId: platoId,
            name: name,
            quantity: 1,
            price: price,
            subtotal: price,
            comment: '' // Inicializar comentario vacío
        });
    }
    updateOrderTable();
    updateTotal();
    showCustomAlert('Plato Agregado', `Se ha agregado ${name} al pedido.`);
}

/**
 * @function updateOrderTable
 * @description Renderiza y actualiza la tabla de ítems del pedido.
 * Hace la columna de cantidad editable.
 */
function updateOrderTable() {
    const tbody = document.getElementById('orderItemsTable');
    if (!tbody) return;

    tbody.innerHTML = '';
    if (orderItems.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No hay ítems en el pedido.</td></tr>';
        resetCommentPanel(); // Limpiar el panel de comentarios si no hay ítems
        return;
    }

    orderItems.forEach((item, index) => {
        const row = document.createElement('tr');
        row.dataset.index = index; // Para identificar el ítem al seleccionar la fila
        row.dataset.platoId = item.platoId; // Para identificar el plato por ID
        // Listener para seleccionar la fila
        row.addEventListener('click', () => selectOrderRow(row, index));

        row.innerHTML = `
            <td>${item.name}</td>
            <td>
                <input type="number" class="form-control form-control-sm order-quantity-input"
                       value="${item.quantity}" min="1" data-index="${index}">
            </td>
            <td>S/. ${item.price.toFixed(2)}</td>
            <td>S/. ${item.subtotal.toFixed(2)}</td>
            <td>${item.comment ? item.comment : 'Sin comentario'}</td>
        `;
        tbody.appendChild(row);
    });

    // Añadir event listeners a los inputs de cantidad después de renderizar
    document.querySelectorAll('.order-quantity-input').forEach(input => {
        input.addEventListener('change', (event) => updateItemQuantity(event.target));
        input.addEventListener('input', (event) => updateItemQuantity(event.target)); // Para updates en tiempo real
    });
}

/**
 * @function updateItemQuantity
 * @description Actualiza la cantidad de un ítem en el pedido y recalcula subtotales/total.
 * @param {HTMLElement} inputElement - El input de cantidad que disparó el evento.
 */
function updateItemQuantity(inputElement) {
    const index = parseInt(inputElement.dataset.index);
    let newQuantity = parseInt(inputElement.value);

    if (isNaN(newQuantity) || newQuantity < 1) {
        newQuantity = 1; // Asegurar que la cantidad mínima sea 1
        inputElement.value = 1; // Actualizar el input
    }

    if (orderItems[index]) {
        orderItems[index].quantity = newQuantity;
        orderItems[index].subtotal = orderItems[index].quantity * orderItems[index].price;
        updateOrderTable(); // Re-renderizar la tabla para actualizar subtotales
        updateTotal();
    }
}

/**
 * @function selectOrderRow
 * @description Selecciona una fila en la tabla de pedidos y carga su comentario en el panel.
 * @param {HTMLElement} rowElement - El elemento <tr> de la fila seleccionada.
 * @param {number} index - El índice del ítem en el array orderItems.
 */
function selectOrderRow(rowElement, index) {
    // Deseleccionar la fila anterior si existe
    if (selectedOrderRowElement) {
        selectedOrderRowElement.classList.remove('table-active');
    }
    selectedOrderRowElement = rowElement;
    selectedOrderRowElement.classList.add('table-active');

    // Almacenar el ítem seleccionado
    selectedOrderItem = orderItems[index];

    // Cargar comentario en el panel
    const commentTextArea = document.getElementById('commentTextArea');
    const addCommentBtn = document.getElementById('addCommentBtn');
    const deleteCommentBtn = document.getElementById('deleteCommentBtn');
    const editOrderBtn = document.getElementById('editOrderBtn'); // Botón de edición global

    if (commentTextArea && addCommentBtn && deleteCommentBtn && editOrderBtn) {
        commentTextArea.value = selectedOrderItem.comment || '';
        commentTextArea.disabled = false;
        addCommentBtn.disabled = false;
        deleteCommentBtn.disabled = !selectedOrderItem.comment; // Deshabilitar si no hay comentario
        editOrderBtn.disabled = false; // Habilitar botón global de edición
    }
}

/**
 * @function resetCommentPanel
 * @description Limpia y deshabilita el panel de comentarios.
 */
function resetCommentPanel() {
    const commentTextArea = document.getElementById('commentTextArea');
    const addCommentBtn = document.getElementById('addCommentBtn');
    const deleteCommentBtn = document.getElementById('deleteCommentBtn');
    const editOrderBtn = document.getElementById('editOrderBtn');

    if (commentTextArea && addCommentBtn && deleteCommentBtn && editOrderBtn) {
        commentTextArea.value = '';
        commentTextArea.disabled = true;
        addCommentBtn.disabled = true;
        deleteCommentBtn.disabled = true;
        editOrderBtn.disabled = true;
    }
    // Deseleccionar fila en la tabla
    if (selectedOrderRowElement) {
        selectedOrderRowElement.classList.remove('table-active');
    }
    selectedOrderItem = null;
    selectedOrderRowElement = null;
}

/**
 * @function saveComment
 * @description Guarda el comentario ingresado para el ítem de pedido seleccionado.
 */
async function saveComment() {
    if (!selectedOrderItem) {
        showCustomAlert('Error', 'No hay ningún plato seleccionado para agregar/editar comentario.');
        return;
    }
    const commentTextArea = document.getElementById('commentTextArea');
    selectedOrderItem.comment = commentTextArea.value.trim();
    updateOrderTable(); // Re-renderizar para mostrar el comentario en la tabla
    updateCommentPanelButtons(); // Actualizar botones del panel de comentarios
    showCustomAlert('Comentario Guardado', `Comentario para '${selectedOrderItem.name}' guardado.`);
}

/**
 * @function deleteComment
 * @description Elimina el comentario del ítem de pedido seleccionado.
 */
async function deleteComment() {
    if (!selectedOrderItem) {
        showCustomAlert('Error', 'No hay ningún plato seleccionado para eliminar comentario.');
        return;
    }
    const confirmDelete = await showCustomConfirm('Confirmar Eliminación', `¿Está seguro de eliminar el comentario para '${selectedOrderItem.name}'?`);
    if (confirmDelete) {
        selectedOrderItem.comment = '';
        document.getElementById('commentTextArea').value = ''; // Limpiar el área de texto
        updateOrderTable(); // Re-renderizar para quitar el comentario de la tabla
        updateCommentPanelButtons(); // Actualizar botones del panel de comentarios
        showCustomAlert('Comentario Eliminado', `Comentario para '${selectedOrderItem.name}' eliminado.`);
    }
}

/**
 * @function updateCommentPanelButtons
 * @description Actualiza el estado de los botones del panel de comentarios.
 */
function updateCommentPanelButtons() {
    const commentTextArea = document.getElementById('commentTextArea');
    const deleteCommentBtn = document.getElementById('deleteCommentBtn');
    if (commentTextArea && deleteCommentBtn && selectedOrderItem) {
        deleteCommentBtn.disabled = !selectedOrderItem.comment && commentTextArea.value.trim() === '';
    }
}

/**
 * @function updateTotal
 * @description Calcula y actualiza el total del pedido.
 */
function updateTotal() {
    const totalAmountElement = document.getElementById('totalAmount');
    if (!totalAmountElement) return;

    const total = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
    totalAmountElement.textContent = `S/. ${total.toFixed(2)}`;

    // También actualizar el total en el modal de pago fraccionado si está abierto
    const splitTotalAmountInput = document.getElementById('splitTotalAmount');
    if (splitTotalAmountInput) {
        splitTotalAmountInput.value = `S/. ${total.toFixed(2)}`;
    }
}

/**
 * @function saveOrder
 * @description Guarda el pedido actual en el DataManager.
 * Si es un nuevo pedido, lo crea. Si ya existe uno pendiente para la mesa, lo actualiza.
 */
async function saveOrder() {
    if (orderItems.length === 0) {
        showCustomAlert('Atención', 'Debe agregar al menos un ítem al pedido para guardar.');
        return;
    }

    const allPedidos = DataManager.getPedidos();
    const mesa = DataManager.getMesas().find(m => m.id === currentTableId);

    if (!mesa) {
        showCustomAlert('Error', 'Mesa no encontrada para guardar el pedido.');
        return;
    }

    const now = new Date();
    const dateTimeString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const totalPedido = orderItems.reduce((sum, item) => sum + item.subtotal, 0);

    let pedidoToSave;

    if (currentOrderId) { // Actualizar un pedido existente
        const index = allPedidos.findIndex(p => p.id === currentOrderId);
        if (index !== -1) {
            pedidoToSave = allPedidos[index];
            pedidoToSave.items = orderItems;
            pedidoToSave.total = totalPedido;
            // Estado y fecha/hora de actualización se mantienen si no se finaliza aquí
            allPedidos[index] = pedidoToSave;
        }
    } else { // Crear un nuevo pedido
        const newOrderId = allPedidos.length > 0 ? Math.max(...allPedidos.map(p => p.id)) + 1 : 1;
        pedidoToSave = {
            id: newOrderId,
            idMesa: currentTableId,
            numeroMesa: mesa.numero, // Para facilitar la visualización en el historial
            idSala: mesa.idSala, // Para facilitar la visualización en el historial
            fecha: dateTimeString,
            total: totalPedido,
            estado: 'PENDIENTE', // Nuevo pedido siempre es PENDIENTE
            items: orderItems,
            atendidoPor: 'Nombre de Usuario' // Placeholder, se podría obtener del login
        };
        allPedidos.push(pedidoToSave);
        currentOrderId = newOrderId; // Guardar el ID del nuevo pedido
    }

    // Persistir el array de pedidos actualizado
    DataManager.savePedidos(allPedidos);

    // Actualizar el estado de la mesa a 'ocupada' y reiniciar/iniciar temporizador
    // Suponemos que mesas.js tiene la función updateTableStatus expuesta (o cargaremos mesasData aquí)
    let mesas = DataManager.getMesas();
    const mesaIndex = mesas.findIndex(m => m.id === currentTableId);
    if (mesaIndex !== -1) {
        if (mesas[mesaIndex].estado !== 'ocupada') {
            mesas[mesaIndex].estado = 'ocupada';
            mesas[mesaIndex].tiempoOcupada = 0; // Reiniciar al tomar un nuevo pedido
            DataManager.saveMesas(mesas);
            // Si estuviéramos en mesas.html, llamaríamos a updateTableStatus.
            // Aquí solo actualizamos el dato, la visualización se hará al recargar mesas.html
        }
    }

    showCustomAlert('Pedido Guardado', `Pedido para Mesa N°${mesa.numero} guardado exitosamente.`);
    // Opcional: Redirigir o limpiar el pedido para uno nuevo
    // clearOrderForm(); // Si quieres limpiar el formulario después de guardar
}

// --- Event Listeners Específicos para la Página de Pedido ---

document.addEventListener("DOMContentLoaded", () => {
    // Cargar los datos del pedido y el menú al cargar la página
    loadOrderData();

    // Listener para el campo de comentarios
    const commentTextArea = document.getElementById('commentTextArea');
    if (commentTextArea) {
        // Al escribir, habilitar el botón de eliminar si hay texto
        commentTextArea.addEventListener('input', updateCommentPanelButtons);
    }

    // Listener para el botón "GUARDAR" del panel de comentarios
    const addCommentBtn = document.getElementById('addCommentBtn'); // Asumiendo que el botón "GUARDAR" es este
    if (addCommentBtn) {
        addCommentBtn.addEventListener('click', saveComment);
    }

    // Listener para el botón "ELIMINAR" del panel de comentarios
    const deleteCommentBtn = document.getElementById('deleteCommentBtn');
    if (deleteCommentBtn) {
        deleteCommentBtn.addEventListener('click', deleteComment);
    }

    // Listener para el botón global "ELIMINAR" del ítem de pedido
    const removeSelectedItemBtn = document.querySelector('.order-actions .btn-danger');
    if (removeSelectedItemBtn) {
        removeSelectedItemBtn.addEventListener('click', removeSelectedItem);
    }

    // Listener para el botón global "GUARDAR" del pedido
    const saveOrderBtn = document.querySelector('.order-actions .btn-success');
    if (saveOrderBtn) {
        saveOrderBtn.addEventListener('click', saveOrder);
    }

    // Inicializar el panel de comentarios en estado deshabilitado
    resetCommentPanel();
});

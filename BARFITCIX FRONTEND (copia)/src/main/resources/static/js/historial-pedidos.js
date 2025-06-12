/**
 * @file historial-pedidos.js
 * @description Módulo JavaScript para la visualización del historial de pedidos en la aplicación BarFitCIX.
 * Se encarga de cargar y renderizar los pedidos desde el DataManager (localStorage),
 * mostrando su estado y permitiendo la navegación a su resumen detallado.
 * @author [Tu Nombre/Nombre de la Empresa]
 * @date 2025-06-11
 */

/**
 * @global DataManager - Instancia global del módulo de gestión de datos.
 * @global setupSearchInput - Función global para configurar la búsqueda en tablas.
 * @global showCustomConfirm - Función global para mostrar confirmaciones personalizadas.
 */

// Array local para almacenar los pedidos
let historicalOrders = [];
// Arrays para tener acceso rápido a la información de salas y mesas
let allSalas = [];
let allMesas = [];

/**
 * @function loadHistoricalOrders
 * @description Carga los pedidos, salas y mesas desde el DataManager (localStorage)
 * y actualiza la tabla del historial de pedidos en la interfaz.
 */
function loadHistoricalOrders() {
    historicalOrders = DataManager.getPedidos();
    allSalas = DataManager.getSalas();
    allMesas = DataManager.getMesas();
    updateHistoricalOrdersTable();
}

/**
 * @function updateHistoricalOrdersTable
 * @description Renderiza y actualiza la tabla del historial de pedidos.
 */
function updateHistoricalOrdersTable() {
    const tbody = document.getElementById('historialPedidosTableBody');
    if (!tbody) {
        console.error("historialPedidosTableBody no encontrado. Asegúrate de estar en historial-pedidos.html.");
        return;
    }

    tbody.innerHTML = ''; // Limpiar la tabla antes de renderizar
    if (historicalOrders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No hay pedidos registrados en el historial.</td></tr>';
        return;
    }

    // Ordenar los pedidos por fecha más reciente primero
    const sortedOrders = [...historicalOrders].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    sortedOrders.forEach(order => {
        const row = document.createElement('tr');
        row.dataset.orderId = order.id; // Almacena el ID del pedido
        // Al hacer clic en la fila, ir al resumen del pedido
        row.style.cursor = 'pointer';
        row.addEventListener('click', () => goToOrderSummary(order.id));

        // Obtener nombre de sala y número de mesa
        const sala = allSalas.find(s => s.id === order.idSala);
        const mesa = allMesas.find(m => m.id === order.idMesa);
        const salaNombre = sala ? sala.nombre : 'N/A';
        const numeroMesa = mesa ? mesa.numero : order.numeroMesa || 'N/A'; // Usar numeroMesa si existe en el pedido

        const statusClass = order.estado === 'PENDIENTE' ? 'status-pendiente' : 'status-finalizado';

        row.innerHTML = `
            <td>${salaNombre}</td>
            <td>${order.atendidoPor || 'Desconocido'}</td>
            <td>${numeroMesa}</td>
            <td>${order.fecha}</td>
            <td>S/. ${order.total.toFixed(2)}</td>
            <td><span class="status-badge ${statusClass}">${order.estado}</span></td>
        `;
        tbody.appendChild(row);
    });
}

/**
 * @function goToOrderSummary
 * @description Redirige a la página de resumen de pedido para un pedido específico.
 * @param {number} orderId - El ID del pedido a mostrar en el resumen.
 */
function goToOrderSummary(orderId) {
    window.location.href = `/resumen-pedido/${orderId}`;
}

// --- Event Listeners Específicos para la Página de Historial de Pedidos ---

document.addEventListener("DOMContentLoaded", () => {
    // Cargar los pedidos al cargar la página
    loadHistoricalOrders();

    // Configurar el input de búsqueda para filtrar la tabla de pedidos
    setupSearchInput('searchInput', '#historialPedidosTable');
});

/**
 * @file dashboard.js
 * @description Módulo JavaScript para el panel principal (dashboard) de BarFitCIX.
 * Se encarga de cargar y mostrar las salas habilitadas, calculando su disponibilidad
 * de mesas basándose en el estado de las mesas almacenadas en el DataManager.
 * @author [Tu Nombre/Nombre de la Empresa]
 * @date 2025-06-11
 */

/**
 * @global DataManager - Instancia global del módulo de gestión de datos.
 */

// Arrays locales para trabajar con salas y mesas
let roomsData = [];
let tablesData = [];

/**
 * @function loadDashboardData
 * @description Carga las salas y mesas desde el DataManager (localStorage)
 * y renderiza las tarjetas de sala en el dashboard.
 */
function loadDashboardData() {
    roomsData = DataManager.getSalas();
    tablesData = DataManager.getMesas();
    renderRoomCards();
}

/**
 * @function renderRoomCards
 * @description Renderiza las tarjetas de sala en 'dashboard.html'
 * basándose en las salas habilitadas y la disponibilidad de mesas.
 */
function renderRoomCards() {
    const roomGridContainer = document.querySelector('.room-grid');
    if (!roomGridContainer) {
        console.error("room-grid container no encontrado. Asegúrate de estar en dashboard.html.");
        return;
    }

    roomGridContainer.innerHTML = ''; // Limpiar el contenedor antes de renderizar

    const enabledRooms = roomsData.filter(room => room.habilitada);

    if (enabledRooms.length === 0) {
        roomGridContainer.innerHTML = '<p class="text-center text-muted col-12">No hay salas habilitadas para mostrar.</p>';
        return;
    }

    enabledRooms.forEach(room => {
        // Contar mesas libres en esta sala
        const mesasDeEstaSala = tablesData.filter(mesa => mesa.idSala === room.id);
        const mesasOcupadas = mesasDeEstaSala.filter(mesa => mesa.estado === 'ocupada').length;
        const mesasLibres = room.capacidadMesas - mesasOcupadas;
        const ocupacionPorcentaje = (mesasOcupadas / room.capacidadMesas) * 100;

        const roomCard = document.createElement('div');
        roomCard.classList.add('room-card');
        roomCard.classList.add(mesasLibres > 0 ? 'available' : 'full'); // Clase para estado visual (verde/rojo)
        roomCard.dataset.roomId = room.id; // Para identificar la sala

        // Redirigir a la página de mesas al hacer clic en la tarjeta de sala
        roomCard.addEventListener('click', () => {
            window.location.href = `/mesas/${room.id}`; // Pasar el ID de la sala
        });

        roomCard.innerHTML = `
            <div class="room-icon">
                <i class="bi bi-${mesasLibres > 0 ? 'door-open' : 'door-closed'}"></i>
            </div>
            <div class="room-name">${room.nombre}</div>
            <div class="availability-info">
                <div>${mesasLibres} / ${room.capacidadMesas} MESAS LIBRES</div>
                <div class="progress">
                    <div class="progress-bar ${mesasLibres > 0 ? 'bg-success' : 'bg-danger'}" style="width: ${ocupacionPorcentaje}%;"></div>
                </div>
            </div>
        `;
        roomGridContainer.appendChild(roomCard);
    });
}

// --- Event Listeners Específicos para la Página del Dashboard ---

document.addEventListener("DOMContentLoaded", () => {
    // Cargar los datos del dashboard al cargar la página
    loadDashboardData();

    // Actualizar el dashboard si se navega a esta página desde el historial o un cambio de hash
    // Esto asegura que si una mesa cambia de estado, el dashboard se actualice
    window.addEventListener('hashchange', loadDashboardData);
    window.addEventListener('popstate', loadDashboardData); // Para navegación con el botón atrás/adelante
});

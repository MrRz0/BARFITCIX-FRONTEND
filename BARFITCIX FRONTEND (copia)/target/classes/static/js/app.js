// --- Funciones Generales ---

// Actualiza la fecha y hora en tiempo real en la interfaz.
function updateDateTime() {
  const now = new Date();

  // Opciones de formato para la hora (ej. 04:00 PM).
  const timeOptions = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  };
  const timeString = now.toLocaleTimeString("es-ES", timeOptions).toUpperCase();

  // Opciones de formato para la fecha (ej. 12 DE MAYO 2025).
  const dateOptions = {
    day: "2-digit",
    month: "long",
    year: "numeric",
  };
  const dateString = now.toLocaleDateString("es-ES", dateOptions).toUpperCase();

  // Actualiza los elementos HTML con la hora y fecha actuales.
  const timeElements = document.querySelectorAll("#currentTime");
  const dateElements = document.querySelectorAll("#currentDate");

  timeElements.forEach((element) => {
    if (element) element.textContent = timeString;
  });

  dateElements.forEach((element) => {
    if (element) element.textContent = dateString;
  });
}

/**
 * Alterna el estado del sidebar (colapsado/expandido en desktop, mostrar/ocultar en móvil).
 * Si se invoca sin argumentos, alterna el estado. Si se fuerza, establece el estado.
 * @param {boolean|null} forceCollapse - Si es true, fuerza el colapso; si es false, fuerza la expansión.
 * Si es null, alterna el estado actual.
 */
function toggleSidebar(forceCollapse = null) {
  const sidebar = document.getElementById("sidebar");
  const dashboardContainer = document.querySelector(".dashboard-container");
  const toggleBtnIcon = sidebar ? sidebar.querySelector(".sidebar-toggle-btn i") : null;

  if (!sidebar || !dashboardContainer || !toggleBtnIcon) {
    console.error("Sidebar, dashboardContainer, or toggle button icon not found.");
    return;
  }

  // Comportamiento para móvil (sidebar se oculta/muestra completamente)
  if (window.innerWidth <= 991) { // Usamos 991px como breakpoint para móvil/tablet
    if (forceCollapse === true) {
      sidebar.classList.remove("show");
    } else if (forceCollapse === false) {
      sidebar.classList.add("show");
    } else {
      sidebar.classList.toggle("show");
    }

    // Gestiona el listener de clic fuera solo para el estado "show" en móvil
    if (sidebar.classList.contains("show")) {
      document.addEventListener("click", closeSidebarOnOutsideClick);
    } else {
      document.removeEventListener("click", closeSidebarOnOutsideClick);
    }
  } else {
    // Comportamiento para desktop (sidebar se colapsa/expande a 70px)
    let isCollapsed;
    if (forceCollapse === true) {
      isCollapsed = true;
    } else if (forceCollapse === false) {
      isCollapsed = false;
    } else {
      isCollapsed = sidebar.classList.contains("collapsed");
      isCollapsed = !isCollapsed; // Alternar
    }

    if (isCollapsed) {
      sidebar.classList.add("collapsed");
      dashboardContainer.classList.add("sidebar-collapsed"); // Agrega la clase al contenedor principal
      toggleBtnIcon.classList.remove("bi-chevron-left");
      toggleBtnIcon.classList.add("bi-chevron-right");
    } else {
      sidebar.classList.remove("collapsed");
      dashboardContainer.classList.remove("sidebar-collapsed"); // Remueve la clase del contenedor principal
      toggleBtnIcon.classList.remove("bi-chevron-right");
      toggleBtnIcon.classList.add("bi-chevron-left");
    }
  }
}

/**
 * Cierra el sidebar al hacer clic fuera de él.
 * Esto se aplica principalmente para desktop (colapsar) y móvil (ocultar) cuando
 * el sidebar está visible y el clic no proviene del sidebar mismo.
 * @param {Event} event - El evento de clic.
 */
function closeSidebarOnOutsideClick(event) {
  const sidebar = document.getElementById("sidebar");
  const toggleButton = document.querySelector(".sidebar-toggle-btn");

  if (!sidebar || !toggleButton) return;

  // Si el clic no fue dentro del sidebar Y el clic no fue en el botón de toggle
  if (!sidebar.contains(event.target) && !toggleButton.contains(event.target)) {
    // En desktop, si el sidebar no está ya colapsado, lo colapsa.
    if (window.innerWidth > 991 && !sidebar.classList.contains("collapsed")) {
      toggleSidebar(true);
    }
    // En móvil, si el sidebar está "show" (visible), lo oculta.
    else if (window.innerWidth <= 991 && sidebar.classList.contains("show")) {
      toggleSidebar(true);
    }
  }
}

// Función para cerrar sesión (muestra una confirmación al usuario).
function logout() {
  // NOTA: Reemplazar 'confirm' con un modal personalizado para mejor UX/UI.
  if (window.confirm("¿Está seguro que desea cerrar sesión?")) {
    window.location.href = "/";
  }
}

// Función para aplicar una animación de "fade in up" a un elemento.
function fadeInUp(element) {
  element.style.opacity = "0";
  element.style.transform = "translateY(30px)";
  element.style.transition = "all 0.5s ease";

  setTimeout(() => {
    element.style.opacity = "1";
    element.style.transform = "translateY(0)";
  }, 100);
}

// Opciones para el Intersection Observer (para detectar cuándo los elementos entran en la vista).
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -50px 0px",
};

// Crea un Intersection Observer para aplicar animaciones cuando los elementos son visibles.
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("fade-in-up");
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);


// --- Funciones de Tema (Modo Claro/Oscuro) ---
function toggleTheme() {
    const body = document.body;
    body.classList.toggle('dark-mode');
    // Guarda la preferencia del usuario en localStorage
    if (body.classList.contains('dark-mode')) {
        localStorage.setItem('theme', 'dark');
    } else {
        localStorage.setItem('theme', 'light');
    }
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body; // Obtener referencia al cuerpo

    // Siempre comenzar asumiendo el modo claro
    body.classList.remove('dark-mode');
    if (themeToggle) {
        themeToggle.checked = false; // Asegurar que el toggle esté desmarcado por defecto
    }

    // Si hay una preferencia guardada y es 'dark', aplicar modo oscuro
    if (savedTheme === 'dark') {
        body.classList.add('dark-mode');
        if (themeToggle) {
            themeToggle.checked = true;
        }
    }

    // Adjuntar el event listener al botón de alternancia
    if (themeToggle) {
        themeToggle.addEventListener('change', toggleTheme);
    }
}


// --- Funciones de Gestión de Usuarios (desde configuracion.html) ---
function selectUser(nombre, usuario, rol) {
  console.log(`Usuario seleccionado: ${nombre} (${usuario}) - ${rol}`);
}

function editUser(usuario, correo, rol, estado) {
    document.getElementById('newUserModalLabel').textContent = 'Editar Usuario';
    document.getElementById('userName').value = usuario;
    document.getElementById('userEmail').value = correo;
    document.getElementById('userPassword').value = '';
    document.getElementById('userRole').value = rol;
    document.getElementById('userStatus').value = estado;

    const modal = new bootstrap.Modal(document.getElementById('newUserModal'));
    modal.show();
}

function deleteUser(usuario) {
    // NOTA: Reemplazar 'confirm' y 'alert' con modales personalizados.
    if (window.confirm(`¿Está seguro de eliminar el usuario ${usuario}?`)) {
        window.alert(`Usuario ${usuario} eliminado exitosamente`);
    }
}

function saveUser() {
    const usuario = document.getElementById('userName').value;
    const correo = document.getElementById('userEmail').value;
    const password = document.getElementById('userPassword').value;
    const rol = document.getElementById('userRole').value;
    const estado = document.getElementById('userStatus').value;

    if (usuario && correo && password && rol && estado) {
        // NOTA: Reemplazar 'alert' con un modal personalizado.
        window.alert(`Usuario ${usuario} guardado exitosamente`);
        const modal = bootstrap.Modal.getInstance(document.getElementById('newUserModal'));
        modal.hide();
        document.getElementById('userForm').reset();
        document.getElementById('newUserModalLabel').textContent = 'Nuevo Usuario';
    } else {
        // NOTA: Reemplazar 'alert' con un modal personalizado.
        window.alert('Por favor complete todos los campos obligatorios');
    }
}

// --- Funciones de Gestión de Platos (desde platos.html) ---
let currentPlatoInsumos = [];

// Mapa de insumos a unidades
const unitMap = {
    "Arroz": "kg",
    "Cebolla": "unidad",
    "Tomate": "kg",
    "Pollo": "kg",
    "Carne": "kg",
    "Pescado": "kg",
    "Aceite": "Lt",
    "Sal": "g",
    "Pimienta": "g",
    // Puedes añadir más insumos y sus unidades aquí
};

function clearPlatoForm() {
    document.getElementById('nombrePlato').value = '';
    document.getElementById('precioPlato').value = '0.00';
    currentPlatoInsumos = [];
    updateInsumosTablePlatos();
    // Resetear el selector de insumos y su display de unidad
    const ingredientTypeSelect = document.getElementById('ingredientType');
    if (ingredientTypeSelect) {
        ingredientTypeSelect.value = ''; // Restablecer el select a la opción por defecto
        updateDisplayIngredientUnit(); // Limpiar el display de la unidad
    }
}

function editPlato(nombre, precio) {
    document.getElementById('nombrePlato').value = nombre;
    const precioNumerico = parseFloat(precio.replace('S/. ', '')) || 0.00;
    document.getElementById('precioPlato').value = precioNumerico.toFixed(2);

    // Simular carga de insumos para el plato (en un caso real, esto vendría de una DB)
    if (nombre === 'PLATO 1') {
        currentPlatoInsumos = [{type: 'Arroz', quantity: 0.5, unit: 'kg'}, {type: 'Pollo', quantity: 0.2, unit: 'kg'}];
    } else if (nombre === 'PLATO 2') {
        currentPlatoInsumos = [{type: 'Cebolla', quantity: 1, unit: 'unidad'}, {type: 'Tomate', quantity: 2, unit: 'unidad'}];
    } else {
        currentPlatoInsumos = [];
    }
    updateInsumosTablePlatos();
}

/**
 * Funciones para el Historial de Precios (desde platos.html)
 */
function showPriceHistoryModal(productName) {
    document.getElementById('productNameHistory').textContent = productName;
    const priceHistoryTableBody = document.getElementById('priceHistoryTableBody');
    priceHistoryTableBody.innerHTML = '';

    // Simular historial de precios
    const historyData = {
        "PLATO 1": [
            {date: "2024-01-15", price: "S/. 12.00"},
            {date: "2024-03-01", price: "S/. 13.50"},
            {date: "2024-05-20", price: "S/. 15.00"}
        ],
        "PLATO 2": [
            {date: "2023-11-10", price: "S/. 18.00"},
            {date: "2024-02-01", price: "S/. 19.50"},
            {date: "2024-04-15", price: "S/. 20.50"}
        ],
        "PLATO 3": [
            {date: "2023-10-01", price: "S/. 10.00"},
            {date: "2024-01-05", price: "S/. 11.50"},
            {date: "2024-03-10", price: "S/. 12.00"}
        ],
        "PLATO 4": [
            {date: "2024-01-20", price: "S/. 22.00"},
            {date: "2024-04-01", price: "S/. 25.00"}
        ],
        "PLATO 5": [
            {date: "2023-12-01", price: "S/. 17.00"},
            {date: "2024-03-15", price: "S/. 18.75"}
        ],
        "PLATO 6": [
            {date: "2024-02-10", price: "S/. 28.00"},
            {date: "2024-05-01", price: "S/. 30.00"}
        ],
        "PLATO 7": [
            {date: "2023-09-01", price: "S/. 9.00"},
            {date: "2024-01-01", price: "S/. 10.00"}
        ]
    };

    const productHistory = historyData[productName] || [];
    if (productHistory.length > 0) {
        productHistory.forEach(entry => {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${entry.date}</td><td>${entry.price}</td>`;
            priceHistoryTableBody.appendChild(row);
        });
    } else {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="2" class="text-center text-muted">No hay historial de precios disponible.</td>`;
        priceHistoryTableBody.appendChild(row);
    }

    const modal = new bootstrap.Modal(document.getElementById('priceHistoryModal'));
    modal.show();
}

/**
 * Funciones para la Gestión de Insumos (para el form de platos, en platos.html)
 */
function updateInsumosTablePlatos() {
    const insumosTableBody = document.getElementById('insumosTableBody');
    if (!insumosTableBody) return;

    insumosTableBody.innerHTML = '';
    if (currentPlatoInsumos.length === 0) {
        insumosTableBody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">No hay insumos agregados.</td></tr>';
        return;
    }
    currentPlatoInsumos.forEach((insumo, index) => {
        const row = document.createElement('tr');
        row.dataset.index = index;
        row.onclick = () => selectIngredientRow(row);
        row.innerHTML = `
            <td>${insumo.type}</td>
            <td>${insumo.quantity}</td>
            <td>${insumo.unit}</td>
        `;
        insumosTableBody.appendChild(row);
    });
}

let selectedIngredientRow = null;

function selectIngredientRow(row) {
    if (selectedIngredientRow) {
        selectedIngredientRow.classList.remove('table-active');
    }
    selectedIngredientRow = row;
    row.classList.add('table-active');
}

// Rellena el select de tipos de insumo
function populateIngredientTypes() {
    const ingredientTypeSelect = document.getElementById('ingredientType');
    if (!ingredientTypeSelect) return;

    ingredientTypeSelect.innerHTML = '<option value="">Seleccionar...</option>';
    for (const type in unitMap) {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        ingredientTypeSelect.appendChild(option);
    }
}

// Actualiza el span de la unidad de insumo al seleccionar un tipo
function updateDisplayIngredientUnit() {
    const ingredientTypeSelect = document.getElementById('ingredientType');
    const displayUnitSpan = document.getElementById('displayIngredientUnit');
    if (!ingredientTypeSelect || !displayUnitSpan) return;

    const selectedType = ingredientTypeSelect.value;
    displayUnitSpan.textContent = unitMap[selectedType] || ''; // Muestra la unidad o vacío si no hay selección
}


function saveIngredient() {
    const type = document.getElementById('ingredientType').value;
    const quantity = parseFloat(document.getElementById('ingredientQuantity').value);
    const unit = unitMap[type]; // Obtener la unidad directamente del mapa

    if (type && quantity > 0 && unit) {
        currentPlatoInsumos.push({ type, quantity, unit });
        updateInsumosTablePlatos();
        const modal = bootstrap.Modal.getInstance(document.getElementById('addIngredientModal'));
        modal.hide();
        document.getElementById('ingredientForm').reset();
        // Resetear el display de la unidad después de guardar
        updateDisplayIngredientUnit();
    } else {
        // NOTA: Reemplazar 'alert' con un modal personalizado.
        window.alert('Por favor, complete todos los campos del insumo y seleccione un tipo válido.');
    }
}

function removeSelectedIngredient() {
    if (selectedIngredientRow) {
        const index = parseInt(selectedIngredientRow.dataset.index);
        currentPlatoInsumos.splice(index, 1);
        selectedIngredientRow = null;
        updateInsumosTablePlatos();
    } else {
        // NOTA: Reemplazar 'alert' con un modal personalizado.
        window.alert('Selecciona un insumo para eliminar.');
    }
}


// --- Funciones de Pedido (desde pedido.html) ---
let orderItems = [];

function addMenuItem(button) {
    const menuItem = button.closest('.menu-item');
    const name = menuItem.dataset.name;
    const price = parseFloat(menuItem.dataset.price);

    const existingItem = orderItems.find(item => item.name === name);

    if (existingItem) {
        existingItem.quantity += 1;
        existingItem.subtotal = existingItem.quantity * existingItem.price;
    } else {
        orderItems.push({
            name: name,
            quantity: 1,
            price: price,
            subtotal: price,
            comment: ''
        });
    }
    updateOrderTable();
    updateTotal();
}

function updateOrderTable() {
    const tbody = document.getElementById('orderItemsTable');
    if (!tbody) return;

    tbody.innerHTML = '';
    orderItems.forEach((item, index) => {
        const row = document.createElement('tr');
        row.onclick = () => selectRow(row, index);
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>S/. ${item.price.toFixed(2)}</td>
            <td>S/. ${item.subtotal.toFixed(2)}</td>
            <td>${item.comment}</td>
        `;
        tbody.appendChild(row);
    });
}

let selectedRow = null;

function selectRow(row, index) {
    if (selectedRow) {
        selectedRow.classList.remove('table-active');
    }
    selectedRow = row;
    row.classList.add('table-active');
}

function removeSelectedItem() {
    if (selectedRow) {
        const index = Array.from(selectedRow.parentNode.children).indexOf(selectedRow);
        orderItems.splice(index, 1);
        updateOrderTable();
        updateTotal();
        selectedRow = null;
    } else {
        // NOTA: Reemplazar 'alert' con un modal personalizado.
        window.alert('Selecciona un item para eliminar.');
    }
}

function updateTotal() {
    const totalAmountElement = document.getElementById('totalAmount');
    if (!totalAmountElement) return;

    const total = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
    totalAmountElement.textContent = `S/. ${total.toFixed(2)}`;
}

function saveOrder() {
    if (orderItems.length === 0) {
        // NOTA: Reemplazar 'alert' con un modal personalizado.
        window.alert('Debe agregar al menos un item al pedido');
        return;
    }
    // NOTA: Reemplazar 'alert' con un modal personalizado.
    window.alert('Pedido guardado exitosamente');
}


// --- Funciones de Historial de Pedidos (desde historial-pedidos.html) ---
function setupSearchInput(inputId, tableSelector) {
    const searchInput = document.getElementById(inputId);
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const rows = document.querySelectorAll(tableSelector + ' tbody tr');

            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                if (text.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }
}

// --- Funciones de Mesas (desde mesas.html) ---
let selectedTables = [];
let longPressTimer;
const longPressDuration = 500; // milisegundos

// Variable para controlar si un long press ha ocurrido
let isLongPressActive = false;

/**
 * Gestiona la selección de una mesa (clic normal o Ctrl+clic en PC, tap o long press en móvil).
 * @param {HTMLElement} element - El elemento DOM de la tarjeta de la mesa.
 * @param {number} tableNumber - El número de la mesa.
 * @param {Event} event - El evento (mouse o touch) que disparó la función.
 */
function toggleTableSelection(element, tableNumber, event) {
    if (isLongPressActive) {
        // Si ya estamos en modo de selección por long press, alternar la mesa
        const index = selectedTables.indexOf(tableNumber);
        if (index > -1) {
            selectedTables.splice(index, 1);
            element.classList.remove('selected');
        } else {
            selectedTables.push(tableNumber);
            element.classList.add('selected');
        }
    } else if (event.ctrlKey) { // En PC, si Ctrl está presionado
        const index = selectedTables.indexOf(tableNumber);
        if (index > -1) {
            selectedTables.splice(index, 1);
            element.classList.remove('selected');
        } else {
            selectedTables.push(tableNumber);
            element.classList.add('selected');
        }
    } else { // Clic normal en PC o tap corto en móvil
        clearSelection(); // Deseleccionar todo lo demás
        selectedTables.push(tableNumber);
        element.classList.add('selected');
    }
    updateButtons();
}

/**
 * Comienza el temporizador para detectar un "mantener presionado" (long press).
 * @param {HTMLElement} element - El elemento DOM de la tarjeta de la mesa.
 * @param {number} tableNumber - El número de la mesa.
 */
function handleTableMouseDown(element, tableNumber) {
    // Solo si es un dispositivo táctil O si no estamos en modo Ctrl (para evitar conflicto en PC)
    if ('ontouchstart' in window || !event.ctrlKey) {
        longPressTimer = setTimeout(() => {
            isLongPressActive = true;
            // Si no hay nada seleccionado, la primera pulsación larga lo selecciona
            if (selectedTables.length === 0) {
                clearSelection(); // Asegurarse de que no haya nada accidentalmente seleccionado
                selectedTables.push(tableNumber);
                element.classList.add('selected');
            } else if (selectedTables.length > 0 && !selectedTables.includes(tableNumber)) {
                 // Si ya hay selección y la actual no está, agregarla
                selectedTables.push(tableNumber);
                element.classList.add('selected');
            } else if (selectedTables.length > 0 && selectedTables.includes(tableNumber)) {
                // Si ya está seleccionada, la long press la deselecciona
                const index = selectedTables.indexOf(tableNumber);
                selectedTables.splice(index, 1);
                element.classList.remove('selected');
            }
            updateButtons();
            // NOTA: Podrías añadir un feedback visual aquí, como vibración o un borde temporal
        }, longPressDuration);
    }
}

/**
 * Finaliza el evento de clic/toque, limpiando el temporizador de long press
 * y ejecutando la selección si no fue un long press.
 * @param {HTMLElement} element - El elemento DOM de la tarjeta de la mesa.
 * @param {number} tableNumber - El número de la mesa.
 * @param {Event} event - El evento (mouse o touch) que disparó la función.
 */
function handleTableMouseUp(element, tableNumber, event) {
    clearTimeout(longPressTimer);
    if (!isLongPressActive && event.detail !== 2) { // event.detail === 2 es doble click
        toggleTableSelection(element, tableNumber, event);
    }
    // Si fue un long press, la selección ya se manejó en handleTableMouseDown
    isLongPressActive = false; // Resetear el estado de long press
}

/**
 * Cancela el long press si el mouse/dedo se mueve significativamente.
 */
function handleTableMove() {
    clearTimeout(longPressTimer);
    isLongPressActive = false; // Asegura que el modo long press se desactive si hay movimiento
}


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

function goToOrderSelected() {
    if (selectedTables.length >= 1) {
        window.location.href = `/pedido/${selectedTables[0]}`;
        clearSelection();
    }
}

function goToOrder(tableNumber) {
    window.location.href = `/pedido/${tableNumber}`;
    clearSelection();
}

function joinTables() {
    if (selectedTables.length > 1) {
        // NOTA: Reemplazar 'alert' con un modal personalizado.
        window.alert(`Uniendo mesas: ${selectedTables.join(', ')}`);
        selectedTables.forEach(tableNumber => {
            const tableElements = document.querySelectorAll('.table-card');
            tableElements.forEach(element => {
                // Asumiendo que el número de mesa está dentro de un strong para el HTML proporcionado
                // Es mejor usar un data-attribute en el HTML para esto: <div data-table-number="1">
                const elementTableNumber = parseInt(element.dataset.tableNumber); // Usar data-table-number
                if (elementTableNumber === tableNumber) {
                    element.classList.add('occupied');
                    element.classList.remove('available');
                    // Iniciar el temporizador para la mesa si es la primera vez que se ocupa
                    const timerElement = element.querySelector('.table-timer');
                    if (timerElement && timerElement.textContent === '00:00:00') {
                        startTableTimer(timerElement);
                    }
                }
            });
        });
        clearSelection();
    } else {
        // NOTA: Reemplazar 'alert' con un modal personalizado.
        window.alert("Selecciona al menos dos mesas para unir.");
    }
}

function clearSelection() {
    const selectedElements = document.querySelectorAll('.table-card.selected');
    selectedElements.forEach(element => {
        element.classList.remove('selected');
    });
    selectedTables = [];
    updateButtons();
    isLongPressActive = false; // Asegura que el modo long press se desactive
}

function startTableTimer(timerElement) {
    let seconds = 0;
    // Si ya existe un timerId, limpiarlo para evitar múltiples intervalos
    if (timerElement.dataset.timerId) {
        clearInterval(parseInt(timerElement.dataset.timerId));
    }
    // Si la mesa ya estaba ocupada, parsear el tiempo existente
    if (timerElement.closest('.table-card').classList.contains('occupied')) {
        const currentTimeParts = timerElement.textContent.split(':');
        if (currentTimeParts.length === 3) {
            seconds = parseInt(currentTimeParts[0]) * 3600 +
                      parseInt(currentTimeParts[1]) * 60 +
                      parseInt(currentTimeParts[2]);
        }
    }
    const timerId = setInterval(() => {
        seconds++;
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        timerElement.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }, 1000);
    timerElement.dataset.timerId = timerId; // Guardar el ID para poder limpiarlo
}


// --- Funciones de Pago Fraccionado (desde resumen-pedido.html) ---
let splitPaymentPeople = [];

function openSplitPaymentModal() {
    const totalAmountElement = document.getElementById('totalPedidoAmount');
    let totalAmount = parseFloat(totalAmountElement.value.replace('S/. ', '')) || 0;

    document.getElementById('splitTotalAmount').value = `S/. ${totalAmount.toFixed(2)}`;
    document.getElementById('numPeopleSplit').value = '1';
    splitPaymentPeople = [];
    updateSplitPaymentRows();
}

function changeSplitPeople(change) {
    const numPeopleInput = document.getElementById('numPeopleSplit');
    let currentNum = parseInt(numPeopleInput.value) || 1;
    currentNum += change;
    if (currentNum < 1) currentNum = 1;
    numPeopleInput.value = currentNum;
    updateSplitPaymentRows();
}

function updateSplitPaymentRows() {
    const numPeople = parseInt(document.getElementById('numPeopleSplit').value);
    const splitPaymentRowsContainer = document.getElementById('splitPaymentRows');
    splitPaymentRowsContainer.innerHTML = '';

    const totalAmountElement = document.getElementById('totalPedidoAmount');
    let totalAmount = parseFloat(totalAmountElement.value.replace('S/. ', '')) || 0;
    const amountPerPerson = (totalAmount / numPeople).toFixed(2);

    splitPaymentPeople = [];

    for (let i = 0; i < numPeople; i++) {
        const rowDiv = document.createElement('div');
        rowDiv.classList.add('row', 'mb-3', 'align-items-center');
        rowDiv.innerHTML = `
            <div class="col-md-5">
                <input type="text" class="form-control" placeholder="Nombre Persona ${i + 1}" id="personName${i}">
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
            name: '',
            amount: parseFloat(amountPerPerson)
        });
    }
    document.querySelectorAll('#splitPaymentRows .person-amount').forEach(input => {
        input.addEventListener('input', validateSplitAmounts);
    });
    validateSplitAmounts();
}

function validateSplitAmounts() {
    const totalAmountElement = document.getElementById('totalPedidoAmount');
    const totalPedido = parseFloat(totalAmountElement.value.replace('S/. ', '')) || 0;
    let currentSum = 0;
    const amountInputs = document.querySelectorAll('#splitPaymentRows .person-amount');

    amountInputs.forEach(input => {
        currentSum += parseFloat(input.value) || 0;
    });

    const diff = Math.abs(totalPedido - currentSum);
    const footer = document.querySelector('#splitPaymentModal .modal-footer');
    let warningElement = document.getElementById('splitAmountWarning');

    if (diff > 0.01) {
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

function processSplitPayment() {
    const totalAmountElement = document.getElementById('totalPedidoAmount');
    const totalPedido = parseFloat(totalAmountElement.value.replace('S/. ', '')) || 0;
    let currentSum = 0;
    const amountInputs = document.querySelectorAll('#splitPaymentRows .person-amount');
    const nameInputs = document.querySelectorAll('#splitPaymentRows input[type="text"]');

    splitPaymentPeople = [];
    amountInputs.forEach((input, index) => {
        const name = nameInputs[index].value || `Persona ${index + 1}`;
        const amount = parseFloat(input.value) || 0;
        splitPaymentPeople.push({ name, amount });
        currentSum += amount;
    });

    const diff = Math.abs(totalPedido - currentSum);

    if (diff > 0.01) {
        // NOTA: Reemplazar 'alert' con un modal personalizado.
        window.alert(`Error: La suma de los pagos (${currentSum.toFixed(2)}) no coincide con el total del pedido (${totalPedido.toFixed(2)}). Ajusta los montos.`);
        return;
    }

    let confirmationMessage = "Se procesarán los siguientes pagos:\n";
    splitPaymentPeople.forEach(p => {
        confirmationMessage += `- ${p.name}: S/. ${p.amount.toFixed(2)}\n`;
    });
    confirmationMessage += "\n¿Confirmar pagos?";

    // NOTA: Reemplazar 'confirm' y 'alert' con modales personalizados.
    if (window.confirm(confirmationMessage)) {
        window.alert('Pagos procesados exitosamente!');
        const modal = bootstrap.Modal.getInstance(document.getElementById('splitPaymentModal'));
        modal.hide();
    }
}

function generateIndividualBoleta(personIndex) {
    const nameInput = document.getElementById(`personName${personIndex}`);
    const amountInput = document.querySelectorAll('#splitPaymentRows .person-amount')[personIndex];

    const personName = nameInput.value || `Persona ${personIndex + 1}`;
    const personAmount = parseFloat(amountInput.value) || 0;

    // NOTA: Reemplazar 'alert' con un modal personalizado.
    window.alert(`Generando boleta para ${personName} por S/. ${personAmount.toFixed(2)}. (Simulado)`);
}

// --- Funciones de Reportes (desde reportes.html) ---
function openReport(reportId) {
    // NOTA: Reemplazar 'alert' con un modal personalizado.
    window.alert(`Abriendo reporte #${reportId}. Aquí se integrará con PowerBI en el futuro.`);
}


// --- Funciones de Gestión de Insumos (desde configuracion.html - NUEVA SECCIÓN) ---
let insumosData = []; // Almacenará los insumos cargados/creados

function loadInsumos() {
    // Simular carga de insumos desde una DB sin stock
    insumosData = [
        { id: 1, name: "Arroz", unit: "kg" },
        { id: 2, name: "Cebolla", unit: "unidad" },
        { id: 3, name: "Tomate", unit: "kg" },
        { id: 4, name: "Pollo", unit: "kg" },
        { id: 5, name: "Aceite", unit: "Lt" }
    ];
    updateInsumosManagementTable();
}

function updateInsumosManagementTable() {
    const tbody = document.getElementById('insumosManagementTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    if (insumosData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">No hay insumos registrados.</td></tr>';
        return;
    }
    insumosData.forEach(insumo => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${insumo.name}</td>
            <td>${insumo.unit}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-edit btn-sm" onclick="editInsumo(${insumo.id})" title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-delete btn-sm" onclick="deleteInsumo(${insumo.id})" title="Eliminar">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function clearInsumoForm() {
    document.getElementById('insumoId').value = '';
    document.getElementById('insumoName').value = '';
    document.getElementById('insumoUnit').value = '';
    document.getElementById('insumoModalLabel').textContent = 'Nuevo Insumo';
}

function saveInsumo() {
    const id = document.getElementById('insumoId').value;
    const name = document.getElementById('insumoName').value;
    const unit = document.getElementById('insumoUnit').value;

    if (name && unit) {
        if (id) { // Edición
            const index = insumosData.findIndex(insumo => insumo.id == id);
            if (index !== -1) {
                insumosData[index] = { id: parseInt(id), name, unit };
                // NOTA: Reemplazar 'alert' con un modal personalizado.
                window.alert(`Insumo '${name}' actualizado exitosamente.`);
            }
        } else { // Nuevo
            const newId = insumosData.length > 0 ? Math.max(...insumosData.map(i => i.id)) + 1 : 1;
            insumosData.push({ id: newId, name, unit });
            // NOTA: Reemplazar 'alert' con un modal personalizado.
            window.alert(`Insumo '${name}' agregado exitosamente.`);
        }
        updateInsumosManagementTable();
        const modal = bootstrap.Modal.getInstance(document.getElementById('insumoModal'));
        modal.hide();
        clearInsumoForm();
    } else {
        // NOTA: Reemplazar 'alert' con un modal personalizado.
        window.alert('Por favor, complete todos los campos del insumo.');
    }
}

function editInsumo(id) {
    const insumo = insumosData.find(i => i.id === id);
    if (insumo) {
        document.getElementById('insumoModalLabel').textContent = 'Editar Insumo';
        document.getElementById('insumoId').value = insumo.id;
        document.getElementById('insumoName').value = insumo.name;
        document.getElementById('insumoUnit').value = insumo.unit;

        const modal = new bootstrap.Modal(document.getElementById('insumoModal'));
        modal.show();
    }
}

function deleteInsumo(id) {
    const insumo = insumosData.find(i => i.id === id);
    // NOTA: Reemplazar 'confirm' y 'alert' con modales personalizados.
    if (insumo && window.confirm(`¿Está seguro de eliminar el insumo '${insumo.name}'?`)) {
        insumosData = insumosData.filter(i => i.id !== id);
        window.alert(`Insumo '${insumo.name}' eliminado exitosamente.`);
        updateInsumosManagementTable();
    }
}


// --- Event Listeners Globales (DOMContentLoaded) ---
document.addEventListener("DOMContentLoaded", () => {
    // Carga el tema al cargar la página
    loadTheme();

    updateDateTime();
    setInterval(updateDateTime, 1000);

    const sidebar = document.getElementById("sidebar");
    const dashboardContainer = document.querySelector(".dashboard-container");
    const navLinks = document.querySelectorAll(".sidebar-nav a"); // Asegúrate de que esta línea esté presente
    const toggleBtnIcon = sidebar ? sidebar.querySelector(".sidebar-toggle-btn i") : null;

    if (sidebar && dashboardContainer && toggleBtnIcon) {
        // Lógica de reseteo del sidebar en redimensionamiento de ventana
        window.addEventListener("resize", () => {
            if (window.innerWidth > 991) { // Usa 991px para desktop
                sidebar.classList.remove("show"); // Quita la clase 'show' de móvil
                if (!sidebar.classList.contains('collapsed')) {
                    dashboardContainer.classList.remove('sidebar-collapsed');
                    toggleBtnIcon.classList.remove("bi-chevron-right");
                    toggleBtnIcon.classList.add("bi-chevron-left");
                } else {
                    dashboardContainer.classList.add('sidebar-collapsed'); // Asegura que se active si está colapsado
                    toggleBtnIcon.classList.remove("bi-chevron-left");
                    toggleBtnIcon.classList.add("bi-chevron-right");
                }
            } else {
                sidebar.classList.remove('collapsed'); // Quita la clase 'collapsed' de desktop
                dashboardContainer.classList.remove('sidebar-collapsed'); // Quita la clase de desktop
                sidebar.classList.remove('show'); // Asegura que no esté visible por defecto en móvil
            }
        });

        // Asegúrate de que el sidebar esté en el estado correcto al cargar la página
        if (window.innerWidth > 991) { // Desktop
            // Si el sidebar no tiene la clase 'collapsed', quita 'sidebar-collapsed' del contenedor
            if (!sidebar.classList.contains('collapsed')) {
                dashboardContainer.classList.remove('sidebar-collapsed');
                toggleBtnIcon.classList.remove("bi-chevron-right");
                toggleBtnIcon.classList.add("bi-chevron-left");
            } else {
                // Si el sidebar tiene 'collapsed', asegúrate de que el contenedor también lo tenga
                dashboardContainer.classList.add('sidebar-collapsed');
                toggleBtnIcon.classList.remove("bi-chevron-left");
                toggleBtnIcon.classList.add("bi-chevron-right");
            }
        } else { // Mobile
            sidebar.classList.remove('collapsed');
            dashboardContainer.classList.remove('sidebar-collapsed');
            sidebar.classList.remove('show');
        }
    }


    const currentPath = window.location.pathname;
    navLinks.forEach((link) => {
        link.classList.remove("active", "disabled");
        // Ajuste para que /configuracion sea activo si está en cualquiera de sus subpestañas
        if (currentPath.startsWith('/configuracion') || currentPath.startsWith('/usuarios')) {
            if (link.getAttribute("href") === '/configuracion') { // Asume que /configuracion es la raíz de la sección
                link.classList.add("active");
            }
        } else if (link.getAttribute("href") === currentPath) {
            link.classList.add("active");
        }
    });


    // Inicializar lógica de tablas y formularios específicos de cada página
    if (document.getElementById('insumosTableBody')) { // Para la tabla de insumos en el formulario de platos
        updateInsumosTablePlatos();
        // Listener para el formulario de platos
        const platoForm = document.getElementById('platoForm');
        if (platoForm) {
            platoForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const nombre = document.getElementById('nombrePlato').value;
                const precio = document.getElementById('precioPlato').value;

                if (nombre && parseFloat(precio) >= 0) {
                    // NOTA: Reemplazar 'alert' con un modal personalizado.
                    window.alert(`Plato guardado: ${nombre} - S/. ${parseFloat(precio).toFixed(2)} con insumos: ${JSON.stringify(currentPlatoInsumos)}`);
                    clearPlatoForm();
                } else {
                    // NOTA: Reemplazar 'alert' con un modal personalizado.
                    window.alert('Por favor, ingresa un nombre y un precio válido para el plato.');
                }
            });
        }
        // Listener para el filtro de búsqueda de platos
        setupSearchInput('searchPlatos', '#platosTable');

        // Para el modal de "Añadir Insumo"
        const addIngredientModal = document.getElementById('addIngredientModal');
        if (addIngredientModal) {
            addIngredientModal.addEventListener('show.bs.modal', function() {
                populateIngredientTypes(); // Rellenar el select de tipos de insumo
                updateDisplayIngredientUnit(); // Asegurar que la unidad se muestre correctamente al abrir
            });
            const ingredientTypeSelect = document.getElementById('ingredientType');
            if (ingredientTypeSelect) {
                ingredientTypeSelect.addEventListener('change', updateDisplayIngredientUnit);
            }
        }
    }

    if (document.getElementById('orderItemsTable')) { // Para la tabla de pedidos en pedido.html
        updateOrderTable();
        updateTotal();
        setupSearchInput('menuSearch', '.menu-items');
    }

    if (document.getElementById('splitPaymentModal')) { // Para el modal de pago fraccionado
        document.getElementById('splitPaymentModal').addEventListener('show.bs.modal', openSplitPaymentModal);
    }

    if (document.getElementById('insumosManagementTableBody')) { // Para la tabla de gestión de insumos en configuracion.html
        loadInsumos(); // Carga los insumos al abrir la pestaña
        // Listener para el modal de insumos (limpiar al abrir)
        document.getElementById('insumoModal').addEventListener('show.bs.modal', function(event) {
            if (!event.relatedTarget || !event.relatedTarget.classList.contains('btn-edit')) {
                clearInsumoForm();
            }
        });
    }

    if (document.getElementById('searchInput')) { // Para la tabla de historial de pedidos
        setupSearchInput('searchInput', '.table');
    }

    // Lógica para mesas.html (Selección múltiple, long press, doble clic)
    const tableCards = document.querySelectorAll('.table-card');
    if (tableCards.length > 0) {
        tableCards.forEach(card => {
            const tableNumber = parseInt(card.dataset.tableNumber);
            let clickTimer = null;
            let lastClickTime = 0;
            const DOUBLE_CLICK_THRESHOLD = 300; // ms

            // Eventos de ratón para PC
            card.addEventListener('mousedown', (event) => {
                if (event.button === 0) { // Solo clic izquierdo
                    handleTableMouseDown(card, tableNumber);
                }
            });

            card.addEventListener('mouseup', (event) => {
                if (event.button === 0) { // Solo clic izquierdo
                    const currentTime = new Date().getTime();
                    // Detectar doble click
                    if (currentTime - lastClickTime < DOUBLE_CLICK_THRESHOLD) {
                        clearTimeout(clickTimer);
                        goToOrder(tableNumber); // Doble clic va directo al pedido
                        clearSelection(); // Limpiar selección al ir a pedido
                    } else {
                        clickTimer = setTimeout(() => {
                            handleTableMouseUp(card, tableNumber, event); // Clic simple o Ctrl+Clic
                        }, DOUBLE_CLICK_THRESHOLD);
                    }
                    lastClickTime = currentTime;
                }
            });

            // Evitar menú contextual en long press para touch
            card.addEventListener('contextmenu', (event) => {
                if ('ontouchstart' in window) { // Solo para dispositivos táctiles
                    event.preventDefault();
                }
            });


            // Eventos táctiles para móvil
            card.addEventListener('touchstart', (event) => {
                // Prevenir el comportamiento por defecto de "doble tap para zoom" si es necesario
                // event.preventDefault(); // Cuidado: esto puede interferir con el scroll
                handleTableMouseDown(card, tableNumber);
            }, { passive: true }); // Usar passive para no bloquear el scroll

            card.addEventListener('touchend', (event) => {
                clearTimeout(longPressTimer);
                if (!isLongPressActive && event.cancelable) { // Si no fue un long press y el evento es cancelable
                    // Aquí se simula el click para que el toggleTableSelection funcione
                    const simulatedEvent = new MouseEvent('click', {
                        bubbles: true,
                        cancelable: true,
                        view: window,
                        detail: 1, // Indicar que es un clic simple
                        ctrlKey: event.ctrlKey || false // Propagar ctrlKey si existe
                    });
                    card.dispatchEvent(simulatedEvent);
                }
                isLongPressActive = false; // Resetear el estado de long press
                event.preventDefault(); // Prevenir el clic fantasma si se usó long press
            });

            card.addEventListener('touchmove', handleTableMove, { passive: true }); // Usar passive para no bloquear el scroll
        });
    }

    const animateElements = document.querySelectorAll(".room-card, .table-card, .card, .table-responsive, .config-tabs");
    animateElements.forEach((el) => observer.observe(el));
});

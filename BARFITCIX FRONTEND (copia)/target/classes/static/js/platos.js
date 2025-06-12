/**
 * @file platos.js
 * @description Módulo JavaScript para la gestión de platos en la aplicación BarFitCIX.
 * Permite listar, agregar, editar y eliminar platos, incluyendo la gestión de sus insumos.
 * Los datos se persisten en localStorage a través del DataManager.
 * @author [Tu Nombre/Nombre de la Empresa]
 * @date 2025-06-11
 */

/**
 * @global DataManager - Instancia global del módulo de gestión de datos.
 * @global showCustomAlert - Función global para mostrar alertas personalizadas.
 * @global showCustomConfirm - Función global para mostrar confirmaciones personalizadas.
 */

// Array local para trabajar con los platos
let dishesData = [];
// Array local para los insumos del plato actualmente en edición/creación
let currentPlatoInsumos = [];
// Mapa de insumos a unidades (cargado desde DataManager)
let unitMap = {};
// Variable para almacenar el ID del plato actualmente seleccionado para edición
let currentPlatoId = null;

/**
 * @function loadDishes
 * @description Carga los platos y los insumos disponibles desde el DataManager (localStorage)
 * y actualiza la tabla de platos en la interfaz.
 */
function loadDishes() {
    dishesData = DataManager.getPlatos();
    // Reconstruir unitMap a partir de los insumos cargados
    unitMap = {};
    DataManager.getInsumos().forEach(insumo => {
        unitMap[insumo.name] = insumo.unit;
    });
    updateDishesTable();
    populateIngredientTypes(); // Rellenar el select de tipos de insumo para el modal
}

/**
 * @function updateDishesTable
 * @description Renderiza y actualiza la tabla de platos en la página 'platos.html'.
 */
function updateDishesTable() {
    const tbody = document.getElementById('platosTableBody');
    if (!tbody) {
        console.error("platosTableBody no encontrado. Asegúrate de estar en platos.html.");
        return;
    }

    tbody.innerHTML = ''; // Limpiar la tabla antes de renderizar
    if (dishesData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No hay platos registrados.</td></tr>';
        return;
    }

    dishesData.forEach(plato => {
        const row = document.createElement('tr');
        row.dataset.platoId = plato.id; // Almacena el ID del plato en el dataset de la fila
        // Hacer la fila clickeable para edición
        row.addEventListener('click', () => editPlato(plato.id));

        row.innerHTML = `
            <td>${plato.id}</td>
            <td>${plato.nombre}</td>
            <td>${plato.descripcion}</td>
            <td>S/. ${plato.precio.toFixed(2)}</td>
            <td>${plato.categoria}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-info btn-sm" onclick="event.stopPropagation(); showPriceHistoryModal('${plato.nombre}')" title="Historial de Precios">
                        <i class="bi bi-clock-history"></i>
                    </button>
                    <button class="btn btn-delete btn-sm" onclick="event.stopPropagation(); deletePlato(${plato.id})" title="Eliminar">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

/**
 * @function clearPlatoForm
 * @description Limpia los campos del formulario de platos y restablece los insumos asociados.
 */
function clearPlatoForm() {
    document.getElementById('platoId').value = ''; // Campo oculto para el ID
    document.getElementById('nombrePlato').value = '';
    document.getElementById('descripcionPlato').value = '';
    document.getElementById('precioPlato').value = '0.00';
    document.getElementById('categoriaPlato').value = ''; // Seleccionar una opción por defecto si aplica
    currentPlatoInsumos = []; // Limpiar insumos asociados
    currentPlatoId = null; // Reiniciar el ID del plato actual
    updateInsumosTablePlatos(); // Actualizar la tabla de insumos del formulario
    document.getElementById('platoFormCardHeader').textContent = 'NUEVO PLATO';
}

/**
 * @function editPlato
 * @description Carga los datos de un plato existente en el formulario para su edición.
 * @param {number} id - El ID del plato a editar.
 */
function editPlato(id) {
    const plato = dishesData.find(p => p.id === id);
    if (plato) {
        document.getElementById('platoFormCardHeader').textContent = 'EDITAR PLATO';
        document.getElementById('platoId').value = plato.id;
        document.getElementById('nombrePlato').value = plato.nombre;
        document.getElementById('descripcionPlato').value = plato.descripcion;
        document.getElementById('precioPlato').value = plato.precio.toFixed(2);
        document.getElementById('categoriaPlato').value = plato.categoria;
        // Clonar los insumos para no modificar el array original directamente al editar
        currentPlatoInsumos = JSON.parse(JSON.stringify(plato.insumos || []));
        currentPlatoId = plato.id; // Almacenar el ID para saber que estamos editando
        updateInsumosTablePlatos(); // Actualizar la tabla de insumos del formulario
    } else {
        showCustomAlert('Error', 'Plato no encontrado para editar.');
    }
}

/**
 * @function savePlato
 * @description Guarda un nuevo plato o actualiza uno existente.
 * Valida los campos y persiste los datos en localStorage.
 */
async function savePlato() {
    const id = document.getElementById('platoId').value;
    const nombre = document.getElementById('nombrePlato').value.trim();
    const descripcion = document.getElementById('descripcionPlato').value.trim();
    const precio = parseFloat(document.getElementById('precioPlato').value);
    const categoria = document.getElementById('categoriaPlato').value;

    if (!nombre || !descripcion || isNaN(precio) || precio < 0 || !categoria) {
        showCustomAlert('Validación', 'Por favor, complete todos los campos del plato y asegúrese de que el precio sea válido.');
        return;
    }

    if (id) { // Edición de plato
        const index = dishesData.findIndex(p => p.id == id);
        if (index !== -1) {
            // Verificar si el nombre del plato ya existe en otro plato
            const existingPlatoByName = dishesData.find(p => p.nombre.toLowerCase() === nombre.toLowerCase() && p.id != id);
            if (existingPlatingByName) {
                showCustomAlert('Error', `Ya existe un plato con el nombre '${nombre}'.`);
                return;
            }

            dishesData[index] = {
                id: parseInt(id),
                nombre,
                descripcion,
                precio,
                categoria,
                insumos: currentPlatoInsumos // Asignar los insumos actuales
            };
            DataManager.savePlatos(dishesData);
            showCustomAlert('Éxito', `Plato '${nombre}' actualizado exitosamente.`);
        } else {
            showCustomAlert('Error', 'No se pudo encontrar el plato para actualizar.');
        }
    } else { // Nuevo plato
        // Verificar si el nombre del plato ya existe
        if (dishesData.some(p => p.nombre.toLowerCase() === nombre.toLowerCase())) {
            showCustomAlert('Error', `Ya existe un plato con el nombre '${nombre}'.`);
            return;
        }

        const newId = dishesData.length > 0 ? Math.max(...dishesData.map(p => p.id)) + 1 : 1;
        dishesData.push({
            id: newId,
            nombre,
            descripcion,
            precio,
            categoria,
            insumos: currentPlatoInsumos // Asignar los insumos actuales
        });
        DataManager.savePlatos(dishesData);
        showCustomAlert('Éxito', `Plato '${nombre}' agregado exitosamente.`);
    }

    updateDishesTable();
    clearPlatoForm();
}

/**
 * @function deletePlato
 * @description Elimina un plato de la lista previa confirmación.
 * @param {number} id - El ID del plato a eliminar.
 */
async function deletePlato(id) {
    const plato = dishesData.find(p => p.id === id);
    if (!plato) {
        showCustomAlert('Error', 'Plato no encontrado.');
        return;
    }

    const confirmDelete = await showCustomConfirm('Confirmar Eliminación', `¿Está seguro de eliminar el plato '${plato.nombre}'?`);
    if (confirmDelete) {
        dishesData = dishesData.filter(p => p.id !== id);
        DataManager.savePlatos(dishesData);
        updateDishesTable();
        showCustomAlert('Éxito', `Plato '${plato.nombre}' eliminado exitosamente.`);
        clearPlatoForm(); // Limpiar el formulario si el plato eliminado estaba en edición
    }
}

/**
 * @function showPriceHistoryModal
 * @description Muestra el modal con el historial de precios simulado para un producto.
 * @param {string} productName - El nombre del producto cuyo historial de precios se mostrará.
 */
function showPriceHistoryModal(productName) {
    document.getElementById('productNameHistory').textContent = productName;
    const priceHistoryTableBody = document.getElementById('priceHistoryTableBody');
    if (!priceHistoryTableBody) {
        console.error("priceHistoryTableBody no encontrado.");
        return;
    }
    priceHistoryTableBody.innerHTML = '';

    // Simular historial de precios
    // En una aplicación real, esto se cargaría de un array de historial de precios o de un backend
    const historyData = {
        "Pollo a la Plancha": [
            {date: "2024-01-15", price: "S/. 23.00"},
            {date: "2024-03-01", price: "S/. 24.50"},
            {date: "2024-05-20", price: "S/. 25.00"}
        ],
        "Ensalada César": [
            {date: "2023-11-10", price: "S/. 20.00"},
            {date: "2024-02-01", price: "S/. 21.50"},
            {date: "2024-04-15", price: "S/. 22.00"}
        ],
        "Batido Proteico": [
            {date: "2023-10-01", price: "S/. 16.00"},
            {date: "2024-01-05", price: "S/. 17.50"},
            {date: "2024-03-10", price: "S/. 18.00"}
        ],
        "Agua Infusionada": [
            {date: "2024-01-20", price: "S/. 11.00"},
            {date: "2024-04-01", price: "S/. 12.00"}
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
 * @function updateInsumosTablePlatos
 * @description Actualiza la tabla de insumos para el plato en el formulario de edición/creación.
 */
function updateInsumosTablePlatos() {
    const insumosTableBody = document.getElementById('insumosTableBody');
    if (!insumosTableBody) {
        console.error("insumosTableBody no encontrado en el formulario de platos.");
        return;
    }

    insumosTableBody.innerHTML = '';
    if (currentPlatoInsumos.length === 0) {
        insumosTableBody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">No hay insumos agregados.</td></tr>';
        return;
    }
    currentPlatoInsumos.forEach((insumo, index) => {
        const row = document.createElement('tr');
        row.dataset.index = index;
        row.onclick = () => selectIngredientRow(row); // Permitir selección para eliminar
        row.innerHTML = `
            <td>${insumo.type}</td>
            <td>${insumo.quantity}</td>
            <td>${insumo.unit}</td>
        `;
        insumosTableBody.appendChild(row);
    });
}

let selectedIngredientRow = null;

/**
 * @function selectIngredientRow
 * @description Marca una fila de la tabla de insumos como seleccionada.
 * @param {HTMLElement} row - El elemento <tr> de la fila seleccionada.
 */
function selectIngredientRow(row) {
    if (selectedIngredientRow) {
        selectedIngredientRow.classList.remove('table-active');
    }
    selectedIngredientRow = row;
    row.classList.add('table-active');
}

/**
 * @function populateIngredientTypes
 * @description Rellena el select de tipos de insumo en el modal 'addIngredientModal'
 * usando los insumos cargados por el DataManager.
 */
function populateIngredientTypes() {
    const ingredientTypeSelect = document.getElementById('ingredientType');
    if (!ingredientTypeSelect) return;

    const allInsumos = DataManager.getInsumos();
    ingredientTypeSelect.innerHTML = '<option value="">Seleccionar...</option>';
    allInsumos.forEach(insumo => {
        const option = document.createElement('option');
        option.value = insumo.name; // Usar el nombre del insumo como valor
        option.textContent = insumo.name;
        ingredientTypeSelect.appendChild(option);
    });
}

/**
 * @function updateDisplayIngredientUnit
 * @description Actualiza el span que muestra la unidad de un insumo seleccionado
 * en el formulario de "Añadir Insumo".
 */
function updateDisplayIngredientUnit() {
    const ingredientTypeSelect = document.getElementById('ingredientType');
    const displayUnitSpan = document.getElementById('displayIngredientUnit');
    if (!ingredientTypeSelect || !displayUnitSpan) return;

    const selectedType = ingredientTypeSelect.value;
    displayUnitSpan.textContent = unitMap[selectedType] || ''; // Muestra la unidad o vacío si no hay selección
}

/**
 * @function saveIngredient
 * @description Agrega un nuevo insumo al plato actual (en `currentPlatoInsumos`).
 * Se valida la entrada y se actualiza la tabla de insumos.
 */
async function saveIngredient() {
    const type = document.getElementById('ingredientType').value;
    const quantity = parseFloat(document.getElementById('ingredientQuantity').value);
    const unit = unitMap[type]; // Obtener la unidad directamente del mapa

    if (!type || isNaN(quantity) || quantity <= 0 || !unit) {
        showCustomAlert('Validación', 'Por favor, complete todos los campos del insumo y asegúrese de que la cantidad sea válida.');
        return;
    }

    currentPlatoInsumos.push({ type, quantity, unit });
    updateInsumosTablePlatos();
    const modal = bootstrap.Modal.getInstance(document.getElementById('addIngredientModal'));
    modal.hide();
    document.getElementById('ingredientForm').reset();
    updateDisplayIngredientUnit(); // Resetear el display de la unidad después de guardar
    showCustomAlert('Éxito', `Insumo '${type}' agregado al plato.`);
}

/**
 * @function removeSelectedIngredient
 * @description Elimina el insumo seleccionado de la tabla de insumos del plato.
 */
async function removeSelectedIngredient() {
    if (selectedIngredientRow) {
        const index = parseInt(selectedIngredientRow.dataset.index);
        const insumoNombre = currentPlatoInsumos[index].type;
        const confirmDelete = await showCustomConfirm('Confirmar Eliminación', `¿Está seguro de eliminar el insumo '${insumoNombre}' del plato?`);

        if (confirmDelete) {
            currentPlatoInsumos.splice(index, 1);
            selectedIngredientRow = null;
            updateInsumosTablePlatos();
            showCustomAlert('Éxito', `Insumo '${insumoNombre}' eliminado del plato.`);
        }
    } else {
        showCustomAlert('Información', 'Selecciona un insumo para eliminar.');
    }
}

// --- Event Listeners Específicos para la Página de Platos ---

document.addEventListener("DOMContentLoaded", () => {
    // Cargar los platos e insumos al cargar la página
    loadDishes();

    // Listener para el formulario de platos (botón "REGISTRAR PLATO" o "MODIFICAR PLATO")
    const platoForm = document.getElementById('platoForm');
    if (platoForm) {
        platoForm.addEventListener('submit', function(e) {
            e.preventDefault(); // Prevenir el envío por defecto del formulario
            savePlato();
        });
    }

    // Listener para el botón "NUEVO PLATO" (fuera del formulario, si existe)
    const newPlatoBtn = document.querySelector('#platosSection .btn-secondary'); // Asegúrate que este selector sea correcto
    if (newPlatoBtn) {
        newPlatoBtn.addEventListener('click', clearPlatoForm);
    }

    // Listener para el botón "ELIMINAR PLATO" (en el formulario)
    const deletePlatoFormBtn = document.querySelector('#platoForm .btn-danger');
    if (deletePlatoFormBtn) {
        deletePlatoFormBtn.addEventListener('click', async () => {
            if (currentPlatoId) {
                await deletePlato(currentPlatoId);
            } else {
                showCustomAlert('Información', 'No hay ningún plato seleccionado para eliminar.');
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

    // Asignar evento click para el botón "Guardar Insumo" dentro del modal de insumos
    const saveIngredientModalBtn = document.querySelector('#addIngredientModal .btn-primary');
    if (saveIngredientModalBtn) {
        saveIngredientModalBtn.onclick = saveIngredient;
    }

    // Asignar evento click para el botón "Remover Insumo Seleccionado"
    const removeIngredientBtn = document.querySelector('#platoForm .insumo-actions .btn-danger');
    if (removeIngredientBtn) {
        removeIngredientBtn.onclick = removeSelectedIngredient;
    }
});

/**
 * @file insumos.js
 * @description Módulo JavaScript para la gestión de insumos en la sección
 * de configuración de la aplicación BarFitCIX. Permite listar, agregar,
 * editar y eliminar insumos, persistiendo los datos en localStorage
 * a través del DataManager.
 * @author [Tu Nombre/Nombre de la Empresa]
 * @date 2025-06-11
 */

/**
 * @global DataManager - Instancia global del módulo de gestión de datos.
 * @global showCustomAlert - Función global para mostrar alertas personalizadas.
 * @global showCustomConfirm - Función global para mostrar confirmaciones personalizadas.
 */

// Array local para trabajar con los insumos
let ingredientsData = [];

/**
 * @function loadIngredients
 * @description Carga los insumos desde el DataManager (localStorage) y actualiza
 * la tabla de gestión de insumos en la interfaz.
 */
function loadIngredients() {
    ingredientsData = DataManager.getInsumos();
    updateIngredientsManagementTable();
}

/**
 * @function updateIngredientsManagementTable
 * @description Renderiza y actualiza la tabla de gestión de insumos en la página
 * 'configuracion.html'.
 */
function updateIngredientsManagementTable() {
    const tbody = document.getElementById('insumosManagementTableBody');
    if (!tbody) {
        console.error("insumosManagementTableBody no encontrado. Asegúrate de estar en configuracion.html.");
        return;
    }

    tbody.innerHTML = ''; // Limpiar la tabla antes de renderizar
    if (ingredientsData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">No hay insumos registrados.</td></tr>';
        return;
    }

    ingredientsData.forEach(insumo => {
        const row = document.createElement('tr');
        row.dataset.insumoId = insumo.id; // Almacena el ID del insumo en el dataset de la fila
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

/**
 * @function clearInsumoForm
 * @description Limpia los campos del formulario de insumo y restablece el título del modal.
 */
function clearInsumoForm() {
    document.getElementById('insumoId').value = ''; // Campo oculto para el ID
    document.getElementById('insumoName').value = '';
    document.getElementById('insumoUnit').value = '';
    document.getElementById('insumoModalLabel').textContent = 'Nuevo Insumo';
}

/**
 * @function saveInsumo
 * @description Guarda un nuevo insumo o actualiza uno existente.
 * Valida los campos y persiste los datos en localStorage.
 */
async function saveInsumo() {
    const id = document.getElementById('insumoId').value;
    const name = document.getElementById('insumoName').value.trim();
    const unit = document.getElementById('insumoUnit').value;

    if (!name || !unit) {
        showCustomAlert('Validación', 'Por favor, complete todos los campos del insumo.');
        return;
    }

    if (id) { // Edición de insumo
        const index = ingredientsData.findIndex(insumo => insumo.id == id);
        if (index !== -1) {
            // Verificar si el nombre del insumo ya existe en otro insumo
            const existingInsumoByName = ingredientsData.find(i => i.name.toLowerCase() === name.toLowerCase() && i.id != id);
            if (existingInsumoByName) {
                showCustomAlert('Error', `Ya existe un insumo con el nombre '${name}'.`);
                return;
            }

            ingredientsData[index] = { id: parseInt(id), name, unit };
            DataManager.saveInsumos(ingredientsData);
            updateIngredientsManagementTable();
            showCustomAlert('Éxito', `Insumo '${name}' actualizado exitosamente.`);
        } else {
            showCustomAlert('Error', 'No se pudo encontrar el insumo para actualizar.');
        }
    } else { // Nuevo insumo
        // Verificar si el nombre del insumo ya existe
        if (ingredientsData.some(insumo => insumo.name.toLowerCase() === name.toLowerCase())) {
            showCustomAlert('Error', `Ya existe un insumo con el nombre '${name}'.`);
            return;
        }

        const newId = ingredientsData.length > 0 ? Math.max(...ingredientsData.map(i => i.id)) + 1 : 1;
        ingredientsData.push({ id: newId, name, unit });
        DataManager.saveInsumos(ingredientsData);
        updateIngredientsManagementTable();
        showCustomAlert('Éxito', `Insumo '${name}' agregado exitosamente.`);
    }

    const modal = bootstrap.Modal.getInstance(document.getElementById('insumoModal'));
    modal.hide();
    clearInsumoForm();
}

/**
 * @function editInsumo
 * @description Carga los datos de un insumo existente en el formulario del modal para su edición.
 * @param {number} id - El ID del insumo a editar.
 */
function editInsumo(id) {
    const insumo = ingredientsData.find(i => i.id === id);
    if (insumo) {
        document.getElementById('insumoModalLabel').textContent = 'Editar Insumo';
        document.getElementById('insumoId').value = insumo.id;
        document.getElementById('insumoName').value = insumo.name;
        document.getElementById('insumoUnit').value = insumo.unit;

        const modal = new bootstrap.Modal(document.getElementById('insumoModal'));
        modal.show();
    } else {
        showCustomAlert('Error', 'Insumo no encontrado para editar.');
    }
}

/**
 * @function deleteInsumo
 * @description Elimina un insumo de la lista previa confirmación.
 * @param {number} id - El ID del insumo a eliminar.
 */
async function deleteInsumo(id) {
    const insumo = ingredientsData.find(i => i.id === id);
    if (!insumo) {
        showCustomAlert('Error', 'Insumo no encontrado.');
        return;
    }

    const confirmDelete = await showCustomConfirm('Confirmar Eliminación', `¿Está seguro de eliminar el insumo '${insumo.name}'?`);
    if (confirmDelete) {
        ingredientsData = ingredientsData.filter(i => i.id !== id);
        DataManager.saveInsumos(ingredientsData);
        updateIngredientsManagementTable();
        showCustomAlert('Éxito', `Insumo '${insumo.name}' eliminado exitosamente.`);
    }
}

// --- Event Listeners Específicos para la Página de Insumos ---

document.addEventListener("DOMContentLoaded", () => {
    // Escuchar el evento de activación de la pestaña de Insumos
    const insumosTabButton = document.getElementById('insumos-tab');
    if (insumosTabButton) {
        insumosTabButton.addEventListener('shown.bs.tab', function () {
            loadIngredients(); // Carga los insumos cuando la pestaña es mostrada
        });
        // Si la pestaña de insumos es la activa al cargar la página, cargarla inmediatamente
        if (insumosTabButton.classList.contains('active')) {
            loadIngredients();
        }
    }

    // Listener para el evento 'show.bs.modal' del modal de insumos
    // Asegura que el formulario se limpie al abrir el modal si no es para edición
    const insumoModal = document.getElementById('insumoModal');
    if (insumoModal) {
        insumoModal.addEventListener('show.bs.modal', function (event) {
            // Si el botón que disparó el modal NO tiene la clase 'btn-edit'
            if (event.relatedTarget && !event.relatedTarget.classList.contains('btn-edit')) {
                clearInsumoForm();
            }
        });
    }

    // Asignar el evento click para el botón "Nuevo Insumo" (fuera del modal)
    const newInsumoBtn = document.querySelector('.new-insumo-btn');
    if (newInsumoBtn) {
        newInsumoBtn.addEventListener('click', clearInsumoForm); // Limpiar el formulario al abrir el modal para un nuevo insumo
    }

    // Asignar el evento click para el botón "Guardar Insumo" (dentro del modal)
    const saveInsumoModalBtn = document.querySelector('#insumoModal .btn-primary');
    if (saveInsumoModalBtn) {
        saveInsumoModalBtn.onclick = saveInsumo;
    }
});

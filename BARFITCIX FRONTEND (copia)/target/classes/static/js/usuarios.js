/**
 * @file usuarios.js
 * @description Módulo JavaScript para la gestión de usuarios en la sección
 * de configuración de la aplicación BarFitCIX. Permite listar, agregar,
 * editar y eliminar usuarios, persistiendo los datos en localStorage
 * a través del DataManager.
 * @author [Tu Nombre/Nombre de la Empresa]
 * @date 2025-06-11
 */

/**
 * @global DataManager - Instancia global del módulo de gestión de datos.
 * @global showCustomAlert - Función global para mostrar alertas personalizadas.
 * @global showCustomConfirm - Función global para mostrar confirmaciones personalizadas.
 */

// Array local para trabajar con los usuarios
let usersData = [];

/**
 * @function loadUsers
 * @description Carga los usuarios desde el DataManager (localStorage) y actualiza
 * la tabla de usuarios en la interfaz.
 */
function loadUsers() {
    usersData = DataManager.getUsuarios();
    updateUsersTable();
}

/**
 * @function updateUsersTable
 * @description Renderiza y actualiza la tabla de usuarios en la página
 * 'configuracion.html'.
 */
function updateUsersTable() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) {
        console.error("usersTableBody no encontrado. Asegúrate de estar en configuracion.html.");
        return;
    }

    tbody.innerHTML = ''; // Limpiar la tabla antes de renderizar
    if (usersData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No hay usuarios registrados.</td></tr>';
        return;
    }

    usersData.forEach(user => {
        const row = document.createElement('tr');
        row.dataset.userId = user.id; // Almacena el ID del usuario en el dataset de la fila
        row.innerHTML = `
            <td><strong>${user.usuario}</strong></td>
            <td>${user.correo}</td>
            <td><span class="role-badge role-${user.rol.toLowerCase().replace(' ', '-')}">${user.rol}</span></td>
            <td><span class="status-badge status-${user.estado.toLowerCase()}">${user.estado}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-edit" onclick="editUser(${user.id})" title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-delete" onclick="deleteUser(${user.id})" title="Eliminar">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

/**
 * @function clearUserForm
 * @description Limpia los campos del formulario de usuario y restablece el título del modal.
 */
function clearUserForm() {
    document.getElementById('userId').value = ''; // Campo oculto para el ID
    document.getElementById('userName').value = '';
    document.getElementById('userEmail').value = '';
    document.getElementById('userPassword').value = '';
    document.getElementById('userRole').value = '';
    document.getElementById('userStatus').value = 'ACTIVO'; // Valor por defecto
    document.getElementById('newUserModalLabel').textContent = 'Nuevo Usuario';
    // Muestra el campo de contraseña en modo "Nuevo Usuario"
    document.getElementById('userPasswordGroup').style.display = 'block';
}

/**
 * @function openNewUserModal
 * @description Abre el modal para crear un nuevo usuario, asegurando que el formulario esté limpio.
 */
function openNewUserModal() {
    clearUserForm();
    const modal = new bootstrap.Modal(document.getElementById('newUserModal'));
    modal.show();
}

/**
 * @function editUser
 * @description Carga los datos de un usuario existente en el formulario del modal para su edición.
 * @param {number} id - El ID del usuario a editar.
 */
function editUser(id) {
    const user = usersData.find(u => u.id === id);
    if (user) {
        document.getElementById('newUserModalLabel').textContent = 'Editar Usuario';
        document.getElementById('userId').value = user.id; // Establece el ID oculto
        document.getElementById('userName').value = user.usuario;
        document.getElementById('userEmail').value = user.correo;
        document.getElementById('userRole').value = user.rol;
        document.getElementById('userStatus').value = user.estado;
        document.getElementById('userPassword').value = ''; // Limpiar campo de contraseña al editar
        // Oculta el campo de contraseña para edición (no se edita directamente por seguridad)
        document.getElementById('userPasswordGroup').style.display = 'none';

        const modal = new bootstrap.Modal(document.getElementById('newUserModal'));
        modal.show();
    } else {
        showCustomAlert('Error', 'Usuario no encontrado para editar.');
    }
}

/**
 * @function saveUser
 * @description Guarda un nuevo usuario o actualiza uno existente.
 * Valida los campos y persiste los datos en localStorage.
 */
async function saveUser() {
    const id = document.getElementById('userId').value;
    const usuario = document.getElementById('userName').value;
    const correo = document.getElementById('userEmail').value;
    const password = document.getElementById('userPassword').value; // Solo relevante para nuevo
    const rol = document.getElementById('userRole').value;
    const estado = document.getElementById('userStatus').value;

    if (!usuario || !correo || !rol || !estado || (!id && !password)) {
        showCustomAlert('Validación', 'Por favor complete todos los campos obligatorios.');
        return;
    }

    if (id) { // Edición de usuario
        const index = usersData.findIndex(u => u.id == id);
        if (index !== -1) {
            usersData[index] = { ...usersData[index], usuario, correo, rol, estado };
            DataManager.saveUsuarios(usersData);
            updateUsersTable();
            showCustomAlert('Éxito', `Usuario '${usuario}' actualizado exitosamente.`);
        } else {
            showCustomAlert('Error', 'No se pudo encontrar el usuario para actualizar.');
        }
    } else { // Nuevo usuario
        // Verificar si el nombre de usuario ya existe
        if (usersData.some(u => u.usuario.toLowerCase() === usuario.toLowerCase())) {
            showCustomAlert('Error', `El usuario '${usuario}' ya existe. Por favor, elija otro.`);
            return;
        }

        const newId = usersData.length > 0 ? Math.max(...usersData.map(u => u.id)) + 1 : 1;
        usersData.push({ id: newId, usuario, correo, password, rol, estado }); // Guardar password (solo para simulación local)
        DataManager.saveUsuarios(usersData);
        updateUsersTable();
        showCustomAlert('Éxito', `Usuario '${usuario}' agregado exitosamente.`);
    }

    const modal = bootstrap.Modal.getInstance(document.getElementById('newUserModal'));
    modal.hide();
    clearUserForm();
}

/**
 * @function deleteUser
 * @description Elimina un usuario de la lista previa confirmación.
 * @param {number} id - El ID del usuario a eliminar.
 */
async function deleteUser(id) {
    const user = usersData.find(u => u.id === id);
    if (!user) {
        showCustomAlert('Error', 'Usuario no encontrado.');
        return;
    }

    const confirmDelete = await showCustomConfirm('Confirmar Eliminación', `¿Está seguro de eliminar el usuario '${user.usuario}'?`);
    if (confirmDelete) {
        usersData = usersData.filter(u => u.id !== id);
        DataManager.saveUsuarios(usersData);
        updateUsersTable();
        showCustomAlert('Éxito', `Usuario '${user.usuario}' eliminado exitosamente.`);
    }
}

// --- Event Listeners Específicos para la Página de Usuarios ---

/**
 * @description Se ejecuta cuando el DOM está completamente cargado.
 * Inicializa la lógica específica de la página de usuarios.
 */
document.addEventListener("DOMContentLoaded", () => {
    // Cargar los usuarios al cargar la página
    loadUsers();

    // Listener para el botón "Nuevo Usuario" para abrir el modal
    const newUserBtn = document.querySelector('.new-user-btn');
    if (newUserBtn) {
        newUserBtn.addEventListener('click', openNewUserModal);
    }

    // Listener para el evento 'show.bs.modal' del modal de usuario
    // Asegura que el formulario se limpie al abrir el modal si no es para edición
    const newUserModal = document.getElementById('newUserModal');
    if (newUserModal) {
        newUserModal.addEventListener('show.bs.modal', function (event) {
            // Si el botón que disparó el modal NO tiene la clase 'btn-edit'
            if (event.relatedTarget && !event.relatedTarget.classList.contains('btn-edit')) {
                clearUserForm();
            }
        });
    }

    // Asignar el evento click para el botón de guardar dentro del modal
    const saveUserBtn = document.querySelector('#newUserModal .btn-primary');
    if (saveUserBtn) {
        saveUserBtn.onclick = saveUser; // Asegura que el botón llama a la función saveUser
    }
});

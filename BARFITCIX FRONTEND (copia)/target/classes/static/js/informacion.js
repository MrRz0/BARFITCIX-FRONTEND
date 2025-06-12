/**
 * @file informacion.js
 * @description Módulo JavaScript para la gestión de la información de la empresa
 * en la sección de configuración de la aplicación BarFitCIX. Permite cargar
 * y guardar los datos de la empresa, persistiendo en localStorage a través del DataManager.
 * @author [Tu Nombre/Nombre de la Empresa]
 * @date 2025-06-11
 */

/**
 * @global DataManager - Instancia global del módulo de gestión de datos.
 * @global showCustomAlert - Función global para mostrar alertas personalizadas.
 */

// Objeto local para trabajar con la información de la empresa
let companyInfo = {};

/**
 * @function loadCompanyInfo
 * @description Carga la información de la empresa desde el DataManager (localStorage)
 * y la rellena en el formulario de la interfaz.
 */
function loadCompanyInfo() {
    companyInfo = DataManager.getEmpresaInfo();
    // Rellenar los campos del formulario
    document.getElementById('companyName').value = companyInfo.nombreComercial || '';
    document.getElementById('companyRazonSocial').value = companyInfo.razonSocial || '';
    document.getElementById('companyRUC').value = companyInfo.ruc || '';
    document.getElementById('companyAddress').value = companyInfo.direccion || '';
    document.getElementById('companyPhone').value = companyInfo.telefono || '';
    document.getElementById('companyEmail').value = companyInfo.correo || '';
    document.getElementById('companyWebsite').value = companyInfo.sitioWeb || '';
    // El logo se maneja directamente en el HTML con una ruta fija, no hay lógica de subida aquí
}

/**
 * @function saveCompanyInfo
 * @description Guarda la información de la empresa desde el formulario
 * y la persiste en localStorage a través del DataManager.
 */
async function saveCompanyInfo(event) {
    event.preventDefault(); // Prevenir el envío por defecto del formulario

    const newCompanyName = document.getElementById('companyName').value.trim();
    const newRazonSocial = document.getElementById('companyRazonSocial').value.trim();
    const newRUC = document.getElementById('companyRUC').value.trim();
    const newAddress = document.getElementById('companyAddress').value.trim();
    const newPhone = document.getElementById('companyPhone').value.trim();
    const newEmail = document.getElementById('companyEmail').value.trim();
    const newWebsite = document.getElementById('companyWebsite').value.trim();

    // Validación básica
    if (!newCompanyName || !newRazonSocial || !newRUC || !newAddress || !newPhone || !newEmail) {
        showCustomAlert('Validación', 'Por favor, complete todos los campos obligatorios (Nombre Comercial, Razón Social, RUC, Dirección, Teléfono, Correo Electrónico).');
        return;
    }

    // Actualizar el objeto companyInfo
    companyInfo = {
        nombreComercial: newCompanyName,
        razonSocial: newRazonSocial,
        ruc: newRUC,
        direccion: newAddress,
        telefono: newPhone,
        correo: newEmail,
        sitioWeb: newWebsite
    };

    DataManager.saveEmpresaInfo(companyInfo); // Persistir los cambios
    showCustomAlert('Éxito', 'Información de la empresa guardada exitosamente.');
}

// --- Event Listeners Específicos para la Página de Información de la Empresa ---

document.addEventListener("DOMContentLoaded", () => {
    // Escuchar el evento de activación de la pestaña de Información
    const infoTabButton = document.getElementById('info-tab');
    if (infoTabButton) {
        infoTabButton.addEventListener('shown.bs.tab', function () {
            loadCompanyInfo(); // Carga la info de la empresa cuando la pestaña es mostrada
        });
        // Si la pestaña de información es la activa al cargar la página (por defecto), cargarla inmediatamente
        if (infoTabButton.classList.contains('active')) {
            loadCompanyInfo();
        }
    }

    // Listener para el botón "GUARDAR CAMBIOS" del formulario de información de la empresa
    const saveCompanyInfoBtn = document.querySelector('#info button[type="submit"]');
    if (saveCompanyInfoBtn) {
        saveCompanyInfoBtn.addEventListener('click', saveCompanyInfo);
    }
});

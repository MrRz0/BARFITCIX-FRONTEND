/**
 * @file login.js
 * @description Módulo JavaScript para la página de inicio de sesión de BarFitCIX.
 * Maneja la lógica de simulación de inicio de sesión.
 * @author [Tu Nombre/Nombre de la Empresa]
 * @date 2025-06-11
 */

/**
 * @global showCustomAlert - Función global para mostrar alertas personalizadas.
 */

/**
 * @function handleLogin
 * @description Simula el proceso de inicio de sesión.
 * Actualmente, solo redirige al dashboard. Se podría añadir validación de credenciales.
 * @param {Event} event - El evento del formulario (para prevenir el envío por defecto).
 */
async function handleLogin(event) {
    event.preventDefault(); // Prevenir el envío por defecto del formulario

    const usernameInput = document.querySelector('.login-card input[type="text"]');
    const passwordInput = document.querySelector('.login-card input[type="password"]');

    const username = usernameInput.value;
    const password = passwordInput.value;

    // Aquí se podría implementar una lógica de validación de credenciales simple
    // Por ejemplo, verificar si el usuario y la contraseña existen en DataManager.getUsuarios()
    // Para esta simulación, cualquier entrada no vacía lleva al dashboard.

    if (username && password) {
        // En un sistema real, aquí se enviaría a un backend para autenticación.
        // Simulamos el inicio de sesión exitoso.
        showCustomAlert('Inicio de Sesión', '¡Inicio de sesión exitoso! Redirigiendo al dashboard.').then(() => {
             window.location.href = "/dashboard";
        });
    } else {
        showCustomAlert('Error de Credenciales', 'Por favor, ingrese su usuario y contraseña.');
    }
}

// --- Event Listeners Específicos para la Página de Login ---

document.addEventListener("DOMContentLoaded", () => {
    // Obtener el formulario de login y añadir el event listener para el envío
    const loginForm = document.querySelector('.login-card form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});

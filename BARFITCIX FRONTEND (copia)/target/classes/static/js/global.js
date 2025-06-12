/**
 * @file global.js
 * @description Este archivo contiene funciones JavaScript de propósito general
 * utilizadas en toda la aplicación BarFitCIX, incluyendo la actualización de
 * fecha/hora, gestión del sidebar, cambio de tema y modales personalizados.
 * @author [Tu Nombre/Nombre de la Empresa]
 * @date 2025-06-11
 */

// --- Funciones de Utilidad General ---

/**
 * @function updateDateTime
 * @description Actualiza la fecha y hora en tiempo real en los elementos HTML
 * con los IDs 'currentTime' y 'currentDate'.
 * Formatea la hora a AM/PM y la fecha a un formato legible en español.
 */
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

    // Actualiza todos los elementos HTML con la hora y fecha actuales.
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
 * @function toggleSidebar
 * @description Alterna el estado del sidebar (colapsado/expandido en desktop,
 * mostrar/ocultar en móvil). Si se invoca sin argumentos, alterna el estado.
 * Si se fuerza, establece el estado.
 * @param {boolean|null} forceCollapse - Si es `true`, fuerza el colapso;
 * si es `false`, fuerza la expansión. Si es `null`, alterna el estado actual.
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
 * @function closeSidebarOnOutsideClick
 * @description Cierra el sidebar al hacer clic fuera de él.
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

/**
 * @function fadeInUp
 * @description Aplica una animación de "fade in up" a un elemento.
 * @param {HTMLElement} element - El elemento DOM al que se aplicará la animación.
 */
function fadeInUp(element) {
    element.style.opacity = "0";
    element.style.transform = "translateY(30px)";
    element.style.transition = "all 0.5s ease";

    setTimeout(() => {
        element.style.opacity = "1";
        element.style.transform = "translateY(0)";
    }, 100);
}

/**
 * @constant observerOptions
 * @description Opciones para el Intersection Observer (para detectar cuándo los elementos entran en la vista).
 */
const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
};

/**
 * @constant observer
 * @description Crea un Intersection Observer para aplicar animaciones cuando los elementos son visibles.
 */
const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add("fade-in-up-active"); // Usar una clase diferente para activar
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

/**
 * @function setupSearchInput
 * @description Configura un campo de búsqueda para filtrar las filas de una tabla.
 * @param {string} inputId - El ID del elemento input de búsqueda.
 * @param {string} tableSelector - Un selector CSS para la tabla (ej. '#myTable', '.my-table-class').
 */
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

// --- Funciones de Tema (Modo Claro/Oscuro) ---

/**
 * @function toggleTheme
 * @description Alterna el modo claro/oscuro de la aplicación y guarda la preferencia
 * en el localStorage.
 */
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

/**
 * @function loadTheme
 * @description Carga la preferencia de tema guardada en localStorage al iniciar la aplicación.
 * Configura el estado del toggle del tema y aplica la clase 'dark-mode' si es necesario.
 */
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

// --- Funciones de Modales Personalizados (Reemplazo de alert/confirm) ---

// Elementos del modal personalizado (se crearán dinámicamente o se espera que existan en base.html)
let customModalInstance; // Instancia del modal de Bootstrap
let customModalTitleElement;
let customModalBodyElement;
let customModalConfirmButton;
let customModalCancelButton;
let customModalResolver; // Para resolver la promesa en showCustomConfirm

/**
 * @function initializeCustomModal
 * @description Inicializa los elementos y la instancia del modal personalizado.
 * Este modal se espera que esté definido en base.html o en cada página que lo necesite.
 */
function initializeCustomModal() {
    const customModalElement = document.getElementById('customMessageModal');
    if (!customModalElement) {
        console.error("Custom message modal not found. Please ensure base.html includes it.");
        return;
    }

    customModalInstance = new bootstrap.Modal(customModalElement);
    customModalTitleElement = document.getElementById('customMessageModalTitle');
    customModalBodyElement = document.getElementById('customMessageModalBody');
    customModalConfirmButton = document.getElementById('customMessageModalConfirmBtn');
    customModalCancelButton = document.getElementById('customMessageModalCancelBtn');

    // Listener para el botón de confirmar (para showCustomConfirm)
    if (customModalConfirmButton) {
        customModalConfirmButton.onclick = () => {
            if (customModalResolver) customModalResolver(true);
            customModalInstance.hide();
        };
    }

    // Listener para el botón de cancelar y cierre del modal (para showCustomConfirm)
    if (customModalCancelButton) {
        customModalCancelButton.onclick = () => {
            if (customModalResolver) customModalResolver(false);
            customModalInstance.hide();
        };
    }
    // Si el modal se cierra por clic fuera o ESC, también resolvemos a false
    customModalElement.addEventListener('hide.bs.modal', () => {
        if (customModalResolver) customModalResolver(false);
        customModalResolver = null; // Limpiar el resolver
    });
}


/**
 * @function showCustomAlert
 * @description Muestra un modal de alerta personalizado.
 * @param {string} title - El título del modal.
 * @param {string} message - El mensaje a mostrar.
 */
function showCustomAlert(title, message) {
    return new Promise(resolve => {
        if (!customModalInstance) {
            // Si el modal no se inicializó, se utiliza alert de fallback
            console.warn("Custom modal not initialized, falling back to window.alert().");
            window.alert(`${title}: ${message}`);
            resolve();
            return;
        }

        customModalTitleElement.textContent = title;
        customModalBodyElement.textContent = message;
        if (customModalConfirmButton) {
            customModalConfirmButton.style.display = 'inline-block'; // Mostrar botón OK
            customModalConfirmButton.textContent = 'Aceptar';
        }
        if (customModalCancelButton) customModalCancelButton.style.display = 'none'; // Ocultar botón Cancelar
        customModalInstance.show();

        // Configurar el resolver para que siempre resuelva a true (como un alert)
        customModalResolver = resolve;
    });
}

/**
 * @function showCustomConfirm
 * @description Muestra un modal de confirmación personalizado.
 * @param {string} title - El título del modal.
 * @param {string} message - El mensaje a mostrar.
 * @returns {Promise<boolean>} Una promesa que resuelve a true si el usuario confirma, false si cancela.
 */
function showCustomConfirm(title, message) {
    return new Promise(resolve => {
        if (!customModalInstance) {
            console.warn("Custom modal not initialized, falling back to window.confirm().");
            resolve(window.confirm(`${title}: ${message}`));
            return;
        }

        customModalTitleElement.textContent = title;
        customModalBodyElement.textContent = message;
        if (customModalConfirmButton) {
            customModalConfirmButton.style.display = 'inline-block'; // Mostrar botón OK
            customModalConfirmButton.textContent = 'Confirmar'; // Cambiar texto del botón
        }
        if (customModalCancelButton) customModalCancelButton.style.display = 'inline-block'; // Mostrar botón Cancelar
        customModalInstance.show();
        customModalResolver = resolve; // Guardar el resolver para usarlo en los clics del modal
    });
}


// --- Event Listeners Globales (DOMContentLoaded) ---

/**
 * @description Se ejecuta cuando el DOM está completamente cargado.
 * Inicializa funciones globales y listeners de eventos.
 */
document.addEventListener("DOMContentLoaded", () => {
    // Inicializa el modal personalizado
    initializeCustomModal();

    // Carga el tema al cargar la página
    loadTheme();

    // Actualiza la fecha y hora y establece un intervalo para su actualización.
    updateDateTime();
    setInterval(updateDateTime, 1000);

    const sidebar = document.getElementById("sidebar");
    const dashboardContainer = document.querySelector(".dashboard-container");
    const navLinks = document.querySelectorAll(".sidebar-nav a");
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

    // Marca el enlace de navegación activo según la URL actual
    const currentPath = window.location.pathname;
    navLinks.forEach((link) => {
        link.classList.remove("active", "disabled");
        // Ajuste para que /configuracion sea activo si está en cualquiera de sus subpestañas
        if (currentPath.startsWith('/configuracion') || currentPath.startsWith('/usuarios') || currentPath.startsWith('/platos') || currentPath.startsWith('/mesas')) {
            if (link.getAttribute("href") === '/configuracion' && (currentPath.startsWith('/configuracion') || currentPath.startsWith('/usuarios') || currentPath.startsWith('/platos') || currentPath.startsWith('/mesas'))) {
                link.classList.add("active");
            }
        } else if (link.getAttribute("href") === currentPath) {
            link.classList.add("active");
        }
    });

    // Observa elementos para la animación "fade-in-up"
    // CORRECCIÓN: Añadido '.login-card' para que la tarjeta de login sea visible.
    // Además, cambié la clase de activación a 'fade-in-up-active' para evitar conflictos
    // con la clase base 'fade-in-up' que tiene opacity: 0.
    const animateElements = document.querySelectorAll(".room-card, .table-card, .card, .table-responsive, .config-tabs, .login-card");
    animateElements.forEach((el) => observer.observe(el));
});

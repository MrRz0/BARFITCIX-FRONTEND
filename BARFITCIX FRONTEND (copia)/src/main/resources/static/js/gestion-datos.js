/**
 * @file gestion-datos.js
 * @description Módulo para la gestión centralizada de datos de la aplicación
 * BarFitCIX utilizando localStorage como caché local.
 * Proporciona funciones para cargar y guardar los diferentes tipos de entidades.
 * @author [Tu Nombre/Nombre de la Empresa]
 * @date 2025-06-11
 */

/**
 * @namespace DataManager
 * @description Objeto que encapsula todas las funciones para la gestión de datos.
 */
const DataManager = (function() {
    // Definición de las claves para localStorage
    const LS_KEYS = {
        USUARIOS: 'barfitcix_usuarios',
        PLATOS: 'barfitcix_platos',
        SALAS: 'barfitcix_salas',
        MESAS: 'barfitcix_mesas', // Incluye estado y temporizador
        PEDIDOS: 'barfitcix_pedidos', // Pedidos pendientes y finalizados
        INSUMOS: 'barfitcix_insumos', // Insumos generales
        EMPRESA: 'barfitcix_empresa_info' // NUEVO: Clave para la información de la empresa
    };

    // Arrays para almacenar los datos en memoria
    let usuarios = [];
    let platos = [];
    let salas = [];
    let mesas = [];
    let pedidos = [];
    let insumos = [];
    let empresaInfo = {}; // NUEVO: Objeto para la información de la empresa

    // --- Funciones de Carga de Datos ---

    /**
     * @function _loadFromLocalStorage
     * @description Carga datos de una clave específica del localStorage.
     * @param {string} key - La clave del localStorage.
     * @returns {Array|Object} El array de datos o objeto parseado, o un valor por defecto si no existe o hay un error.
     * @private
     */
    function _loadFromLocalStorage(key) {
        try {
            const data = localStorage.getItem(key);
            // Si la clave es para un objeto (como EMPRESA), retornar un objeto vacío si no hay datos
            if (key === LS_KEYS.EMPRESA) {
                return data ? JSON.parse(data) : {};
            }
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error(`Error al cargar ${key} desde localStorage:`, e);
            // Retornar un objeto vacío para EMPRESA, array vacío para otros
            return (key === LS_KEYS.EMPRESA) ? {} : [];
        }
    }

    /**
     * @function _saveToLocalStorage
     * @description Guarda datos en una clave específica del localStorage.
     * @param {string} key - La clave del localStorage.
     * @param {Array|Object} data - El array de datos u objeto a guardar.
     * @private
     */
    function _saveToLocalStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error(`Error al guardar ${key} en localStorage:`, e);
        }
    }

    /**
     * @function _initializeDefaultData
     * @description Inicializa los datos con valores por defecto si no existen en localStorage.
     * @private
     */
    function _initializeDefaultData() {
        // Inicializar usuarios si no existen
        if (usuarios.length === 0) {
            usuarios = [
                { id: 1, usuario: 'ADMIN', correo: 'admin@gmail.com', rol: 'ADMINISTRADOR', estado: 'ACTIVO' },
                { id: 2, usuario: 'USER1', correo: 'user1@gmail.com', rol: 'EMPLEADO', estado: 'ACTIVO' },
                { id: 3, usuario: 'USER2', correo: 'user2@gmail.com', rol: 'EMPLEADO', estado: 'ACTIVO' },
                { id: 4, usuario: 'USER3', correo: 'user3@gmail.com', rol: 'EMPLEADO', estado: 'ACTIVO' },
                { id: 5, usuario: 'USER4', correo: 'user4@gmail.com', rol: 'EMPLEADO', estado: 'INACTIVO' }
            ];
            _saveToLocalStorage(LS_KEYS.USUARIOS, usuarios);
        }

        // Inicializar platos si no existen
        if (platos.length === 0) {
            platos = [
                { id: 1, nombre: 'Pollo a la Plancha', descripcion: 'Pechuga de pollo a la plancha con vegetales', precio: 25.00, categoria: 'Platos Principales', insumos: [{type: 'Pollo', quantity: 0.2, unit: 'kg'}, {type: 'Brócoli', quantity: 0.1, unit: 'kg'}] },
                { id: 2, nombre: 'Ensalada César', descripcion: 'Lechuga, crutones, queso parmesano, aderezo César', precio: 22.00, categoria: 'Ensaladas', insumos: [{type: 'Lechuga', quantity: 0.1, unit: 'unidad'}, {type: 'Pollo', quantity: 0.15, unit: 'kg'}] },
                { id: 3, nombre: 'Batido Proteico', descripcion: 'Batido de proteína de suero con frutos rojos', precio: 18.00, categoria: 'Bebidas', insumos: [{type: 'Proteína en polvo', quantity: 0.05, unit: 'kg'}, {type: 'Frutos Rojos', quantity: 0.05, unit: 'kg'}] },
                { id: 4, nombre: 'Agua Infusionada', descripcion: 'Agua con rodajas de pepino y limón', precio: 12.00, categoria: 'Bebidas', insumos: [{type: 'Pepino', quantity: 0.05, unit: 'unidad'}, {type: 'Limón', quantity: 0.05, unit: 'unidad'}] }
            ];
            _saveToLocalStorage(LS_KEYS.PLATOS, platos);
        }

        // Inicializar salas y mesas si no existen
        if (salas.length === 0) {
            salas = [
                { id: 1, nombre: 'SALA PRINCIPAL', capacidadMesas: 5, habilitada: true } // Sala predeterminada con 5 mesas
            ];
            _saveToLocalStorage(LS_KEYS.SALAS, salas);
        }

        // Verificar y/o crear mesas para las salas existentes si no hay mesas registradas
        // o si una sala tiene mesas insuficientes (para el caso de que solo se añadan salas)
        let needsTableUpdate = false;
        if (mesas.length === 0) { // Si no hay mesas en absoluto, crearlas desde cero
            salas.forEach(sala => {
                for (let i = 1; i <= sala.capacidadMesas; i++) {
                    mesas.push({
                        id: (sala.id * 100) + i,
                        numero: i,
                        idSala: sala.id,
                        estado: 'disponible',
                        tiempoOcupada: 0,
                        timerId: null
                    });
                }
            });
            needsTableUpdate = true;
        } else {
            // Asegurarse de que cada sala tenga el número correcto de mesas
            salas.forEach(sala => {
                const mesasDeEstaSala = mesas.filter(m => m.idSala === sala.id);
                if (mesasDeEstaSala.length < sala.capacidadMesas) {
                    for (let i = mesasDeEstaSala.length + 1; i <= sala.capacidadMesas; i++) {
                        mesas.push({
                            id: (sala.id * 100) + i,
                            numero: i,
                            idSala: sala.id,
                            estado: 'disponible',
                            tiempoOcupada: 0,
                            timerId: null
                        });
                    }
                    needsTableUpdate = true;
                }
                // No manejamos la reducción de mesas aquí, eso se hace en salas.js al editar/borrar
            });
        }
        if (needsTableUpdate) {
            _saveToLocalStorage(LS_KEYS.MESAS, mesas);
        }


        // Inicializar pedidos vacíos si no existen
        if (pedidos.length === 0) {
            pedidos = [];
            _saveToLocalStorage(LS_KEYS.PEDIDOS, pedidos);
        }

        // Inicializar insumos si no existen
        if (insumos.length === 0) {
            insumos = [
                { id: 1, name: "Arroz", unit: "kg" },
                { id: 2, name: "Cebolla", unit: "unidad" },
                { id: 3, name: "Tomate", unit: "kg" },
                { id: 4, name: "Pollo", unit: "kg" },
                { id: 5, name: "Carne", unit: "kg" },
                { id: 6, name: "Pescado", unit: "kg" },
                { id: 7, name: "Aceite", unit: "Lt" },
                { id: 8, name: "Sal", unit: "g" },
                { id: 9, name: "Pimienta", unit: "g" },
                { id: 10, name: "Brócoli", unit: "kg" },
                { id: 11, name: "Lechuga", unit: "unidad" },
                { id: 12, name: "Proteína en polvo", unit: "kg" },
                { id: 13, name: "Frutos Rojos", unit: "kg" },
                { id: 14, name: "Pepino", unit: "unidad" },
                { id: 15, name: "Limón", unit: "unidad" }
            ];
            _saveToLocalStorage(LS_KEYS.INSUMOS, insumos);
        }

        // NUEVO: Inicializar información de la empresa si no existe
        if (Object.keys(empresaInfo).length === 0) { // Verificar si el objeto está vacío
            empresaInfo = {
                nombreComercial: 'BarFitCIX',
                razonSocial: 'BarFitCIX',
                ruc: '10164120517',
                direccion: 'Avenida José Balta y calle Juan fanning, Chiclayo, Peru',
                telefono: '951 321 618',
                correo: 'barfit.cix@gmail.com',
                sitioWeb: 'instagram.com/barfit.cix'
                // No hay logo, se puede dejar el path por defecto en el HTML
            };
            _saveToLocalStorage(LS_KEYS.EMPRESA, empresaInfo);
        }
    }

    /**
     * @function loadAllData
     * @description Carga todos los datos de la aplicación desde localStorage.
     * Se debe llamar al inicio de la aplicación.
     */
    function loadAllData() {
        usuarios = _loadFromLocalStorage(LS_KEYS.USUARIOS);
        platos = _loadFromLocalStorage(LS_KEYS.PLATOS);
        salas = _loadFromLocalStorage(LS_KEYS.SALAS);
        mesas = _loadFromLocalStorage(LS_KEYS.MESAS);
        pedidos = _loadFromLocalStorage(LS_KEYS.PEDIDOS);
        insumos = _loadFromLocalStorage(LS_KEYS.INSUMOS);
        empresaInfo = _loadFromLocalStorage(LS_KEYS.EMPRESA); // NUEVO: Cargar info de empresa

        // Si no hay datos, inicializar con valores por defecto y guardar
        _initializeDefaultData();

        // Para las mesas, reiniciar los temporizadores si estaban corriendo
        // Esto se manejará en mesas.js al cargar las mesas
    }

    // --- Funciones para Obtener Datos ---

    /**
     * @function getUsuarios
     * @description Obtiene el array de usuarios.
     * @returns {Array} El array de usuarios.
     */
    function getUsuarios() {
        return usuarios;
    }

    /**
     * @function getPlatos
     * @description Obtiene el array de platos.
     * @returns {Array} El array de platos.
     */
    function getPlatos() {
        return platos;
    }

    /**
     * @function getSalas
     * @description Obtiene el array de salas.
     * @returns {Array} El array de salas.
     */
    function getSalas() {
        return salas;
    }

    /**
     * @function getMesas
     * @description Obtiene el array de mesas.
     * @returns {Array} El array de mesas.
     */
    function getMesas() {
        return mesas;
    }

    /**
     * @function getPedidos
     * @description Obtiene el array de pedidos.
     * @returns {Array} El array de pedidos.
     */
    function getPedidos() {
        return pedidos;
    }

    /**
     * @function getInsumos
     * @description Obtiene el array de insumos.
     * @returns {Array} El array de insumos.
     */
    function getInsumos() {
        return insumos;
    }

    /**
     * @function getEmpresaInfo
     * @description Obtiene el objeto con la información de la empresa.
     * @returns {Object} El objeto de información de la empresa.
     */
    function getEmpresaInfo() {
        return empresaInfo;
    }

    // --- Funciones para Guardar Datos (y actualizar localStorage) ---

    /**
     * @function saveUsuarios
     * @description Guarda el array de usuarios y lo persiste en localStorage.
     * @param {Array} newUsuarios - El nuevo array de usuarios.
     */
    function saveUsuarios(newUsuarios) {
        usuarios = newUsuarios;
        _saveToLocalStorage(LS_KEYS.USUARIOS, usuarios);
    }

    /**
     * @function savePlatos
     * @description Guarda el array de platos y lo persiste en localStorage.
     * @param {Array} newPlatos - El nuevo array de platos.
     */
    function savePlatos(newPlatos) {
        platos = newPlatos;
        _saveToLocalStorage(LS_KEYS.PLATOS, platos);
    }

    /**
     * @function saveSalas
     * @description Guarda el array de salas y lo persiste en localStorage.
     * @param {Array} newSalas - El nuevo array de salas.
     */
    function saveSalas(newSalas) {
        salas = newSalas;
        _saveToLocalStorage(LS_KEYS.SALAS, salas);
    }

    /**
     * @function saveMesas
     * @description Guarda el array de mesas y lo persiste en localStorage.
     * @param {Array} newMesas - El nuevo array de mesas.
     */
    function saveMesas(newMesas) {
        mesas = newMesas;
        _saveToLocalStorage(LS_KEYS.MESAS, mesas);
    }

    /**
     * @function savePedidos
     * @description Guarda el array de pedidos y lo persiste en localStorage.
     * @param {Array} newPedidos - El nuevo array de pedidos.
     */
    function savePedidos(newPedidos) {
        pedidos = newPedidos;
        _saveToLocalStorage(LS_KEYS.PEDIDOS, pedidos);
    }

    /**
     * @function saveInsumos
     * @description Guarda el array de insumos y lo persiste en localStorage.
     * @param {Array} newInsumos - El nuevo array de insumos.
     */
    function saveInsumos(newInsumos) {
        insumos = newInsumos;
        _saveToLocalStorage(LS_KEYS.INSUMOS, insumos);
    }

    /**
     * @function saveEmpresaInfo
     * @description Guarda el objeto de información de la empresa y lo persiste en localStorage.
     * @param {Object} newEmpresaInfo - El nuevo objeto de información de la empresa.
     */
    function saveEmpresaInfo(newEmpresaInfo) {
        empresaInfo = newEmpresaInfo;
        _saveToLocalStorage(LS_KEYS.EMPRESA, empresaInfo);
    }

    // Retorna las funciones públicas del DataManager
    return {
        loadAllData,
        getUsuarios,
        getPlatos,
        getSalas,
        getMesas,
        getPedidos,
        getInsumos,
        getEmpresaInfo, // NUEVO
        saveUsuarios,
        savePlatos,
        saveSalas,
        saveMesas,
        savePedidos,
        saveInsumos,
        saveEmpresaInfo // NUEVO
    };
})();

// Llama a loadAllData inmediatamente para cargar los datos al inicio
// y asegurar que los datos por defecto existan.
DataManager.loadAllData();

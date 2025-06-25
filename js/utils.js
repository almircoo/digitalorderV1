/**
 * Funciones Utilitarias
 * Utilidades comunes usadas en toda la aplicación
 */

/**
 * Funciones de gestión de modales
 */
function closeModal(modalId) {
    document.getElementById(modalId).style.display = "none";
  }
  
  function showConfirmModal(message, onConfirm) {
    const modal = document.getElementById("confirmModal");
    const messageElement = document.getElementById("confirmModalMessage");
    const yesButton = document.getElementById("confirmModalYesBtn");
  
    messageElement.textContent = message;
    modal.style.display = "flex";
  
    yesButton.onclick = () => {
      onConfirm();
      closeConfirmModal();
    };
  }
  
  function closeConfirmModal() {
    document.getElementById("confirmModal").style.display = "none";
  }
  
  /**
   * Utilidad para selección de categoría
   */
  function selectCategory(element, category) {
    element.parentElement.querySelectorAll(".category-item").forEach((item) => {
      item.classList.remove("selected");
    });
    element.classList.add("selected");
    element.closest("form").querySelector('input[name="category"]').value = category;
  }
  
  /**
   * Utilidades de estado para pedidos
   */
  function getStatusText(status) {
    const statusMap = {
      pending: "Pendiente",
      accepted: "Aceptado",
      preparing: "Preparando",
      delivering: "En camino",
      completed: "Completado",
    };
    return statusMap[status] || status;
  }
  
  function getStatusClass(status) {
    const classMap = {
      pending: "btn-outline",
      accepted: "btn-secondary",
      preparing: "btn-secondary",
      delivering: "btn-primary",
      completed: "btn-primary",
    };
    return classMap[status] || "btn-outline";
  }
  
  /**
   * Utilidades de navegación
   */
  function updateActiveMenuItem(activeId) {
    document.querySelectorAll(".nav-menu a").forEach((item) => {
      item.classList.remove("active");
    });
  
    const listItem = document.getElementById(activeId);
    if (listItem) {
      const anchorTag = listItem.querySelector("a");
      if (anchorTag) {
        anchorTag.classList.add("active");
      }
    }
  }
  
  function hideAllPages() {
    document.getElementById("landingPage").style.display = "none";
    document.getElementById("dashboard").style.display = "none";
    document.getElementById("cartPage").style.display = "none";
    document.getElementById("checkoutPage").style.display = "none";
  }
  
  function showHome() {
    hideAllPages();
    document.getElementById("landingPage").style.display = "block";
  }
  
  function showDashboard() {
    hideAllPages();
    document.getElementById("dashboard").style.display = "block";
  
    if (currentUser && currentUser.accountType === "provider") {
      loadProviderMenu();
      showCatalog();
    } else if (currentUser && currentUser.accountType === "restaurant") {
      loadRestaurantMenu();
      showLists();
    }
  }
  
  /**
   * Funciones para cargar menús
   */
  function loadProviderMenu() {
    const menu = document.getElementById("navMenu");
    menu.innerHTML = `
      <li id="nav-catalog"><a href="#" onclick="showCatalog()">
          <i data-lucide="package"></i> Mi catálogo
      </a></li>
      <li id="nav-deliveries"><a href="#" onclick="showDeliveries()">
          <i data-lucide="truck"></i> Mis entregas
      </a></li>
      <li id="nav-requests"><a href="#" onclick="showRequests()">
          <i data-lucide="clipboard-list"></i> Solicitudes
      </a></li>
      <li id="nav-provider-invoices"><a href="#" onclick="showProviderInvoices()">
          <i data-lucide="file-text"></i> Facturas
      </a></li>
      <li id="nav-provider-reports"><a href="#" onclick="showProviderReports()">
          <i data-lucide="bar-chart"></i> Informe
      </a></li>
      <li id="nav-promotions"><a href="#" onclick="showPromotions()">
          <i data-lucide="percent"></i> Promociones
      </a></li>
      <li id="nav-account"><a href="#" onclick="showAccount()">
          <i data-lucide="user"></i> Mi cuenta
      </a></li>
      <li id="nav-logout">
        <a href="#" onclick="logout()">
          <i data-lucide="log-out"></i> Cerrar sesión
      </a></li>

    `;
    lucide.createIcons();
  }
  
  function loadRestaurantMenu() {
    const menu = document.getElementById("navMenu");
    menu.innerHTML = `
      <li id="nav-lists"><a href="#" onclick="showLists()">
          <i data-lucide="list"></i> Mi lista
      </a></li>
      <li id="nav-my-orders"><a href="#" onclick="showMyOrders()">
          <i data-lucide="shopping-bag"></i> Mis pedidos
      </a></li>
      <li id="nav-tracking"><a href="#" onclick="showTracking()">
          <i data-lucide="map-pin"></i> Seguimiento
      </a></li>
      <li id="nav-restaurant-reports"><a href="#" onclick="showRestaurantReports()">
          <i data-lucide="bar-chart"></i> Informe
      </a></li>
      <li id="nav-restaurant-invoices"><a href="#" onclick="showRestaurantInvoices()">
          <i data-lucide="file-text"></i> Facturas
      </a></li>
      <li id="nav-account"><a href="#" onclick="showAccount()">
          <i data-lucide="user"></i> Mi cuenta
      </a></li>
      <li id="nav-logout">
        <a href="#" onclick="logout()">
          <i data-lucide="log-out"></i> Cerrar sesión
      </a></li>
    `;
    lucide.createIcons();
  }
  
  /**
   * Utilidades de formato
   */
  function formatCurrency(amount) {
    return `S/. ${amount.toFixed(2)}`;
  }
  
  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
  }
  
  function formatDateTime(dateString) {
    return new Date(dateString).toLocaleString();
  }
  
  /**
   * Utilidades de validación
   */
  function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  function validatePhone(phone) {
    const phoneRegex = /^\+?[\d\s-()]+$/;
    return phoneRegex.test(phone) && phone.length >= 9;
  }
  
  function validateRUC(ruc) {
    // Validación básica de RUC para Perú (11 dígitos)
    const rucRegex = /^\d{11}$/;
    return rucRegex.test(ruc);
  }
  
  /**
   * Utilidades de búsqueda
   */
  function handleGlobalSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    if (searchTerm.length < 2) return;
  
    // Esto normalmente buscaría en todos los productos disponibles
    console.log("Buscando:", searchTerm);
    // La implementación depende del contexto actual (vista de catálogo, exploración de productos, etc.)
  }
  
  /**
   * Utilidades de almacenamiento local
   */
  function saveToLocalStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error guardando en localStorage:', error);
      return false;
    }
  }
  
  function loadFromLocalStorage(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error cargando de localStorage:', error);
      return null;
    }
  }
  
  /**
   * Utilidades para generación de gráficos (para reportes)
   */
  function generateSalesChart(days) {
    const bars = days === 7 ? 7 : days === 30 ? 30 : days === 90 ? 15 : 12;
    return Array(bars)
      .fill(0)
      .map(() => {
        const height = Math.random() * 80 + 20;
        return `<div class="chart-bar" style="height: ${height}%;"></div>`;
      })
      .join("");
  }
  
  function generateRevenueChart(days) {
    const bars = days === 7 ? 7 : days === 30 ? 30 : days === 90 ? 15 : 12;
    return Array(bars)
      .fill(0)
      .map(() => {
        const height = Math.random() * 80 + 20;
        return `<div class="chart-bar" style="height: ${height}%; background-color: #28453D;"></div>`;
      })
      .join("");
  }
  
  function generateTopProductsList() {
    const topProducts = [
      { name: "Tomates Frescos", quantity: 234 },
      { name: "Manzanas Premium", quantity: 189 },
      { name: "Lechugas Hidropónicas", quantity: 156 },
      { name: "Zanahorias Orgánicas", quantity: 134 },
    ];
  
    return topProducts
      .map(
        (product) => `
          <div style="margin: 15px 0;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                  <span>${product.name}</span>
                  <span>${product.quantity}</span>
              </div>
              <div style="background-color: hsl(var(--background)); height: 8px; border-radius: 4px;">
                  <div style="background-color: hsl(var(--primary)); height: 100%; width: ${(product.quantity / 234) * 100}%; border-radius: 4px;"></div>
              </div>
          </div>
      `,
      )
      .join("");
  }
  
  function generateCategoryDistribution() {
    return `
      <div style="text-align: center; padding: 20px;">
          <div style="width: 200px; height: 200px; margin: 0 auto; background: conic-gradient(
              hsl(var(--primary)) 0deg 140deg,
              #28453D 140deg 260deg,
              #f59e0b 260deg 300deg,
              #ef4444 300deg 360deg
          ); border-radius: 50%;"></div>
          <div style="margin-top: 20px; text-align: left;">
              <div style="display: flex; align-items: center; gap: 10px; margin: 5px 0;">
                  <div style="width: 12px; height: 12px; background-color: hsl(var(--primary)); border-radius: 2px;"></div>
                  <span>Frutas: 39%</span>
              </div>
              <div style="display: flex; align-items: center; gap: 10px; margin: 5px 0;">
                  <div style="width: 12px; height: 12px; background-color: #28453D; border-radius: 2px;"></div>
                  <span>Verduras: 33%</span>
              </div>
              <div style="display: flex; align-items: center; gap: 10px; margin: 5px 0;">
                  <div style="width: 12px; height: 12px; background-color: #f59e0b; border-radius: 2px;"></div>
                  <span>Carnes: 11%</span>
              </div>
              <div style="display: flex; align-items: center; gap: 10px; margin: 5px 0;">
                  <div style="width: 12px; height: 12px; background-color: #ef4444; border-radius: 2px;"></div>
                  <span>Otros: 6%</span>
              </div>
          </div>
      </div>
    `;
  }
  
  /**
   * Utilidades para manejo de errores
   */
  function handleError(error, userMessage = "Ha ocurrido un error") {
    console.error('Error de la aplicación:', error);
    toastr.error(userMessage);
  }
  
  function showLoadingSpinner(container) {
    if (typeof container === 'string') {
      container = document.getElementById(container);
    }
    if (container) {
      container.innerHTML = '<div class="spinner"></div>';
    }
  }
  
  function hideLoadingSpinner(container) {
    if (typeof container === 'string') {
      container = document.getElementById(container);
    }
    if (container) {
      const spinner = container.querySelector('.spinner');
      if (spinner) {
        spinner.remove();
      }
    }
  }
  
  /**
   * Utilidad de debounce para entradas de búsqueda
   */
  function debounce(func, wait, immediate) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        if (!immediate) func(...args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func(...args);
    };
  }
  
  /**
   * Utilidad para copiar al portapapeles
   */
  function copyToClipboard(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        toastr.success('Copiado al portapapeles');
      }).catch(err => {
        console.error('Error copiando al portapapeles:', err);
        toastr.error('Error al copiar');
      });
    } else {
      // Alternativa para navegadores antiguos
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toastr.success('Copiado al portapapeles');
    }
  }
  
  /**
   * Generar ID único
   */
  function generateUniqueId() {
    return Date.now() + Math.random().toString(36).substr(2, 9);
  }
  
  /**
   * Sanitizar HTML para prevenir XSS
   */
  function sanitizeHTML(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
  }
  
  /**
   * Verificar si un objeto está vacío
   */
  function isEmpty(obj) {
    return Object.keys(obj).length === 0;
  }
  
  /**
   * Clonación profunda de objetos
   */
  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }
  
  /**
   * Capitalizar la primera letra
   */
  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  
  /**
   * Truncar texto
   */
  function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
  }
  
  /**
   * Mostrar aviso de descarga de la app
   */
  function showApp() {
    toastr.info("Descarga nuestra app desde App Store o Google Play!");
  }
  
  /**
   * Inicializar búsqueda global
   */
  function initializeGlobalSearch() {
    const globalSearch = document.getElementById("globalSearch");
    if (globalSearch) {
      globalSearch.addEventListener("input", debounce(handleGlobalSearch, 300));
    }
  }
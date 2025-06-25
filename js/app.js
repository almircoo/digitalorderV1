/**
 * Punto de entrada principal de la aplicación
 * Inicializa la aplicación DigitalOrder y coordina todos los módulos
 */

// Estado global de la aplicación
let promotions = [];

// Inicializar la aplicación
document.addEventListener("DOMContentLoaded", async () => {
  await initializeApplication();
});

/**
 * Inicializar la aplicación completa
 */
async function initializeApplication() {
  try {
    // Inicializar íconos de Lucide
    lucide.createIcons();

    // Configurar notificaciones de toastr
    configureToastr();

    // Inicializar servicio de datos
    if (window.dataService) {
      await window.dataService.initializeData();
    }

    // Inicializar autenticación
    initializeAuth();

    // inicializar búsqueda global
    initializeGlobalSearch();

    // Inicializar gestión de catálogo (para proveedores)
    await initializeCatalogManagement();

    // Inicializar gestión de restaurantes
    await initializeRestaurantManagement();

    // Inicializar gestión de facturas
    await initializeInvoiceManagement();

    // Cargar datos iniciales
    await loadApplicationData();

    console.log('DigitalOrder application initialized successfully');
  } catch (error) {
    console.error('Error initializing application:', error);
    toastr.error('Error al inicializar la aplicación');
  }
}

/**
 * Configurar notificaciones de toastr
 */
function configureToastr() {
  if (typeof toastr !== 'undefined') {
    toastr.options = {
      closeButton: true,
      progressBar: true,
      positionClass: "toast-top-right",
      timeOut: "3000",
    };
  }
}

/**
 * Cargar datos de la aplicación
 */
async function loadApplicationData() {
  try {
    promotions = await dataService.getPromotions();
  } catch (error) {
    console.error('Error loading application data:', error);
  }
}

/**
 * Funcionalidad específica del proveedor
 */

/**
 * Mostrar gestión de entregas
 */
async function showDeliveries() {
  if (!isProvider()) return;
  
  updateActiveMenuItem("nav-deliveries");
  const content = document.getElementById("mainContent");
  
  try {
    const allOrders = await dataService.getOrders();
    const userOrders = allOrders.filter((o) => o.providerId === currentUser.id && o.status !== "pending");

    content.innerHTML = `
      <h2>Mis Entregas</h2>
      <p style="margin-bottom: 20px; color: hsl(var(--muted-foreground));">Gestiona el estado de tus pedidos aceptados</p>
      ${
        userOrders.length > 0
          ? userOrders
              .map(
                (order) => `
            <div class="invoice-item">
                <div class="invoice-info">
                    <h4>Pedido #${order.id}</h4>
                    <p>${order.restaurantName} - ${new Date(order.createdAt).toLocaleDateString()}</p>
                    <p>Estado: <span class="btn btn-sm ${getStatusClass(order.status)}">${getStatusText(order.status)}</span></p>
                </div>
                <div class="invoice-amount">S/. ${order.total.toFixed(2)}</div>
                <div class="invoice-actions">
                    <button class="btn btn-outline btn-sm" onclick="viewOrderDetails(${order.id})">Ver detalles</button>
                    ${
                      order.status !== "completed"
                        ? `
                        <button class="btn btn-primary btn-sm" onclick="updateOrderStatus(${order.id})">
                            Actualizar Estado
                        </button>
                    `
                        : ""
                    }
                </div>
            </div>
        `,
              )
              .join("")
          : '<p style="text-align: center; padding: 40px;">No hay entregas pendientes</p>'
      }
    `;
    lucide.createIcons();
  } catch (error) {
    handleError(error, 'Error al cargar entregas');
  }
}

/**
 * Mostrar gestión de solicitudes
 */
async function showRequests() {
  if (!isProvider()) return;
  
  updateActiveMenuItem("nav-requests");
  const content = document.getElementById("mainContent");
  
  try {
    const allOrders = await dataService.getOrders();
    const pendingOrders = allOrders.filter((o) => o.status === "pending");

    content.innerHTML = `
      <h2>Solicitudes</h2>
      <p style="margin-bottom: 20px; color: hsl(var(--muted-foreground));">Revisa y acepta nuevos pedidos de restaurantes</p>
      ${
        pendingOrders.length > 0
          ? pendingOrders
              .map(
                (order) => `
            <div class="invoice-item">
                <div class="invoice-info">
                    <h4>Pedido #${order.id}</h4>
                    <p>${order.restaurantName} - ${new Date(order.createdAt).toLocaleDateString()}</p>
                    <p>Total: S/. ${order.total.toFixed(2)}</p>
                    <p style="font-size: 12px; color: hsl(var(--muted-foreground));">
                        ${order.items.length} producto(s) - ${order.items.map((item) => item.name).join(", ")}
                    </p>
                </div>
                <div class="invoice-actions">
                    <button class="btn btn-outline btn-sm" onclick="viewOrderDetails(${order.id})">Ver detalles</button>
                    <button class="btn btn-primary btn-sm" onclick="acceptOrder(${order.id})">Aceptar Pedido</button>
                </div>
            </div>
        `,
              )
              .join("")
          : '<p style="text-align: center; padding: 40px;">No hay solicitudes pendientes</p>'
      }
    `;
    lucide.createIcons();
  } catch (error) {
    handleError(error, 'Error al cargar solicitudes');
  }
}

/**
 * Aceptar pedido
 */
async function acceptOrder(orderId) {
  try {
    const updateData = {
      status: "accepted",
      providerId: currentUser.id,
      lastUpdated: new Date().toISOString()
    };
    
    await dataService.updateOrder(orderId, updateData);
    await showRequests();
    toastr.success("Pedido aceptado");
  } catch (error) {
    handleError(error, 'Error al aceptar pedido');
  }
}

/**
 * Actualizar estado del pedido
 */
async function updateOrderStatus(orderId) {
  try {
    const allOrders = await dataService.getOrders();
    const order = allOrders.find((o) => o.id === orderId);
    if (!order) return;

    const modal = document.createElement("div");
    modal.className = "modal";
    modal.style.display = "flex";
    modal.innerHTML = `
      <div class="modal-content">
          <div class="modal-header">
              <h2>Actualizar Estado del Pedido</h2>
              <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
          </div>
          <p>Pedido #${order.id} - ${order.restaurantName}</p>
          <div class="order-status" style="margin: 30px 0;">
              <div class="status-item ${order.status === "accepted" || ["preparing", "delivering", "completed"].includes(order.status) ? "completed" : ""}" 
                   onclick="setOrderStatus(${orderId}, 'accepted')">
                  <div class="status-icon">
                      <i data-lucide="check"></i>
                  </div>
                  <span>Aceptado</span>
              </div>
              <div class="status-item ${order.status === "preparing" || ["delivering", "completed"].includes(order.status) ? "completed" : ""}"
                   onclick="setOrderStatus(${orderId}, 'preparing')">
                  <div class="status-icon">
                      <i data-lucide="clock"></i>
                  </div>
                  <span>Preparando</span>
              </div>
              <div class="status-item ${order.status === "delivering" || order.status === "completed" ? "completed" : ""}"
                   onclick="setOrderStatus(${orderId}, 'delivering')">
                  <div class="status-icon">
                      <i data-lucide="truck"></i>
                  </div>
                  <span>En camino</span>
              </div>
              <div class="status-item ${order.status === "completed" ? "completed" : ""}"
                   onclick="setOrderStatus(${orderId}, 'completed')">
                  <div class="status-icon">
                      <i data-lucide="check-circle"></i>
                  </div>
                  <span>Completado</span>
              </div>
          </div>
          <div style="text-align: center;">
              <button class="btn btn-primary" onclick="this.closest('.modal').remove()">Cerrar</button>
          </div>
      </div>
    `;
    document.body.appendChild(modal);
    lucide.createIcons();
  } catch (error) {
    handleError(error, 'Error al mostrar estado del pedido');
  }
}

/**
 * Establecer estado del pedido
 */
async function setOrderStatus(orderId, newStatus) {
  try {
    const allOrders = await dataService.getOrders();
    const order = allOrders.find((o) => o.id === orderId);
    if (!order) return;

    const statusOrder = ["pending", "accepted", "preparing", "delivering", "completed"];
    const currentIndex = statusOrder.indexOf(order.status);
    const newIndex = statusOrder.indexOf(newStatus);

    if (newIndex > currentIndex) {
      const updateData = {
        status: newStatus,
        lastUpdated: new Date().toISOString()
      };
      
      await dataService.updateOrder(orderId, updateData);
      document.querySelector(".modal").remove();
      await showDeliveries();
      toastr.success(`Estado actualizado a: ${getStatusText(newStatus)}`);
    } else {
      toastr.warning("No puedes retroceder el estado del pedido");
    }
  } catch (error) {
    handleError(error, 'Error al actualizar estado del pedido');
  }
}

/**
 * Ver detalles del pedido
 */
async function viewOrderDetails(orderId) {
  try {
    const allOrders = await dataService.getOrders();
    const order = allOrders.find((o) => o.id === orderId);
    if (!order) return;

    const modal = document.createElement("div");
    modal.className = "modal";
    modal.style.display = "flex";
    modal.innerHTML = `
      <div class="modal-content">
          <div class="modal-header">
              <h2>Detalles del Pedido #${order.id}</h2>
              <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
              <div>
                  <label>Restaurante</label>
                  <p>${order.restaurantName || "Restaurante Demo"}</p>
              </div>
              <div>
                  <label>Estado</label>
                  <span class="btn btn-sm ${getStatusClass(order.status)}">${getStatusText(order.status)}</span>
              </div>
          </div>
          <div>
              <label>Fecha y Hora</label>
              <p>${new Date(order.createdAt).toLocaleString()}</p>
          </div>
          
          <h3 style="margin: 20px 0 10px;">Estado del Pedido</h3>
          <div class="order-status">
              <div class="status-item ${["pending", "accepted", "preparing", "delivering", "completed"].includes(order.status) ? "completed" : ""}">
                  <div class="status-icon">
                      <i data-lucide="check"></i>
                  </div>
                  <span>Registrado</span>
              </div>
              <div class="status-item ${["accepted", "preparing", "delivering", "completed"].includes(order.status) ? "completed" : ""}">
                  <div class="status-icon">
                      <i data-lucide="package"></i>
                  </div>
                  <span>Aprobado</span>
              </div>
              <div class="status-item ${["preparing", "delivering", "completed"].includes(order.status) ? "completed" : ""}">
                  <div class="status-icon">
                      <i data-lucide="clock"></i>
                  </div>
                  <span>Preparado</span>
              </div>
              <div class="status-item ${["delivering", "completed"].includes(order.status) ? "completed" : ""}">
                  <div class="status-icon">
                      <i data-lucide="truck"></i>
                  </div>
                  <span>En camino</span>
              </div>
              <div class="status-item ${order.status === "completed" ? "completed" : ""}">
                  <div class="status-icon">
                      <i data-lucide="check-circle"></i>
                  </div>
                  <span>Entregado</span>
              </div>
          </div>

          <h3 style="margin: 20px 0 10px;">Productos</h3>
          ${order.items
            .map(
              (item) => `
              <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid hsl(var(--border));">
                  <span>${item.name} (${item.quality || "Premium"})</span>
                  <span>${item.quantity} ${item.unit} - S/. ${(item.price * item.quantity).toFixed(2)}</span>
              </div>
          `,
            )
            .join("")}
          
          ${
            order.discount
              ? `
              <div style="display: flex; justify-content: space-between; padding: 10px 0; color: #10b981;">
                  <span>Descuento aplicado (${order.promoCode})</span>
                  <span>- S/. ${order.discount.toFixed(2)}</span>
              </div>
          `
              : ""
          }
          
          <div style="text-align: right; margin-top: 20px; font-size: 20px; font-weight: bold;">
              Total: S/. ${order.total.toFixed(2)}
          </div>
      </div>
    `;
    document.body.appendChild(modal);
    lucide.createIcons();
  } catch (error) {
    handleError(error, 'Error al mostrar detalles del pedido');
  }
}

/**
 * Mostrar gestión de promociones
 */
async function showPromotions() {
  if (!isProvider()) return;
  
  updateActiveMenuItem("nav-promotions");
  const content = document.getElementById("mainContent");
  
  try {
    const userPromotions = await dataService.getPromotionsByProviderId(currentUser.id);

    content.innerHTML = `
      <div class="catalog-header">
          <h2>Gestión de Promociones</h2>
          <button class="btn btn-primary" onclick="createPromotion()">
              <i data-lucide="plus"></i> Nueva Promoción
          </button>
      </div>
      
      <div class="promotion-grid">
          ${userPromotions
            .map(
              (promo) => `
              <div class="promotion-card">
                  <span class="promotion-badge ${promo.active ? "btn-primary" : "btn-outline"}">${promo.active ? "Activa" : "Inactiva"}</span>
                  <h3 class="promotion-title">${promo.name}</h3>
                  <p class="promotion-details">${promo.description}</p>
                  <p><i data-lucide="percent"></i> ${promo.type === "percentage" ? promo.value + "% de descuento" : "S/. " + promo.value + " de descuento"}</p>
                  <p><i data-lucide="calendar"></i> ${new Date(promo.startDate).toLocaleDateString()} - ${new Date(promo.endDate).toLocaleDateString()}</p>
                  <p><i data-lucide="tag"></i> Código: ${promo.code}</p>
                  <div class="promotion-actions">
                      ${
                        promo.active
                          ? `<button class="btn btn-outline btn-sm" onclick="deactivatePromotion(${promo.id})">Desactivar</button>`
                          : `<button class="btn btn-primary btn-sm" onclick="activatePromotion(${promo.id})">Activar</button>`
                      }
                      <button class="btn btn-outline btn-sm" onclick="editPromotion(${promo.id})">
                          <i data-lucide="edit"></i>
                      </button>
                      <button class="btn btn-outline btn-sm" onclick="deletePromotion(${promo.id})">
                          <i data-lucide="trash"></i>
                      </button>
                  </div>
              </div>
          `,
            )
            .join("")}
      </div>
      ${userPromotions.length === 0 ? '<p style="text-align: center; padding: 40px;">No hay promociones creadas. Crea una nueva para comenzar.</p>' : ""}
    `;
    lucide.createIcons();
  } catch (error) {
    handleError(error, 'Error al cargar promociones');
  }
}

/**
 * Create promotion
 */
function createPromotion() {
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.style.display = "flex";
  modal.innerHTML = `
    <div class="modal-content">
        <div class="modal-header">
            <h2>Nueva Promoción</h2>
            <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
        </div>
        <p>Crea una nueva promoción para tus clientes.</p>
        <form onsubmit="savePromotion(event)">
            <div class="form-group">
                <label>Nombre de la Promoción</label>
                <input type="text" name="name" placeholder="Ej: Descuento de Verano" required>
            </div>
            <div class="form-group">
                <label>Descripción</label>
                <textarea name="description" placeholder="Describe los detalles de la promoción" required></textarea>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div class="form-group">
                    <label>Tipo de Descuento</label>
                    <select name="type" required>
                        <option value="percentage">Porcentaje (%)</option>
                        <option value="fixed">Monto Fijo (S/.)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Valor del Descuento</label>
                    <input type="number" name="value" placeholder="Ej: 15" required min="0" step="0.01">
                </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div class="form-group">
                    <label>Fecha de Inicio</label>
                    <input type="date" name="startDate" required>
                </div>
                <div class="form-group">
                    <label>Fecha de Fin</label>
                    <input type="date" name="endDate" required>
                </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div class="form-group">
                    <label>Valor Mínimo de Pedido (S/.)</label>
                    <input type="number" name="minOrder" placeholder="Ej: 100" min="0" step="0.01">
                </div>
                <div class="form-group">
                    <label>Descuento Máximo (S/.)</label>
                    <input type="number" name="maxDiscount" placeholder="Opcional" min="0" step="0.01">
                </div>
            </div>
            <div class="form-group">
                <label>Código de Promoción</label>
                <input type="text" name="code" placeholder="Ej: VERANO15" required style="text-transform: uppercase;">
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" name="active" checked> Promoción Activa
                </label>
            </div>
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button type="button" class="btn btn-outline" onclick="this.closest('.modal').remove()">Cancelar</button>
                <button type="submit" class="btn btn-primary">Crear Promoción</button>
            </div>
        </form>
    </div>
  `;
  document.body.appendChild(modal);
  lucide.createIcons();
}

/**
 * Guardar promoción
 */
async function savePromotion(event) {
  event.preventDefault();
  const formData = new FormData(event.target);

  const promotionData = {
    providerId: currentUser.id,
    name: formData.get("name"),
    description: formData.get("description"),
    type: formData.get("type"),
    value: parseFloat(formData.get("value")),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    minOrder: parseFloat(formData.get("minOrder")) || 0,
    maxDiscount: parseFloat(formData.get("maxDiscount")) || null,
    code: formData.get("code").toUpperCase(),
    active: formData.get("active") === "on"
  };

  try {
    await dataService.createPromotion(promotionData);
    event.target.closest(".modal").remove();
    await showPromotions();
    toastr.success("Promoción creada exitosamente");
  } catch (error) {
    handleError(error, 'Error al crear promoción');
  }
}

/**
 * Activar promoción
 */
async function activatePromotion(promoId) {
  try {
    await dataService.updatePromotion(promoId, { active: true });
    await showPromotions();
    toastr.success("Promoción activada");
  } catch (error) {
    handleError(error, 'Error al activar promoción');
  }
}

/**
 * Desactivar promoción
 */
async function deactivatePromotion(promoId) {
  try {
    await dataService.updatePromotion(promoId, { active: false });
    await showPromotions();
    toastr.info("Promoción desactivada");
  } catch (error) {
    handleError(error, 'Error al desactivar promoción');
  }
}

/**
 * Eliminar promoción
 */
async function deletePromotion(promoId) {
  showConfirmModal("¿Está seguro de eliminar esta promoción?", async () => {
    try {
      await dataService.deletePromotion(promoId);
      await showPromotions();
      toastr.success("Promoción eliminada");
    } catch (error) {
      handleError(error, 'Error al eliminar promoción');
    }
  });
}

/**
 * Editar promoción
 */
async function editPromotion(promoId) {
  try {
    const allPromotions = await dataService.getPromotions();
    const promo = allPromotions.find((p) => p.id === promoId);
    if (!promo) return;

    const modal = document.createElement("div");
    modal.className = "modal";
    modal.style.display = "flex";
    modal.innerHTML = `
      <div class="modal-content">
          <div class="modal-header">
              <h2>Editar Promoción</h2>
              <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
          </div>
          <form onsubmit="updatePromotion(event, ${promoId})">
              <div class="form-group">
                  <label>Nombre de la Promoción</label>
                  <input type="text" name="name" value="${promo.name}" required>
              </div>
              <div class="form-group">
                  <label>Descripción</label>
                  <textarea name="description" required>${promo.description}</textarea>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                  <div class="form-group">
                      <label>Tipo de Descuento</label>
                      <select name="type" required>
                          <option value="percentage" ${promo.type === "percentage" ? "selected" : ""}>Porcentaje (%)</option>
                          <option value="fixed" ${promo.type === "fixed" ? "selected" : ""}>Monto Fijo (S/.)</option>
                      </select>
                  </div>
                  <div class="form-group">
                      <label>Valor del Descuento</label>
                      <input type="number" name="value" value="${promo.value}" required min="0" step="0.01">
                  </div>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                  <div class="form-group">
                      <label>Fecha de Inicio</label>
                      <input type="date" name="startDate" value="${promo.startDate}" required>
                  </div>
                  <div class="form-group">
                      <label>Fecha de Fin</label>
                      <input type="date" name="endDate" value="${promo.endDate}" required>
                  </div>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                  <div class="form-group">
                      <label>Valor Mínimo de Pedido (S/.)</label>
                      <input type="number" name="minOrder" value="${promo.minOrder || 0}" min="0" step="0.01">
                  </div>
                  <div class="form-group">
                      <label>Descuento Máximo (S/.)</label>
                      <input type="number" name="maxDiscount" value="${promo.maxDiscount || ""}" min="0" step="0.01">
                  </div>
              </div>
              <div class="form-group">
                  <label>Código de Promoción</label>
                  <input type="text" name="code" value="${promo.code}" required style="text-transform: uppercase;">
              </div>
              <div class="form-group">
                  <label>
                      <input type="checkbox" name="active" ${promo.active ? "checked" : ""}> Promoción Activa
                  </label>
              </div>
              <div style="display: flex; gap: 10px; justify-content: flex-end;">
                  <button type="button" class="btn btn-outline" onclick="this.closest('.modal').remove()">Cancelar</button>
                  <button type="submit" class="btn btn-primary">Actualizar Promoción</button>
              </div>
          </form>
      </div>
    `;
    document.body.appendChild(modal);
    lucide.createIcons();
  } catch (error) {
    handleError(error, 'Error al cargar promoción');
  }
}

/**
 * Actualizar promoción
 */
async function updatePromotion(event, promoId) {
  event.preventDefault();
  const formData = new FormData(event.target);

  const updateData = {
    name: formData.get("name"),
    description: formData.get("description"),
    type: formData.get("type"),
    value: parseFloat(formData.get("value")),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    minOrder: parseFloat(formData.get("minOrder")) || 0,
    maxDiscount: parseFloat(formData.get("maxDiscount")) || null,
    code: formData.get("code").toUpperCase(),
    active: formData.get("active") === "on"
  };

  try {
    await dataService.updatePromotion(promoId, updateData);
    event.target.closest(".modal").remove();
    await showPromotions();
    toastr.success("Promoción actualizada exitosamente");
  } catch (error) {
    handleError(error, 'Error al actualizar promoción');
  }
}

// mostrar cuenta
function showAccount() {
  updateActiveMenuItem("nav-account");
  const content = document.getElementById("mainContent");

  content.innerHTML = `
    <h2>Mi Cuenta</h2>
    <div style="max-width: 600px;">
        <div style="background-color: hsl(var(--background)); padding: 30px; border-radius: var(--radius); margin-bottom: 20px;">
            <h3>Información Personal</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
                <div>
                    <label>Nombre</label>
                    <p>${currentUser.firstName}</p>
                </div>
                <div>
                    <label>Apellido</label>
                    <p>${currentUser.lastName}</p>
                </div>
            </div>
            <div style="margin-top: 20px;">
                <label>Correo Electrónico</label>
                <p>${currentUser.email}</p>
            </div>
            <div style="margin-top: 20px;">
                <label>Tipo de Cuenta</label>
                <p>${currentUser.accountType === "provider" ? "Proveedor" : "Restaurante"}</p>
            </div>
        </div>
        
        <div style="background-color: hsl(var(--background)); padding: 30px; border-radius: var(--radius); margin-bottom: 20px;">
            <h3>${currentUser.accountType === "provider" ? "Información de la Empresa" : "Información del Restaurante"}</h3>
            <div style="margin-top: 20px;">
                <label>${currentUser.accountType === "provider" ? "Nombre de la Empresa" : "Nombre del Restaurante"}</label>
                <p>${currentUser.accountType === "provider" ? currentUser.companyName : currentUser.restaurantName}</p>
            </div>
            <div style="margin-top: 20px;">
                <label>Dirección</label>
                <p>${currentUser.address}</p>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
                <div>
                    <label>Teléfono</label>
                    <p>${currentUser.phone}</p>
                </div>
                <div>
                    <label>RUC</label>
                    <p>${currentUser.ruc}</p>
                </div>
            </div>
        </div>
        
        <div style="background-color: hsl(var(--background)); padding: 30px; border-radius: var(--radius);">
            <h3>Configuración de Cuenta</h3>
            <div style="margin-top: 20px;">
                <label>Fecha de Registro</label>
                <p>${new Date(currentUser.createdAt).toLocaleDateString()}</p>
            </div>
            <div style="margin-top: 30px; display: flex; gap: 10px;">
                <button class="btn btn-primary" onclick="editProfile()">
                    <i data-lucide="edit"></i> Editar Perfil
                </button>
                <button class="btn btn-outline" onclick="changePassword()">
                    <i data-lucide="lock"></i> Cambiar Contraseña
                </button>
            </div>
        </div>
    </div>
  `;
  lucide.createIcons();
}

/**
 * Editar perfil
 */
function editProfile() {
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.style.display = "flex";
  modal.innerHTML = `
    <div class="modal-content">
        <div class="modal-header">
            <h2>Editar Perfil</h2>
            <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
        </div>
        <form onsubmit="updateProfile(event)">
            <div class="form-group">
                <label>Nombre</label>
                <input type="text" name="firstName" value="${currentUser.firstName}" required>
            </div>
            <div class="form-group">
                <label>Apellido</label>
                <input type="text" name="lastName" value="${currentUser.lastName}" required>
            </div>
            <div class="form-group">
                <label>${currentUser.accountType === "provider" ? "Nombre de la Empresa" : "Nombre del Restaurante"}</label>
                <input type="text" name="businessName" value="${currentUser.accountType === "provider" ? currentUser.companyName : currentUser.restaurantName}" required>
            </div>
            <div class="form-group">
                <label>Dirección</label>
                <input type="text" name="address" value="${currentUser.address}" required>
            </div>
            <div class="form-group">
                <label>Teléfono</label>
                <input type="tel" name="phone" value="${currentUser.phone}" required>
            </div>
            <div class="form-group">
                <label>RUC</label>
                <input type="text" name="ruc" value="${currentUser.ruc}" required>
            </div>
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button type="button" class="btn btn-outline" onclick="this.closest('.modal').remove()">Cancelar</button>
                <button type="submit" class="btn btn-primary">Actualizar Perfil</button>
            </div>
        </form>
    </div>
  `;
  document.body.appendChild(modal);
  lucide.createIcons();
}

/**
 * Cambiar contraseña
 */
function changePassword() {
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.style.display = "flex";
  modal.innerHTML = `
    <div class="modal-content">
        <div class="modal-header">
            <h2>Cambiar Contraseña</h2>
            <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
        </div>
        <form onsubmit="updatePassword(event)">
            <div class="form-group">
                <label>Contraseña Actual</label>
                <input type="password" name="currentPassword" required>
            </div>
            <div class="form-group">
                <label>Nueva Contraseña</label>
                <input type="password" name="newPassword" required>
            </div>
            <div class="form-group">
                <label>Confirmar Nueva Contraseña</label>
                <input type="password" name="confirmPassword" required>
            </div>
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button type="button" class="btn btn-outline" onclick="this.closest('.modal').remove()">Cancelar</button>
                <button type="submit" class="btn btn-primary">Cambiar Contraseña</button>
            </div>
        </form>
    </div>
  `;
  document.body.appendChild(modal);
  lucide.createIcons();
}

/**
 * Extensiones de funcionalidad específica del restaurante
 */

/**
 * Mostrar seguimiento de pedidos
 */
async function showTracking() {
  if (!isRestaurant()) return;
  
  updateActiveMenuItem("nav-tracking");
  const content = document.getElementById("mainContent");
  
  try {
    const allOrders = await dataService.getOrders();
    const activeOrders = allOrders.filter((o) => o.restaurantId === currentUser.id && o.status !== "completed");

    content.innerHTML = `
      <h2>Seguimiento de Pedidos</h2>
      <p style="margin-bottom: 20px; color: hsl(var(--muted-foreground));">Monitorea el estado en tiempo real de tus pedidos activos</p>
      ${
        activeOrders.length > 0
          ? activeOrders
              .map((order) => {
                const statusMap = {
                  pending: { text: "Pendiente", icon: "clock" },
                  accepted: { text: "Aceptado", icon: "check" },
                  preparing: { text: "Preparando", icon: "package" },
                  delivering: { text: "En camino", icon: "truck" },
                  completed: { text: "Completado", icon: "check-circle" },
                };

                return `
              <div class="invoice-item" style="margin-bottom: 30px; flex-direction: column; align-items: flex-start;">
                  <div style="width: 100%; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                      <h3>Pedido #${order.id}</h3>
                      <span class="btn btn-sm ${getStatusClass(order.status)}">${getStatusText(order.status)}</span>
                  </div>
                  
                  <div class="order-status" style="width: 100%;">
                      <div class="status-item ${["pending", "accepted", "preparing", "delivering", "completed"].includes(order.status) ? "completed" : ""}">
                          <div class="status-icon">
                              <i data-lucide="check"></i>
                          </div>
                          <span>Registrado</span>
                      </div>
                      <div class="status-item ${["accepted", "preparing", "delivering", "completed"].includes(order.status) ? "completed" : ""}">
                          <div class="status-icon">
                              <i data-lucide="package"></i>
                          </div>
                          <span>Aprobado</span>
                      </div>
                      <div class="status-item ${["preparing", "delivering", "completed"].includes(order.status) ? "completed" : ""}">
                          <div class="status-icon">
                              <i data-lucide="clock"></i>
                          </div>
                          <span>Preparado</span>
                      </div>
                      <div class="status-item ${["delivering", "completed"].includes(order.status) ? "completed" : ""}">
                          <div class="status-icon">
                              <i data-lucide="truck"></i>
                          </div>
                          <span>En camino</span>
                      </div>
                      <div class="status-item ${order.status === "completed" ? "completed" : ""}">
                          <div class="status-icon">
                              <i data-lucide="check-circle"></i>
                          </div>
                          <span>Entregado</span>
                      </div>
                  </div>

                  <div style="background-color: hsl(var(--background)); padding: 20px; border-radius: var(--radius); margin-top: 20px; width: 100%;">
                      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                          <i data-lucide="${statusMap[order.status]?.icon || "info"}" style="color: hsl(var(--primary));"></i>
                          <strong>Estado actual: ${statusMap[order.status]?.text || "Desconocido"}</strong>
                      </div>
                      ${order.lastUpdated ? `<p style="font-size: 14px; color: hsl(var(--muted-foreground));">Última actualización: ${new Date(order.lastUpdated).toLocaleString()}</p>` : ""}
                  </div>
                  
                  <div style="margin-top: 20px; width: 100%;">
                      <h4>Detalles del Pedido</h4>
                      <p>Fecha: ${new Date(order.createdAt).toLocaleDateString()}</p>
                      <p>Hora: ${new Date(order.createdAt).toLocaleTimeString()}</p>
                      <p>Total: S/. ${order.total.toFixed(2)}</p>
                      ${order.promoCode ? `<p>Código de promoción aplicado: ${order.promoCode}</p>` : ""}
                  </div>
                  
                  <div style="margin-top: 20px; width: 100%;">
                      <h4>Productos</h4>
                      ${order.items
                        .map(
                          (item) => `
                          <p>${item.quantity} ${item.unit} de ${item.name}</p>
                      `,
                        )
                        .join("")}
                  </div>
                  
                  ${
                    order.providerId
                      ? `
                      <div style="margin-top: 20px; padding: 15px; background-color: hsl(var(--background)); border-radius: var(--radius); width: 100%;">
                          <p><i data-lucide="phone"></i> Contactar proveedor: +51 987 654 321</p>
                          <p><i data-lucide="message-circle" class="whatsapp-icon"></i> WhatsApp: +51 987 654 321</p>
                      </div>
                  `
                      : ""
                  }
              </div>
          `
              })
              .join("")
          : '<p style="text-align: center; padding: 40px;">No hay pedidos en seguimiento</p>'
      }
    `;
    lucide.createIcons();
  } catch (error) {
    handleError(error, 'Error al cargar seguimiento');
  }
}

/**
 * Mostrar página de checkout
 */
function showCheckout() {
  hideAllPages();
  document.getElementById("checkoutPage").style.display = "block";
  renderCheckout();
}

/**
 * Renderizar checkout
 */
function renderCheckout() {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = 0;
  const discount = 0;
  const total = subtotal + shipping - discount;

  const content = document.getElementById("checkoutContent");
  content.innerHTML = `
    <div class="checkout-section">
        <h3><i data-lucide="map-pin"></i> Dirección de Entrega</h3>
        <textarea placeholder="Ingresa la dirección completa de entrega" class="product-input" rows="4"></textarea>
        
        <h3 style="margin-top: 30px;"><i data-lucide="credit-card"></i> Método de Pago</h3>
        <div class="payment-methods">
            <div class="payment-method selected">
                <input type="radio" name="payment" value="card" checked>
                <label><i data-lucide="credit-card"></i> Tarjeta de Crédito/Débito</label>
            </div>
            <div class="payment-method">
                <input type="radio" name="payment" value="transfer">
                <label><i data-lucide="building-2"></i> Transferencia Bancaria</label>
            </div>
        </div>
        
        <div id="cardPayment">
            <div class="form-group">
                <label>Número de Tarjeta</label>
                <input type="text" placeholder="1234 5678 9012 3456" class="product-input">
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div class="form-group">
                    <label>Fecha de Expiración</label>
                    <input type="text" placeholder="MM/AA" class="product-input">
                </div>
                <div class="form-group">
                    <label>CVV</label>
                    <input type="text" placeholder="123" class="product-input">
                </div>
            </div>
            <div class="form-group">
                <label>Titular de la Tarjeta</label>
                <input type="text" placeholder="Nombre como aparece en la tarjeta" class="product-input">
            </div>
        </div>
        
        <div id="transferPayment" style="display: none;">
            <div style="background-color: hsl(var(--background)); padding: 20px; border-radius: var(--radius);">
                <h4>Instrucciones para Transferencia Bancaria:</h4>
                <p>Banco: Banco Nacional de Perú</p>
                <p>Cuenta: 123-456789-0</p>
                <p>Titular: ${currentUser.restaurantName || "Restaurante Demo"}</p>
                <p>Referencia: Tu número de pedido</p>
                <p style="margin-top: 10px; font-size: 14px; color: hsl(var(--muted-foreground));">
                    Una vez realizada la transferencia, envía el comprobante a pagos@digitalorder.com
                </p>
            </div>
        </div>
        
        <h3 style="margin-top: 30px;"><i data-lucide="tag"></i> Código de Promoción</h3>
        <div style="display: flex; gap: 10px;">
            <input type="text" id="promoCode" placeholder="Ingresa código de promoción" class="product-input" style="flex: 1;">
            <button class="btn btn-outline" onclick="applyPromoCode()">Aplicar</button>
        </div>
        <div id="promoMessage" style="margin-top: 10px;"></div>
    </div>
    
    <div class="checkout-section">
        <h3>Resumen del Pedido</h3>
        ${cart
          .map(
            (item) => `
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid hsl(var(--border));">
                <span>${item.name} x${item.quantity}</span>
                <span>S/. ${(item.price * item.quantity).toFixed(2)}</span>
            </div>
        `,
          )
          .join("")}
        
        <div class="summary-row">
            <span>Subtotal</span>
            <span>S/. ${subtotal.toFixed(2)}</span>
        </div>
        <div class="summary-row">
            <span>Envío</span>
            <span>${shipping === 0 ? "Gratis" : "S/. " + shipping.toFixed(2)}</span>
        </div>
        ${
          discount > 0
            ? `
            <div class="summary-row" style="color: #10b981;">
                <span>Descuento</span>
                <span>- S/. ${discount.toFixed(2)}</span>
            </div>
        `
            : ""
        }
        <div class="summary-row total">
            <span>Total</span>
            <span id="finalTotal">S/. ${total.toFixed(2)}</span>
        </div>
        
        <button class="btn btn-primary" style="width: 100%; margin-top: 20px;" onclick="processOrder()">
            <i data-lucide="check"></i> Confirmar Pedido
        </button>
    </div>
  `;
  lucide.createIcons();

  // Cambio de método de pago
  document.querySelectorAll('input[name="payment"]').forEach((radio) => {
    radio.addEventListener("change", function () {
      document.querySelectorAll(".payment-method").forEach((method) => {
        method.classList.remove("selected");
      });
      this.closest(".payment-method").classList.add("selected");

      if (this.value === "card") {
        document.getElementById("cardPayment").style.display = "block";
        document.getElementById("transferPayment").style.display = "none";
      } else {
        document.getElementById("cardPayment").style.display = "none";
        document.getElementById("transferPayment").style.display = "block";
      }
    });
  });
}

/**
 * Aplicar código promocional
 */
async function applyPromoCode() {
  const promoCodeInput = document.getElementById("promoCode");
  const promoCode = promoCodeInput.value.trim().toUpperCase();
  const promoMessage = document.getElementById("promoMessage");

  if (!promoCode) {
    promoMessage.innerHTML = '<p style="color: hsl(var(--destructive));">Por favor ingresa un código de promoción</p>';
    return;
  }

  try {
    const allPromotions = await dataService.getPromotions();
    const activePromo = allPromotions.find(
      (p) => p.code === promoCode && p.active && new Date(p.startDate) <= new Date() && new Date(p.endDate) >= new Date()
    );

    if (!activePromo) {
      promoMessage.innerHTML = '<p style="color: hsl(var(--destructive));">Código de promoción inválido o expirado</p>';
      return;
    }

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    if (activePromo.minOrder && subtotal < activePromo.minOrder) {
      promoMessage.innerHTML = `<p style="color: hsl(var(--destructive));">El pedido mínimo para esta promoción es S/. ${activePromo.minOrder.toFixed(2)}</p>`;
      return;
    }

    let discount = 0;
    if (activePromo.type === "percentage") {
      discount = subtotal * (activePromo.value / 100);
    } else {
      discount = activePromo.value;
    }

    if (activePromo.maxDiscount && discount > activePromo.maxDiscount) {
      discount = activePromo.maxDiscount;
    }

    const newTotal = subtotal - discount;
    document.getElementById("finalTotal").textContent = `S/. ${newTotal.toFixed(2)}`;
    promoMessage.innerHTML = `<p style="color: #10b981;">✓ Promoción aplicada: ${activePromo.name} - Descuento: S/. ${discount.toFixed(2)}</p>`;

    // Store applied promo for order processing
    window.appliedPromo = { code: promoCode, discount: discount };
  } catch (error) {
    handleError(error, 'Error al aplicar código promocional');
  }
}

/**
 * Funciones de reportes (placeholders)
 */
async function showProviderReports() {
  updateActiveMenuItem("nav-provider-reports");
  const content = document.getElementById("mainContent");
  
  content.innerHTML = `
    <h2>Análisis de Proveedor</h2>
    <div class="date-filters">
        <button class="date-filter active" onclick="filterReports(7, this)">7 días</button>
        <button class="date-filter" onclick="filterReports(30, this)">30 días</button>
        <button class="date-filter" onclick="filterReports(90, this)">90 días</button>
        <button class="date-filter" onclick="filterReports(365, this)">12 meses</button>
    </div>
    <div id="reportContent">
        ${generateProviderReportContent(7)}
    </div>
  `;
  lucide.createIcons();
}

async function showRestaurantReports() {
  updateActiveMenuItem("nav-restaurant-reports");
  const content = document.getElementById("mainContent");
  
  content.innerHTML = `
    <h2>Análisis de Restaurante</h2>
    <div class="date-filters">
        <button class="date-filter active" onclick="filterRestaurantReports(7, this)">7 días</button>
        <button class="date-filter" onclick="filterRestaurantReports(30, this)">30 días</button>
        <button class="date-filter" onclick="filterRestaurantReports(90, this)">90 días</button>
        <button class="date-filter" onclick="filterRestaurantReports(365, this)">12 meses</button>
    </div>
    <div id="restaurantReportContent">
        ${generateRestaurantReportContent(7)}
    </div>
  `;
  lucide.createIcons();
}

function generateProviderReportContent(days) {
  const salesChange = days === 7 ? 12.6 : days === 30 ? 8.3 : days === 90 ? 15.2 : 22.1;
  const revenueChange = days === 7 ? 6.4 : days === 30 ? 9.8 : days === 90 ? 11.5 : 18.7;

  return `
    <div class="stats-grid">
        <div class="stat-card">
            <i data-lucide="shopping-cart" class="stat-icon"></i>
            <h4>Total Ventas</h4>
            <div class="stat-value">156</div>
            <div class="stat-change">↑ ${salesChange}% vs. periodo anterior</div>
        </div>
        <div class="stat-card">
            <i data-lucide="dollar-sign" class="stat-icon"></i>
            <h4>Ingresos Totales</h4>
            <div class="stat-value">S/. 24,567.89</div>
            <div class="stat-change">↑ ${revenueChange}% vs. periodo anterior</div>
        </div>
        <div class="stat-card">
            <i data-lucide="trending-up" class="stat-icon"></i>
            <h4>Valor Promedio</h4>
            <div class="stat-value">S/. 157.48</div>
            <div class="stat-change">Por venta en el periodo seleccionado</div>
        </div>
        <div class="stat-card">
            <i data-lucide="users" class="stat-icon"></i>
            <h4>Clientes Activos</h4>
            <div class="stat-value">23</div>
            <div class="stat-change">Restaurantes con compras activas</div>
        </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <div class="chart-container">
            <h3>Tendencia de Ventas</h3>
            <p style="font-size: 14px; color: hsl(var(--muted-foreground));">Número de ventas en los últimos ${days} días</p>
            <div class="chart">
                ${generateSalesChart(days)}
            </div>
        </div>
        <div class="chart-container">
            <h3>Ingresos</h3>
            <p style="font-size: 14px; color: hsl(var(--muted-foreground));">Ingresos en los últimos ${days} días</p>
            <div class="chart">
                ${generateRevenueChart(days)}
            </div>
        </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <div class="chart-container">
            <h3>Productos Más Vendidos</h3>
            <p style="font-size: 14px; color: hsl(var(--muted-foreground));">Top 5 productos por cantidad</p>
            ${generateTopProductsList()}
        </div>
        <div class="chart-container">
            <h3>Distribución por Categoría</h3>
            <p style="font-size: 14px; color: hsl(var(--muted-foreground));">Ventas por categoría de producto</p>
            ${generateCategoryDistribution()}
        </div>
    </div>
  `;
}

function generateRestaurantReportContent(days) {
  const ordersChange = days === 7 ? 8.2 : days === 30 ? 12.5 : days === 90 ? 18.3 : 25.7;
  const spentChange = days === 7 ? 5.8 : days === 30 ? 11.2 : days === 90 ? 16.8 : 21.4;

  return `
    <div class="stats-grid">
        <div class="stat-card">
            <i data-lucide="shopping-bag" class="stat-icon"></i>
            <h4>Total Pedidos</h4>
            <div class="stat-value">42</div>
            <div class="stat-change">↑ ${ordersChange}% vs. periodo anterior</div>
        </div>
        <div class="stat-card">
            <i data-lucide="credit-card" class="stat-icon"></i>
            <h4>Total Compras</h4>
            <div class="stat-value">S/. 6,789.23</div>
            <div class="stat-change">↑ ${spentChange}% vs. periodo anterior</div>
        </div>
        <div class="stat-card">
            <i data-lucide="trending-up" class="stat-icon"></i>
            <h4>Valor Promedio</h4>
            <div class="stat-value">S/. 161.65</div>
            <div class="stat-change">Por pedido en el periodo seleccionado</div>
        </div>
        <div class="stat-card">
            <i data-lucide="users" class="stat-icon"></i>
            <h4>Proveedores Activos</h4>
            <div class="stat-value">8</div>
            <div class="stat-change">Proveedores con pedidos activos</div>
        </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <div class="chart-container">
            <h3>Tendencia de Pedidos</h3>
            <p style="font-size: 14px; color: hsl(var(--muted-foreground));">Número de pedidos en los últimos ${days} días</p>
            <div class="chart">
                ${generateSalesChart(days)}
            </div>
        </div>
        <div class="chart-container">
            <h3>Gastos</h3>
            <p style="font-size: 14px; color: hsl(var(--muted-foreground));">Gastos en los últimos ${days} días</p>
            <div class="chart">
                ${generateRevenueChart(days)}
            </div>
        </div>
    </div>
  `;
}

function filterReports(days, button) {
  document.querySelectorAll(".date-filter").forEach((btn) => btn.classList.remove("active"));
  button.classList.add("active");

  const reportContent = document.getElementById("reportContent");
  if (reportContent) {
    reportContent.innerHTML = generateProviderReportContent(days);
    lucide.createIcons();
  }
}

function filterRestaurantReports(days, button) {
  document.querySelectorAll(".date-filter").forEach((btn) => btn.classList.remove("active"));
  button.classList.add("active");

  const reportContent = document.getElementById("restaurantReportContent");
  if (reportContent) {
    reportContent.innerHTML = generateRestaurantReportContent(days);
    lucide.createIcons();
  }
}
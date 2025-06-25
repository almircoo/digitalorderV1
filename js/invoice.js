/**
 * Gestión de Facturas
 * Maneja la creación, gestión y procesamiento de pagos de facturas para proveedores y restaurantes
 */

let invoices = [];

/**
 * Inicializar gestión de facturas
 */
async function initializeInvoiceManagement() {
  await loadInvoiceData();
}

/**
 * Cargar datos de facturas
 */
async function loadInvoiceData() {
  try {
    invoices = await dataService.getInvoices();
  } catch (error) {
    console.error('Error loading invoice data:', error);
    toastr.error('Error al cargar datos de facturas');
  }
}

/**
 * Mostrar gestión de facturas
 */
async function showProviderInvoices() {
  if (!isProvider()) return;
  
  updateActiveMenuItem("nav-provider-invoices");
  await loadInvoiceData();
  
  const content = document.getElementById("mainContent");
  const userInvoices = invoices.filter((i) => i.providerId === currentUser.id);
  const allOrders = await dataService.getOrders();
  const ordersWithoutInvoice = allOrders.filter(
    (o) => o.providerId === currentUser.id && o.status === "completed" && !userInvoices.find((i) => i.orderId === o.id)
  );

  content.innerHTML = `
    <h2>Gestión de Facturas</h2>
    <p style="margin-bottom: 20px; color: hsl(var(--muted-foreground));">Administra tus facturas y crea nuevas para pedidos completados</p>
    <div class="form-tabs">
        <button class="form-tab active" onclick="filterProviderInvoices('all', this)">Todas</button>
        <button class="form-tab" onclick="filterProviderInvoices('pending', this)">Pendientes</button>
        <button class="form-tab" onclick="filterProviderInvoices('paid', this)">Pagadas</button>
        <button class="form-tab" onclick="filterProviderInvoices('without', this)">Pedidos sin Factura</button>
    </div>
    <div id="providerInvoiceList">
        ${renderProviderInvoiceList(userInvoices, "all", ordersWithoutInvoice)}
    </div>
  `;
  lucide.createIcons();
}

/**
 * Renderizar lista de facturas
 */
function renderProviderInvoiceList(invoiceList, filter, ordersWithoutInvoice) {
  let filteredInvoices = invoiceList;

  if (filter === "pending") {
    filteredInvoices = invoiceList.filter((i) => i.status === "pending");
  } else if (filter === "paid") {
    filteredInvoices = invoiceList.filter((i) => i.status === "paid");
  } else if (filter === "without") {
    return `
      <div class="invoice-section">
        <h3>Pedidos Completados sin Factura</h3>
        ${ordersWithoutInvoice.length > 0 ? ordersWithoutInvoice
          .map(
            (order) => `
            <div class="invoice-item">
                <div class="invoice-info">
                    <h4>Pedido #${order.id} - Sin Factura</h4>
                    <p><strong>Cliente:</strong> ${order.restaurantName}</p>
                    <p><strong>Fecha:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
                    <p><strong>Total:</strong> S/. ${order.total.toFixed(2)}</p>
                    <p style="font-size: 12px; color: hsl(var(--muted-foreground));">
                        ${order.items.length} producto(s) - ${order.items.map((item) => item.name).join(", ")}
                    </p>
                </div>
                <div class="invoice-actions">
                    <button class="btn btn-primary btn-sm" onclick="createInvoiceForOrder(${order.id})">
                        <i data-lucide="file-plus"></i> Crear Factura
                    </button>
                </div>
            </div>
        `,
          )
          .join("") : '<p style="text-align: center; padding: 40px;">Todos los pedidos completados tienen factura</p>'}
      </div>
    `;
  }

  return `
    <div class="invoice-section">
      <h3>Todas las Facturas</h3>
      ${filteredInvoices.length > 0 ? filteredInvoices
        .map(
          (invoice) => `
          <div class="invoice-item">
              <div class="invoice-info">
                  <h4>F001-${String(invoice.id).padStart(5, '0')}</h4>
                  <p><strong>Cliente:</strong> ${invoice.restaurantName}</p>
                  <p><strong>Pedido:</strong> order-${invoice.orderId}</p>
                  <p>📅 <strong>Emitida:</strong> ${new Date(invoice.createdAt).toLocaleDateString()} | <strong>Vence:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
              </div>
              <div class="invoice-amount">S/. ${invoice.amount.toFixed(2)}</div>
              <div class="invoice-actions">
                  <span class="btn btn-sm ${invoice.status === "paid" ? "btn-primary" : "btn-outline"}">
                      ${invoice.status === "paid" ? "Pagada" : "Pendiente"}
                  </span>
                  <button class="btn btn-outline btn-sm" onclick="viewProviderInvoiceDetails(${invoice.id})">
                      <i data-lucide="eye"></i> Ver
                  </button>
                  <button class="btn btn-outline btn-sm" onclick="downloadInvoicePDF('${invoice.id}')">
                      <i data-lucide="download"></i> Descargar
                  </button>
              </div>
          </div>
      `,
        )
        .join("") : '<p style="text-align: center; padding: 40px;">No hay facturas en esta categoría</p>'}
    </div>
  `;
}

/**
 * Filtrar facturas
 */
async function filterProviderInvoices(type, button) {
  document.querySelectorAll(".form-tab").forEach((tab) => tab.classList.remove("active"));
  button.classList.add("active");

  try {
    const userInvoices = await dataService.getInvoicesByProviderId(currentUser.id);
    const allOrders = await dataService.getOrders();
    const ordersWithoutInvoice = allOrders.filter(
      (o) => o.providerId === currentUser.id && o.status === "completed" && !userInvoices.find((i) => i.orderId === o.id)
    );

    document.getElementById("providerInvoiceList").innerHTML = renderProviderInvoiceList(userInvoices, type, ordersWithoutInvoice);
    lucide.createIcons();
  } catch (error) {
    handleError(error, 'Error al filtrar facturas');
  }
}

/**
 * Crear factura para pedido
 */
async function createInvoiceForOrder(orderId) {
  try {
    const allOrders = await dataService.getOrders();
    const order = allOrders.find((o) => o.id === orderId);
    if (!order) {
      toastr.error("Pedido no encontrado");
      return;
    }

    const modal = document.createElement("div");
    modal.className = "modal";
    modal.style.display = "flex";
    modal.innerHTML = `
      <div class="modal-content">
          <div class="modal-header">
              <h2>Crear Factura</h2>
              <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
          </div>
          <p>Crear factura para el pedido completado</p>
          <form onsubmit="saveInvoiceForOrder(event, ${orderId})">
              <div class="form-group">
                  <label>Número de Factura</label>
                  <input type="text" name="invoiceNumber" value="F001-${String(Date.now()).slice(-5)}" required readonly>
              </div>
              <div class="form-group">
                  <label>Cliente</label>
                  <input type="text" value="${order.restaurantName}" readonly>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                  <div class="form-group">
                      <label>Fecha de Emisión</label>
                      <input type="date" name="issueDate" value="${new Date().toISOString().split('T')[0]}" required>
                  </div>
                  <div class="form-group">
                      <label>Fecha de Vencimiento</label>
                      <input type="date" name="dueDate" value="${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}" required>
                  </div>
              </div>
              <div class="form-group">
                  <label>Monto Total</label>
                  <input type="number" name="amount" value="${order.total.toFixed(2)}" step="0.01" required>
              </div>
              <div class="form-group">
                  <label>Notas Adicionales</label>
                  <textarea name="notes" placeholder="Información adicional sobre la factura (opcional)" rows="3"></textarea>
              </div>
              <div style="display: flex; gap: 10px; justify-content: flex-end;">
                  <button type="button" class="btn btn-outline" onclick="this.closest('.modal').remove()">Cancelar</button>
                  <button type="submit" class="btn btn-primary">Crear Factura</button>
              </div>
          </form>
      </div>
    `;
    document.body.appendChild(modal);
    lucide.createIcons();
  } catch (error) {
    handleError(error, 'Error al crear factura');
  }
}

/**
 * Guardar factura para pedido
 */
async function saveInvoiceForOrder(event, orderId) {
  event.preventDefault();
  const formData = new FormData(event.target);
  
  try {
    const allOrders = await dataService.getOrders();
    const order = allOrders.find((o) => o.id === orderId);

    const invoiceData = {
      orderId: orderId,
      providerId: currentUser.id,
      restaurantId: order.restaurantId,
      restaurantName: order.restaurantName,
      invoiceNumber: formData.get("invoiceNumber"),
      amount: parseFloat(formData.get("amount")),
      status: "pending",
      notes: formData.get("notes") || "Factura generada automáticamente",
      createdAt: formData.get("issueDate"),
      dueDate: formData.get("dueDate")
    };

    await dataService.createInvoice(invoiceData);
    event.target.closest(".modal").remove();
    await showProviderInvoices();
    toastr.success("Factura creada exitosamente");
  } catch (error) {
    handleError(error, 'Error al guardar factura');
  }
}

/**
 * Ver detalles de factura
 */
async function viewProviderInvoiceDetails(invoiceId) {
  try {
    const allInvoices = await dataService.getInvoices();
    const invoice = allInvoices.find((i) => i.id === invoiceId);
    if (!invoice) return;

    const modal = document.createElement("div");
    modal.className = "modal";
    modal.style.display = "flex";
    modal.innerHTML = `
      <div class="modal-content">
          <div class="modal-header">
              <h2>Detalles de Factura</h2>
              <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
          </div>
          <p style="margin-bottom: 20px; color: hsl(var(--muted-foreground));">Información detallada de la factura.</p>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
              <div>
                  <label><strong>Número de Factura</strong></label>
                  <p>${invoice.invoiceNumber || `F001-${String(invoice.id).padStart(5, '0')}`}</p>
              </div>
              <div>
                  <label><strong>Estado</strong></label>
                  <span class="btn btn-sm ${invoice.status === "paid" ? "btn-primary" : "btn-outline"}">
                      ${invoice.status === "paid" ? "Pagada" : "Pendiente"}
                  </span>
              </div>
          </div>
          
          <div style="margin-bottom: 20px;">
              <label><strong>Cliente</strong></label>
              <p>${invoice.restaurantName}</p>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
              <div>
                  <label><strong>Fecha de Emisión</strong></label>
                  <p>${new Date(invoice.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                  <label><strong>Fecha de Vencimiento</strong></label>
                  <p>${new Date(invoice.dueDate).toLocaleDateString()}</p>
              </div>
          </div>
          
          <div style="margin-bottom: 20px;">
              <label><strong>Monto</strong></label>
              <p style="font-size: 24px; font-weight: bold; color: hsl(var(--primary));">S/. ${invoice.amount.toFixed(2)}</p>
          </div>
          
          <div style="margin-bottom: 20px;">
              <label><strong>Pedido Relacionado</strong></label>
              <p>order-${invoice.orderId}</p>
          </div>
          
          <div style="margin-bottom: 20px;">
              <label><strong>Notas</strong></label>
              <p>${invoice.notes || "No hay notas adicionales."}</p>
          </div>
          
          <div style="margin-bottom: 20px;">
              <label><strong>Archivo</strong></label>
              <div style="display: flex; align-items: center; gap: 10px;">
                  <i data-lucide="file-text"></i>
                  <span>factura-${String(invoice.id).padStart(3, '0')}.pdf</span>
                  <button class="btn btn-outline btn-sm" onclick="downloadInvoicePDF('${invoice.id}')">
                      <i data-lucide="download"></i>
                  </button>
              </div>
          </div>
          
          <div style="display: flex; gap: 10px; justify-content: flex-end;">
              ${invoice.status === "pending" 
                ? `<button class="btn btn-outline" onclick="markInvoiceAsPending(${invoice.id})">Marcar como Pendiente</button>
                   <button class="btn btn-destructive" onclick="deleteInvoice(${invoice.id})">Eliminar Factura</button>`
                : `<button class="btn btn-outline" onclick="markInvoiceAsPending(${invoice.id})">Marcar como Pendiente</button>`
              }
          </div>
      </div>
    `;
    document.body.appendChild(modal);
    lucide.createIcons();
  } catch (error) {
    handleError(error, 'Error al mostrar detalles de factura');
  }
}

/**
 * Mostrar facturas de restaurante
 */
async function showRestaurantInvoices() {
  if (!isRestaurant()) return;
  
  updateActiveMenuItem("nav-restaurant-invoices");
  await loadInvoiceData();
  
  const content = document.getElementById("mainContent");
  const userInvoices = invoices.filter((i) => i.restaurantId === currentUser.id);

  content.innerHTML = `
    <h2>Mis Facturas</h2>
    <div style="margin-bottom: 20px;">
        <input type="text" placeholder="Buscar por número de factura, proveedor o pedido..." 
               class="product-input" style="width: 100%;" 
               onkeyup="searchRestaurantInvoices(this.value)">
    </div>
    <div class="form-tabs">
        <button class="form-tab active" onclick="filterRestaurantInvoices('all', this)">Todas</button>
        <button class="form-tab" onclick="filterRestaurantInvoices('pending', this)">Pendientes</button>
        <button class="form-tab" onclick="filterRestaurantInvoices('paid', this)">Pagadas</button>
    </div>
    <div id="restaurantInvoiceList">
        ${renderRestaurantInvoiceList(userInvoices, "all")}
    </div>
  `;
  lucide.createIcons();
}

/**
 * Renderizar lista de facturas de restaurante
 */
function renderRestaurantInvoiceList(invoiceList, filter, searchTerm = "") {
  let filteredInvoices = invoiceList;

  // Apply status filter
  if (filter === "pending") {
    filteredInvoices = invoiceList.filter((i) => i.status === "pending");
  } else if (filter === "paid") {
    filteredInvoices = invoiceList.filter((i) => i.status === "paid");
  }

  // Apply search filter
  if (searchTerm) {
    filteredInvoices = filteredInvoices.filter((invoice) => 
      invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.orderId?.toString().includes(searchTerm) ||
      invoice.restaurantName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  return `
    <div class="invoice-section">
      <h3>Todas las Facturas</h3>
      ${filteredInvoices.length > 0 ? filteredInvoices
        .map(
          (invoice) => {
            const providerName = invoice.providerId ? 
              `Provider-${invoice.providerId}` : 'Proveedor Desconocido';
            
            return `
            <div class="invoice-item">
                <div class="invoice-info">
                    <h4>F001-${String(invoice.id).padStart(5, '0')}</h4>
                    <p><strong>Proveedor:</strong> ${providerName}</p>
                    <p><strong>Pedido:</strong> order-${invoice.orderId}</p>
                    <p>📅 <strong>Emitida:</strong> ${new Date(invoice.createdAt).toLocaleDateString()} | <strong>Vence:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
                </div>
                <div class="invoice-amount">S/. ${invoice.amount.toFixed(2)}</div>
                <div class="invoice-actions">
                    <span class="btn btn-sm ${invoice.status === "paid" ? "btn-primary" : "btn-outline"}">
                        ${invoice.status === "paid" ? "Pagada" : "Pendiente"}
                    </span>
                    <button class="btn btn-outline btn-sm" onclick="viewRestaurantInvoiceDetails(${invoice.id})">
                        <i data-lucide="eye"></i> Ver
                    </button>
                    <button class="btn btn-outline btn-sm" onclick="downloadInvoicePDF('${invoice.id}')">
                        <i data-lucide="download"></i> Descargar
                    </button>
                    ${invoice.status === "pending" 
                      ? `<button class="btn btn-primary btn-sm" onclick="payInvoice(${invoice.id})">
                           <i data-lucide="credit-card"></i> Pagar
                         </button>`
                      : ""
                    }
                </div>
            </div>
        `;
          }
        )
        .join("") : '<p style="text-align: center; padding: 40px;">No hay facturas en esta categoría</p>'}
    </div>
  `;
}

/**
 * Filtrar facturas de restaurante
 */
async function filterRestaurantInvoices(type, button) {
  document.querySelectorAll(".form-tab").forEach((tab) => tab.classList.remove("active"));
  button.classList.add("active");

  try {
    const userInvoices = await dataService.getInvoicesByRestaurantId(currentUser.id);
    document.getElementById("restaurantInvoiceList").innerHTML = renderRestaurantInvoiceList(userInvoices, type);
    lucide.createIcons();
  } catch (error) {
    handleError(error, 'Error al filtrar facturas');
  }
}

/**
 * Buscar facturas de restaurante
 */
async function searchRestaurantInvoices(searchTerm) {
  try {
    const userInvoices = await dataService.getInvoicesByRestaurantId(currentUser.id);
    const activeFilter = document.querySelector(".form-tab.active")?.textContent.toLowerCase() || "all";
    const filterType = activeFilter === "todas" ? "all" : activeFilter === "pendientes" ? "pending" : "paid";
    
    document.getElementById("restaurantInvoiceList").innerHTML = 
      renderRestaurantInvoiceList(userInvoices, filterType, searchTerm);
    lucide.createIcons();
  } catch (error) {
    handleError(error, 'Error al buscar facturas');
  }
}

/**
 * Ver detalles de factura de restaurante
 */
async function viewRestaurantInvoiceDetails(invoiceId) {
  try {
    const allInvoices = await dataService.getInvoices();
    const invoice = allInvoices.find((i) => i.id === invoiceId);
    if (!invoice) return;

    const providerName = invoice.providerId ? `Provider-${invoice.providerId}` : 'Proveedor Desconocido';

    const modal = document.createElement("div");
    modal.className = "modal";
    modal.style.display = "flex";
    modal.innerHTML = `
      <div class="modal-content">
          <div class="modal-header">
              <h2>Detalles de Factura</h2>
              <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
              <div>
                  <label><strong>Número de Factura</strong></label>
                  <p>${invoice.invoiceNumber || `F001-${String(invoice.id).padStart(5, '0')}`}</p>
              </div>
              <div>
                  <label><strong>Estado</strong></label>
                  <span class="btn btn-sm ${invoice.status === "paid" ? "btn-primary" : "btn-outline"}">
                      ${invoice.status === "paid" ? "Pagada" : "Pendiente"}
                  </span>
              </div>
          </div>
          
          <div style="margin-bottom: 20px;">
              <label><strong>Proveedor</strong></label>
              <p>${providerName}</p>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
              <div>
                  <label><strong>Fecha de Emisión</strong></label>
                  <p>${new Date(invoice.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                  <label><strong>Fecha de Vencimiento</strong></label>
                  <p>${new Date(invoice.dueDate).toLocaleDateString()}</p>
              </div>
          </div>
          
          <div style="margin-bottom: 20px;">
              <label><strong>Monto</strong></label>
              <p style="font-size: 24px; font-weight: bold; color: hsl(var(--primary));">S/. ${invoice.amount.toFixed(2)}</p>
          </div>
          
          <div style="margin-bottom: 20px;">
              <label><strong>Pedido Relacionado</strong></label>
              <p>order-${invoice.orderId}</p>
          </div>
          
          <div style="margin-bottom: 20px;">
              <label><strong>Notas</strong></label>
              <p>${invoice.notes || "No hay notas adicionales."}</p>
          </div>
          
          <div style="margin-bottom: 20px;">
              <label><strong>Archivo</strong></label>
              <div style="display: flex; align-items: center; gap: 10px;">
                  <i data-lucide="file-text"></i>
                  <span>factura-${String(invoice.id).padStart(3, '0')}.pdf</span>
                  <button class="btn btn-outline btn-sm" onclick="downloadInvoicePDF('${invoice.id}')">
                      <i data-lucide="download"></i>
                  </button>
              </div>
          </div>
          
          ${invoice.status === "pending" 
            ? `<div style="background-color: hsl(var(--background)); padding: 20px; border-radius: var(--radius); margin-bottom: 20px;">
                 <button class="btn btn-primary" onclick="markInvoiceAsPaid(${invoice.id})" style="width: 100%;">
                     Marcar como Pagada
                 </button>
               </div>`
            : `<div style="background-color: hsl(var(--background)); padding: 20px; border-radius: var(--radius); margin-bottom: 20px; text-align: center;">
                 <p style="color: #10b981; font-weight: 600;">✓ Factura pagada el ${new Date(invoice.paidAt || invoice.createdAt).toLocaleDateString()}</p>
               </div>`
          }
          
          <div style="display: flex; gap: 10px; justify-content: flex-end;">
              ${invoice.status === "pending" 
                ? `<button class="btn btn-primary" onclick="payInvoice(${invoice.id})">Pagar Factura</button>`
                : ""
              }
          </div>
      </div>
    `;
    document.body.appendChild(modal);
    lucide.createIcons();
  } catch (error) {
    handleError(error, 'Error al mostrar detalles de factura');
  }
}

/**
 * Pagar factura (para restaurantes)
 */
async function payInvoice(invoiceId) {
  showConfirmModal("¿Confirma el pago de esta factura?", async () => {
    try {
      const updateData = {
        status: "paid",
        paidAt: new Date().toISOString()
      };
      
      await dataService.updateInvoice(invoiceId, updateData);
      
      // Close any open modals
      const openModal = document.querySelector(".modal");
      if (openModal) {
        openModal.remove();
      }
      
      await showRestaurantInvoices();
      toastr.success("Factura pagada exitosamente");
    } catch (error) {
      handleError(error, 'Error al pagar factura');
    }
  });
}

/**
 * Marcar factura como pagada (para proveedores)
 */
async function markInvoiceAsPaid(invoiceId) {
  try {
    const updateData = {
      status: "paid",
      paidAt: new Date().toISOString()
    };
    
    await dataService.updateInvoice(invoiceId, updateData);
    
    // Close any open modals
    const openModal = document.querySelector(".modal");
    if (openModal) {
      openModal.remove();
    }
    
    // Refresh appropriate view based on current user type
    if (isProvider()) {
      await showProviderInvoices();
    } else {
      await showRestaurantInvoices();
    }
    
    toastr.success("Factura marcada como pagada");
  } catch (error) {
    handleError(error, 'Error al marcar factura como pagada');
  }
}

/**
 * Marcar factura como pendiente (para proveedores)
 */
async function markInvoiceAsPending(invoiceId) {
  try {
    const updateData = {
      status: "pending",
      paidAt: null
    };
    
    await dataService.updateInvoice(invoiceId, updateData);
    
    // Close any open modals
    const openModal = document.querySelector(".modal");
    if (openModal) {
      openModal.remove();
    }
    
    await showProviderInvoices();
    toastr.info("Factura marcada como pendiente");
  } catch (error) {
    handleError(error, 'Error al marcar factura como pendiente');
  }
}

/**
 * Eliminar factura (para proveedores)
 */
async function deleteInvoice(invoiceId) {
  showConfirmModal("¿Está seguro de eliminar esta factura? Esta acción no se puede deshacer.", async () => {
    try {
      await dataService.deleteInvoice(invoiceId);
      
      // Close any open modals
      const openModal = document.querySelector(".modal");
      if (openModal) {
        openModal.remove();
      }
      
      await showProviderInvoices();
      toastr.success("Factura eliminada exitosamente");
    } catch (error) {
      handleError(error, 'Error al eliminar factura');
    }
  });
}

/**
 * Descargar factura PDF (simulación)
 */
function downloadInvoicePDF(invoiceId) {
  // En una aplicación real, esto generaría y descargaría un PDF real
  // Para demostración, simularemos la descarga
  toastr.info("Descargando factura...");
  
  setTimeout(() => {
    // Simular descarga de PDF
    const filename = `factura-${String(invoiceId).padStart(3, '0')}.pdf`;
    toastr.success(`Factura ${filename} descargada exitosamente`);
    
    // En una implementación real, podrías:
    // 1. Generar PDF usando bibliotecas como jsPDF o PDFKit
    // 2. Hacer una solicitud a un servicio backend que genere el PDF
    // 3. Crear un blob descargable y activar la descarga
    
    /*
    // Ejemplo de creación de un archivo descargable:
    const blob = new Blob(['PDF content here'], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    */
  }, 1000);
}

// Hacer funciones accesibles globalmente
window.showProviderInvoices = showProviderInvoices;
window.showRestaurantInvoices = showRestaurantInvoices;
window.filterProviderInvoices = filterProviderInvoices;
window.filterRestaurantInvoices = filterRestaurantInvoices;
window.searchRestaurantInvoices = searchRestaurantInvoices;
window.createInvoiceForOrder = createInvoiceForOrder;
window.viewProviderInvoiceDetails = viewProviderInvoiceDetails;
window.viewRestaurantInvoiceDetails = viewRestaurantInvoiceDetails;
window.payInvoice = payInvoice;
window.markInvoiceAsPaid = markInvoiceAsPaid;
window.markInvoiceAsPending = markInvoiceAsPending;
window.deleteInvoice = deleteInvoice;
window.downloadInvoicePDF = downloadInvoicePDF;
window.saveInvoiceForOrder = saveInvoiceForOrder;
/**
 * Gestión de Catálogo
 * Maneja la gestión de catálogo y productos para proveedores
 */

let catalogs = [];
let products = [];
let activeCatalogId = null;

/**
 * Inicializar gestión de catálogo
 */
async function initializeCatalogManagement() {
  await loadCatalogData();
}

/**
 * Cargar datos de catálogo y productos
 */
async function loadCatalogData() {
  try {
    catalogs = await dataService.getCatalogs();
    products = await dataService.getProducts();
  } catch (error) {
    console.error('Error loading catalog data:', error);
    toastr.error('Error al cargar datos de catálogos');
  }
}

/**
 * Mostrar interfaz de gestión de catálogo
 */
async function showCatalog() {
  if (!isProvider()) return;
  
  updateActiveMenuItem("nav-catalog");
  await loadCatalogData();
  
  const content = document.getElementById("mainContent");
  const userCatalogs = catalogs.filter((c) => c.userId === currentUser.id);

  if (userCatalogs.length > 0 && activeCatalogId === null) {
    activeCatalogId = userCatalogs[0].id;
  }

  content.innerHTML = `
    <div class="catalog-header">
        <h2>Gestionar Catálogos</h2>
        <button class="btn btn-primary" onclick="createNewCatalog()">
            <i data-lucide="plus"></i> Nuevo Catálogo
        </button>
    </div>
    ${
      userCatalogs.length > 0
        ? `
        <div class="catalog-overview-grid">
            ${userCatalogs
              .map(
                (catalog) => `
                <div class="catalog-card ${catalog.id === activeCatalogId ? "active-catalog" : ""}" onclick="setActiveCatalog(${catalog.id})">
                    <h3>${catalog.name}</h3>
                    <p>Categoría: ${catalog.category}</p>
                    <p>Creado: ${new Date(catalog.createdAt).toLocaleDateString()}</p>
                    <p>Productos: ${products.filter((p) => p.catalogId === catalog.id).length}</p>
                    <div class="catalog-actions">
                        <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); viewCatalogDetails(${catalog.id})">Ver Detalles</button>
                        <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); editCatalog(${catalog.id})"><i data-lucide="edit"></i></button>
                        <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); deleteCatalog(${catalog.id})"><i data-lucide="trash"></i></button>
                    </div>
                </div>
            `,
              )
              .join("")}
        </div>
        <div class="catalog-detail-section" id="catalogDetailSection">
            ${activeCatalogId ? renderCatalogDetailSection(activeCatalogId) : '<p style="text-align: center; padding: 40px;">Selecciona un catálogo para ver sus detalles.</p>'}
        </div>
    `
        : '<p style="text-align: center; padding: 40px;">No hay catálogos creados. Crea uno nuevo para comenzar.</p>'
    }
  `;
  lucide.createIcons();
}

/**
 * Establecer catálogo activo
 */
function setActiveCatalog(catalogId) {
  activeCatalogId = catalogId;
  showCatalog();
}

/**
 * Renderizar sección de detalles del catálogo
 */
function renderCatalogDetailSection(catalogId) {
  const catalog = catalogs.find((c) => c.id === catalogId);
  if (!catalog) return "";

  const catalogProducts = products.filter((p) => p.catalogId === catalog.id);

  return `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h3>Catálogo Activo: ${catalog.name}</h3>
        <div>
            <span class="btn ${catalog.published ? "btn-primary" : "btn-outline"} btn-sm">
                ${catalog.published ? "Publicado" : "Borrador"}
            </span>
            ${
              !catalog.published
                ? `
                <button class="btn btn-primary btn-sm" onclick="publishCatalog(${catalog.id})">Publicar</button>
            `
                : ""
            }
        </div>
    </div>
    <div class="product-input-section">
        <input type="text" id="newProductInput" placeholder="Agregar nuevo producto" class="product-input" 
               style="margin-bottom: 20px;" onkeypress="if(event.key==='Enter') addProductToCatalog(${catalog.id})">
        <button class="btn btn-primary" onclick="addProductToCatalog(${catalog.id})">Agregar</button>
    </div>
    ${
      catalogProducts.length > 0
        ? `
        <table class="product-table">
            <thead>
                <tr>
                    <th>Producto</th>
                    <th>Calidad</th>
                    <th>Cantidad</th>
                    <th>Unidad</th>
                    <th>Precio</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                ${catalogProducts
                  .map(
                    (product) => `
                    <tr>
                        <td>${product.name}</td>
                        <td>
                            <select class="product-input" onchange="updateCatalogProduct(${catalog.id}, ${product.id}, 'quality', this.value)">
                                <option ${product.quality === "Premium" ? "selected" : ""}>Premium</option>
                                <option ${product.quality === "Estándar" ? "selected" : ""}>Estándar</option>
                            </select>
                        </td>
                        <td><input type="number" value="${product.quantity}" class="product-input" style="width: 80px;" onchange="updateCatalogProduct(${catalog.id}, ${product.id}, 'quantity', this.value)"></td>
                        <td>
                            <select class="product-input" onchange="updateCatalogProduct(${catalog.id}, ${product.id}, 'unit', this.value)">
                                <option ${product.unit === "Kilogramo (kg)" ? "selected" : ""}>Kilogramo (kg)</option>
                                <option ${product.unit === "Litro (L)" ? "selected" : ""}>Litro (L)</option>
                                <option ${product.unit === "Unidad" ? "selected" : ""}>Unidad</option>
                            </select>
                        </td>
                        <td>S/. <input type="number" value="${product.price}" class="product-input" style="width: 80px;" step="0.01" onchange="updateCatalogProduct(${catalog.id}, ${product.id}, 'price', this.value)"></td>
                        <td>
                            <button onclick="removeProduct(${catalog.id}, ${product.id})" style="background: none; border: none; cursor: pointer; color: hsl(var(--destructive));">
                                <i data-lucide="x"></i>
                            </button>
                        </td>
                    </tr>
                `,
                  )
                  .join("")}
            </tbody>
        </table>
    `
        : '<p style="text-align: center; padding: 20px;">No hay productos en este catálogo. Agrega algunos productos para comenzar.</p>'
    }
  `;
}

/**
 * Crear nuevo catálogo
 */
function createNewCatalog() {
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.style.display = "flex";
  modal.innerHTML = `
    <div class="modal-content">
        <div class="modal-header">
            <h2>Crear Nuevo Catálogo</h2>
            <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
        </div>
        <form onsubmit="saveCatalog(event)">
            <div class="form-group">
                <label>Nombre del catálogo</label>
                <input type="text" name="name" placeholder="Ingrese nombre" required>
            </div>
            <div class="form-group">
                <label>Categoría</label>
                <div class="category-grid" id="catalogCategoryGrid">
                    <div class="category-item" data-category="Carnes">
                        <i data-lucide="beef"></i>
                        <span>Carnes</span>
                    </div>
                    <div class="category-item" data-category="Frutas">
                        <i data-lucide="apple"></i>
                        <span>Frutas</span>
                    </div>
                    <div class="category-item" data-category="Verduras">
                        <i data-lucide="carrot"></i>
                        <span>Verduras</span>
                    </div>
                    <div class="category-item" data-category="Lácteos">
                        <i data-lucide="milk"></i>
                        <span>Lácteos</span>
                    </div>
                    <div class="category-item" data-category="Granos">
                        <i data-lucide="wheat"></i>
                        <span>Granos</span>
                    </div>
                    <div class="category-item" data-category="Congelados">
                        <i data-lucide="snowflake"></i>
                        <span>Congelados</span>
                    </div>
                    <div class="category-item" data-category="Enlatados">
                        <i data-lucide="package-2"></i>
                        <span>Enlatados</span>
                    </div>
                    <div class="category-item" data-category="Bebidas">
                        <i data-lucide="cup-soda"></i>
                        <span>Bebidas</span>
                    </div>
                    <div class="category-item" data-category="Limpieza">
                        <i data-lucide="sparkles"></i>
                        <span>Limpieza</span>
                    </div>
                </div>
                <input type="hidden" name="category" required>
            </div>
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button type="button" class="btn btn-outline" onclick="this.closest('.modal').remove()">Cancelar</button>
                <button type="submit" class="btn btn-primary">Crear Catálogo</button>
            </div>
        </form>
    </div>
  `;
  document.body.appendChild(modal);
  lucide.createIcons();

  modal.querySelectorAll("#catalogCategoryGrid .category-item").forEach((item) => {
    item.addEventListener("click", (event) => {
      selectCategory(event.currentTarget, event.currentTarget.dataset.category);
    });
  });
}

/**
 * Guardar catálogo
 */
async function saveCatalog(event) {
  event.preventDefault();
  const formData = new FormData(event.target);

  const catalogData = {
    userId: currentUser.id,
    name: formData.get("name"),
    category: formData.get("category"),
    published: false,
  };

  try {
    const newCatalog = await dataService.createCatalog(catalogData);
    
    if (newCatalog) {
      event.target.closest(".modal").remove();
      await showCatalog();
      toastr.success("Catálogo creado exitosamente");
    }
  } catch (error) {
    console.error('Error creating catalog:', error);
    toastr.error("Error al crear catálogo");
  }
}

/**
 * Agregar producto al catálogo
 */
async function addProductToCatalog(catalogId) {
  const inputElement = document.getElementById("newProductInput");
  const productName = inputElement.value.trim();

  if (!productName) {
    toastr.warning("Por favor ingrese el nombre del producto");
    return;
  }

  const productData = {
    catalogId: catalogId,
    name: productName,
    quality: "Premium",
    quantity: 1,
    unit: "Kilogramo (kg)",
    price: 0,
  };

  try {
    const newProduct = await dataService.createProduct(productData);
    
    if (newProduct) {
      inputElement.value = "";
      await loadCatalogData();
      document.getElementById("catalogDetailSection").innerHTML = renderCatalogDetailSection(catalogId);
      lucide.createIcons();
      toastr.success("Producto agregado al catálogo");
    }
  } catch (error) {
    console.error('Error adding product:', error);
    toastr.error("Error al agregar producto");
  }
}

/**
 * Actualizar producto del catálogo
 */
async function updateCatalogProduct(catalogId, productId, field, value) {
  const updateData = {};
  
  if (field === "quantity" || field === "price") {
    updateData[field] = parseFloat(value);
  } else {
    updateData[field] = value;
  }

  try {
    await dataService.updateProduct(productId, updateData);
    await loadCatalogData();
  } catch (error) {
    console.error('Error updating product:', error);
    toastr.error("Error al actualizar producto");
  }
}

/**
 * Eliminar producto del catálogo
 */
async function removeProduct(catalogId, productId) {
  showConfirmModal("¿Está seguro de eliminar este producto del catálogo?", async () => {
    try {
      await dataService.deleteProduct(productId);
      await loadCatalogData();
      document.getElementById("catalogDetailSection").innerHTML = renderCatalogDetailSection(catalogId);
      lucide.createIcons();
      toastr.info("Producto eliminado del catálogo");
    } catch (error) {
      console.error('Error removing product:', error);
      toastr.error("Error al eliminar producto");
    }
  });
}

/**
 * Publicar catálogo
 */
async function publishCatalog(catalogId) {
  try {
    await dataService.publishCatalog(catalogId);
    await showCatalog();
    toastr.success("Catálogo publicado exitosamente");
  } catch (error) {
    console.error('Error publishing catalog:', error);
    toastr.error("Error al publicar catálogo");
  }
}

/**
 * Ver detalles del catálogo
 */
function viewCatalogDetails(catalogId) {
  const catalog = catalogs.find((c) => c.id === catalogId);
  if (!catalog) return;
  
  const catalogProducts = products.filter((p) => p.catalogId === catalog.id);

  const modal = document.createElement("div");
  modal.className = "modal";
  modal.style.display = "flex";
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 700px;">
        <div class="modal-header">
            <h2>Detalles del Catálogo: ${catalog.name}</h2>
            <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
        </div>
        <p><strong>Categoría:</strong> ${catalog.category}</p>
        <p><strong>Creado:</strong> ${new Date(catalog.createdAt).toLocaleDateString()}</p>
        <p><strong>Estado:</strong> ${catalog.published ? "Publicado" : "Borrador"}</p>
        <h3 style="margin-top: 20px;">Productos en el catálogo:</h3>
        ${
          catalogProducts.length > 0
            ? `
            <table class="product-table">
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Calidad</th>
                        <th>Cantidad</th>
                        <th>Unidad</th>
                        <th>Precio</th>
                    </tr>
                </thead>
                <tbody>
                    ${catalogProducts
                      .map(
                        (product) => `
                        <tr>
                            <td>${product.name}</td>
                            <td>${product.quality}</td>
                            <td>${product.quantity}</td>
                            <td>${product.unit}</td>
                            <td>S/. ${product.price.toFixed(2)}</td>
                        </tr>
                    `,
                      )
                      .join("")}
                </tbody>
            </table>
        `
            : "<p>No hay productos en este catálogo.</p>"
        }
    </div>
  `;
  document.body.appendChild(modal);
  lucide.createIcons();
}

/**
 * Editar catálogo
 */
function editCatalog(catalogId) {
  const catalog = catalogs.find((c) => c.id === catalogId);
  if (!catalog) return;

  const modal = document.createElement("div");
  modal.className = "modal";
  modal.style.display = "flex";
  modal.innerHTML = `
    <div class="modal-content">
        <div class="modal-header">
            <h2>Editar Catálogo</h2>
            <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
        </div>
        <form onsubmit="updateCatalog(event, ${catalog.id})">
            <div class="form-group">
                <label>Nombre del catálogo</label>
                <input type="text" name="name" value="${catalog.name}" required>
            </div>
            <div class="form-group">
                <label>Categoría</label>
                <div class="category-grid" id="editCatalogCategoryGrid">
                    <div class="category-item ${catalog.category === "Carnes" ? "selected" : ""}" data-category="Carnes">
                        <i data-lucide="beef"></i><span>Carnes</span>
                    </div>
                    <div class="category-item ${catalog.category === "Frutas" ? "selected" : ""}" data-category="Frutas">
                        <i data-lucide="apple"></i><span>Frutas</span>
                    </div>
                    <div class="category-item ${catalog.category === "Verduras" ? "selected" : ""}" data-category="Verduras">
                        <i data-lucide="carrot"></i><span>Verduras</span>
                    </div>
                    <div class="category-item ${catalog.category === "Lácteos" ? "selected" : ""}" data-category="Lácteos">
                        <i data-lucide="milk"></i><span>Lácteos</span>
                    </div>
                    <div class="category-item ${catalog.category === "Granos" ? "selected" : ""}" data-category="Granos">
                        <i data-lucide="wheat"></i><span>Granos</span>
                    </div>
                    <div class="category-item ${catalog.category === "Congelados" ? "selected" : ""}" data-category="Congelados">
                        <i data-lucide="snowflake"></i><span>Congelados</span>
                    </div>
                    <div class="category-item ${catalog.category === "Enlatados" ? "selected" : ""}" data-category="Enlatados">
                        <i data-lucide="package-2"></i><span>Enlatados</span>
                    </div>
                    <div class="category-item ${catalog.category === "Bebidas" ? "selected" : ""}" data-category="Bebidas">
                        <i data-lucide="cup-soda"></i><span>Bebidas</span>
                    </div>
                    <div class="category-item ${catalog.category === "Limpieza" ? "selected" : ""}" data-category="Limpieza">
                        <i data-lucide="sparkles"></i><span>Limpieza</span>
                    </div>
                </div>
                <input type="hidden" name="category" value="${catalog.category}" required>
            </div>
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button type="button" class="btn btn-outline" onclick="this.closest('.modal').remove()">Cancelar</button>
                <button type="submit" class="btn btn-primary">Actualizar Catálogo</button>
            </div>
        </form>
    </div>
  `;
  document.body.appendChild(modal);
  lucide.createIcons();
  
  modal.querySelectorAll("#editCatalogCategoryGrid .category-item").forEach((item) => {
    item.addEventListener("click", (event) => {
      selectCategory(event.currentTarget, event.currentTarget.dataset.category);
    });
  });
}

/**
 * Actualizar catálogo
 */
async function updateCatalog(event, catalogId) {
  event.preventDefault();
  const formData = new FormData(event.target);

  const updateData = {
    name: formData.get("name"),
    category: formData.get("category")
  };

  try {
    await dataService.updateCatalog(catalogId, updateData);
    await showCatalog();
    event.target.closest(".modal").remove();
    toastr.success("Catálogo actualizado exitosamente");
  } catch (error) {
    console.error('Error updating catalog:', error);
    toastr.error("Error al actualizar catálogo");
  }
}

/**
 * Eliminar catálogo
 */
async function deleteCatalog(catalogId) {
  showConfirmModal("¿Está seguro de eliminar este catálogo? Esto eliminará todos los productos asociados.", async () => {
    try {
      await dataService.deleteCatalog(catalogId);
      activeCatalogId = null;
      await showCatalog();
      toastr.success("Catálogo eliminado");
    } catch (error) {
      console.error('Error deleting catalog:', error);
      toastr.error("Error al eliminar catálogo");
    }
  });
}
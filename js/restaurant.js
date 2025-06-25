/**
 * Servicio de Gestión de Restaurante
 * Maneja listas de compras, pedidos y funcionalidad específica del restaurante
 */

let lists = [];
let orders = [];
let activeListId = null;
let cart = [];

/**
 * Inicializar gestión del restaurante
 */
async function initializeRestaurantManagement() {
  await loadRestaurantData();
  updateCartCount();
}

/**
 * Cargar datos del restaurante
 */
async function loadRestaurantData() {
  try {
    lists = await dataService.getLists();
    orders = await dataService.getOrders();
    
    // Cargar carrito desde localStorage (sesión específica)
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      cart = JSON.parse(savedCart);
    }
  } catch (error) {
    console.error('Error al cargar datos del restaurante:', error);
    toastr.error('Error al cargar datos del restaurante');
  }
}

/**
 * Guardar carrito en localStorage
 */
function saveCartToStorage() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

/**
 * Mostrar interfaz de listas de compras
 */
async function showLists() {
  if (!isRestaurant()) return;
  
  updateActiveMenuItem("nav-lists");
  await loadRestaurantData();
  
  const content = document.getElementById("mainContent");
  const userLists = lists.filter((l) => l.restaurantId === currentUser.id);

  if (userLists.length > 0 && activeListId === null) {
    activeListId = userLists[0].id;
  }

  content.innerHTML = `
    <div class="list-header">
        <h2>Mis Listas de Compras</h2>
        <button class="btn btn-primary" onclick="createNewList()">
            <i data-lucide="plus"></i> Crear nueva lista
        </button>
    </div>
    ${
      userLists.length > 0
        ? `
        <div class="list-overview-grid">
            ${userLists
              .map(
                (list) => `
                <div class="list-card ${list.id === activeListId ? "active-list" : ""}" onclick="setActiveList(${list.id})">
                    <h3>${list.name}</h3>
                    <p>Categoría: ${list.category}</p>
                    <p>Creada: ${new Date(list.createdAt).toLocaleDateString()}</p>
                    <p>Productos: ${list.items ? list.items.length : 0}</p>
                    <div class="list-actions">
                        <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); viewListDetails(${list.id})">Ver Detalles</button>
                        
                        <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); editList(${list.id})"><i data-lucide="edit"></i></button>
                        <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); deleteList(${list.id})"><i data-lucide="trash"></i></button>
                    </div>
                    <div class="list-actions">
                        <button class="btn btn-primary" onclick="event.stopPropagation(); addListToCart(${list.id})">Agregar al Carrito</button>
                    </div>
                </div>
            `,
              )
              .join("")}
        </div>
        <div class="list-detail-section" id="listDetailSection">
            ${activeListId ? renderListDetailSection(activeListId) : '<p style="text-align: center; padding: 40px;">Selecciona una lista para ver sus detalles.</p>'}
        </div>
    `
        : '<p style="text-align: center; padding: 40px;">No hay listas creadas. Crea una nueva para comenzar.</p>'
    }
  `;
  lucide.createIcons();
}

/**
 * Establecer lista activa
 */
function setActiveList(listId) {
  activeListId = listId;
  showLists();
}

/**
 * Renderizar sección de detalles de lista
 */
function renderListDetailSection(listId) {
  const list = lists.find((l) => l.id === listId);
  if (!list) return "";

  return `
    <h3>Lista Activa: ${list.name}</h3>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h4>Productos en ${list.name}</h4>
        <button class="btn btn-primary" onclick="browseProducts()">
            <i data-lucide="plus"></i> Agregar producto
        </button>
    </div>
    <div id="listContent">
        ${renderListContentItems(list.id)}
    </div>
  `;
}

/**
 * Renderizar elementos de contenido de lista
 */
function renderListContentItems(listId) {
  const list = lists.find((l) => l.id === listId);
  if (!list || !list.items || list.items.length === 0) {
    return '<p style="text-align: center; padding: 20px;">No hay productos en esta lista. Agrega algunos productos.</p>';
  }

  return `
    <table class="product-table">
        <thead>
            <tr>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Unidad</th>
                <th>Precio Unit.</th>
                <th>Total</th>
                <th></th>
            </tr>
        </thead>
        <tbody>
            ${list.items
              .map(
                (item) => `
                <tr>
                    <td>${item.name} (${item.quality})</td>
                    <td><input type="number" value="${item.quantity}" class="product-input" style="width: 80px;" 
                               onchange="updateListItemQuantity(${list.id}, ${item.id}, this.value)"></td>
                    <td>${item.unit}</td>
                    <td>S/. ${item.price.toFixed(2)}</td>
                    <td>S/. ${(item.price * item.quantity).toFixed(2)}</td>
                    <td>
                        <button onclick="removeListItem(${list.id}, ${item.id})" style="background: none; border: none; cursor: pointer; color: hsl(var(--destructive));">
                            <i data-lucide="x"></i>
                        </button>
                    </td>
                </tr>
            `,
              )
              .join("")}
        </tbody>
    </table>
    <div style="text-align: right; margin-top: 20px; font-size: 20px; font-weight: bold;">
        Total Lista: S/. ${list.items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}
    </div>
  `;
}

/**
 * Crear nueva lista
 */
function createNewList() {
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.style.display = "flex";
  modal.innerHTML = `
    <div class="modal-content">
        <div class="modal-header">
            <h2>Crear Nueva Lista</h2>
            <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
        </div>
        <form onsubmit="saveList(event)">
            <div class="form-group">
                <label>Nombre de la lista</label>
                <input type="text" name="name" placeholder="Ingrese nombre" required>
            </div>
            <div class="form-group">
                <label>Categoría</label>
                <div class="category-grid" id="listCategoryGrid">
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
                    <div class="category-item" data-category="Bebidas">
                        <i data-lucide="beer"></i>
                        <span>Bebidas</span>
                    </div>
                    <div class="category-item" data-category="Dulces">
                        <i data-lucide="candy"></i>
                        <span>Dulces</span> 
                    </div>
                    <div class="category-item" data-category="Otros">
                        <i data-lucide="package"></i>
                        <span>Otros</span>
                    </div>
                </div>
                <input type="hidden" name="category" required>
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" name="active" checked> Lista Activa  
                </label>
            </div>
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button type="button" class="btn btn-outline" onclick="this.closest('.modal').remove()">Cancelar</button>
                <button type="submit" class="btn btn-primary">Crear Lista</button>
            </div>
        </form>
    </div>
  `;
  document.body.appendChild(modal);
  lucide.createIcons();

  modal.querySelectorAll("#listCategoryGrid .category-item").forEach((item) => {
    item.addEventListener("click", (event) => {
      selectCategory(event.currentTarget, event.currentTarget.dataset.category);
    });
  });
}

/**
 * Guardar lista
 */
async function saveList(event) {
  event.preventDefault();
  const formData = new FormData(event.target);

  const listData = {
    restaurantId: currentUser.id,
    name: formData.get("name"),
    category: formData.get("category"),
    active: formData.get("active") === "on",
    items: []
  };

  try {
    const newList = await dataService.createList(listData);
    
    if (newList) {
      event.target.closest(".modal").remove();
      await showLists();
      toastr.success("Lista creada exitosamente");
    }
  } catch (error) {
    console.error('Error al crear lista:', error);
    toastr.error("Error al crear lista");
  }
}

/**
 * Actualizar cantidad de elemento de lista
 */
async function updateListItemQuantity(listId, itemId, newQuantity) {
  const list = lists.find((l) => l.id === listId);
  if (!list) return;
  
  const item = list.items.find((i) => i.id === itemId);
  if (item) {
    item.quantity = parseInt(newQuantity);
    
    try {
      await dataService.updateList(listId, { items: list.items });
      await loadRestaurantData();
      document.getElementById("listDetailSection").innerHTML = renderListDetailSection(listId);
      lucide.createIcons();
    } catch (error) {
      console.error('Error al actualizar elemento de lista:', error);
      toastr.error("Error al actualizar producto");
    }
  }
}

/**
 * Eliminar elemento de lista
 */
async function removeListItem(listId, itemId) {
  showConfirmModal("¿Está seguro de eliminar este producto de la lista?", async () => {
    const list = lists.find((l) => l.id === listId);
    if (!list) return;
    
    list.items = list.items.filter((item) => item.id !== itemId);
    
    try {
      await dataService.updateList(listId, { items: list.items });
      await loadRestaurantData();
      document.getElementById("listDetailSection").innerHTML = renderListDetailSection(listId);
      lucide.createIcons();
      toastr.info("Producto eliminado de la lista");
    } catch (error) {
      console.error('Error al eliminar elemento de lista:', error);
      toastr.error("Error al eliminar producto");
    }
  });
}

/**
 * Eliminar lista
 */
async function deleteList(listId) {
  showConfirmModal("¿Está seguro de eliminar esta lista? Esto eliminará todos los productos en ella.", async () => {
    try {
      await dataService.deleteList(listId);
      activeListId = null;
      await showLists();
      toastr.success("Lista eliminada");
    } catch (error) {
      console.error('Error al eliminar lista:', error);
      toastr.error("Error al eliminar lista");
    }
  });
}

/**
 * Ver detalles de lista
 */
function viewListDetails(listId) {
  const list = lists.find((l) => l.id === listId);
  if (!list) return;

  const modal = document.createElement("div");
  modal.className = "modal";
  modal.style.display = "flex";
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 600px;">
        <div class="modal-header">
            <h2>Detalles de la Lista: ${list.name}</h2>
            <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
        </div>
        <p><strong>Categoría:</strong> ${list.category}</p>
        <p><strong>Creada:</strong> ${new Date(list.createdAt).toLocaleDateString()}</p>
        <p><strong>Estado:</strong> ${list.active ? "Activa" : "Inactiva"}</p>
        <h3 style="margin-top: 20px;">Productos en la lista:</h3>
        ${
          list.items && list.items.length > 0
            ? `
            <table class="product-table">
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Unidad</th>
                        <th>Precio Unit.</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${list.items
                      .map(
                        (item) => `
                        <tr>
                            <td>${item.name}</td>
                            <td>${item.quantity}</td>
                            <td>${item.unit}</td>
                            <td>S/. ${item.price.toFixed(2)}</td>
                            <td>S/. ${(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                    `,
                      )
                      .join("")}
                </tbody>
            </table>
            <div style="text-align: right; margin-top: 20px; font-size: 18px; font-weight: bold;">
                Total de la Lista: S/. ${list.items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}
            </div>
        `
            : "<p>No hay productos en esta lista.</p>"
        }
    </div>
  `;
  document.body.appendChild(modal);
  lucide.createIcons();
}

/**
 * Editar lista
 */
function editList(listId) {
  const list = lists.find((l) => l.id === listId);
  if (!list) return;

  const modal = document.createElement("div");
  modal.className = "modal";
  modal.style.display = "flex";
  modal.innerHTML = `
    <div class="modal-content">
        <div class="modal-header">
            <h2>Editar Lista</h2>
            <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
        </div>
        <form onsubmit="updateList(event, ${list.id})">
            <div class="form-group">
                <label>Nombre de la lista</label>
                <input type="text" name="name" value="${list.name}" required>
            </div>
            <div class="form-group">
                <label>Categoría</label>
                <div class="category-grid" id="editListCategoryGrid">
                    <div class="category-item ${list.category === "Carnes" ? "selected" : ""}" data-category="Carnes">
                        <i data-lucide="beef"></i><span>Carnes</span>
                    </div>
                    <div class="category-item ${list.category === "Frutas" ? "selected" : ""}" data-category="Frutas">
                        <i data-lucide="apple"></i><span>Frutas</span>
                    </div>
                    <div class="category-item ${list.category === "Verduras" ? "selected" : ""}" data-category="Verduras">
                        <i data-lucide="carrot"></i><span>Verduras</span>
                    </div>
                    <div class="category-item ${list.category === "Bebidas" ? "selected" : ""}" data-category="Bebidas">
                        <i data-lucide="beer"></i><span>Bebidas</span>
                    </div>
                    <div class="category-item ${list.category === "Dulces" ? "selected" : ""}" data-category="Dulces">
                        <i data-lucide="candy"></i><span>Dulces</span>
                    </div>
                    <div class="category-item ${list.category === "Otros" ? "selected" : ""}" data-category="Otros">
                        <i data-lucide="package"></i><span>Otros</span>
                    </div>
                </div>
                <input type="hidden" name="category" value="${list.category}" required>
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" name="active" ${list.active ? "checked" : ""}> Lista Activa  
                </label>
            </div>
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button type="button" class="btn btn-outline" onclick="this.closest('.modal').remove()">Cancelar</button>
                <button type="submit" class="btn btn-primary">Actualizar Lista</button>
            </div>
        </form>
    </div>
  `;
  document.body.appendChild(modal);
  lucide.createIcons();
  
  modal.querySelectorAll("#editListCategoryGrid .category-item").forEach((item) => {
    item.addEventListener("click", (event) => {
      selectCategory(event.currentTarget, event.currentTarget.dataset.category);
    });
  });
}

/**
 * Actualizar lista
 */
async function updateList(event, listId) {
  event.preventDefault();
  const formData = new FormData(event.target);

  const updateData = {
    name: formData.get("name"),
    category: formData.get("category"),
    active: formData.get("active") === "on"
  };

  try {
    await dataService.updateList(listId, updateData);
    await showLists();
    event.target.closest(".modal").remove();
    toastr.success("Lista actualizada exitosamente");
  } catch (error) {
    console.error('Error al actualizar lista:', error);
    toastr.error("Error al actualizar lista");
  }
}

/**
 * Agregar lista al carrito
 */
function addListToCart(listId) {
  const list = lists.find((l) => l.id === listId);
  if (!list || !list.items || list.items.length === 0) {
    toastr.warning("La lista está vacía");
    return;
  }

  list.items.forEach((item) => {
    const existingItem = cart.find((c) => c.id === item.id);
    if (existingItem) {
      existingItem.quantity += item.quantity;
    } else {
      cart.push({ ...item });
    }
  });

  saveCartToStorage();
  updateCartCount();
  toastr.success("Lista agregada al carrito");
  showCart();
}

/**
 * Explorar productos para agregar a listas
 */
async function browseProducts() {
  if (!activeListId) {
    toastr.warning("Por favor, selecciona una lista para agregar productos.");
    return;
  }

  try {
    const allCatalogs = await dataService.getCatalogs();
    const allProducts = await dataService.getProducts();
    
    const modal = document.createElement("div");
    modal.className = "modal";
    modal.style.display = "flex";
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 800px;">
          <div class="modal-header">
              <h2>Explorar Productos</h2>
              <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
          </div>
          <div style="margin-bottom: 20px;">
              <input type="text" placeholder="Buscar productos..." class="product-input" 
                     onkeyup="searchProducts(this.value)" style="width: 100%;">
          </div>
          <div class="category-grid" id="browseProductCategoryGrid" style="margin-bottom: 20px;">
              <div class="category-item selected" data-category="all">
                  <i data-lucide="package"></i>
                  <span>Todos</span>
              </div>
              <div class="category-item" data-category="Frutas">
                  <i data-lucide="apple"></i>
                  <span>Frutas</span>
              </div>
              <div class="category-item" data-category="Verduras">
                  <i data-lucide="carrot"></i>
                  <span>Verduras</span>
              </div>
              <div class="category-item" data-category="Carnes">
                  <i data-lucide="beef"></i>
                  <span>Carnes</span>
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
          </div>
          <div id="productListContainer" style="max-height: 400px; overflow-y: auto;">
              ${await generateProductList()}
          </div>
      </div>
    `;
    document.body.appendChild(modal);
    lucide.createIcons();
    
    modal.querySelectorAll("#browseProductCategoryGrid .category-item").forEach((item) => {
      item.addEventListener("click", (event) => {
        filterProductsByCategory(event.currentTarget, event.currentTarget.dataset.category);
      });
    });
  } catch (error) {
    console.error('Error al explorar productos:', error);
    toastr.error("Error al cargar productos");
  }
}

/**
 * Generar lista de productos en busqueda
 */
async function generateProductList(filterCategory = "all", searchTerm = "") {
  try {
    const allCatalogs = await dataService.getCatalogs();
    const allProducts = await dataService.getProducts();
    
    const publishedCatalogs = allCatalogs.filter((c) => c.published !== false);
    let availableProducts = [];

    publishedCatalogs.forEach((catalog) => {
      const catalogProducts = allProducts.filter((p) => p.catalogId === catalog.id);
      catalogProducts.forEach((product) => {
        availableProducts.push({
          ...product,
          category: catalog.category,
          providerName: catalog.userId // Podrías querer obtener el nombre real del proveedor desde los datos del usuario
        });
      });
    });

    if (filterCategory !== "all") {
      availableProducts = availableProducts.filter((p) => p.category === filterCategory);
    }

    if (searchTerm) {
      availableProducts = availableProducts.filter((p) => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (availableProducts.length === 0) {
      return '<p style="text-align: center; padding: 40px;">No hay productos disponibles en esta categoría</p>';
    }

    return availableProducts
      .map(
        (product) => `
          <div class="invoice-item">
              <div class="invoice-info">
                  <h4>${product.name}</h4>
                  <p>${product.category} - ${product.quality || "Premium"}</p>
                  <p style="font-size: 12px; color: hsl(var(--muted-foreground));">Proveedor: ${product.providerName}</p>
              </div>
              <div style="text-align: right;">
                  <p style="font-weight: 600; font-size: 18px;">S/. ${product.price.toFixed(2)}</p>
                  <p style="font-size: 14px;">por ${product.unit}</p>
              </div>
              <button class="btn btn-primary btn-sm" onclick="addProductToList(${product.id}, '${product.name}', ${product.price}, '${product.unit}', '${product.quality}', '${product.category}')">
                  <i data-lucide="plus"></i> Agregar
              </button>
          </div>
      `,
      )
      .join("");
  } catch (error) {
    console.error('Error al generar lista de productos:', error);
    return '<p style="text-align: center; padding: 40px;">Error al cargar productos</p>';
  }
}

/**
 * Filtrar productos por categoría
 */
async function filterProductsByCategory(element, category) {
  element.parentElement.querySelectorAll(".category-item").forEach((item) => {
    item.classList.remove("selected");
  });
  element.classList.add("selected");

  document.getElementById("productListContainer").innerHTML = await generateProductList(category);
  lucide.createIcons();
}

/**
 * Buscar productos
 */
async function searchProducts(searchTerm) {
  const selectedCategory = 
    document.querySelector("#browseProductCategoryGrid .category-item.selected")?.dataset.category || "all";
  document.getElementById("productListContainer").innerHTML = await generateProductList(selectedCategory, searchTerm);
  lucide.createIcons();
}

/**
 * Agregar producto a lista activa
 */
async function addProductToList(productId, name, price, unit, quality, category) {
  const listToUpdate = lists.find((l) => l.id === activeListId);
  if (!listToUpdate) {
    toastr.warning("No hay lista activa. Por favor, selecciona una lista primero.");
    return;
  }

  const newItem = {
    id: Date.now(),
    productId: productId,
    name: name,
    quality: quality || "Premium",
    quantity: 1,
    unit: unit,
    price: price,
    category: category,
  };

  if (!listToUpdate.items) listToUpdate.items = [];
  listToUpdate.items.push(newItem);

  try {
    await dataService.updateList(activeListId, { items: listToUpdate.items });
    await loadRestaurantData();
    toastr.success("Producto agregado a la lista");

    if (document.getElementById("listDetailSection")) {
      document.getElementById("listDetailSection").innerHTML = renderListDetailSection(activeListId);
      lucide.createIcons();
    }
  } catch (error) {
    console.error('Error al agregar producto a la lista:', error);
    toastr.error("Error al agregar producto a la lista");
  }
}

/**
 * Funciones de gestión del carrito
 */
function updateCartCount() {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.getElementById("cartCount").textContent = count;
}

function showCart() {
  if (!currentUser) {
    toastr.warning("Por favor inicie sesión para ver el carrito");
    showLogin();
    return;
  }

  hideAllPages();
  document.getElementById("cartPage").style.display = "block";
  renderCart();
}

function renderCart() {
  const content = document.getElementById("cartContent");

  if (cart.length === 0) {
    content.innerHTML = `
      <div class="cart-empty">
          <p>Tu carrito está vacío</p>
          <button class="btn btn-primary" onclick="showDashboard()">Continuar Comprando</button>
      </div>
    `;
    return;
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = 0;
  const total = subtotal + shipping;

  content.innerHTML = `
    <div class="cart-items">
        <h3>Productos en el Carrito</h3>
        ${cart
          .map(
            (item, index) => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>${item.quality || "Premium"}</p>
                </div>
                <div class="quantity-controls">
                    <button onclick="updateCartItemQuantity(${index}, ${item.quantity - 1})">-</button>
                    <input type="number" value="${item.quantity}" min="1" onchange="updateCartItemQuantity(${index}, this.value)">
                    <button onclick="updateCartItemQuantity(${index}, ${item.quantity + 1})">+</button>
                </div>
                <div style="text-align: right; min-width: 100px;">
                    <p>${item.unit}</p>
                    <p style="font-weight: 600;">S/. ${item.price.toFixed(2)}</p>
                </div>
                <div style="text-align: right; min-width: 100px;">
                    <p style="font-weight: 600;">S/. ${(item.price * item.quantity).toFixed(2)}</p>
                </div>
                <button onclick="removeFromCart(${index})" style="background: none; border: none; cursor: pointer; color: hsl(var(--destructive));">
                    <i data-lucide="trash"></i>
                </button>
            </div>
        `,
          )
          .join("")}
    </div>
    
    <div class="cart-summary">
        <h3>Resumen del Pedido</h3>
        <div class="summary-row">
            <span>Subtotal</span>
            <span>S/. ${subtotal.toFixed(2)}</span>
        </div>
        <div class="summary-row">
            <span>Envío</span>
            <span>${shipping === 0 ? "Gratis" : "S/. " + shipping.toFixed(2)}</span>
        </div>
        <div class="summary-row total">
            <span>Total</span>
            <span>S/. ${total.toFixed(2)}</span>
        </div>
        <button class="btn btn-primary" style="width: 100%; margin-top: 20px;" onclick="showCheckout()">
            Proceder al Pago
        </button>
    </div>
  `;
  lucide.createIcons();
}

function updateCartItemQuantity(index, newQuantity) {
  if (newQuantity < 1) {
    removeFromCart(index);
    return;
  }
  cart[index].quantity = parseInt(newQuantity);
  saveCartToStorage();
  updateCartCount();
  renderCart();
}

function removeFromCart(index) {
  cart.splice(index, 1);
  saveCartToStorage();
  updateCartCount();
  renderCart();
  toastr.info("Producto eliminado del carrito");
}

/**
 * Procesar pedido
 */
async function processOrder() {
  if (cart.length === 0) {
    toastr.warning("El carrito está vacío");
    return;
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = window.appliedPromo ? window.appliedPromo.discount : 0;
  const total = subtotal - discount;

  const orderData = {
    restaurantId: currentUser.id,
    restaurantName: currentUser.restaurantName || "Restaurante Demo",
    items: [...cart],
    subtotal: subtotal,
    discount: discount,
    total: total,
    promoCode: window.appliedPromo ? window.appliedPromo.code : null,
    status: "pending"
  };

  try {
    const newOrder = await dataService.createOrder(orderData);
    
    if (newOrder) {
      // Limpiar carrito
      cart = [];
      saveCartToStorage();
      updateCartCount();
      
      // Limpiar promoción aplicada
      window.appliedPromo = null;
      
      toastr.success("¡Pedido realizado exitosamente!");
      showMyOrders();
    }
  } catch (error) {
    console.error('Error al procesar pedido:', error);
    toastr.error("Error al procesar pedido");
  }
}

/**
 * Mostrar mis pedidos
 */
async function showMyOrders() {
  if (!isRestaurant()) return;
  
  updateActiveMenuItem("nav-my-orders");
  await loadRestaurantData();
  
  const content = document.getElementById("mainContent");
  const userOrders = orders.filter((o) => o.restaurantId === currentUser.id);

  content.innerHTML = `
    <h2>Mis Pedidos</h2>
    <p style="margin-bottom: 20px; color: hsl(var(--muted-foreground));">Historial completo de todos tus pedidos realizados</p>
    ${
      userOrders.length > 0
        ? userOrders
            .map(
              (order) => `
          <div class="invoice-item">
              <div class="invoice-info">
                  <h4>Pedido #${order.id}</h4>
                  <p>${new Date(order.createdAt).toLocaleDateString()} ${new Date(order.createdAt).toLocaleTimeString()}</p>
                  <p>Estado: <span class="btn btn-sm ${getStatusClass(order.status)}">${getStatusText(order.status)}</span></p>
                  <p style="font-size: 12px; color: hsl(var(--muted-foreground));">
                      ${order.items.length} producto(s) - ${order.items.map((item) => item.name).join(", ")}
                  </p>
              </div>
              <div class="invoice-amount">S/. ${order.total.toFixed(2)}</div>
              <div class="invoice-actions">
                  <button class="btn btn-outline btn-sm" onclick="viewOrderDetails(${order.id})">Ver detalles</button>
                  ${
                    order.status === "completed"
                      ? `
                      <button class="btn btn-primary btn-sm" onclick="reorderItems(${order.id})">Volver a pedir</button>
                  `
                      : ""
                  }
              </div>
          </div>
      `,
            )
            .join("")
        : '<p style="text-align: center; padding: 40px;">No hay pedidos realizados</p>'
    }
  `;
  lucide.createIcons();
}

/**
 * Volver a pedir elementos
 */
function reorderItems(orderId) {
  const order = orders.find((o) => o.id === orderId);
  if (!order) return;

  order.items.forEach((item) => {
    const existingItem = cart.find((c) => c.productId === item.productId);
    if (existingItem) {
      existingItem.quantity += item.quantity;
    } else {
      cart.push({ ...item, id: Date.now() + Math.random() });
    }
  });

  saveCartToStorage();
  updateCartCount();
  toastr.success("Productos agregados al carrito");
  showCart();
}
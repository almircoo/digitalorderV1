/**
 * DataService - Maneja todas las operaciones de persistencia de datos
 * Nota: En una aplicación real, esto haría solicitudes HTTP a un servidor backend
 * Para propósitos de demostración, estamos usando localStorage como almacenamiento subyacente
 */
class DataService {
    constructor() {
      this.dataFile = 'data/data.json';
      this.initializeData();
    }
  
    /**
     * Inicializar estructura de datos con datos de demostración si no existe
     */
    initializeData() {
      const existingData = localStorage.getItem('digitalorder_data');
      if (!existingData) {
        const initialData = {
          users: [
            {
              id: 1,
              email: "proveedor@demo.com",
              password: "demo123",
              firstName: "Juan",
              lastName: "Pérez",
              accountType: "provider",
              companyName: "Frutas y Verduras del Valle",
              address: "Av. Los Frutales 123, Lima",
              phone: "+51 987 654 321",
              ruc: "20123456789",
              createdAt: "2024-01-15T10:00:00.000Z"
            },
            {
              id: 2,
              email: "restaurante@demo.com",
              password: "demo123",
              firstName: "María",
              lastName: "García",
              accountType: "restaurant",
              restaurantName: "Restaurante El Sabor",
              address: "Jr. Los Sabores 456, Lima",
              phone: "+51 987 654 322",
              ruc: "20987654321",
              createdAt: "2024-01-15T10:00:00.000Z"
            }
          ],
          catalogs: [
            {
              id: 1,
              userId: 1,
              name: "Frutas Frescas",
              category: "Frutas",
              published: true,
              createdAt: "2024-01-15T10:00:00.000Z"
            },
            {
              id: 2,
              userId: 1,
              name: "Verduras Orgánicas",
              category: "Verduras",
              published: true,
              createdAt: "2024-01-15T10:00:00.000Z"
            }
          ],
          products: [
            {
              id: 1,
              catalogId: 1,
              name: "Manzana",
              quality: "Premium",
              quantity: 50,
              unit: "Kilogramo (kg)",
              price: 4.5
            },
            {
              id: 2,
              catalogId: 1,
              name: "Plátano",
              quality: "Premium",
              quantity: 30,
              unit: "Kilogramo (kg)",
              price: 2.8
            },
            {
              id: 3,
              catalogId: 1,
              name: "Naranja",
              quality: "Premium",
              quantity: 40,
              unit: "Kilogramo (kg)",
              price: 3.2
            },
            {
              id: 4,
              catalogId: 2,
              name: "Lechuga",
              quality: "Premium",
              quantity: 25,
              unit: "Unidad",
              price: 1.5
            },
            {
              id: 5,
              catalogId: 2,
              name: "Tomate",
              quality: "Premium",
              quantity: 35,
              unit: "Kilogramo (kg)",
              price: 3.8
            }
          ],
          lists: [
            {
              id: 1,
              restaurantId: 2,
              name: "Lista de Helados",
              category: "Dulces",
              active: true,
              items: [
                {
                  id: 1,
                  productId: 1,
                  name: "Helado",
                  quality: "Vainilla",
                  quantity: 10,
                  unit: "Unidad",
                  price: 5.0,
                  category: "Dulces"
                }
              ],
              createdAt: "2024-01-15T10:00:00.000Z"
            }
          ],
          orders: [
            {
              id: 1,
              restaurantId: 2,
              restaurantName: "Restaurante El Sabor",
              providerId: 1,
              providerName: "Frutas y Verduras del Valle",
              items: [
                {
                  id: 1,
                  productId: 1,
                  name: "Manzana",
                  quality: "Premium",
                  quantity: 15,
                  unit: "Kilogramo (kg)",
                  price: 4.5,
                  category: "Frutas"
                },
                {
                  id: 2,
                  productId: 4,
                  name: "Lechuga",
                  quality: "Premium",
                  quantity: 25,
                  unit: "Unidad",
                  price: 1.5,
                  category: "Verduras"
                }
              ],
              subtotal: 105.0,
              discount: 0,
              total: 350.75,
              promoCode: null,
              status: "completed",
              createdAt: "2023-11-10T10:00:00.000Z",
              lastUpdated: "2023-11-15T16:00:00.000Z"
            },
            {
              id: 2,
              restaurantId: 2,
              restaurantName: "Restaurante El Sabor", 
              providerId: 1,
              providerName: "Frutas y Verduras del Valle",
              items: [
                {
                  id: 3,
                  productId: 5,
                  name: "Tomate",
                  quality: "Premium",
                  quantity: 20,
                  unit: "Kilogramo (kg)",
                  price: 3.8,
                  category: "Verduras"
                },
                {
                  id: 4,
                  productId: 2,
                  name: "Plátano",
                  quality: "Premium",
                  quantity: 30,
                  unit: "Kilogramo (kg)",
                  price: 2.8,
                  category: "Frutas"
                }
              ],
              subtotal: 160.0,
              discount: 15.0,
              total: 425.30,
              promoCode: "VERANO15",
              status: "completed",
              createdAt: "2023-11-18T10:00:00.000Z",
              lastUpdated: "2023-11-20T12:00:00.000Z"
            },
            {
              id: 3,
              restaurantId: 2,
              restaurantName: "Restaurante El Sabor",
              providerId: 1,
              providerName: "Frutas y Verduras del Valle",
              items: [
                {
                  id: 5,
                  productId: 3,
                  name: "Naranja",
                  quality: "Premium",
                  quantity: 25,
                  unit: "Kilogramo (kg)",
                  price: 3.2,
                  category: "Frutas"
                }
              ],
              subtotal: 80.0,
              discount: 0,
              total: 280.50,
              promoCode: null,
              status: "completed",
              createdAt: "2023-11-22T10:00:00.000Z",
              lastUpdated: "2023-11-24T14:00:00.000Z"
            },
            {
              id: 4,
              restaurantId: 2,
              restaurantName: "Restaurante El Sabor",
              providerId: null,
              providerName: null,
              items: [
                {
                  id: 6,
                  productId: 1,
                  name: "Manzana",
                  quality: "Premium",
                  quantity: 10,
                  unit: "Kilogramo (kg)",
                  price: 4.5,
                  category: "Frutas"
                }
              ],
              subtotal: 45.0,
              discount: 0,
              total: 45.0,
              promoCode: null,
              status: "pending",
              createdAt: "2024-06-24T10:00:00.000Z",
              lastUpdated: "2024-06-24T10:00:00.000Z"
            }
          ],
          invoices: [
            {
              id: 1,
              orderId: 1,
              providerId: 1,
              restaurantId: 2,
              restaurantName: "Restaurante El Sabor",
              invoiceNumber: "F001-00123",
              amount: 350.75,
              status: "paid",
              notes: "Pago realizado mediante transferencia bancaria",
              createdAt: "2023-11-15T10:00:00.000Z",
              dueDate: "2023-12-15T10:00:00.000Z",
              paidAt: "2023-11-20T14:30:00.000Z"
            },
            {
              id: 2,
              orderId: 2,
              providerId: 1,
              restaurantId: 2,
              restaurantName: "Verduras Express",
              invoiceNumber: "F001-00124",
              amount: 425.30,
              status: "pending",
              notes: "Pendiente de pago",
              createdAt: "2023-11-20T10:00:00.000Z",
              dueDate: "2023-12-20T10:00:00.000Z",
              paidAt: null
            },
            {
              id: 3,
              orderId: 3,
              providerId: 1,
              restaurantId: 2,
              restaurantName: "Distribuidora Orgánica",
              invoiceNumber: "F001-00125",
              amount: 280.50,
              status: "pending",
              notes: "Pendiente de pago",
              createdAt: "2023-11-24T10:00:00.000Z",
              dueDate: "2023-12-24T10:00:00.000Z",
              paidAt: null
            }
          ],
          promotions: [],
          settings: {
            initialized: true,
            version: "1.0.0"
          }
        };
        this.saveData(initialData);
      }
    }
  
    /**
     * Cargar todos los datos desde el almacenamiento
     * En una aplicación real, esto sería: fetch('/api/data')
     */
    async loadData() {
      try {
        const data = localStorage.getItem('digitalorder_data');
        return data ? JSON.parse(data) : null;
      } catch (error) {
        console.error('Error loading data:', error);
        return null;
      }
    }
  
    /**
     * Guardar todos los datos en el almacenamiento
     * En una aplicación real, esto sería: fetch('/api/data', { method: 'POST', body: JSON.stringify(data) })
     */
    async saveData(data) {
      try {
        localStorage.setItem('digitalorder_data', JSON.stringify(data));
        return true;
      } catch (error) {
        console.error('Error saving data:', error);
        return false;
      }
    }
  
    /**
     * Métodos genéricos para operaciones CRUD
     */
  
    // Operaciones GET
    async getUsers() {
      const data = await this.loadData();
      return data ? data.users : [];
    }
  
    async getCatalogs() {
      const data = await this.loadData();
      return data ? data.catalogs : [];
    }
  
    async getProducts() {
      const data = await this.loadData();
      return data ? data.products : [];
    }
  
    async getLists() {
      const data = await this.loadData();
      return data ? data.lists : [];
    }
  
    async getOrders() {
      const data = await this.loadData();
      return data ? data.orders : [];
    }
  
    async getInvoices() {
      const data = await this.loadData();
      return data ? data.invoices : [];
    }
  
    async getPromotions() {
      const data = await this.loadData();
      return data ? data.promotions : [];
    }
  
    // User operations
    async createUser(userData) {
      const data = await this.loadData();
      if (!data) return false;
  
      // Verificar si el correo electrónico ya existe
      const existingUser = data.users.find(u => u.email === userData.email);
      if (existingUser) {
        throw new Error('Email already exists');
      }
  
      const newUser = {
        id: Date.now(),
        ...userData,
        createdAt: new Date().toISOString()
      };
  
      data.users.push(newUser);
      await this.saveData(data);
      return newUser;
    }
  
    async updateUser(userId, userData) {
      const data = await this.loadData();
      if (!data) return false;
  
      const userIndex = data.users.findIndex(u => u.id === userId);
      if (userIndex === -1) return false;
  
      data.users[userIndex] = { ...data.users[userIndex], ...userData };
      await this.saveData(data);
      return data.users[userIndex];
    }
  
    async authenticateUser(email, password, accountType) {
      const users = await this.getUsers();
      return users.find(u => 
        u.email === email && 
        u.password === password && 
        u.accountType === accountType
      );
    }
  
    // Catalog operations
    async createCatalog(catalogData) {
      const data = await this.loadData();
      if (!data) return false;
  
      const newCatalog = {
        id: Date.now(),
        ...catalogData,
        createdAt: new Date().toISOString()
      };
  
      data.catalogs.push(newCatalog);
      await this.saveData(data);
      return newCatalog;
    }
  
    async updateCatalog(catalogId, catalogData) {
      const data = await this.loadData();
      if (!data) return false;
  
      const catalogIndex = data.catalogs.findIndex(c => c.id === catalogId);
      if (catalogIndex === -1) return false;
  
      data.catalogs[catalogIndex] = { ...data.catalogs[catalogIndex], ...catalogData };
      await this.saveData(data);
      return data.catalogs[catalogIndex];
    }
  
    async deleteCatalog(catalogId) {
      const data = await this.loadData();
      if (!data) return false;
  
      // Eliminar catálogo
      data.catalogs = data.catalogs.filter(c => c.id !== catalogId);
      // Eliminar productos asociados
      data.products = data.products.filter(p => p.catalogId !== catalogId);
      
      await this.saveData(data);
      return true;
    }
  
    async publishCatalog(catalogId) {
      const data = await this.loadData();
      if (!data) return false;
  
      const catalog = data.catalogs.find(c => c.id === catalogId);
      if (!catalog) return false;
  
      catalog.published = true;
      await this.saveData(data);
      return catalog;
    }
  
    // Operaciones de producto
    async createProduct(productData) {
      const data = await this.loadData();
      if (!data) return false;
  
      const newProduct = {
        id: Date.now(),
        ...productData
      };
  
      data.products.push(newProduct);
      await this.saveData(data);
      return newProduct;
    }
  
    async updateProduct(productId, productData) {
      const data = await this.loadData();
      if (!data) return false;
  
      const productIndex = data.products.findIndex(p => p.id === productId);
      if (productIndex === -1) return false;
  
      data.products[productIndex] = { ...data.products[productIndex], ...productData };
      await this.saveData(data);
      return data.products[productIndex];
    }
  
    async deleteProduct(productId) {
      const data = await this.loadData();
      if (!data) return false;
  
      data.products = data.products.filter(p => p.id !== productId);
      await this.saveData(data);
      return true;
    }
  
    // Operaciones de lista
    async createList(listData) {
      const data = await this.loadData();
      if (!data) return false;
  
      const newList = {
        id: Date.now(),
        ...listData,
        items: listData.items || [],
        createdAt: new Date().toISOString()
      };
  
      data.lists.push(newList);
      await this.saveData(data);
      return newList;
    }
  
    async updateList(listId, listData) {
      const data = await this.loadData();
      if (!data) return false;
  
      const listIndex = data.lists.findIndex(l => l.id === listId);
      if (listIndex === -1) return false;
  
      data.lists[listIndex] = { ...data.lists[listIndex], ...listData };
      await this.saveData(data);
      return data.lists[listIndex];
    }
  
    async deleteList(listId) {
      const data = await this.loadData();
      if (!data) return false;
  
      data.lists = data.lists.filter(l => l.id !== listId);
      await this.saveData(data);
      return true;
    }
  
    // Operaciones de pedido
    async createOrder(orderData) {
      const data = await this.loadData();
      if (!data) return false;
  
      const newOrder = {
        id: Date.now(),
        ...orderData,
        createdAt: new Date().toISOString()
      };
  
      data.orders.push(newOrder);
      await this.saveData(data);
      return newOrder;
    }
  
    async updateOrder(orderId, orderData) {
      const data = await this.loadData();
      if (!data) return false;
  
      const orderIndex = data.orders.findIndex(o => o.id === orderId);
      if (orderIndex === -1) return false;
  
      data.orders[orderIndex] = { ...data.orders[orderIndex], ...orderData };
      await this.saveData(data);
      return data.orders[orderIndex];
    }
  
    // Operaciones de factura
    async createInvoice(invoiceData) {
      const data = await this.loadData();
      if (!data) return false;
  
      const newInvoice = {
        id: Date.now(),
        ...invoiceData,
        createdAt: new Date().toISOString()
      };
  
      data.invoices.push(newInvoice);
      await this.saveData(data);
      return newInvoice;
    }
  
    async updateInvoice(invoiceId, invoiceData) {
      const data = await this.loadData();
      if (!data) return false;
  
      const invoiceIndex = data.invoices.findIndex(i => i.id === invoiceId);
      if (invoiceIndex === -1) return false;
  
      data.invoices[invoiceIndex] = { ...data.invoices[invoiceIndex], ...invoiceData };
      await this.saveData(data);
      return data.invoices[invoiceIndex];
    }
  
    async deleteInvoice(invoiceId) {
      const data = await this.loadData();
      if (!data) return false;
  
      data.invoices = data.invoices.filter(i => i.id !== invoiceId);
      await this.saveData(data);
      return true;
    }
  
    // Operaciones de promoción
    async createPromotion(promotionData) {
      const data = await this.loadData();
      if (!data) return false;
  
      const newPromotion = {
        id: Date.now(),
        ...promotionData,
        createdAt: new Date().toISOString()
      };
  
      data.promotions.push(newPromotion);
      await this.saveData(data);
      return newPromotion;
    }
  
    async updatePromotion(promotionId, promotionData) {
      const data = await this.loadData();
      if (!data) return false;
  
      const promotionIndex = data.promotions.findIndex(p => p.id === promotionId);
      if (promotionIndex === -1) return false;
  
      data.promotions[promotionIndex] = { ...data.promotions[promotionIndex], ...promotionData };
      await this.saveData(data);
      return data.promotions[promotionIndex];
    }
  
    async deletePromotion(promotionId) {
      const data = await this.loadData();
      if (!data) return false;
  
      data.promotions = data.promotions.filter(p => p.id !== promotionId);
      await this.saveData(data);
      return true;
    }
  
    // Métodos utilitarios
    async getUserById(userId) {
      const users = await this.getUsers();
      return users.find(u => u.id === userId);
    }
  
    async getCatalogsByUserId(userId) {
      const catalogs = await this.getCatalogs();
      return catalogs.filter(c => c.userId === userId);
    }
  
    async getProductsByCatalogId(catalogId) {
      const products = await this.getProducts();
      return products.filter(p => p.catalogId === catalogId);
    }
  
    async getListsByRestaurantId(restaurantId) {
      const lists = await this.getLists();
      return lists.filter(l => l.restaurantId === restaurantId);
    }
  
    async getOrdersByRestaurantId(restaurantId) {
      const orders = await this.getOrders();
      return orders.filter(o => o.restaurantId === restaurantId);
    }
  
    async getOrdersByProviderId(providerId) {
      const orders = await this.getOrders();
      return orders.filter(o => o.providerId === providerId);
    }
  
    async getInvoicesByProviderId(providerId) {
      const invoices = await this.getInvoices();
      return invoices.filter(i => i.providerId === providerId);
    }
  
    async getInvoicesByRestaurantId(restaurantId) {
      const invoices = await this.getInvoices();
      return invoices.filter(i => i.restaurantId === restaurantId);
    }
  
    async getPromotionsByProviderId(providerId) {
      const promotions = await this.getPromotions();
      return promotions.filter(p => p.providerId === providerId);
    }
  
    // Métodos de búsqueda
    async searchProducts(searchTerm, category = null) {
      const products = await this.getProducts();
      const catalogs = await this.getCatalogs();
      
      let filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
  
      if (category && category !== 'all') {
        const categoryProducts = [];
        catalogs.forEach(catalog => {
          if (catalog.category === category && catalog.published) {
            const catalogProducts = filteredProducts.filter(p => p.catalogId === catalog.id);
            catalogProducts.forEach(product => {
              categoryProducts.push({
                ...product,
                category: catalog.category,
                providerName: catalog.userId // debe obtner el nombre del proveedor real
              });
            });
          }
        });
        return categoryProducts;
      }
  
      return filteredProducts;
    }
  }
  
  // Crear instancia global
  window.dataService = new DataService();
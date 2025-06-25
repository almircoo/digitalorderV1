# DigitalOrder - Conectando Restaurantes con Proveedores

## Descripción del Proyecto

DigitalOrder es una plataforma web que conecta restaurantes con proveedores de alimentos, permitiendo a los restaurantes crear listas de compras, explorar catálogos de productos, realizar pedidos y gestionar sus compras de manera eficiente.

## Estructura del Proyecto Refactorizado

El proyecto ha sido reestructurado en módulos separados para mejorar la mantenibilidad y escalabilidad:

```
project/
├── index.html                 # Página principal de la aplicación
├── css/
│   └── styles.css            # Estilos CSS 
├── js/
│   ├── data-service.js       # Servicio de gestión de datos y persistencia
│   ├── auth.js              # Autenticación y gestión de usuarios
│   ├── catalog.js           # Gestión de catálogos y productos (proveedores)
│   ├── restaurant.js        # Gestión de listas y pedidos (restaurantes)
│   ├── invoice.js           # Sistema completo de facturación
│   ├── utils.js             # Funciones utilitarias
│   └── app.js               # Aplicación principal y coordinación
├── data/
│   └── data.json            # Estructura de datos 
└── README.md                # Documentación del proyecto
```

## Sistema de Facturación

### Funcionalidades Implementadas

#### Para Proveedores (`js/invoice.js`):
- **Crear Facturas**: Generar facturas automáticamente para pedidos completados
- **Gestión de Estados**: Marcar facturas como pagadas o pendientes
- **Vista de Gestión**: Interface completa para administrar todas las facturas
- **Filtros Avanzados**: Ver facturas por estado (todas/pendientes/pagadas/sin factura)
- **Detalles Completos**: Modalidad con información detallada de cada factura
- **Eliminar Facturas**: Opción para eliminar facturas cuando sea necesario
- **Descarga PDF**: Simulación de descarga de facturas en formato PDF

#### Para Restaurantes (`js/invoice.js`):
- **Ver Facturas**: Interface para visualizar todas las facturas recibidas
- **Búsqueda Avanzada**: Buscar facturas por número, proveedor o pedido
- **Filtros por Estado**: Organizar facturas por estado de pago
- **Procesar Pagos**: Marcar facturas como pagadas
- **Detalles Completos**: Vista detallada de cada factura
- **Descarga PDF**: Descargar facturas para registros contables

### Estructura de Datos de Facturas

```javascript
{
  id: 1,
  orderId: 1,                    // ID del pedido relacionado
  providerId: 1,                 // ID del proveedor
  restaurantId: 2,               // ID del restaurante
  restaurantName: "Restaurante", // Nombre del restaurante
  invoiceNumber: "F001-00123",   // Número único de factura
  amount: 350.75,                // Monto total
  status: "pending",             // Estado: "pending" | "paid"
  notes: "Notas adicionales",    // Notas de la factura
  createdAt: "2023-11-15T10:00:00.000Z",  // Fecha de emisión
  dueDate: "2023-12-15T10:00:00.000Z",    // Fecha de vencimiento
  paidAt: "2023-11-20T14:30:00.000Z"      // Fecha de pago (null si pendiente)
}
```

### Flujo de Trabajo de Facturación

1. **Creación**: Proveedor crea factura para pedido completado
2. **Notificación**: Restaurante ve nueva factura en su panel
3. **Revisión**: Restaurante revisa detalles de la factura
4. **Pago**: Restaurante procesa el pago
5. **Confirmación**: Estado se actualiza automáticamente
6. **Registro**: Ambas partes tienen acceso al historial completo

## Características Principales

### Para Proveedores:
- ✅ **Gestión de Catálogos**: Crear, editar y publicar catálogos de productos
- ✅ **Gestión de Productos**: Agregar, editar y eliminar productos de catálogos
- ✅ **Gestión de Pedidos**: Ver solicitudes, aceptar pedidos y actualizar estados
- ✅ **Sistema de Promociones**: Crear códigos promocionales con descuentos
- ✅ **Sistema de Facturación Completo**: 
  - Crear facturas para pedidos completados
  - Gestionar estados de factura (pendiente/pagada)
  - Ver detalles completos de facturas
  - Descargar facturas en PDF (simulado)
  - Eliminar facturas cuando sea necesario
- ✅ **Reportes y Analytics**: Visualizar estadísticas de ventas y rendimiento

### Para Restaurantes:
- ✅ **Listas de Compras**: Crear y gestionar listas de productos necesarios
- ✅ **Explorar Productos**: Buscar y filtrar productos por categoría
- ✅ **Sistema de Carrito**: Agregar productos al carrito de compras
- ✅ **Realizar Pedidos**: Procesar pedidos con información de entrega y pago
- ✅ **Seguimiento de Pedidos**: Monitorear el estado en tiempo real
- ✅ **Sistema de Facturación Completo**:
  - Ver todas las facturas recibidas
  - Filtrar facturas por estado (todas/pendientes/pagadas)
  - Buscar facturas por número, proveedor o pedido
  - Ver detalles completos de facturas
  - Procesar pagos de facturas pendientes
  - Descargar facturas en PDF (simulado)

## Implementación de Persistencia de Datos

### Estado Actual (Demo)
Actualmente, la aplicación utiliza `localStorage` para simular la persistencia de datos. Esto permite demostrar toda la funcionalidad sin necesidad de un backend.

### Migración a Backend Real

Para implementar persistencia real con un archivo JSON o base de datos, sigue estos pasos:

#### 1. Configurar Servidor Backend

```javascript
// Ejemplo con Node.js y Express
const express = require('express');
const fs = require('fs').promises;
const app = express();

// Middleware
app.use(express.json());
app.use(express.static('public')); // Servir archivos estáticos

// Ruta para cargar todos los datos
app.get('/api/data', async (req, res) => {
  try {
    const data = await fs.readFile('./data/data.json', 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).json({ error: 'Error loading data' });
  }
});

// Ruta para guardar datos
app.post('/api/data', async (req, res) => {
  try {
    await fs.writeFile('./data/data.json', JSON.stringify(req.body, null, 2));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error saving data' });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
```

#### 2. Actualizar DataService

Modifica `js/data-service.js` para usar HTTP requests en lugar de localStorage:

```javascript
class DataService {
  constructor() {
    this.apiUrl = '/api'; // URL de tu API
  }

  async loadData() {
    try {
      const response = await fetch(`${this.apiUrl}/data`);
      return await response.json();
    } catch (error) {
      console.error('Error loading data:', error);
      return null;
    }
  }

  async saveData(data) {
    try {
      const response = await fetch(`${this.apiUrl}/data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      console.error('Error saving data:', error);
      return false;
    }
  }

}
```

#### 3. Implementar API Endpoints Específicos

Para mejor rendimiento, implementa endpoints específicos:

```javascript
// Usuarios
app.post('/api/users', createUser);
app.put('/api/users/:id', updateUser);
app.post('/api/auth/login', authenticateUser);

// Catálogos
app.get('/api/catalogs', getCatalogs);
app.post('/api/catalogs', createCatalog);
app.put('/api/catalogs/:id', updateCatalog);
app.delete('/api/catalogs/:id', deleteCatalog);

// Productos
app.get('/api/products', getProducts);
app.post('/api/products', createProduct);
app.put('/api/products/:id', updateProduct);
app.delete('/api/products/:id', deleteProduct);

// Pedidos
app.get('/api/orders', getOrders);
app.post('/api/orders', createOrder);
app.put('/api/orders/:id', updateOrder);

// ... etc para todos los recursos
```

## Usuarios Demo

La aplicación incluye usuarios de demostración:

### Proveedor
- **Email**: `proveedor@demo.com`
- **Contraseña**: `demo123`
- **Tipo**: Provider

### Restaurante
- **Email**: `restaurante@demo.com`
- **Contraseña**: `demo123`
- **Tipo**: Restaurant

## Instalación y Uso

### Modo Demo (Solo Frontend)
1. Clona el repositorio
2. Abre `index.html` en un navegador web
3. Usa las credenciales demo para acceder

### Modo Producción (Con Backend)
1. Implementa el servidor backend siguiendo las instrucciones anteriores
2. Actualiza las URLs de API en `data-service.js`
3. Configura tu base de datos o sistema de archivos
4. Despliega en tu servidor web

## Tecnologías Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Iconos**: Lucide Icons
- **Notificaciones**: Toastr.js
- **Estilos**: CSS Custom Properties (Variables CSS)
- **Persistencia**: localStorage (demo) / JSON files + REST API (producción)

## Características de Seguridad Recomendadas

Para implementación en producción, considera:

1. **Autenticación JWT**: Implementar tokens de autenticación
2. **Validación de Datos**: Validar todos los inputs en el servidor
3. **Sanitización**: Limpiar datos para prevenir XSS
4. **Autorización**: Verificar permisos de usuario en cada endpoint
5. **HTTPS**: Usar conexiones seguras
6. **Rate Limiting**: Implementar límites de requests

## Funcionalidades Futuras

- [ ] Sistema de chat en tiempo real entre proveedores y restaurantes
- [ ] Integración con sistemas de pago (Stripe, PayPal)
- [ ] Notificaciones push para actualizaciones de pedidos
- [ ] Sistema de calificaciones y reseñas
- [ ] API para aplicaciones móviles
- [ ] Dashboard avanzado con más métricas
- [ ] Integración con sistemas de inventario
- [ ] Soporte para múltiples idiomas

## Contribución

Para contribuir al proyecto:

1. Fork del repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crea un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## Soporte

Para preguntas o soporte, contacta:
- Email: soporte@digitalorder.lat
- GitHub Issues: [Crear Issue](https://github.com/almircoo/digitalorderV1/issues)

---

**Nota Importante**: La implementación actual utiliza localStorage para demostración. Para uso en producción, es necesario implementar un backend real siguiendo las instrucciones de este README.
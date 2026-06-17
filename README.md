# Módulo Order — Implementación técnica

## Entidades JPA

Se crearon 6 entidades en `com.gastrosoftware.order.entity` mapeadas directamente desde el schema de `gastro_db`:

**Order** — mapea la tabla `order_table` (el nombre de la tabla difiere de la clase porque `ORDER` es palabra reservada en SQL). Contiene relaciones `@ManyToOne` a `Branch`, `Employee`, `Customer`, `DeliveryPlatform`, `CashRegisterShift`, `RestaurantTable`, `DiscountRule`, `OrderType` y `OrderStatus`. Los campos monetarios `subtotal`, `discountAmount`, `platformCommission` y `total` son `BigDecimal`. Las fechas `createdAt` y `updatedAt` son `LocalDateTime` con `@CreationTimestamp` y `@UpdateTimestamp`. Tiene relación `@OneToMany` a `OrderItem` y `@OneToOne` a `KitchenTicket`.

**OrderItem** — mapea `order_item`. Contiene `@ManyToOne` a `Order`, `Product` y `Recipe`. El campo `unitPrice` es un snapshot del precio al momento de la venta — no apunta al precio actual del producto para preservar integridad histórica.

**OrderType** — mapea `order_type`. Tabla de catálogo con `id`, `name`, `description` y `active`. Reemplaza el ENUM fijo que hubiera limitado los tipos de pedido a los definidos en tiempo de compilación.

**OrderStatus** — mapea `order_status`. Tabla de catálogo con `id`, `name`, `description`, `color` y `sortOrder`. El campo `color` permite al frontend mostrar cada estado con su color correspondiente sin lógica adicional.

**KitchenTicket** — mapea `kitchen_ticket`. Relación `@OneToOne` con `Order`. Tiene tres timestamps: `sentAt` (cuándo llegó el pedido a cocina), `startedAt` (cuándo cocina empezó a preparar) y `completedAt` (cuándo terminó). La diferencia entre estos tres campos permite calcular tiempos de espera y preparación. Relación `@ManyToOne` a `TicketStatus`.

**KitchenTicketItem** — mapea `kitchen_ticket_item`. Cada ítem del ticket tiene su propio `TicketStatus` independiente del ticket padre, permitiendo que un cocinero marque ítems individuales como listos.

**TicketStatus** — mapea `ticket_status`. Tabla de catálogo equivalente a `OrderStatus` pero para el flujo de cocina. Se creó en una segunda iteración porque `KitchenTicket` y `KitchenTicketItem` la referenciaban sin que existiera, causando errores de compilación.

Decisión transversal a todas las entidades — no se usaron enums Java para ningún estado. Todos los estados son entidades relacionadas via FK a tablas de catálogo en la BD. Esto permite que el encargado agregue nuevos estados desde el panel de administración sin tocar código.

---

## Repositorios JPA

Se crearon 6 interfaces en `com.gastrosoftware.order.repository`, todas extendiendo `JpaRepository<Entidad, Long>`.

**OrderRepository** — además de los métodos heredados de JpaRepository, tiene tres métodos de consulta derivados:

- `findByBranchIdAndOrderStatusName` — busca pedidos de una sucursal filtrados por nombre del estado. Usado para obtener pedidos activos o en un estado específico sin escribir JPQL.
- `findByBranchIdAndCreatedAtBetween` — busca pedidos de una sucursal en un rango de fechas. Base para los reportes de ventas por turno o por día.
- `findByCustomerId` — historial de pedidos de un cliente. Usado por el módulo de fidelización para calcular `totalOrders` y `totalSpent`.

**KitchenTicketRepository** — tiene dos métodos adicionales:

- `findByBranchIdAndTicketStatusNameNot` — obtiene todos los tickets de cocina que no están en un estado específico. El caso de uso principal es la pantalla de cocina que muestra todos los tickets que no están en DONE.
- `findByOrderId` — busca el ticket asociado a un pedido. Usado cuando se actualiza el estado de un pedido para sincronizar el ticket correspondiente.

Los otros cuatro repositorios (`OrderItemRepository`, `OrderTypeRepository`, `OrderStatusRepository`, `KitchenTicketItemRepository`) usan solo los métodos heredados de JpaRepository en esta etapa.

---

## OrderService

Implementado en `com.gastrosoftware.order.service` con `@Service` y `@Transactional`. Dependencias inyectadas por constructor.

- **createOrder** — recibe `CreateOrderDTO` con `branchId`, `employeeId`, `customerId` (opcional), `orderTypeId`. Busca cada entidad relacionada por su ID lanzando `ResourceNotFoundException` si no existe. Crea el pedido con status `PENDING`. Retorna `OrderResponseDTO`.

- **addItem** — recibe `orderId` y `AddOrderItemDTO` con `productId`, `recipeId` (opcional) y `quantity`. Guarda `unitPrice` como snapshot del precio actual del producto en ese momento. Tras agregar el ítem recalcula el `subtotal` del pedido sumando todos los ítems y actualiza el `total` aplicando el descuento si existe.

- **updateStatus** — cambia el `OrderStatus` del pedido. Contiene la lógica de negocio más importante del módulo: cuando el nuevo estado es `IN_PROGRESS` publica un evento en RabbitMQ para que el módulo de inventario descuente el stock y se genere el ticket de cocina. Este desacoplamiento permite que el descuento de stock y la notificación a cocina ocurran de forma asíncrona sin bloquear la respuesta al cajero.

- **getOrderById** — retorna `OrderResponseDTO` con la lista de ítems incluida.

- **getActiveOrders** — retorna todos los pedidos de una sucursal que no están en `DELIVERED` ni `CANCELLED`. Usado por la pantalla de cocina y el panel de seguimiento.

- **cancelOrder** — cambia el estado a `CANCELLED`. En una iteración futura deberá revertir el stock descontado si el pedido ya estaba en `IN_PROGRESS`.

---

## OrderController

Implementado en `com.gastrosoftware.order.controller` con `@RestController`, `@RequestMapping("/api/orders")` y `@CrossOrigin` para permitir peticiones desde el frontend React.

Endpoints expuestos:

| Método | Ruta | Descripción | HTTP Status |
|---|---|---|---|
| POST | /api/orders | Crear pedido | 201 CREATED |
| POST | /api/orders/{id}/items | Agregar ítem | 200 OK |
| PUT | /api/orders/{id}/status | Cambiar estado | 200 OK |
| GET | /api/orders/{id} | Obtener pedido | 200 OK |
| GET | /api/orders/branch/{branchId}/active | Pedidos activos | 200 OK |
| DELETE | /api/orders/{id} | Cancelar pedido | 200 OK |

Todas las respuestas están envueltas en `ResponseEntity`. El controller tiene `@ExceptionHandler` para `ResourceNotFoundException` retornando `404 NOT_FOUND`.

---

## Manejo de errores

**ResourceNotFoundException** en `com.gastrosoftware.shared.exception` — extiende `RuntimeException`. Se lanza cuando cualquier búsqueda por ID no encuentra el recurso.

**GlobalExceptionHandler** con `@RestControllerAdvice` maneja tres casos:
- `ResourceNotFoundException` → 404 con mensaje descriptivo
- `MethodArgumentNotValidException` → 400 con lista de campos inválidos
- `Exception` genérica → 500 para errores no controlados

**ApiResponse** en `com.gastrosoftware.shared.response` — clase genérica `ApiResponse<T>` con campos `success`, `message` y `data`. Métodos estáticos `ok(data)`, `ok(message, data)` y `error(message)` estandarizan todas las respuestas de la API.

---

## DTOs creados

| DTO | Campos |
|---|---|
| `CreateOrderDTO` | `branchId`, `employeeId`, `customerId`, `orderTypeId`, `tableId`, `platformId` |
| `AddOrderItemDTO` | `productId`, `recipeId`, `quantity`, `notes` |
| `UpdateOrderStatusDTO` | `statusId` |
| `OrderResponseDTO` | todos los campos de Order + lista de `OrderItemResponseDTO` |
| `OrderItemResponseDTO` | datos del ítem con nombre del producto incluido |



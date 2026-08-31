# Order Processing & Status Management

<cite>
**Referenced Files in This Document**
- [order-badges.ts](file://src/app/(LoggedIn)/order/components/order-badges.ts)
- [types.ts](file://src/app/(LoggedIn)/order/components/types.ts)
- [page.tsx](file://src/app/(LoggedIn)/order/list/page.tsx)
- [order-card.tsx](file://src/app/(LoggedIn)/order/list/components/order-card.tsx)
- [update-status-modal.tsx](file://src/app/(LoggedIn)/order/list/components/update-status-modal.tsx)
- [01-buat-pesanan.mmd](file://diagram/sequence/01-buat-pesanan.mmd)
- [03-update-status-pesanan.mmd](file://diagram/sequence/03-update-status-pesanan.mmd)
- [05-pembayaran-order.mmd](file://diagram/sequence/05-pembayaran-order.mmd)
- [06-buat-spk-produksi.mmd](file://diagram/sequence/06-buat-spk-produksi.mmd)
- [07-update-status-spk.mmd](file://diagram/sequence/07-update-status-spk.mmd)
- [08-penerimaan-barang.mmd](file://diagram/sequence/08-penerimaan-barang.mmd)
- [part2-order-desain.plantuml](file://diagram/class/part2-order-desain.plantuml)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)
10. [Appendices](#appendices)

## Introduction
This document explains the order processing and status management functionality of the POS system. It covers the complete order lifecycle from creation to delivery, including status transitions, visual tracking, approval workflows, and integrations with production and inventory systems. It also documents the order information display, item details management, status change audit trails, typical status sequences, exception handling for status conflicts, and automated status updates driven by business rules.

## Project Structure
The order module is organized around shared components, list views, and modals that manage status updates. Key areas:
- Shared types and status badges for consistent UI and logic
- List page with filtering, sorting, pagination, and order cards
- Order card displays status badges, deadlines, totals, and action buttons
- Update status modal handles status transitions with role-based restrictions and SPK creation flow
- Sequence diagrams illustrate end-to-end workflows for order creation, status updates, payments, SPK creation, and delivery

```mermaid
graph TB
subgraph "Order UI Layer"
LIST["Order List Page<br/>(list/page.tsx)"]
CARD["Order Card<br/>(list/components/order-card.tsx)"]
MODAL["Update Status Modal<br/>(list/components/update-status-modal.tsx)"]
end
subgraph "Shared Utilities"
BADGES["Status Badges<br/>(components/order-badges.ts)"]
TYPES["Types & Constants<br/>(components/types.ts)"]
end
LIST --> CARD
CARD --> MODAL
CARD --> BADGES
MODAL --> BADGES
LIST --> TYPES
CARD --> TYPES
MODAL --> TYPES
```

**Diagram sources**
- [page.tsx:17-136](file://src/app/(LoggedIn)/order/list/page.tsx#L17-L136)
- [order-card.tsx:20-155](file://src/app/(LoggedIn)/order/list/components/order-card.tsx#L20-L155)
- [update-status-modal.tsx:42-295](file://src/app/(LoggedIn)/order/list/components/update-status-modal.tsx#L42-L295)
- [order-badges.ts:11-51](file://src/app/(LoggedIn)/order/components/order-badges.ts#L11-L51)
- [types.ts:3-73](file://src/app/(LoggedIn)/order/components/types.ts#L3-L73)

**Section sources**
- [page.tsx:17-136](file://src/app/(LoggedIn)/order/list/page.tsx#L17-L136)
- [order-card.tsx:20-155](file://src/app/(LoggedIn)/order/list/components/order-card.tsx#L20-L155)
- [update-status-modal.tsx:42-295](file://src/app/(LoggedIn)/order/list/components/update-status-modal.tsx#L42-L295)
- [order-badges.ts:11-51](file://src/app/(LoggedIn)/order/components/order-badges.ts#L11-L51)
- [types.ts:3-73](file://src/app/(LoggedIn)/order/components/types.ts#L3-L73)

## Core Components
- Status badges: Provide consistent label and color mapping for production and payment statuses.
- Types and constants: Define status enums, options, and step sequences used across the UI.
- Order list page: Fetches orders via SWR, supports search, filters, sorting, and pagination.
- Order card: Renders customer info, order number, status chips, deadline, and action buttons.
- Update status modal: Manages status transitions with role-based restrictions, SPK creation flow, and toast feedback.

**Section sources**
- [order-badges.ts:11-51](file://src/app/(LoggedIn)/order/components/order-badges.ts#L11-L51)
- [types.ts:22-73](file://src/app/(LoggedIn)/order/components/types.ts#L22-L73)
- [page.tsx:39-47](file://src/app/(LoggedIn)/order/list/page.tsx#L39-L47)
- [order-card.tsx:26-94](file://src/app/(LoggedIn)/order/list/components/order-card.tsx#L26-L94)
- [update-status-modal.tsx:52-141](file://src/app/(LoggedIn)/order/list/components/update-status-modal.tsx#L52-L141)

## Architecture Overview
The order status management architecture combines frontend UI components with backend API endpoints. The frontend enforces role-based transitions and guides users to appropriate queues (design queue, production queue) for certain status changes. Payment status is updated automatically when payment history is recorded.

```mermaid
sequenceDiagram
participant U as "User"
participant L as "Order List Page"
participant C as "Order Card"
participant M as "Update Status Modal"
participant API as "Order API (/api/order/ : id)"
participant S as "SPK Form Modal"
U->>L : Open Orders List
L->>C : Render Order Cards
U->>C : Click "Status" action
C->>M : Open Update Status Modal
U->>M : Select new Production Status
alt Transition requires SPK creation
M->>S : Open SPK Form Modal
S-->>M : SPK Created
end
U->>M : Save Status
M->>API : PATCH /api/order/ : id (statusProduksi)
API-->>M : Success/Failure
M-->>L : Trigger refresh
L-->>U : Updated order list
```

**Diagram sources**
- [page.tsx:39-47](file://src/app/(LoggedIn)/order/list/page.tsx#L39-L47)
- [order-card.tsx:123-134](file://src/app/(LoggedIn)/order/list/components/order-card.tsx#L123-L134)
- [update-status-modal.tsx:70-111](file://src/app/(LoggedIn)/order/list/components/update-status-modal.tsx#L70-L111)

## Detailed Component Analysis

### Status Badges and Visual Tracking
- Production status badges map internal keys to human-readable labels and colors for Pending, Design, Production, Packing, Completed, and Canceled.
- Payment status badges map to Unpaid, Down Payment, and Paid.
- Channel formatting ensures consistent display across UI.

```mermaid
flowchart TD
A["Input Status Key"] --> B{"Is Production Status?"}
B --> |Yes| C["Map to Label + Color"]
B --> |No| D{"Is Payment Status?"}
D --> |Yes| E["Map to Label + Color"]
D --> |No| F["Return Original Key + Default Color"]
```

**Diagram sources**
- [order-badges.ts:11-39](file://src/app/(LoggedIn)/order/components/order-badges.ts#L11-L39)

**Section sources**
- [order-badges.ts:11-39](file://src/app/(LoggedIn)/order/components/order-badges.ts#L11-L39)

### Order Information Display and Item Details
- The order row type defines fields for order metadata, customer info, counts, SPK presence, and item summaries.
- The order card renders customer avatar, order number, production/payment badges, deadline with overdue indicator, and grand total.
- Mobile layout adapts with a compact summary row.

```mermaid
classDiagram
class OrderRow {
+string id
+string nomorOrder
+string channel
+string statusProduksi
+string statusPembayaran
+string metodePembayaran
+string|null deadline
+string subtotal
+string diskon
+string|null ongkir
+string grandTotal
+string createdAt
+Customer customer
+_count _items
+SPK|null spk
+Item[] items
}
class Customer {
+string id
+string nama
+string nomorHp
+string|null image
}
class Item {
+string nama
+number qty
}
OrderRow --> Customer : "belongsTo"
OrderRow --> Item : "hasMany"
```

**Diagram sources**
- [types.ts:3-20](file://src/app/(LoggedIn)/order/components/types.ts#L3-L20)

**Section sources**
- [types.ts:3-20](file://src/app/(LoggedIn)/order/components/types.ts#L3-L20)
- [order-card.tsx:26-116](file://src/app/(LoggedIn)/order/list/components/order-card.tsx#L26-L116)

### Status Update Workflow and Approval Processes
- The update status modal allows authorized users to select a new production status from predefined steps.
- Role-based restrictions prevent certain transitions (e.g., cashiers cannot mark as Completed; locked statuses require queue navigation).
- Payment dependency: Orders with unpaid status cannot transition to Completed.
- SPK creation flow: Transitioning to Production opens the SPK form modal when no SPK exists.

```mermaid
flowchart TD
Start(["Open Update Status Modal"]) --> Load["Load Current Status + Items"]
Load --> Select{"Select New Status"}
Select --> Locked{"Status Locked?"}
Locked --> |Yes| Hint["Show Lock Reason + Queue Link"]
Locked --> |No| CanProceed{"Cashier Allowed?"}
CanProceed --> |No| Proceed["Allow Change"]
CanProceed --> |Yes| CheckRole{"Selected 'Completed'?"}
CheckRole --> |Yes| Deny["Deny (Admin/Produksi Only)"]
CheckRole --> |No| Proceed
Proceed --> Payment{"Payment Unpaid?"}
Payment --> |Yes| Block["Block Transition"]
Payment --> |No| HasSPK{"Has SPK?"}
HasSPK --> |No| CreateSPK["Open SPK Form Modal"]
HasSPK --> |Yes| Save["PATCH /api/order/:id"]
Save --> Toast["Show Success Toast"]
Toast --> Refresh["Trigger List Refresh"]
Hint --> End(["Close"])
Deny --> End
Block --> End
CreateSPK --> End
Refresh --> End
```

**Diagram sources**
- [update-status-modal.tsx:52-141](file://src/app/(LoggedIn)/order/list/components/update-status-modal.tsx#L52-L141)
- [update-status-modal.tsx:70-111](file://src/app/(LoggedIn)/order/list/components/update-status-modal.tsx#L70-L111)

**Section sources**
- [update-status-modal.tsx:52-141](file://src/app/(LoggedIn)/order/list/components/update-status-modal.tsx#L52-L141)
- [update-status-modal.tsx:117-141](file://src/app/(LoggedIn)/order/list/components/update-status-modal.tsx#L117-L141)

### Automated Status Changes and Integrations
- Payment status updates automatically when payment history is recorded in the order detail page.
- Production and packing statuses are managed via dedicated queues:
  - Design Queue: moves orders from Design to Production after approval.
  - Production Queue (SPK): manages Packing and Completion stages.
- Inventory and production systems integrate indirectly through SPK creation and status progression.

```mermaid
sequenceDiagram
participant Cashier as "Cashier"
participant OrderDetail as "Order Detail Page"
participant API as "Order API"
participant Finance as "Finance Module"
Cashier->>OrderDetail : Add Payment History
OrderDetail->>API : POST Payment
API-->>OrderDetail : Update statusPembayaran
Note over OrderDetail : Payment status auto-updated
```

**Diagram sources**
- [05-pembayaran-order.mmd:1-200](file://diagram/sequence/05-pembayaran-order.mmd#L1-L200)
- [06-buat-spk-produksi.mmd:1-200](file://diagram/sequence/06-buat-spk-produksi.mmd#L1-L200)
- [07-update-status-spk.mmd:1-200](file://diagram/sequence/07-update-status-spk.mmd#L1-L200)

### Typical Status Sequences
Common production status progression:
- Pending → Design → Production → Packing → Completed
- Alternative: Pending → Design → Canceled (if rejected)
- Payment milestones: Unpaid → Down Payment → Paid

```mermaid
stateDiagram-v2
[*] --> Pending
Pending --> Design : "Approved"
Design --> Production : "SPK Created"
Production --> Packing : "Items Ready"
Packing --> Completed : "Delivered"
Pending --> Canceled : "Rejected"
Design --> Canceled : "Rejected"
```

**Diagram sources**
- [types.ts:52-62](file://src/app/(LoggedIn)/order/components/types.ts#L52-L62)

### Exception Handling for Status Conflicts
- Locked statuses (Production, Packing) are inaccessible from the order list modal and must be changed via their respective queues.
- Role restrictions prevent unauthorized transitions (e.g., cashiers cannot mark as Completed).
- Payment dependency blocks completion until payment is recorded.
- Network errors during status save are handled with user-visible toasts.

**Section sources**
- [update-status-modal.tsx:117-141](file://src/app/(LoggedIn)/order/list/components/update-status-modal.tsx#L117-L141)
- [update-status-modal.tsx:84-111](file://src/app/(LoggedIn)/order/list/components/update-status-modal.tsx#L84-L111)

## Dependency Analysis
The order UI components depend on shared types and badge utilities. The list page depends on the order card, which in turn depends on the update status modal and badge helpers. The modal coordinates with the SPK form modal and the backend API.

```mermaid
graph LR
TYPES["types.ts"] --> LIST["list/page.tsx"]
TYPES --> CARD["list/components/order-card.tsx"]
TYPES --> MODAL["list/components/update-status-modal.tsx"]
BADGES["components/order-badges.ts"] --> CARD
BADGES --> MODAL
MODAL --> SPK["order/[id]/components/spk-form-modal.tsx"]
MODAL --> API["/api/order/:id (PATCH)"]
```

**Diagram sources**
- [types.ts:3-73](file://src/app/(LoggedIn)/order/components/types.ts#L3-L73)
- [page.tsx:39-47](file://src/app/(LoggedIn)/order/list/page.tsx#L39-L47)
- [order-card.tsx:26-94](file://src/app/(LoggedIn)/order/list/components/order-card.tsx#L26-L94)
- [update-status-modal.tsx:29, 285-292](file://src/app/(LoggedIn)/order/list/components/update-status-modal.tsx#L29,L285-L292)

**Section sources**
- [types.ts:3-73](file://src/app/(LoggedIn)/order/components/types.ts#L3-L73)
- [page.tsx:39-47](file://src/app/(LoggedIn)/order/list/page.tsx#L39-L47)
- [order-card.tsx:26-94](file://src/app/(LoggedIn)/order/list/components/order-card.tsx#L26-L94)
- [update-status-modal.tsx:29, 285-292](file://src/app/(LoggedIn)/order/list/components/update-status-modal.tsx#L29,L285-L292)

## Performance Considerations
- Client-side filtering and debounced search reduce unnecessary API calls.
- Pagination limits data volume per request.
- SWR caching and optimistic UI updates improve perceived responsiveness.
- Badge rendering is lightweight and computed per render; memoization can be considered if rendering many cards frequently.

## Troubleshooting Guide
- Status not updating: Verify network connectivity and check toast messages for server errors.
- Cannot change status: Confirm role permissions and payment status; ensure the status is not locked by the UI.
- SPK creation blocked: Ensure items exist; the modal opens the SPK form when transitioning to Production without an existing SPK.
- Overdue warnings: Deadline checks compare dates and apply visual indicators for overdue orders.

**Section sources**
- [update-status-modal.tsx:84-111](file://src/app/(LoggedIn)/order/list/components/update-status-modal.tsx#L84-L111)
- [order-card.tsx:37-41](file://src/app/(LoggedIn)/order/list/components/order-card.tsx#L37-L41)

## Conclusion
The order processing and status management system provides a robust, role-aware workflow for managing production and payment statuses. Visual badges and cards offer clear status tracking, while modals enforce business rules and guide users to appropriate queues. Automated payment updates and SPK-driven production transitions streamline end-to-end order fulfillment.

## Appendices

### End-to-End Workflows
- Creating an order and progressing through Design → Production → Packing → Completed
- Recording payments to update payment status
- Creating SPKs to enable Production status
- Updating Packing and Completed statuses via production queues

```mermaid
graph TB
A["Create Order"] --> B["Design Queue<br/>(Approve)"]
B --> C["Production Queue<br/>(Create SPK)"]
C --> D["Packing Queue"]
D --> E["Delivery & Completion"]
A --> F["Payments Recorded"]
F --> G["Auto Update Payment Status"]
```

**Diagram sources**
- [01-buat-pesanan.mmd:1-200](file://diagram/sequence/01-buat-pesanan.mmd#L1-L200)
- [05-pembayaran-order.mmd:1-200](file://diagram/sequence/05-pembayaran-order.mmd#L1-L200)
- [06-buat-spk-produksi.mmd:1-200](file://diagram/sequence/06-buat-spk-produksi.mmd#L1-L200)
- [07-update-status-spk.mmd:1-200](file://diagram/sequence/07-update-status-spk.mmd#L1-L200)
- [08-penerimaan-barang.mmd:1-200](file://diagram/sequence/08-penerimaan-barang.mmd#L1-L200)

### Class Model for Order Domain
```mermaid
classDiagram
class Order {
+string id
+string nomorOrder
+string statusProduksi
+string statusPembayaran
+Customer customer
+OrderItem[] items
+SPK|null spk
}
class Customer {
+string id
+string nama
+string nomorHp
+string|null image
}
class OrderItem {
+string nama
+number qty
}
class SPK {
+string id
+string orderId
}
Order --> Customer : "belongsTo"
Order --> OrderItem : "hasMany"
Order --> SPK : "hasOne"
```

**Diagram sources**
- [part2-order-desain.plantuml:1-200](file://diagram/class/part2-order-desain.plantuml#L1-L200)
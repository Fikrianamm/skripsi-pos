# Multi-Rekening (Multiple Account) Support

<cite>
**Referenced Files in This Document**
- [schema.prisma](file://prisma/schema.prisma)
- [seed-transactions.ts](file://prisma/seed-transactions.ts)
- [route.ts](file://src/app/api/finance/akun/route.ts)
- [route.ts](file://src/app/api/finance/kas-bank/route.ts)
- [finance.ts](file://src/lib/finance.ts)
- [route.ts](file://src/app/api/order/[id]/payment/route.ts)
- [route.ts](file://src/app/api/finance/piutang/route.ts)
- [page.tsx](file://src/app/(LoggedIn)/reports/piutang/page.tsx)
- [route.ts](file://src/app/api/reports/finance/neraca/route.ts)
- [page.tsx](file://src/app/(LoggedIn)/reports/neraca/page.tsx)
- [route.ts](file://src/app/api/reports/finance/tabungan/route.ts)
- [akun-modal.tsx](file://src/app/(LoggedIn)/finance/akun/components/akun-modal.tsx)
- [akun-table.tsx](file://src/app/(LoggedIn)/finance/akun/components/akun-table.tsx)
- [part4-keuangan.plantuml](file://diagram/class/part4-keuangan.plantuml)
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
This document explains the multi-rekening (multiple account) support system implemented in the application. It covers how customer and supplier accounts are managed, how receivables and payables are tracked across multiple accounts, and how journal entries are recorded against chart of accounts and bank/cash accounts. It also documents account allocation mechanisms, payment distribution algorithms, reconciliation processes, aging analysis, credit limits, inter-company transactions, consolidated reporting, and integrations with order processing and payment collection.

## Project Structure
The multi-account system spans several layers:
- Data model layer (Prisma schema) defines accounts, journals, cash/bank accounts, orders, payments, and suppliers/customers.
- API routes implement CRUD and transactional operations for chart of accounts, cash/bank accounts, payments, receivables, and reports.
- Frontend components manage account creation/editing and display receivable reports.
- Finance utilities encapsulate double-entry journal creation.
- Seed scripts demonstrate typical allocations to savings accounts and supplier payment flows.

```mermaid
graph TB
subgraph "Data Model (Prisma)"
Akun["Akun<br/>Chart of Accounts"]
KasBank["KasBank<br/>Cash/Bank Accounts"]
Jurnal["JurnalUmum<br/>General Ledger"]
Order["Order"]
Payment["Payment"]
Customer["Customer"]
Supplier["Supplier"]
end
subgraph "API Layer"
AkunRoute["/api/finance/akun"]
KasBankRoute["/api/finance/kas-bank"]
PaymentRoute["/api/order/[id]/payment"]
PiutangRoute["/api/finance/piutang"]
NeracaRoute["/api/reports/finance/neraca"]
TabunganRoute["/api/reports/finance/tabungan"]
end
subgraph "Frontend"
AkunModal["AkunModal"]
AkunTable["AkunTable"]
PiutangReport["Piutang Report Page"]
end
subgraph "Finance Utils"
FinanceUtil["createJurnalDoubleEntry"]
end
Customer --> Order
Order --> Payment
Payment --> Jurnal
Payment --> KasBank
KasBank --> Akun
Jurnal --> Akun
FinanceUtil --> Jurnal
AkunRoute --> Akun
KasBankRoute --> KasBank
PaymentRoute --> Payment
PiutangRoute --> Order
NeracaRoute --> Jurnal
TabunganRoute --> Jurnal
AkunModal --> AkunRoute
AkunTable --> AkunRoute
PiutangReport --> PiutangRoute
```

**Diagram sources**
- [schema.prisma](file://prisma/schema.prisma)
- [route.ts](file://src/app/api/finance/akun/route.ts)
- [route.ts](file://src/app/api/finance/kas-bank/route.ts)
- [finance.ts](file://src/lib/finance.ts)
- [route.ts](file://src/app/api/order/[id]/payment/route.ts)
- [route.ts](file://src/app/api/finance/piutang/route.ts)
- [route.ts](file://src/app/api/reports/finance/neraca/route.ts)
- [route.ts](file://src/app/api/reports/finance/tabungan/route.ts)
- [akun-modal.tsx](file://src/app/(LoggedIn)/finance/akun/components/akun-modal.tsx)
- [akun-table.tsx](file://src/app/(LoggedIn)/finance/akun/components/akun-table.tsx)

**Section sources**
- [schema.prisma](file://prisma/schema.prisma)
- [route.ts](file://src/app/api/finance/akun/route.ts)
- [route.ts](file://src/app/api/finance/kas-bank/route.ts)
- [finance.ts](file://src/lib/finance.ts)
- [route.ts](file://src/app/api/order/[id]/payment/route.ts)
- [route.ts](file://src/app/api/finance/piutang/route.ts)
- [route.ts](file://src/app/api/reports/finance/neraca/route.ts)
- [route.ts](file://src/app/api/reports/finance/tabungan/route.ts)
- [akun-modal.tsx](file://src/app/(LoggedIn)/finance/akun/components/akun-modal.tsx)
- [akun-table.tsx](file://src/app/(LoggedIn)/finance/akun/components/akun-table.tsx)

## Core Components
- Chart of Accounts (Akun): Defines account codes, groups, and normal positions for balance calculations.
- Cash/Bank Accounts (KasBank): Links to a chart of accounts and aggregates balances via journal entries.
- General Journal (JurnalUmum): Double-entry records linking debits/credits to accounts.
- Payments (Payment): Records cash/bank inflows/outflows against orders and links to journals.
- Receivables (Piutang): Tracks unpaid and partial payments per order/customer.
- Reports: Balance sheet, receivable summary, and savings aggregation.

Key implementation references:
- Account CRUD and auto-code generation: [route.ts](file://src/app/api/finance/akun/route.ts)
- Cash/bank listing with computed balances: [route.ts](file://src/app/api/finance/kas-bank/route.ts)
- Payment recording and journal creation: [route.ts](file://src/app/api/order/[id]/payment/route.ts)
- Receivable listing and aging: [route.ts](file://src/app/api/finance/piutang/route.ts), [page.tsx](file://src/app/(LoggedIn)/reports/piutang/page.tsx)
- Balance sheet and normal position handling: [route.ts](file://src/app/api/reports/finance/neraca/route.ts), [page.tsx](file://src/app/(LoggedIn)/reports/neraca/page.tsx)
- Savings aggregation: [route.ts](file://src/app/api/reports/finance/tabungan/route.ts)
- Journal utility: [finance.ts](file://src/lib/finance.ts)

**Section sources**
- [route.ts](file://src/app/api/finance/akun/route.ts)
- [route.ts](file://src/app/api/finance/kas-bank/route.ts)
- [finance.ts](file://src/lib/finance.ts)
- [route.ts](file://src/app/api/order/[id]/payment/route.ts)
- [route.ts](file://src/app/api/finance/piutang/route.ts)
- [page.tsx](file://src/app/(LoggedIn)/reports/piutang/page.tsx)
- [route.ts](file://src/app/api/reports/finance/neraca/route.ts)
- [page.tsx](file://src/app/(LoggedIn)/reports/neraca/page.tsx)
- [route.ts](file://src/app/api/reports/finance/tabungan/route.ts)

## Architecture Overview
The system follows a double-entry bookkeeping architecture:
- Orders generate Receivables (debit accounts like “Accounts Receivable”).
- Payments allocate to Cash/Bank (credit accounts like “Accounts Receivable”) and update order status.
- Journal entries are created automatically for each payment.
- Cash/Bank balances are derived from journal totals per account.
- Reports compute totals by normal positions and groupings.

```mermaid
sequenceDiagram
participant Client as "Client"
participant OrderAPI as "Order Payment Route"
participant DB as "Prisma ORM"
participant Journal as "createJurnalDoubleEntry"
participant GL as "JurnalUmum"
Client->>OrderAPI : POST /api/order/{id}/payment
OrderAPI->>DB : Fetch Order + Payments
OrderAPI->>DB : Validate kasBankId + Account linkage
OrderAPI->>DB : Create Payment
OrderAPI->>DB : Update Order status
OrderAPI->>Journal : createJurnalDoubleEntry(...)
Journal->>GL : Insert Debit/Credit rows
GL-->>OrderAPI : Success
OrderAPI-->>Client : {message, payment, status}
```

**Diagram sources**
- [route.ts](file://src/app/api/order/[id]/payment/route.ts)
- [finance.ts](file://src/lib/finance.ts)

**Section sources**
- [route.ts](file://src/app/api/order/[id]/payment/route.ts)
- [finance.ts](file://src/lib/finance.ts)

## Detailed Component Analysis

### Chart of Accounts Management
- Auto-generates account codes by group prefix.
- Creates linked Cash/Bank records optionally during account creation.
- Updates Cash/Bank names when account names change.

```mermaid
flowchart TD
Start([Create/Edit Account]) --> Validate["Validate Required Fields"]
Validate --> |Invalid| Error["Return Validation Error"]
Validate --> |Valid| GenerateCode["Generate Code by Group Prefix"]
GenerateCode --> Save["Save Akun"]
Save --> MaybeKasBank{"Create KasBank?"}
MaybeKasBank --> |Yes| CreateKB["Create KasBank Linked to Akun"]
MaybeKasBank --> |No| Done([Done])
CreateKB --> Done
```

**Diagram sources**
- [route.ts](file://src/app/api/finance/akun/route.ts)

**Section sources**
- [route.ts](file://src/app/api/finance/akun/route.ts)
- [akun-modal.tsx](file://src/app/(LoggedIn)/finance/akun/components/akun-modal.tsx)
- [akun-table.tsx](file://src/app/(LoggedIn)/finance/akun/components/akun-table.tsx)

### Cash/Bank Account Balancing
- Lists all cash/bank accounts with computed balances by summing debits and credits from journals.
- Assumes asset accounts are normally debited; balance = total debet − total kredit.

```mermaid
flowchart TD
List([GET /api/finance/kas-bank]) --> Filter["Optional Type Filter"]
Filter --> Compute["For Each KasBank: Sum Debits + Sums Credits"]
Compute --> Balance["Balance = Sum Debet − Sum Kredit"]
Balance --> Return["Return KasBank With Saldo"]
```

**Diagram sources**
- [route.ts](file://src/app/api/finance/kas-bank/route.ts)

**Section sources**
- [route.ts](file://src/app/api/finance/kas-bank/route.ts)

### Payment Distribution and Journal Creation
- Validates payment amount vs. outstanding invoice.
- Allocates to the selected Cash/Bank account’s linked Chart of Accounts.
- Generates double-entry journal: Debit Cash/Bank, Credit Receivable.
- Updates order payment status (Unpaid, Down Payment, Paid).

```mermaid
sequenceDiagram
participant Client as "Client"
participant PayRoute as "POST /api/order/{id}/payment"
participant DB as "Prisma"
participant Util as "createJurnalDoubleEntry"
participant GL as "JurnalUmum"
Client->>PayRoute : Submit Payment (nominal, kasBankId, date)
PayRoute->>DB : Load Order + Payments
PayRoute->>DB : Validate kasBankId -> Akun
PayRoute->>DB : Create Payment
PayRoute->>DB : Update Order status
PayRoute->>Util : createJurnalDoubleEntry(ref, tanggal, akunDebetId, akunKreditId, nominal)
Util->>GL : Insert Debit row
Util->>GL : Insert Credit row
GL-->>PayRoute : Success
PayRoute-->>Client : {message, payment, status}
```

**Diagram sources**
- [route.ts](file://src/app/api/order/[id]/payment/route.ts)
- [finance.ts](file://src/lib/finance.ts)

**Section sources**
- [route.ts](file://src/app/api/order/[id]/payment/route.ts)
- [finance.ts](file://src/lib/finance.ts)

### Receivable Tracking and Aging
- Receivable list filters by unpaid and down-payment statuses.
- Computes paid and remaining amounts per order.
- Frontend report displays aging buckets (e.g., current, overdue).

```mermaid
flowchart TD
Fetch([GET /api/finance/piutang]) --> Filters["Apply Status + Search Filters"]
Filters --> Paginate["Paginate Results"]
Paginate --> Compute["For Each Order: Sum Payments -> Remaining"]
Compute --> Return["Return Orders with Sisa Tagihan"]
```

**Diagram sources**
- [route.ts](file://src/app/api/finance/piutang/route.ts)
- [page.tsx](file://src/app/(LoggedIn)/reports/piutang/page.tsx)

**Section sources**
- [route.ts](file://src/app/api/finance/piutang/route.ts)
- [page.tsx](file://src/app/(LoggedIn)/reports/piutang/page.tsx)

### Balance Sheet and Normal Position Handling
- Aggregates journal totals by account and applies normal position rules to compute group balances.
- Groups accounts by classification (e.g., Current Assets, Liabilities, Equity, Income, Expenses).
- Ensures balance sheet equality (Assets = Liabilities + Equity).

```mermaid
flowchart TD
Read([GET /api/reports/finance/neraca]) --> SumDebet["Sum Debet per Akun"]
Read --> SumKredit["Sum Kredit per Akun"]
SumDebet --> ApplyNormal["Apply Normal Position Rule"]
SumKredit --> ApplyNormal
ApplyNormal --> Group["Group by Kelompok"]
Group --> Totals["Compute Totals per Group"]
Totals --> Validate["Validate Balance (Aktiva vs Pasiva)"]
```

**Diagram sources**
- [route.ts](file://src/app/api/reports/finance/neraca/route.ts)
- [page.tsx](file://src/app/(LoggedIn)/reports/neraca/page.tsx)

**Section sources**
- [route.ts](file://src/app/api/reports/finance/neraca/route.ts)
- [page.tsx](file://src/app/(LoggedIn)/reports/neraca/page.tsx)

### Savings (Tabungan) Allocation Reporting
- Aggregates journal entries for accounts whose names contain “Tabungan”.
- Sums by month for trend analysis.

```mermaid
flowchart TD
Get([GET /api/reports/finance/tabungan]) --> Find["Find Active Accounts with Name 'Tabungan'"]
Find --> Range["Filter Journals by Year"]
Range --> Group["Group by Account"]
Group --> Monthly["Aggregate by Month"]
Monthly --> Return["Return Totals"]
```

**Diagram sources**
- [route.ts](file://src/app/api/reports/finance/tabungan/route.ts)

**Section sources**
- [route.ts](file://src/app/api/reports/finance/tabungan/route.ts)

### Supplier Payment and Inter-Company Transactions
- Supplier purchases create journal entries: Debit expense (e.g., Cost of Goods Sold), Credit Accounts Payable.
- Periodic supplier payments reverse Accounts Payable (Debit) and Cash/Bank (Credit).
- Savings allocations demonstrate multi-account transfers from Cash/Bank to multiple “Tabungan” accounts.

```mermaid
sequenceDiagram
participant Proc as "Procurement"
participant GL as "JurnalUmum"
Proc->>GL : Debit HPP / Expense, Credit Accounts Payable
Proc->>GL : Debit Accounts Payable, Credit Cash/Bank (Payment)
```

**Diagram sources**
- [seed-transactions.ts](file://prisma/seed-transactions.ts)

**Section sources**
- [seed-transactions.ts](file://prisma/seed-transactions.ts)

### Credit Limit Management
- Credit limits are not modeled in the current schema. Receivable aging and outstanding balances can be used to assess risk and inform credit decisions externally to the system.

[No sources needed since this section provides general guidance]

### Consolidation and Transfer Capabilities
- Consolidation: Use report endpoints to aggregate by account grouping and normal positions for consolidated views.
- Transfers: Multi-account transfers can be modeled as journal entries moving funds between Cash/Bank accounts while maintaining double-entry integrity.

[No sources needed since this section provides general guidance]

### Practical Examples
- Large customer multi-account setup: Create separate Cash/Bank accounts per customer segment and allocate revenue to a receivable account per segment. Track receivables per segment via the receivable report.
- Inter-company transactions: Use expense and payable accounts to record transfers between legal entities; reconcile via journal entries and reports.
- Consolidated reporting: Use the balance sheet endpoint to produce consolidated statements by normal positions and account groups.

[No sources needed since this section provides general guidance]

## Dependency Analysis
The following diagram maps core dependencies among modules:

```mermaid
graph LR
AkunRoute["/api/finance/akun"] --> AkunModel["Akun (Prisma)"]
KasBankRoute["/api/finance/kas-bank"] --> KasBankModel["KasBank (Prisma)"]
PaymentRoute["/api/order/[id]/payment"] --> PaymentModel["Payment (Prisma)"]
PaymentRoute --> JournalUtil["createJurnalDoubleEntry"]
JournalUtil --> JournalModel["JurnalUmum (Prisma)"]
JournalModel --> AkunModel
JournalModel --> KasBankModel
PiutangRoute["/api/finance/piutang"] --> OrderModel["Order (Prisma)"]
PiutangRoute --> PaymentModel
NeracaRoute["/api/reports/finance/neraca"] --> JournalModel
TabunganRoute["/api/reports/finance/tabungan"] --> JournalModel
```

**Diagram sources**
- [route.ts](file://src/app/api/finance/akun/route.ts)
- [route.ts](file://src/app/api/finance/kas-bank/route.ts)
- [finance.ts](file://src/lib/finance.ts)
- [route.ts](file://src/app/api/order/[id]/payment/route.ts)
- [route.ts](file://src/app/api/finance/piutang/route.ts)
- [route.ts](file://src/app/api/reports/finance/neraca/route.ts)
- [route.ts](file://src/app/api/reports/finance/tabungan/route.ts)
- [schema.prisma](file://prisma/schema.prisma)

**Section sources**
- [schema.prisma](file://prisma/schema.prisma)
- [route.ts](file://src/app/api/finance/akun/route.ts)
- [route.ts](file://src/app/api/finance/kas-bank/route.ts)
- [finance.ts](file://src/lib/finance.ts)
- [route.ts](file://src/app/api/order/[id]/payment/route.ts)
- [route.ts](file://src/app/api/finance/piutang/route.ts)
- [route.ts](file://src/app/api/reports/finance/neraca/route.ts)
- [route.ts](file://src/app/api/reports/finance/tabungan/route.ts)

## Performance Considerations
- Prefer indexed fields (e.g., account codes, journal dates) for fast filtering and aggregation.
- Batch report queries using pagination and selective field selection.
- Use aggregated queries (sums) instead of scanning entire journal tables when computing balances.
- Cache frequently accessed account lists and cash/bank balances.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- Unauthorized or forbidden access to endpoints: Verify user roles and session checks in API routes.
- Payment exceeds outstanding amount: The payment route validates remaining balance and rejects overpayments.
- Missing linked account on Cash/Bank: Ensure the Cash/Bank record has a valid account linkage before posting payments.
- Reconciling balances: Use the Cash/Bank endpoint to compute balances from journals; verify normal position rules in reports.

**Section sources**
- [route.ts](file://src/app/api/order/[id]/payment/route.ts)
- [route.ts](file://src/app/api/finance/kas-bank/route.ts)
- [route.ts](file://src/app/api/finance/akun/route.ts)

## Conclusion
The multi-rekening system leverages a robust chart of accounts, cash/bank linkage, and automatic double-entry journaling to support multi-account receivable/payable tracking, aging analysis, and consolidated reporting. While credit limits are not currently modeled, the system provides strong primitives for modeling inter-company transfers, savings allocations, and reconciliations.

## Appendices
- Class relationships for financial entities:

```mermaid
classDiagram
class Akun {
+id : String
+kodeAkun : String
+namaAkun : String
+kelompok : String
+posisiNormal : String
+isActive : Boolean
}
class KasBank {
+id : String
+namaRekening : String
+jenisRekening : String
+nomorRekening : String
+isActive : Boolean
+akunId : String
}
class JurnalUmum {
+id : String
+ref : String
+tanggal : Date
+namaBiaya : String
+nominal : Decimal
+akunDebetId : String
+akunKreditId : String
}
class Payment {
+id : String
+orderId : String
+userId : String
+nominal : Decimal
+metodePembayaran : String
+tanggal : Date
+keterangan : String
}
class Order {
+id : String
+grandTotal : Decimal
+statusPembayaran : String
}
Akun <|-- KasBank : "linked via akunId"
JurnalUmum --> Akun : "debet"
JurnalUmum --> Akun : "kredit"
Payment --> JurnalUmum : "generates"
Order --> Payment : "has many"
```

**Diagram sources**
- [schema.prisma](file://prisma/schema.prisma)
- [part4-keuangan.plantuml](file://diagram/class/part4-keuangan.plantuml)
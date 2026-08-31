# Financial Accounting System

<cite>
**Referenced Files in This Document**
- [schema.prisma](file://prisma/schema.prisma)
- [finance.ts](file://src/lib/finance.ts)
- [akun/route.ts](file://src/app/api/finance/akun/route.ts)
- [jurnal/route.ts](file://src/app/api/finance/jurnal/route.ts)
- [kas-bank/route.ts](file://src/app/api/finance/kas-bank/route.ts)
- [dashboard/route.ts](file://src/app/api/finance/dashboard/route.ts)
- [cost/route.ts](file://src/app/api/reports/finance/cost/route.ts)
- [laba-rugi/route.ts](file://src/app/api/reports/finance/laba-rugi/route.ts)
- [neraca/route.ts](file://src/app/api/reports/finance/neraca/route.ts)
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
This document describes the financial accounting system built into the POS application. It covers chart of accounts management, journal entry processing, financial reporting, and multi-rekening (multiple bank and cash accounts) support. It explains how accounting principles are implemented, how automated journal entries are triggered by business events, how financial statements are generated, and how receivables/payables are tracked. It also documents integration points with order processing, inventory changes, and production costs, along with dashboards, budget tracking, and variance analysis capabilities.

## Project Structure
The financial domain is implemented with:
- Prisma schema defining financial entities (accounts, journals, cash/bank accounts, settings)
- API routes for CRUD and queries on financial data
- Utility library for double-entry journal creation
- Report endpoints for profit & loss, balance sheet, and cost center allocation
- Dashboard endpoint aggregating financial KPIs and trends

```mermaid
graph TB
subgraph "Financial Entities (Prisma)"
AK["Akun<br/>Chart of Accounts"]
JU["JurnalUmum<br/>General Journal"]
KB["KasBank<br/>Cash/Bank Accounts"]
PS["AppSetting<br/>System Settings"]
end
subgraph "API Routes"
AKR["GET/PATCH /api/finance/akun"]
JUR["GET/POST/DELETE /api/finance/jurnal"]
KBR["GET/PATCH /api/finance/kas-bank"]
DSH["GET /api/finance/dashboard"]
RPT_COST["GET /api/reports/finance/cost"]
RPT_LR["GET /api/reports/finance/laba-rugi"]
RPT_NER["GET /api/reports/finance/neraca"]
end
subgraph "Libraries"
LIB_F["createJurnalDoubleEntry()<br/>finance.ts"]
end
AK --- JU
KB --- AK
PS --- AK
LIB_F --> JU
AKR --> AK
JUR --> JU
KBR --> KB
DSH --> JU
RPT_COST --> JU
RPT_LR --> JU
RPT_NER --> JU
```

**Diagram sources**
- [schema.prisma](file://prisma/schema.prisma)
- [finance.ts](file://src/lib/finance.ts)
- [akun/route.ts](file://src/app/api/finance/akun/route.ts)
- [jurnal/route.ts](file://src/app/api/finance/jurnal/route.ts)
- [kas-bank/route.ts](file://src/app/api/finance/kas-bank/route.ts)
- [dashboard/route.ts](file://src/app/api/finance/dashboard/route.ts)
- [cost/route.ts](file://src/app/api/reports/finance/cost/route.ts)
- [laba-rugi/route.ts](file://src/app/api/reports/finance/laba-rugi/route.ts)
- [neraca/route.ts](file://src/app/api/reports/finance/neraca/route.ts)

**Section sources**
- [schema.prisma](file://prisma/schema.prisma)
- [finance.ts](file://src/lib/finance.ts)
- [akun/route.ts](file://src/app/api/finance/akun/route.ts)
- [jurnal/route.ts](file://src/app/api/finance/jurnal/route.ts)
- [kas-bank/route.ts](file://src/app/api/finance/kas-bank/route.ts)
- [dashboard/route.ts](file://src/app/api/finance/dashboard/route.ts)
- [cost/route.ts](file://src/app/api/reports/finance/cost/route.ts)
- [laba-rugi/route.ts](file://src/app/api/reports/finance/laba-rugi/route.ts)
- [neraca/route.ts](file://src/app/api/reports/finance/neraca/route.ts)

## Core Components
- Chart of Accounts (Akun): Defines account codes, groupings, and normal positions for balance sheet treatment.
- General Journal (JurnalUmum): Central double-entry posting engine with references, supporting documents, and links to business events.
- Cash/Bank Accounts (KasBank): Multiple rekening mapped to ledger accounts for cash flow tracking.
- System Settings (AppSetting): Stores company info, prefixes, and default revenue account for automatic postings.
- Finance Utilities: Double-entry creation helper for consistent journal entries.

Key responsibilities:
- Account classification and numbering scheme aligned with balance sheet groups
- Automated journal entries from payments and inventory receipts
- Real-time cash account balances derived from journal activity
- Financial statements via aggregated journal data

**Section sources**
- [schema.prisma](file://prisma/schema.prisma)
- [finance.ts](file://src/lib/finance.ts)
- [akun/route.ts](file://src/app/api/finance/akun/route.ts)
- [jurnal/route.ts](file://src/app/api/finance/jurnal/route.ts)
- [kas-bank/route.ts](file://src/app/api/finance/kas-bank/route.ts)
- [dashboard/route.ts](file://src/app/api/finance/dashboard/route.ts)
- [laba-rugi/route.ts](file://src/app/api/reports/finance/laba-rugi/route.ts)
- [neraca/route.ts](file://src/app/api/reports/finance/neraca/route.ts)
- [cost/route.ts](file://src/app/api/reports/finance/cost/route.ts)

## Architecture Overview
The system follows a layered architecture:
- Data Access: Prisma ORM models define entities and relations
- Business Logic: API routes orchestrate operations and enforce authorization
- Reporting: Dedicated endpoints compute aggregates for financial statements
- UI Integration: Front-end pages consume these APIs for charts, tables, and forms

```mermaid
graph TB
UI["UI Pages<br/>Finance/Akun, Finance/Jurnal, Reports, Dashboard"]
API_AK["/api/finance/akun"]
API_JU["/api/finance/jurnal"]
API_KB["/api/finance/kas-bank"]
API_DSH["/api/finance/dashboard"]
API_RPT_COST["/api/reports/finance/cost"]
API_RPT_LR["/api/reports/finance/laba-rugi"]
API_RPT_NER["/api/reports/finance/neraca"]
DB["Prisma Models<br/>Akun, JurnalUmum, KasBank, AppSetting"]
UI --> API_AK
UI --> API_JU
UI --> API_KB
UI --> API_DSH
UI --> API_RPT_COST
UI --> API_RPT_LR
UI --> API_RPT_NER
API_AK --> DB
API_JU --> DB
API_KB --> DB
API_DSH --> DB
API_RPT_COST --> DB
API_RPT_LR --> DB
API_RPT_NER --> DB
```

**Diagram sources**
- [schema.prisma](file://prisma/schema.prisma)
- [akun/route.ts](file://src/app/api/finance/akun/route.ts)
- [jurnal/route.ts](file://src/app/api/finance/jurnal/route.ts)
- [kas-bank/route.ts](file://src/app/api/finance/kas-bank/route.ts)
- [dashboard/route.ts](file://src/app/api/finance/dashboard/route.ts)
- [cost/route.ts](file://src/app/api/reports/finance/cost/route.ts)
- [laba-rugi/route.ts](file://src/app/api/reports/finance/laba-rugi/route.ts)
- [neraca/route.ts](file://src/app/api/reports/finance/neraca/route.ts)

## Detailed Component Analysis

### Chart of Accounts Management
- Purpose: Maintain standardized account codes, groupings, and normal positions for balance sheet alignment.
- Features:
  - Auto-numbering by account group prefix
  - Optional automatic creation of a linked cash/bank account
  - Bulk filtering by search, group, and active status
  - Synchronized rekening name updates when account name changes

```mermaid
classDiagram
class Akun {
+string id
+string kodeAkun
+string namaAkun
+string kelompok
+PosisiNormal posisiNormal
+boolean isActive
}
class KasBank {
+string id
+string namaRekening
+string jenisRekening
+string nomorRekening
+string akunId
+boolean isActive
}
Akun <.. KasBank : "linked via akunId"
```

**Diagram sources**
- [schema.prisma](file://prisma/schema.prisma)
- [akun/route.ts](file://src/app/api/finance/akun/route.ts)
- [kas-bank/route.ts](file://src/app/api/finance/kas-bank/route.ts)

**Section sources**
- [schema.prisma](file://prisma/schema.prisma)
- [akun/route.ts](file://src/app/api/finance/akun/route.ts)
- [kas-bank/route.ts](file://src/app/api/finance/kas-bank/route.ts)

### Journal Entry Processing
- Purpose: Centralized double-entry posting for all financial transactions.
- Features:
  - Manual entries with reversal support
  - Soft deletion cascading to related records
  - Filtering by date range, search terms, and account groups
  - Automatic posting references and optional supporting documents

```mermaid
sequenceDiagram
participant UI as "Client UI"
participant API as "/api/finance/jurnal"
participant UTIL as "createJurnalDoubleEntry()"
participant DB as "Prisma JurnalUmum"
UI->>API : POST {tanggal, akunDebetId, akunKreditId, nominal, namaBiaya,...}
API->>UTIL : createJurnalDoubleEntry(input)
UTIL->>DB : insert two rows (debet+kredit)
DB-->>UTIL : created entries
UTIL-->>API : journal record
API-->>UI : {message, jurnal}
```

**Diagram sources**
- [jurnal/route.ts](file://src/app/api/finance/jurnal/route.ts)
- [finance.ts](file://src/lib/finance.ts)
- [schema.prisma](file://prisma/schema.prisma)

**Section sources**
- [jurnal/route.ts](file://src/app/api/finance/jurnal/route.ts)
- [finance.ts](file://src/lib/finance.ts)
- [schema.prisma](file://prisma/schema.prisma)

### Multi-Rekening (Cash/Bank Accounts)
- Purpose: Track multiple bank and cash accounts with real-time balances.
- Features:
  - List filtered by account type
  - Compute current balance by summing debet and kredit for each linked ledger account
  - Update account metadata (name, type, number, active flag)

```mermaid
flowchart TD
Start(["GET /api/finance/kas-bank"]) --> Filter["Apply jenisRekening filter"]
Filter --> LoadKB["Load KasBank list"]
LoadKB --> ForEach["For each KasBank with akunId"]
ForEach --> SumDebet["Aggregate JurnalUmum.debet nominal"]
ForEach --> SumKredit["Aggregate JurnalUmum.kredit nominal"]
SumDebet --> Calc["saldoSaatIni = totalDebet - totalKredit"]
SumKredit --> Calc
Calc --> Return["Return kasBanksWithBalance"]
```

**Diagram sources**
- [kas-bank/route.ts](file://src/app/api/finance/kas-bank/route.ts)
- [schema.prisma](file://prisma/schema.prisma)

**Section sources**
- [kas-bank/route.ts](file://src/app/api/finance/kas-bank/route.ts)
- [schema.prisma](file://prisma/schema.prisma)

### Automated Journal Entries
- Payments: Each payment generates two journal rows (income account vs customer account or cash).
- Inventory Receipts: Purchase receipts generate entries linking to supplier accounts and inventory accounts.
- Production Costs: Cost entries can be posted to expense accounts, later aggregated for cost center reporting.

```mermaid
sequenceDiagram
participant PAY as "Payment"
participant API as "/api/finance/jurnal"
participant UTIL as "createJurnalDoubleEntry()"
participant DB as "JurnalUmum"
PAY->>API : Trigger posting after payment recorded
API->>UTIL : createJurnalDoubleEntry({akunDebetId, akunKreditId, nominal, paymentId})
UTIL->>DB : insert debet row
UTIL->>DB : insert kredit row
DB-->>API : posted entries
```

**Diagram sources**
- [jurnal/route.ts](file://src/app/api/finance/jurnal/route.ts)
- [finance.ts](file://src/lib/finance.ts)
- [schema.prisma](file://prisma/schema.prisma)

**Section sources**
- [schema.prisma](file://prisma/schema.prisma)
- [jurnal/route.ts](file://src/app/api/finance/jurnal/route.ts)
- [finance.ts](file://src/lib/finance.ts)

### Financial Statement Generation
- Profit & Loss (Income Statement):
  - Aggregates by account group (Pendapatan increases on credit; Beban increases on debit)
  - Computes totals and margin percentage
- Balance Sheet:
  - Accumulates journals up to a given period
  - Groups by asset/liability/equity and computes totals
  - Validates equality with rounding tolerance

```mermaid
flowchart TD
A["Select Period (bulan, tahun)"] --> B["Load Active Accounts (Pendapatan, Beban)"]
B --> C["Fetch JurnalUmum within period"]
C --> D["For each journal:<br/>+ Pendapatan on KREDIT<br/>- Pendapatan on DEBET<br/>+ Beban on DEBET<br/>- Beban on KREDIT"]
D --> E["Compute totals per account"]
E --> F["Sum totals and derive KPIs"]
F --> G["Return P&L data"]
```

**Diagram sources**
- [laba-rugi/route.ts](file://src/app/api/reports/finance/laba-rugi/route.ts)
- [schema.prisma](file://prisma/schema.prisma)

**Section sources**
- [laba-rugi/route.ts](file://src/app/api/reports/finance/laba-rugi/route.ts)
- [neraca/route.ts](file://src/app/api/reports/finance/neraca/route.ts)
- [schema.prisma](file://prisma/schema.prisma)

### Receivable/Payable Tracking
- Receivables:
  - Orders with unpaid status accumulate outstanding amounts
  - Dashboard computes total receivables by subtracting payments from order totals
- Payables:
  - Inventory receipts link to supplier accounts; future payable tracking can be implemented similarly

```mermaid
flowchart TD
O["Orders with unpaid status"] --> P["Payments per order"]
P --> S["Sum paid per order"]
S --> T["Outstanding = grandTotal - sum(payments)"]
T --> SUM["Total Receivables"]
```

**Diagram sources**
- [dashboard/route.ts](file://src/app/api/finance/dashboard/route.ts)
- [schema.prisma](file://prisma/schema.prisma)

**Section sources**
- [dashboard/route.ts](file://src/app/api/finance/dashboard/route.ts)
- [schema.prisma](file://prisma/schema.prisma)

### Cost Center and Variance Analysis
- Cost Allocation:
  - Monthly cost report groups expenses by expense account
- Variance Analysis:
  - Dashboard compares monthly and yearly aggregates against previous periods
  - Provides trend indicators for revenue, expenses, and net profit

```mermaid
flowchart TD
J["Fetch JurnalUmum (BEBAN_USAHA)"] --> G["Group by akunDebet (expense)"]
G --> T["Sum nominal per group"]
T --> R["Return grouped costs"]
```

**Diagram sources**
- [cost/route.ts](file://src/app/api/reports/finance/cost/route.ts)
- [schema.prisma](file://prisma/schema.prisma)

**Section sources**
- [cost/route.ts](file://src/app/api/reports/finance/cost/route.ts)
- [dashboard/route.ts](file://src/app/api/finance/dashboard/route.ts)
- [schema.prisma](file://prisma/schema.prisma)

### Tax Reporting Capabilities
- The system supports tax reporting readiness by:
  - Maintaining supporting documents (buktiNota) in journal entries
  - Recording transaction references (ref) for audit trails
  - Grouping transactions by account categories for VAT and expense categorization
- Implementation note: Specific tax calculation logic (e.g., VAT rates) is not present in the current schema and would require extension of journal entries and reporting filters.

**Section sources**
- [jurnal/route.ts](file://src/app/api/finance/jurnal/route.ts)
- [schema.prisma](file://prisma/schema.prisma)

### Integration with Order Processing, Inventory, and Production
- Orders:
  - Payment events trigger automated journal entries to income and receivable accounts
- Inventory:
  - Purchase receipts link to supplier accounts and inventory accounts
- Production:
  - Cost entries can be posted to expense accounts; later aggregated for cost center reporting

```mermaid
sequenceDiagram
participant ORD as "Order/Payment"
participant JRN as "/api/finance/jurnal"
participant DB as "JurnalUmum"
ORD->>JRN : On payment confirmed
JRN->>DB : Insert income vs receivable rows
ORD->>JRN : On receipt confirmed
JRN->>DB : Insert inventory vs supplier rows
```

**Diagram sources**
- [jurnal/route.ts](file://src/app/api/finance/jurnal/route.ts)
- [schema.prisma](file://prisma/schema.prisma)

**Section sources**
- [schema.prisma](file://prisma/schema.prisma)
- [jurnal/route.ts](file://src/app/api/finance/jurnal/route.ts)

## Dependency Analysis
- Entities:
  - JurnalUmum depends on Akun for debet and kredit sides
  - KasBank optionally references Akun for balance computation
  - AppSetting references Akun for default revenue account
- API routes depend on Prisma models and the finance utility
- Reports depend on aggregated queries over JurnalUmum and Akun

```mermaid
erDiagram
AKUN {
string id PK
string kodeAkun
string namaAkun
string kelompok
enum posisiNormal
boolean isActive
}
JURNAL {
string id PK
string akunDebetId FK
string akunKreditId FK
decimal nominal
datetime tanggal
string ref
string buktiNota
string paymentId
string penerimaanId
}
KASBANK {
string id PK
string akunId FK
string namaRekening
string jenisRekening
string nomorRekening
boolean isActive
}
APPSETTING {
int id PK
string defaultPendapatanAkunId FK
}
AKUN ||--o{ JURNAL : "debet/kredit"
KASBANK }o--|| AKUN : "links to"
APPSETTING }o--|| AKUN : "default revenue"
```

**Diagram sources**
- [schema.prisma](file://prisma/schema.prisma)

**Section sources**
- [schema.prisma](file://prisma/schema.prisma)

## Performance Considerations
- Indexing:
  - JurnalUmum has indexes on date, debet/kredit accounts, and related foreign keys
- Aggregation:
  - Reports use aggregate queries to avoid loading full datasets
- Pagination:
  - Journal listing supports limit parameters
- Concurrency:
  - Batch operations use database transactions to maintain consistency

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- Unauthorized/Forbidden:
  - Ensure user role is admin or kasir for finance endpoints
- Validation errors:
  - Nominal must be positive; debet and kredit must differ; required fields must be present
- Soft deletion:
  - Deleting a journal triggers soft delete and cascades to related records
- Duplicate account code:
  - Creating an account with existing code is rejected

**Section sources**
- [akun/route.ts](file://src/app/api/finance/akun/route.ts)
- [jurnal/route.ts](file://src/app/api/finance/jurnal/route.ts)
- [kas-bank/route.ts](file://src/app/api/finance/kas-bank/route.ts)

## Conclusion
The financial accounting system provides a robust foundation for chart of accounts, double-entry journaling, multi-rekening cash flow tracking, and financial reporting. Automated journal entries integrate with payments and inventory receipts, while dashboard and report endpoints enable operational insights and compliance-ready records. Extending the system to include tax-specific calculations and budget targets would further enhance its capabilities.

## Appendices

### Practical Workflows and Examples
- Chart of Accounts Setup:
  - Create an account under a group; optionally auto-create a linked bank/cash account
- Journal Entry Automation:
  - After recording a payment, the system posts debet and kredit rows to income and receivable accounts
- Financial Reporting:
  - Generate monthly profit & loss and balance sheet by selecting period
- Receivable Tracking:
  - Review outstanding orders and compute total receivables from payments
- Cash Flow Management:
  - Monitor current balances across multiple bank and cash accounts

[No sources needed since this section provides general guidance]
# Configuration & Settings

<cite>
**Referenced Files in This Document**
- [navigation.ts](file://src/config/navigation.ts)
- [roles.ts](file://src/config/roles.ts)
- [permissions.ts](file://src/lib/permissions.ts)
- [settings page](file://src/app/(LoggedIn)/settings/page.tsx)
- [profile section](file://src/app/(LoggedIn)/settings/profile/profile-section.tsx)
- [security section](file://src/app/(LoggedIn)/settings/security/security-section.tsx)
- [web setting section](file://src/app/(LoggedIn)/settings/web-setting/web-setting-section.tsx)
- [check-account route](file://src/app/api/check-account/route.ts)
- [upload route](file://src/app/api/upload/route.ts)
- [settings route](file://src/app/api/settings/route.ts)
- [pusher auth route](file://src/app/api/pusher/auth/route.ts)
- [auth client](file://src/lib/auth-client.ts)
- [storage client](file://src/lib/storage.ts)
- [pusher client](file://src/lib/pusher-client.ts)
- [next.config.ts](file://next.config.ts)
- [package.json](file://package.json)
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
This document explains the centralized configuration and settings management system for the Point of Sale application. It covers:
- Centralized navigation and role-based access configuration
- Application settings for company identity, transactions, production, and financial mapping
- Environment variable management and deployment configuration
- Settings API endpoints and validation mechanisms
- Integration with external services (storage, real-time events, authentication)
- Practical examples and troubleshooting guidance

## Project Structure
The configuration system is organized around three pillars:
- Centralized role and permission definitions
- Navigation configuration with role gating
- Settings UI and API endpoints for application-wide preferences

```mermaid
graph TB
subgraph "Configuration Layer"
NAV["Navigation Config<br/>src/config/navigation.ts"]
ROLES["Roles Config<br/>src/config/roles.ts"]
PERMS["Permissions Config<br/>src/lib/permissions.ts"]
end
subgraph "Settings UI"
SETTINGS_PAGE["Settings Page<br/>src/app/(LoggedIn)/settings/page.tsx"]
PROFILE["Profile Section<br/>src/app/(LoggedIn)/settings/profile/profile-section.tsx"]
SECURITY["Security Section<br/>src/app/(LoggedIn)/settings/security/security-section.tsx"]
WEB_SETTING["Web Setting Section<br/>src/app/(LoggedIn)/settings/web-setting/web-setting-section.tsx"]
end
subgraph "API Layer"
CHECK_ACCOUNT["/api/check-account<br/>src/app/api/check-account/route.ts"]
UPLOAD["/api/upload<br/>src/app/api/upload/route.ts"]
SETTINGS_API["/api/admin/settings<br/>src/app/api/settings/route.ts"]
PUSHER_AUTH["/api/pusher/auth<br/>src/app/api/pusher/auth/route.ts"]
end
subgraph "Integration Clients"
AUTH_CLIENT["Auth Client<br/>src/lib/auth-client.ts"]
STORAGE["Storage Client<br/>src/lib/storage.ts"]
PUSHER["Pusher Client<br/>src/lib/pusher-client.ts"]
end
NAV --> SETTINGS_PAGE
ROLES --> PERMS
PERMS --> SETTINGS_PAGE
SETTINGS_PAGE --> PROFILE
SETTINGS_PAGE --> SECURITY
SETTINGS_PAGE --> WEB_SETTING
PROFILE --> CHECK_ACCOUNT
PROFILE --> UPLOAD
WEB_SETTING --> SETTINGS_API
WEB_SETTING --> UPLOAD
SECURITY --> CHECK_ACCOUNT
WEB_SETTING --> AUTH_CLIENT
WEB_SETTING --> STORAGE
WEB_SETTING --> PUSHER
```

**Diagram sources**
- [navigation.ts:1-217](file://src/config/navigation.ts#L1-L217)
- [roles.ts:1-18](file://src/config/roles.ts#L1-L18)
- [permissions.ts:1-67](file://src/lib/permissions.ts#L1-L67)
- [settings page](file://src/app/(LoggedIn)/settings/page.tsx#L1-L114)
- [profile section](file://src/app/(LoggedIn)/settings/profile/profile-section.tsx#L1-L297)
- [security section](file://src/app/(LoggedIn)/settings/security/security-section.tsx#L1-L294)
- [web setting section](file://src/app/(LoggedIn)/settings/web-setting/web-setting-section.tsx#L1-L421)
- [check-account route](file://src/app/api/check-account/route.ts)
- [upload route](file://src/app/api/upload/route.ts)
- [settings route](file://src/app/api/settings/route.ts)
- [pusher auth route](file://src/app/api/pusher/auth/route.ts)
- [auth client](file://src/lib/auth-client.ts)
- [storage client](file://src/lib/storage.ts)
- [pusher client](file://src/lib/pusher-client.ts)

**Section sources**
- [navigation.ts:1-217](file://src/config/navigation.ts#L1-L217)
- [roles.ts:1-18](file://src/config/roles.ts#L1-L18)
- [permissions.ts:1-67](file://src/lib/permissions.ts#L1-L67)
- [settings page](file://src/app/(LoggedIn)/settings/page.tsx#L1-L114)

## Core Components
- Centralized roles and permissions define resource-level access for POS, customers, payments, designs, production, inventory, finance, reports, and master data.
- Navigation groups and items are typed and gated by roles, ensuring only authorized users see relevant menus.
- Settings UI is split into Profile, Security, and Web Setting sections, each backed by dedicated API endpoints.

Key configuration files:
- Roles and keys: [roles.ts:1-18](file://src/config/roles.ts#L1-L18)
- Access control statements and role grants: [permissions.ts:1-67](file://src/lib/permissions.ts#L1-L67)
- Navigation tree with icons, URLs, and role filters: [navigation.ts:1-217](file://src/config/navigation.ts#L1-L217)
- Settings page composition and role-aware visibility: [settings page](file://src/app/(LoggedIn)/settings/page.tsx#L1-L114)

**Section sources**
- [roles.ts:1-18](file://src/config/roles.ts#L1-L18)
- [permissions.ts:1-67](file://src/lib/permissions.ts#L1-L67)
- [navigation.ts:1-217](file://src/config/navigation.ts#L1-L217)
- [settings page](file://src/app/(LoggedIn)/settings/page.tsx#L1-L114)

## Architecture Overview
The settings subsystem integrates UI, API, and external service clients. The Web Setting section orchestrates:
- Fetching current settings and related resources
- Uploading images to storage
- Patching settings via the admin settings endpoint
- Mapping financial accounts and invoice bank accounts

```mermaid
sequenceDiagram
participant U as "User"
participant UI as "WebSettingSection"
participant API as "Settings API (/api/admin/settings)"
participant Upload as "Upload API (/api/upload)"
participant Storage as "Storage Provider"
U->>UI : Open "Web Setting" section
UI->>API : GET /api/admin/settings
UI->>API : GET /api/finance/akun?isActive=true
UI->>API : GET /api/finance/kas-bank?jenisRekening=BANK
API-->>UI : Settings + Active Accounts + Active Cash/Bank
U->>UI : Select Logo / Edit Fields
UI->>Upload : POST /api/upload (optional)
Upload-->>UI : {url}
U->>UI : Click "Save Settings"
UI->>API : PATCH /api/admin/settings (payload with logoUrl and mapped accounts)
API-->>UI : Success/Failure
```

**Diagram sources**
- [web setting section](file://src/app/(LoggedIn)/settings/web-setting/web-setting-section.tsx#L30-L129)
- [settings route](file://src/app/api/settings/route.ts)
- [upload route](file://src/app/api/upload/route.ts)

## Detailed Component Analysis

### Centralized Role-Based Navigation
The navigation configuration defines:
- Groups (Main Menu, Finance, Others)
- Items with optional icons, URLs, and role arrays
- Subitems for nested navigation
- Role gating ensures only authorized roles can access specific sections

```mermaid
classDiagram
class NavGroup {
+string label
+NavItem[] items
}
class NavItem {
+string title
+string url
+LucideIcon icon
+RoleKey[] roles
+NavSubItem[] items
}
class NavSubItem {
+string title
+string url
+RoleKey[] roles
}
class RoleKey {
<<enumeration>>
}
NavGroup --> NavItem : "contains"
NavItem --> NavSubItem : "contains"
NavItem --> RoleKey : "filtered by"
NavSubItem --> RoleKey : "filtered by"
```

**Diagram sources**
- [navigation.ts:16-33](file://src/config/navigation.ts#L16-L33)

Practical implications:
- Adding a new role requires updates in both roles configuration and navigation items.
- Icons and labels are centralized for consistent UX.

**Section sources**
- [navigation.ts:35-217](file://src/config/navigation.ts#L35-L217)
- [roles.ts:5-11](file://src/config/roles.ts#L5-L11)

### Permissions and Access Control
Resource-level permissions are defined and merged with built-in statements. Roles are granted explicit capabilities:
- Admin: full access across all resources
- Cashier: POS, customer, payment, finance CRUD, reports view
- Designer: design view/upload/update-status
- Production: production view/update-status
- Warehouse: inventory view/create/update; supplier view only

```mermaid
flowchart TD
Start(["Initialize Access Control"]) --> DefineStatements["Define Resource Statements"]
DefineStatements --> MergeDefaults["Merge with Built-in Statements"]
MergeDefaults --> CreateRoles["Create Roles with Capabilities"]
CreateRoles --> Admin["Admin Role: Full Access"]
CreateRoles --> Cashier["Cashier Role: POS/Customer/Payment + Finance/Reports"]
CreateRoles --> Designer["Designer Role: Design View/Upload/Status"]
CreateRoles --> Production["Production Role: Production View/Status"]
CreateRoles --> Warehouse["Warehouse Role: Inventory View/Create/Update"]
Admin --> End(["Ready"])
Cashier --> End
Designer --> End
Production --> End
Warehouse --> End
```

**Diagram sources**
- [permissions.ts:8-21](file://src/lib/permissions.ts#L8-L21)
- [permissions.ts:26-66](file://src/lib/permissions.ts#L26-L66)

**Section sources**
- [permissions.ts:1-67](file://src/lib/permissions.ts#L1-L67)

### Settings UI Composition
The settings page dynamically renders sections based on the user’s role:
- Profile: update personal info and avatar
- Security: change password and view linked accounts
- Web Setting: company identity, transaction/POS preferences, production preferences, financial mapping, invoice bank accounts

```mermaid
sequenceDiagram
participant U as "User"
participant Page as "Settings Page"
participant Profile as "Profile Section"
participant Security as "Security Section"
participant Web as "Web Setting Section"
U->>Page : Navigate to /settings
Page->>Page : Determine role
Page->>Profile : Render if allowed
Page->>Security : Render if allowed
Page->>Web : Render only for admin
```

**Diagram sources**
- [settings page](file://src/app/(LoggedIn)/settings/page.tsx#L25-L113)

**Section sources**
- [settings page](file://src/app/(LoggedIn)/settings/page.tsx#L1-L114)

### Profile Settings
Profile updates support:
- Name editing
- Avatar upload with size/type validation
- Avatar selection from a curated set
- Optional avatar upload to storage

```mermaid
sequenceDiagram
participant U as "User"
participant PS as "ProfileSection"
participant Upload as "Upload API"
participant Auth as "Auth Client"
U->>PS : Choose avatar file / pick from collection
PS->>PS : Validate file type/size
alt File selected
PS->>Upload : POST /api/upload
Upload-->>PS : {url}
end
U->>PS : Submit form
PS->>Auth : Update user (name, image)
Auth-->>PS : Success/Failure
```

**Diagram sources**
- [profile section](file://src/app/(LoggedIn)/settings/profile/profile-section.tsx#L77-L127)
- [upload route](file://src/app/api/upload/route.ts)
- [auth client](file://src/lib/auth-client.ts)

**Section sources**
- [profile section](file://src/app/(LoggedIn)/settings/profile/profile-section.tsx#L1-L297)

### Security Settings
Security section:
- Detects account provider (credentials vs social)
- Provides password change form with validation
- Revokes other sessions upon password change
- Triggers sign-out and redirects after successful change

```mermaid
sequenceDiagram
participant U as "User"
participant SS as "SecuritySection"
participant CA as "Check-Account API"
participant Auth as "Auth Client"
U->>SS : Open Security
SS->>CA : GET /api/check-account
CA-->>SS : providerId
alt Has credential provider
U->>SS : Enter current/new/confirm passwords
SS->>Auth : Change password (revokeOtherSessions)
Auth-->>SS : Result
SS->>Auth : Sign out and redirect
else No credential provider
SS-->>U : Show "linked accounts" info
end
```

**Diagram sources**
- [security section](file://src/app/(LoggedIn)/settings/security/security-section.tsx#L51-L102)
- [check-account route](file://src/app/api/check-account/route.ts)
- [auth client](file://src/lib/auth-client.ts)

**Section sources**
- [security section](file://src/app/(LoggedIn)/settings/security/security-section.tsx#L1-L294)

### Web Setting Configuration
Web Setting manages:
- Company identity (logo upload, name, contact, email, address)
- Transaction/POS preferences (order prefix, receipt footer note)
- Production preferences (SPK prefix, estimated days)
- Financial mapping (default income account)
- Invoice bank account mapping (multiple selection)

```mermaid
flowchart TD
Load["Fetch Settings + Accounts + Cash/Bank"] --> Edit["Edit Fields / Select Accounts"]
Edit --> UploadLogo{"Logo changed?"}
UploadLogo --> |Yes| UploadAPI["POST /api/upload"]
UploadLogo --> |No| BuildPayload["Build Payload"]
UploadAPI --> UploadAPIResp{"Upload OK?"}
UploadAPIResp --> |Yes| BuildPayload
UploadAPIResp --> |No| Error["Show Toast Error"]
BuildPayload --> Patch["PATCH /api/admin/settings"]
Patch --> Success["Show Success Toast"]
```

**Diagram sources**
- [web setting section](file://src/app/(LoggedIn)/settings/web-setting/web-setting-section.tsx#L30-L129)
- [settings route](file://src/app/api/settings/route.ts)
- [upload route](file://src/app/api/upload/route.ts)

**Section sources**
- [web setting section](file://src/app/(LoggedIn)/settings/web-setting/web-setting-section.tsx#L1-L421)

## Dependency Analysis
- UI depends on:
  - Auth client for session and user updates
  - Storage client for avatar/logo uploads
  - Pusher client for real-time integrations
- Settings API depends on:
  - Prisma-backed persistence for settings and related entities
  - Storage service for media assets
  - Pusher service for event broadcasting

```mermaid
graph LR
UI_Profile["ProfileSection"] --> AuthClient["Auth Client"]
UI_Profile --> UploadRoute["/api/upload"]
UI_Web["WebSettingSection"] --> SettingsRoute["/api/admin/settings"]
UI_Web --> UploadRoute
UI_Security["SecuritySection"] --> CheckAccountRoute["/api/check-account"]
SettingsRoute --> Storage["Storage Service"]
SettingsRoute --> Pusher["Pusher Service"]
```

**Diagram sources**
- [profile section](file://src/app/(LoggedIn)/settings/profile/profile-section.tsx#L104-L107)
- [web setting section](file://src/app/(LoggedIn)/settings/web-setting/web-setting-section.tsx#L103-L107)
- [security section](file://src/app/(LoggedIn)/settings/security/security-section.tsx#L19-L21)
- [upload route](file://src/app/api/upload/route.ts)
- [settings route](file://src/app/api/settings/route.ts)
- [check-account route](file://src/app/api/check-account/route.ts)

**Section sources**
- [auth client](file://src/lib/auth-client.ts)
- [storage client](file://src/lib/storage.ts)
- [pusher client](file://src/lib/pusher-client.ts)

## Performance Considerations
- Batch API calls in Web Setting reduce round-trips for initial load.
- Client-side caching of uploaded asset URLs avoids redundant uploads.
- Debounce or throttle frequent updates to avoid excessive API calls.
- Lazy-load heavy components only when their sections are visible.

## Troubleshooting Guide
Common configuration and deployment issues:
- Settings not saving
  - Verify /api/admin/settings PATCH endpoint availability and response.
  - Ensure uploaded logo meets size/format constraints.
  - Confirm invoice bank account IDs are valid and serialized correctly.
- Avatar/logo upload failures
  - Check /api/upload endpoint and storage service connectivity.
  - Validate file size (<5MB) and MIME type.
- Role-based navigation missing items
  - Confirm user role matches expected RoleKey values.
  - Ensure roles.ts and navigation.ts are synchronized.
- Password change errors
  - Validate current password and confirm new password match.
  - Ensure credential provider exists for the account.
- Real-time updates not working
  - Verify Pusher credentials and channel configuration.
  - Confirm /api/pusher/auth endpoint responds with proper signature.

Operational checks:
- Environment variables for storage and Pusher must be present during build and runtime.
- Next.js configuration supports static exports and runtime environment handling.

**Section sources**
- [web setting section](file://src/app/(LoggedIn)/settings/web-setting/web-setting-section.tsx#L79-L95)
- [profile section](file://src/app/(LoggedIn)/settings/profile/profile-section.tsx#L52-L61)
- [security section](file://src/app/(LoggedIn)/settings/security/security-section.tsx#L38-L49)
- [navigation.ts:49-76](file://src/config/navigation.ts#L49-L76)
- [roles.ts:5-11](file://src/config/roles.ts#L5-L11)

## Conclusion
The configuration and settings system provides a centralized, role-aware approach to managing application behavior and user preferences. By consolidating roles, permissions, navigation, and settings APIs, the system ensures consistent access control and streamlined customization across environments.

## Appendices

### Environment Variables and Deployment
- Define environment variables for:
  - Storage service (bucket, region, credentials)
  - Pusher (cluster, key, secret)
  - Authentication (issuer, cookie settings)
- Use environment-specific configuration files or CI/CD secrets for deployment.
- Validate environment variables at startup and provide clear error messages for missing values.

**Section sources**
- [next.config.ts](file://next.config.ts)
- [package.json](file://package.json)

### Settings API Endpoints Summary
- GET /api/check-account
  - Purpose: Detect account provider (credential/social) for conditional UI rendering.
  - Response: providerId array indicating configured providers.
- POST /api/upload
  - Purpose: Upload avatar/logo to storage.
  - Request: multipart/form-data with file and folder.
  - Response: { url } of uploaded asset.
- PATCH /api/admin/settings
  - Purpose: Update company identity, preferences, and mappings.
  - Request: JSON payload including logoUrl, invoiceRekeningIds, and other fields.
  - Response: Updated settings record.
- GET /api/finance/akun?isActive=true
  - Purpose: Fetch active chart of accounts for financial mapping.
- GET /api/finance/kas-bank?jenisRekening=BANK
  - Purpose: Fetch active cash/bank accounts for invoice display.

**Section sources**
- [check-account route](file://src/app/api/check-account/route.ts)
- [upload route](file://src/app/api/upload/route.ts)
- [settings route](file://src/app/api/settings/route.ts)

### External Integrations
- Storage
  - Used for avatar and company logo uploads.
  - Integrated via upload API and storage client.
- Pusher
  - Used for real-time notifications and collaboration features.
  - Auth endpoint generates signed channel tokens.
- Better Auth
  - Provides authentication, session management, and access control plugins.

**Section sources**
- [web setting section](file://src/app/(LoggedIn)/settings/web-setting/web-setting-section.tsx#L84-L95)
- [pusher auth route](file://src/app/api/pusher/auth/route.ts)
- [permissions.ts:1-21](file://src/lib/permissions.ts#L1-L21)
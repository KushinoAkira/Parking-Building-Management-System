# USER MANUAL

## Parking Building Management System (PBMS)

---

| Document Information | |
|---|---|
| **Project Code** | SU26SWP08 |
| **Document Type** | User Manual |
| **Version** | 1.0 |
| **Prepared By** | SU26SWP08 Development Team |

---

## 1. System Access

PBMS operates as a web application. Navigation is controlled via Role-Based Access Control (RBAC).

**Production URL**: `https://parking-management-syste-97d18.web.app`

### 1.1 Authentication
- **Staff / Manager / Admin**: Use assigned email and password credentials provided by the System Administrator.
- **Drivers**: Authenticate via Local Registration (Email/Password) or Google OAuth Single Sign-On (SSO).

---

## 2. Administrator Instructions

The Admin controls system-wide configurations and personnel access.

### 2.1 User Provisioning
1. Navigate to **User Management**.
2. Select **Add User**.
3. Detail required fields: Full Name, Email, Role (Admin, Manager, Staff), and Status.
4. Issue provisional password to staff members upon creation.

### 2.2 System Configuration
1. Navigate to **System Configs**.
2. Modify key values:
   - `GRACE_PERIOD_MINUTES`
   - `VIP_SLOT_SURCHARGE`
3. Save changes. Execution applies to new processes immediately.

---

## 3. Manager Instructions

The Manager defines operational metrics and reviews financial reporting.

### 3.1 Facility and Pricing Configuration
1. Navigate to **Facility Settings** to manage operating hours.
2. Navigate to **Pricing Policies** to assign or update the active fee structure per vehicle class. Older policies deactivate automatically upon generating a replacement.
3. Use the **Subscription Plans** interface to configure monthly pass products for drivers.

### 3.2 Analytics
- Ensure real-time monitoring via the **Dashboard** (active metrics).
- Access historical data exports via **Reports** tab for revenue trends and zone utilization mapping.

---

## 4. Staff Operations

Staff executes physical parking logic at access control points.

### 4.1 Vehicle Check-In Process
1. Input license plate manually or initiate camera scan via OCR input field.
2. Select the correct **Vehicle Type**.
3. (Optional) Input a confirmed **Reservation ID** if presented by customer.
4. Submit Check-In request. The system returns the assigned zone and slot.

### 4.2 Vehicle Check-Out Process
1. Search active sessions via **License Plate**.
2. System calculates outstanding balance based on duration and applying subscriptions.
3. Request primary payment channel: Cash, Bank Transfer, or Digital E-Wallet.
4. Execute payment submission to finalize the session block and restore slot availability.

### 4.3 Incident Logging
Log exceptions (Lost Ticket, Wrong Zone) against active sessions via the **Violations** module prior to processing checkout requests. Manager validation is required to clear incidents.

---

## 5. Driver Portal Guide

The Customer interface supports self-service financial processing.

### 5.1 Wallet Operations
1. Authenticate to the Driver portal.
2. Access the **Wallet** interface.
3. Define top-up amount and execute transaction request.
4. Scan the rendered PayOS QR Code via banking platform. Balance commits dynamically.

### 5.2 Advance Reservations
1. Navigate to **Reservations**.
2. Specify booking window, vehicle class, and optional premium VIP parameter.
3. Submit and click confirm to lock slot selection. Check-in must occur prior to expiration limits.

### 5.3 Active Session Management
Monitor current parking session duration and execute internal checkout via the active session module using pre-loaded wallet balances.

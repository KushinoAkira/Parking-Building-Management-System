# PBMS Database Explanation for Agents

## 1. Purpose of This Document

This document explains the simplified database design for **PBMS – Parking Building Management System**. It is intended for AI agents, developers, UI designers, backend developers, and documentation agents who need to understand how the database supports the parking system requirements.

The current database is intentionally simplified. It is not designed as an overly complex enterprise parking platform. Instead, it is designed to be realistic for a parking building management system with enough features for:

- System Administrator
- Parking Facility Manager
- Parking Staff
- Parking User / Driver

The database supports account management, facility setup, vehicle types, parking zones, parking slots, pricing policies, reservations, parking sessions, payments, incidents, feedback, reports, and system configuration.

---

## 2. High-Level Database Groups

The database is divided into the following functional groups:

| Group | Tables | Purpose |
|---|---|---|
| Auth & Users | `Roles`, `Users` | Manage accounts and role-based access |
| Facility Setup | `ParkingFacility`, `VehicleTypes`, `ParkingZones`, `ParkingSlots` | Configure the parking building, vehicle types, zones, and slots |
| Pricing | `PricingPolicies` | Define parking fee rules by vehicle type |
| Reservation | `Reservations` | Allow drivers to reserve parking slots in advance |
| Parking Operations | `ParkingSessions`, `Payments` | Handle vehicle check-in, check-out, fee calculation, and payment |
| Exception Handling | `Incidents` | Track abnormal cases such as lost ticket, wrong plate, overstay, unpaid sessions |
| Feedback & Reports | `Feedbacks`, `ReportSnapshots` | Store driver feedback and optional saved report summaries |
| System Configuration | `SystemConfigs` | Store global system settings |

---

## 3. Core Design Philosophy

### 3.1 Simplified but Requirement-Covering

The database removes unnecessary complexity such as a separate `Floors` table and a many-to-many `FloorVehicleType` table. Instead, it uses `ParkingZones` to represent floors, areas, or zones.

For example:

| ZoneCode | Meaning | Vehicle Type |
|---|---|---|
| A | Motorbike Zone A | MOTORBIKE |
| B | Car Zone B | CAR |
| C | EV Zone C | EV |
| B1 | Basement 1 | CAR |
| F1 | Floor 1 | MOTORBIKE |

This makes the database easier to understand while still supporting the requirement: **manage zones/floors by vehicle type**.

### 3.2 Short Slot IDs

Parking slots use short readable IDs such as:

```text
A1, A2, A3
B1, B2, B3
C1, C2, C3
```

This is more realistic for a small or medium parking facility than using overly technical slot IDs.

### 3.3 ParkingSessions as the Central Operational Table

`ParkingSessions` is the core table for real-time parking operation. A parking session represents one vehicle visit from entry to exit.

It connects:

- Driver account, if available
- Reservation, if the session came from a reservation
- Vehicle type
- Parking zone
- Parking slot
- Entry and exit staff
- Entry and exit time
- Estimated and final fee
- Session status

---

## 4. Table-by-Table Explanation

## 4.1 Roles

### Purpose

`Roles` defines the system roles used for access control.

### Main Fields

| Field | Meaning |
|---|---|
| `RoleID` | Primary key |
| `RoleName` | Role name: `Admin`, `Manager`, `Staff`, `Driver` |

### Business Meaning

Each user belongs to one role. The role determines which screens and functions the user can access.

### Common Role Permissions

| Role | Main Responsibility |
|---|---|
| Admin | Manage users, roles, and system configuration |
| Manager | Manage facility setup, pricing, reports, reservations, incidents |
| Staff | Handle vehicle entry, exit, payment, and incidents |
| Driver | View parking info, reserve slot, track session, pay, submit feedback |

---

## 4.2 Users

### Purpose

`Users` stores account information for all system users.

### Main Fields

| Field | Meaning |
|---|---|
| `UserID` | Primary key |
| `FullName` | User full name |
| `Email` | Unique login email |
| `PasswordHash` | Hashed password, not plain text |
| `Phone` | Contact phone |
| `RoleID` | Foreign key to `Roles` |
| `Status` | `Active` or `Locked` |
| `CreatedAt` | Account creation timestamp |

### Notes for Agents

- Do not store plain text passwords.
- Use `Status = Locked` to block access without deleting the user.
- Drivers can have accounts, but `ParkingSessions.UserID` is nullable to support guest drivers.

---

## 4.3 ParkingFacility

### Purpose

`ParkingFacility` stores basic information about the parking building.

### Main Fields

| Field | Meaning |
|---|---|
| `FacilityID` | Primary key |
| `FacilityName` | Parking building name |
| `Address` | Facility address |
| `OpenTime` | Opening time |
| `CloseTime` | Closing time |
| `Status` | `Active`, `Maintenance`, or `Inactive` |
| `Description` | Additional public or internal description |

### Business Meaning

This table supports the Manager requirement: **manage parking building information**.

### UI Usage

Used in:

- Manager Facility Info screen
- Driver Parking Info page
- Dashboard facility status card

---

## 4.4 VehicleTypes

### Purpose

`VehicleTypes` defines the vehicle categories accepted by the parking facility.

### Main Fields

| Field | Meaning |
|---|---|
| `VehicleTypeID` | Primary key |
| `TypeCode` | Unique code, such as `MOTORBIKE`, `CAR`, `EV` |
| `TypeName` | Display name |
| `Status` | Whether this vehicle type is active |

### Business Meaning

Vehicle types are used throughout the system for:

- Parking zone setup
- Slot allocation
- Pricing policies
- Reservations
- Parking sessions
- Reports

### Example Data

| TypeCode | TypeName |
|---|---|
| MOTORBIKE | Motorbike |
| CAR | Car |
| EV | Electric Vehicle |

---

## 4.5 ParkingZones

### Purpose

`ParkingZones` represents parking areas, floors, or sections inside the parking building.

This table replaces a more complex `Floors` + `FloorVehicleType` design.

### Main Fields

| Field | Meaning |
|---|---|
| `ZoneID` | Primary key |
| `ZoneCode` | Short code such as `A`, `B`, `C`, `B1`, `F1` |
| `ZoneName` | Display name |
| `VehicleTypeID` | Vehicle type allowed in this zone |
| `Capacity` | Total capacity of the zone |
| `Status` | `Active`, `Maintenance`, or `Locked` |

### Business Meaning

This table supports the requirement: **manage zones/floors by vehicle type**.

### Example Data

| ZoneCode | ZoneName | VehicleType |
|---|---|---|
| A | Motorbike Zone A | MOTORBIKE |
| B | Car Zone B | CAR |
| C | EV Zone C | EV |

### Notes for Agents

- A zone belongs to one vehicle type.
- If a floor supports multiple vehicle types, create multiple zones for that floor.
- Example: `F1-MOTO`, `F1-CAR`, or simply `A`, `B` depending on UI style.

---

## 4.6 ParkingSlots

### Purpose

`ParkingSlots` stores individual parking spaces.

### Main Fields

| Field | Meaning |
|---|---|
| `SlotID` | Primary key, readable slot code such as `A1`, `B2` |
| `ZoneID` | Foreign key to `ParkingZones` |
| `Status` | Current slot status |
| `Note` | Additional note |

### Slot Status Values

| Status | Meaning |
|---|---|
| `Available` | Slot is free and can be assigned |
| `Occupied` | Slot is currently used by a vehicle |
| `Reserved` | Slot is reserved for a future driver |
| `Maintenance` | Slot is under maintenance |
| `Locked` | Slot is temporarily blocked |

### UI Usage

Used heavily in:

- Slot Map
- Manager Dashboard
- Staff Dashboard
- Driver Parking Info
- Reservation flow
- Check-in flow

### Important Rule

Only `Available` slots should be assigned to a new parking session unless a valid reservation uses a pre-reserved slot.

---

## 4.7 PricingPolicies

### Purpose

`PricingPolicies` stores parking fee rules by vehicle type.

### Main Fields

| Field | Meaning |
|---|---|
| `PolicyID` | Primary key |
| `VehicleTypeID` | Vehicle type this policy applies to |
| `PolicyName` | Human-readable policy name |
| `PricePerHour` | Fee per hour |
| `DailyMaxFee` | Maximum fee per day |
| `LostTicketFee` | Penalty for lost ticket |
| `OvertimeFee` | Additional fee for overtime |
| `Status` | `Active` or `Inactive` |
| `CreatedAt` | Creation timestamp |

### Business Meaning

This table supports the Manager requirement: **manage price table and parking fee policies**.

### Example Data

| PolicyName | Vehicle Type | PricePerHour | DailyMaxFee |
|---|---|---:|---:|
| Motorbike Standard | MOTORBIKE | 5,000 VND | 50,000 VND |
| Car Standard | CAR | 20,000 VND | 200,000 VND |
| EV Standard | EV | 25,000 VND | 250,000 VND |

### Notes for Agents

- Fee calculation should use the active policy for the vehicle type.
- If historical pricing is required, do not delete old policies. Set them to `Inactive`.

---

## 4.8 Reservations

### Purpose

`Reservations` stores advance slot reservations made by drivers.

### Main Fields

| Field | Meaning |
|---|---|
| `ReservationID` | Primary key |
| `UserID` | Driver who made the reservation |
| `VehicleTypeID` | Vehicle type requested |
| `ZoneID` | Preferred or assigned zone |
| `SlotID` | Assigned slot, nullable before assignment |
| `LicensePlate` | Vehicle plate number |
| `ReservedFrom` | Reservation start time |
| `ReservedTo` | Reservation end time |
| `Status` | Reservation lifecycle status |
| `CreatedAt` | Creation timestamp |

### Reservation Status Values

| Status | Meaning |
|---|---|
| `Pending` | Reservation created but not confirmed |
| `Confirmed` | Reservation is accepted and slot may be reserved |
| `CheckedIn` | Driver has arrived and parking session started |
| `Cancelled` | Reservation cancelled by user or staff |
| `Expired` | Reservation time passed without check-in |

### Business Meaning

This table supports Driver requirement: **advance reservation by vehicle type, time, and available area**.

### Notes for Agents

- When a reservation is confirmed and a slot is assigned, the related `ParkingSlots.Status` should become `Reserved`.
- When the driver checks in, the reservation status should become `CheckedIn`, and the slot status should become `Occupied`.
- If the reservation expires or is cancelled, the slot should return to `Available`.

---

## 4.9 ParkingSessions

### Purpose

`ParkingSessions` is the main operational table. It records every vehicle parking visit.

### Main Fields

| Field | Meaning |
|---|---|
| `SessionID` | Primary key |
| `TicketCode` | Unique ticket or QR code |
| `UserID` | Driver account, nullable for guest |
| `ReservationID` | Linked reservation, nullable |
| `VehicleTypeID` | Vehicle type |
| `ZoneID` | Assigned zone |
| `SlotID` | Assigned slot |
| `LicensePlate` | Vehicle license plate |
| `EntryTime` | Check-in time |
| `ExitTime` | Check-out time |
| `EntryGate` | Gate used for entry |
| `ExitGate` | Gate used for exit |
| `EstimatedFee` | Temporary fee estimate |
| `TotalFee` | Final fee |
| `Status` | Session lifecycle status |
| `EntryStaffID` | Staff who checked vehicle in |
| `ExitStaffID` | Staff who checked vehicle out |
| `Note` | Additional note |

### Session Status Values

| Status | Meaning |
|---|---|
| `Active` | Vehicle is currently parked |
| `Completed` | Vehicle has exited and session is finished |
| `Cancelled` | Session was cancelled |
| `Unpaid` | Session has unpaid fee or pending payment issue |

### Business Meaning

This table supports:

- Vehicle entry
- Vehicle exit
- Session tracking
- Fee calculation
- Staff operation
- Driver active session view
- Reports and analytics

### Important Business Rules

1. A license plate should not have more than one `Active` session at the same time.
2. When a session is created, the assigned slot should become `Occupied`.
3. When a session is completed, the assigned slot should become `Available`.
4. `EntryTime` should be generated by the server, not manually trusted from the client.
5. `TotalFee` is finalized during check-out.

---

## 4.10 Payments

### Purpose

`Payments` stores payment transactions for parking sessions.

### Main Fields

| Field | Meaning |
|---|---|
| `PaymentID` | Primary key |
| `SessionID` | Related parking session |
| `Amount` | Paid amount |
| `PaymentMethod` | `Cash`, `BankTransfer`, or `EWallet` |
| `PaymentTime` | Payment timestamp |
| `Status` | Payment status |

### Payment Status Values

| Status | Meaning |
|---|---|
| `Pending` | Payment started but not completed |
| `Completed` | Payment successful |
| `Refunded` | Payment refunded |
| `Failed` | Payment failed |

### Business Meaning

Payment is separated from `ParkingSessions` so the system can track payment method, status, refunds, and failed payments.

### UI Usage

Used in:

- Staff check-out screen
- Payment receipt screen
- Driver payment page
- Reports and revenue dashboard

---

## 4.11 Incidents

### Purpose

`Incidents` stores abnormal parking cases and exception handling records.

### Main Fields

| Field | Meaning |
|---|---|
| `IncidentID` | Primary key |
| `SessionID` | Related parking session, nullable if not tied to a session |
| `ReportedByID` | User who reported or created the incident |
| `IncidentType` | Type of incident |
| `Description` | Detailed explanation |
| `PenaltyFee` | Penalty fee applied |
| `Status` | `Open`, `Resolved`, or `Cancelled` |
| `CreatedAt` | Creation timestamp |
| `ResolvedAt` | Resolution timestamp |

### Incident Types

| IncidentType | Meaning |
|---|---|
| `LostTicket` | Driver lost ticket or QR code |
| `WrongPlate` | License plate does not match |
| `Overstay` | Vehicle stayed too long |
| `WrongZone` | Vehicle parked in wrong area |
| `Unpaid` | Payment not completed |
| `SlotOccupied` | Slot is occupied unexpectedly |
| `Other` | Other issue |

### Business Meaning

This table supports Staff and Manager requirements for handling exceptional cases.

### Notes for Agents

- Staff usually creates incidents.
- Manager may review or approve special cases.
- Driver feedback may become an incident if staff needs to process it operationally.

---

## 4.12 Feedbacks

### Purpose

`Feedbacks` stores feedback or issue reports submitted by drivers.

### Main Fields

| Field | Meaning |
|---|---|
| `FeedbackID` | Primary key |
| `UserID` | Driver who submitted feedback |
| `SessionID` | Related parking session, optional |
| `FeedbackType` | Type of feedback |
| `Content` | Feedback content |
| `Status` | `New`, `Processing`, or `Resolved` |
| `CreatedAt` | Creation timestamp |

### Feedback Types

| FeedbackType | Meaning |
|---|---|
| `LostTicket` | Driver reports lost ticket |
| `WrongFee` | Driver reports incorrect fee |
| `HardToFindVehicle` | Driver cannot find vehicle |
| `SlotOccupied` | Driver reports occupied slot issue |
| `Other` | Other feedback |

### Business Meaning

This table supports optional Driver requirement: **submit feedback about lost ticket, wrong fee, hard to find vehicle, occupied slot, or other issues**.

### Difference Between Feedbacks and Incidents

| Table | Used By | Purpose |
|---|---|---|
| `Feedbacks` | Driver | User-facing issue report |
| `Incidents` | Staff / Manager | Operational exception handling |

A feedback can lead to an incident, but they are not exactly the same.

---

## 4.13 ReportSnapshots

### Purpose

`ReportSnapshots` stores saved daily or monthly report data.

This table is optional. If reports are generated directly from `ParkingSessions` and `Payments`, this table can be removed.

### Main Fields

| Field | Meaning |
|---|---|
| `ReportID` | Primary key |
| `ReportDate` | Date of report |
| `VehicleTypeID` | Vehicle type being reported |
| `TotalEntries` | Number of vehicle entries |
| `TotalExits` | Number of vehicle exits |
| `TotalRevenue` | Total revenue |
| `OccupancyRate` | Occupancy percentage |
| `PeakHour` | Busiest hour, 0–23 |
| `CreatedAt` | Snapshot creation time |

### Business Meaning

This table supports Manager/Admin reporting requirements:

- Vehicle entries and exits
- Revenue
- Occupancy rate
- Peak hours
- Vehicle-type based statistics

### Notes for Agents

Use this table when:

- Dashboard needs fast loading
- Historical summary snapshots are needed
- Reports should not be recalculated every time

Remove or ignore this table when:

- The project wants a smaller database
- Reports can be calculated directly by SQL queries

---

## 4.14 SystemConfigs

### Purpose

`SystemConfigs` stores global application settings.

### Main Fields

| Field | Meaning |
|---|---|
| `ConfigKey` | Primary key, setting name |
| `ConfigValue` | Setting value |
| `Description` | Explanation of the setting |

### Example Configs

| ConfigKey | ConfigValue |
|---|---|
| `MAX_ACTIVE_RESERVATIONS` | `2` |
| `RESERVATION_HOLD_MINUTES` | `15` |
| `DEFAULT_CURRENCY` | `VND` |
| `AUTO_RELEASE_RESERVED_SLOT` | `true` |
| `CHATBOT_ENABLED` | `true` |

### Business Meaning

This table supports the Admin requirement: **manage system configuration**.

---

## 5. Main Database Relationships

## 5.1 User and Role

```text
Roles 1 ──── * Users
```

Each user belongs to one role.

---

## 5.2 Facility Setup

```text
VehicleTypes 1 ──── * ParkingZones
ParkingZones 1 ──── * ParkingSlots
```

A vehicle type can have many zones. A zone contains many slots.

---

## 5.3 Pricing

```text
VehicleTypes 1 ──── * PricingPolicies
```

Each vehicle type can have multiple pricing policies, but normally only one should be active at a time.

---

## 5.4 Reservation

```text
Users 1 ──── * Reservations
VehicleTypes 1 ──── * Reservations
ParkingZones 1 ──── * Reservations
ParkingSlots 1 ──── * Reservations
```

A driver can create multiple reservations. A reservation may be assigned to a zone and slot.

---

## 5.5 Parking Session

```text
Users 1 ──── * ParkingSessions
Reservations 1 ──── * ParkingSessions
VehicleTypes 1 ──── * ParkingSessions
ParkingZones 1 ──── * ParkingSessions
ParkingSlots 1 ──── * ParkingSessions
```

`ParkingSessions` connects the driver, vehicle type, zone, slot, staff, and reservation.

---

## 5.6 Payment

```text
ParkingSessions 1 ──── * Payments
```

A session can have one or more payments. In the simplest flow, one session has one completed payment.

---

## 5.7 Incidents and Feedback

```text
ParkingSessions 1 ──── * Incidents
Users 1 ──── * Incidents

Users 1 ──── * Feedbacks
ParkingSessions 1 ──── * Feedbacks
```

Incidents are operational records. Feedbacks are user-facing reports.

---

## 6. Main Business Workflows

## 6.1 Vehicle Check-In Flow

1. Staff enters or scans the license plate.
2. Staff selects vehicle type.
3. System checks whether the license plate already has an active session.
4. System finds an available slot in a suitable zone for that vehicle type.
5. System creates a `ParkingSessions` record with `Status = Active`.
6. System updates `ParkingSlots.Status = Occupied`.
7. System generates a `TicketCode`.
8. Staff gives ticket code or QR code to the driver.

Affected tables:

```text
ParkingSessions
ParkingSlots
VehicleTypes
ParkingZones
Users
Reservations, optional
```

---

## 6.2 Vehicle Check-Out and Payment Flow

1. Staff searches active session by ticket code or license plate.
2. System calculates duration from `EntryTime` to current time.
3. System gets active pricing policy for the vehicle type.
4. System calculates base fee, overtime fee, lost ticket fee, or other penalties if applicable.
5. Staff confirms payment method.
6. System creates `Payments` record.
7. System updates `ParkingSessions.Status = Completed`.
8. System records `ExitTime`, `ExitGate`, `TotalFee`, and `ExitStaffID`.
9. System updates `ParkingSlots.Status = Available`.
10. System shows receipt.

Affected tables:

```text
ParkingSessions
Payments
ParkingSlots
PricingPolicies
Incidents, optional
```

---

## 6.3 Reservation Flow

1. Driver selects vehicle type, license plate, reservation time, and optionally a preferred zone.
2. System checks slot availability.
3. System creates `Reservations` record.
4. If a slot is assigned, system updates `ParkingSlots.Status = Reserved`.
5. When driver arrives, staff checks in using reservation information.
6. Reservation becomes `CheckedIn`.
7. Parking session is created and slot becomes `Occupied`.
8. If driver does not arrive, reservation becomes `Expired` and slot returns to `Available`.

Affected tables:

```text
Reservations
ParkingSlots
ParkingSessions
Users
VehicleTypes
ParkingZones
```

---

## 6.4 Incident Handling Flow

1. Staff or driver reports an issue.
2. Staff creates an `Incidents` record.
3. System applies `PenaltyFee` if needed.
4. Incident remains `Open` until reviewed or solved.
5. Manager or Staff resolves the incident.
6. `ResolvedAt` is set and `Status = Resolved`.

Affected tables:

```text
Incidents
ParkingSessions
Payments, optional
ParkingSlots, optional
Users
```

---

## 6.5 Reporting Flow

Reports can be generated in two ways.

### Option 1: Query Directly

Generate reports directly from:

```text
ParkingSessions
Payments
VehicleTypes
ParkingZones
ParkingSlots
```

This is simpler and avoids storing duplicate report data.

### Option 2: Use ReportSnapshots

Store daily or monthly summary data in `ReportSnapshots` for faster dashboard loading.

This is useful for:

- Total revenue
- Total entries
- Total exits
- Occupancy rate
- Peak hour
- Vehicle type statistics

---

## 7. UI Mapping by Role

## 7.1 System Administrator

| Screen | Related Tables |
|---|---|
| Admin Dashboard | `Users`, `Roles`, `SystemConfigs` |
| User Management | `Users`, `Roles` |
| Role & Permission | `Roles` |
| System Configuration | `SystemConfigs` |
| Reports | `ReportSnapshots`, `ParkingSessions`, `Payments` |

---

## 7.2 Parking Facility Manager

| Screen | Related Tables |
|---|---|
| Manager Dashboard | `ParkingSlots`, `ParkingSessions`, `Payments`, `Incidents`, `ReportSnapshots` |
| Facility Info | `ParkingFacility` |
| Vehicle Types | `VehicleTypes` |
| Parking Zones | `ParkingZones`, `VehicleTypes` |
| Slot Map | `ParkingSlots`, `ParkingZones`, `ParkingSessions`, `Reservations` |
| Pricing Policies | `PricingPolicies`, `VehicleTypes` |
| Reservations | `Reservations`, `Users`, `ParkingSlots` |
| Incident Review | `Incidents`, `ParkingSessions`, `Users` |
| Reports | `ReportSnapshots`, `ParkingSessions`, `Payments`, `VehicleTypes` |

---

## 7.3 Parking Staff

| Screen | Related Tables |
|---|---|
| Staff Dashboard | `ParkingSessions`, `ParkingSlots`, `Incidents` |
| Vehicle Check-In | `ParkingSessions`, `ParkingSlots`, `VehicleTypes`, `ParkingZones`, `Reservations` |
| Vehicle Check-Out | `ParkingSessions`, `Payments`, `PricingPolicies`, `ParkingSlots` |
| Slot Map | `ParkingSlots`, `ParkingZones`, `ParkingSessions` |
| Incident Handling | `Incidents`, `ParkingSessions`, `Users` |

---

## 7.4 Parking User / Driver

| Screen | Related Tables |
|---|---|
| Parking Info | `ParkingFacility`, `VehicleTypes`, `PricingPolicies`, `ParkingSlots`, `ParkingZones` |
| My Reservations | `Reservations`, `ParkingSlots`, `VehicleTypes`, `ParkingZones` |
| My Sessions | `ParkingSessions`, `Payments` |
| Driver Payment | `Payments`, `ParkingSessions` |
| Feedback / Report Issue | `Feedbacks`, `ParkingSessions` |
| AI Assistant | `SystemConfigs`, live data from parking tables |

---

## 8. AI Slot Allocation Logic

The database supports an AI-assisted or rule-based slot allocation feature.

The allocation logic should use:

```text
VehicleTypes
ParkingZones
ParkingSlots
ParkingSessions
Reservations
```

Basic allocation rule:

1. Filter zones by requested vehicle type.
2. Find slots with `Status = Available`.
3. Prefer the zone with higher availability ratio.
4. Prefer slots closer to entry gate if that data exists.
5. Assign the selected slot to the session or reservation.

Since the current simplified database does not store distance-to-gate, agents can implement basic load balancing by availability ratio:

```text
Available slots / Capacity
```

Recommended logic:

```text
Choose the active zone for the vehicle type with the highest availability percentage.
Then choose the first available slot in that zone.
```

---

## 9. Important Status Transition Rules

## 9.1 Slot Status

```text
Available → Occupied      when a parking session starts
Available → Reserved      when a reservation is confirmed
Reserved → Occupied       when reserved driver checks in
Reserved → Available      when reservation is cancelled or expired
Occupied → Available      when parking session is completed
Available → Maintenance   when manager/staff marks slot for repair
Maintenance → Available   when repair is completed
Available → Locked        when slot is temporarily blocked
Locked → Available        when slot is unlocked
```

---

## 9.2 Reservation Status

```text
Pending → Confirmed
Confirmed → CheckedIn
Confirmed → Cancelled
Confirmed → Expired
```

---

## 9.3 Parking Session Status

```text
Active → Completed
Active → Unpaid
Active → Cancelled
Unpaid → Completed
```

---

## 9.4 Payment Status

```text
Pending → Completed
Pending → Failed
Completed → Refunded
```

---

## 9.5 Incident Status

```text
Open → Resolved
Open → Cancelled
```

---

## 10. Suggested API Modules

Agents building backend APIs should group endpoints as follows:

| Module | Example Endpoints |
|---|---|
| Auth | `/api/auth/login`, `/api/auth/logout` |
| Users | `/api/users`, `/api/roles` |
| Facility | `/api/facility` |
| Vehicle Types | `/api/vehicle-types` |
| Zones | `/api/zones` |
| Slots | `/api/slots`, `/api/slots/map` |
| Pricing | `/api/pricing-policies` |
| Reservations | `/api/reservations` |
| Sessions | `/api/parking-sessions/check-in`, `/api/parking-sessions/check-out` |
| Payments | `/api/payments` |
| Incidents | `/api/incidents` |
| Feedbacks | `/api/feedbacks` |
| Reports | `/api/reports/dashboard`, `/api/reports/sessions`, `/api/reports/revenue` |
| Configs | `/api/system-configs` |
| AI Assistant | `/api/ai/slot-suggestion`, `/api/chatbot/message` |

---

## 11. Tables That Are Optional

The following tables can be removed if the project needs an even smaller scope.

| Table | Can Remove? | Reason |
|---|---|---|
| `Feedbacks` | Yes | Driver feedback is optional and can be merged into `Incidents` |
| `ReportSnapshots` | Yes | Reports can be generated directly from `ParkingSessions` and `Payments` |
| `SystemConfigs` | Not recommended | Needed for Admin configuration requirement |

Recommended minimum version:

```text
Roles
Users
ParkingFacility
VehicleTypes
ParkingZones
ParkingSlots
PricingPolicies
Reservations
ParkingSessions
Payments
Incidents
SystemConfigs
```

---

## 12. Notes for Different Agents

## 12.1 For UI Agents

Use this database to design screens around actual entities:

- Slot Map should be based on `ParkingSlots`, `ParkingZones`, and `ParkingSessions`.
- Check-in should create `ParkingSessions` and update `ParkingSlots`.
- Check-out should update `ParkingSessions`, create `Payments`, and release `ParkingSlots`.
- Driver portal should use `Reservations`, `ParkingSessions`, `Payments`, and `Feedbacks`.
- Reports should use `ParkingSessions`, `Payments`, and optionally `ReportSnapshots`.

## 12.2 For Backend Agents

Focus on transaction consistency:

- Check-in must create session and update slot status together.
- Check-out must create payment, complete session, and release slot together.
- Reservation cancellation or expiration must release the slot.
- Do not allow duplicate active sessions for the same license plate.
- Do not assign slots that are not `Available`.

## 12.3 For Database Agents

Recommended constraints and indexes:

- Unique `Users.Email`.
- Unique `Roles.RoleName`.
- Unique `VehicleTypes.TypeCode`.
- Unique `ParkingZones.ZoneCode`.
- Primary key `ParkingSlots.SlotID`.
- Unique `ParkingSessions.TicketCode`.
- Index `ParkingSessions.LicensePlate`.
- Index `ParkingSessions.Status`.
- Index `ParkingSessions.SlotID`.
- Unique `ReportSnapshots(ReportDate, VehicleTypeID)`.

## 12.4 For AI Agents

AI features should not bypass core business rules.

AI can support:

- Slot suggestion
- FAQ chatbot
- Incident handling guidance
- Fee explanation
- Availability explanation

AI should not directly:

- Modify payment records without user confirmation
- Complete a parking session without staff action
- Override slot status without authorized user confirmation
- Delete historical operational records

---

## 13. Summary

This PBMS database is a simplified but complete schema for a realistic parking building management system. It supports all main roles and core requirements:

- Admin manages users, roles, and system configs.
- Manager manages facility, vehicle types, zones, slots, pricing, reservations, incidents, and reports.
- Staff handles vehicle entry, exit, payments, slot status, and incidents.
- Driver views parking information, reserves slots, tracks sessions, pays fees, and submits feedback.

The most important operational tables are:

```text
ParkingSlots
Reservations
ParkingSessions
Payments
Incidents
```

The most important setup tables are:

```text
ParkingFacility
VehicleTypes
ParkingZones
PricingPolicies
```

Agents should treat this document as the primary explanation of the simplified PBMS database design.

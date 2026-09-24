# Aqua Track — Master Specification

**Version:** 1.0
**Status:** Development Specification
**Purpose:** Source of truth for product, architecture, implementation, and testing

---

# 1. Project Overview

## 1.1 Product Name

**Aqua Track**

## 1.2 Product Type

A role-based laundry tracking and workflow management web application.

## 1.3 Core Problem

Students who submit laundry to a laundry service currently have limited visibility into the laundry lifecycle.

They often do not know:

* whether pickup is available today
* whether their bag has actually been collected
* whether it has reached the washing facility
* whether washing has started
* whether washing is complete
* whether the laundry is ready for delivery
* whether it is out for delivery
* whether it has been delivered

Aqua Track solves this by connecting the physical laundry workflow with a digital tracking system.

## 1.4 Core Value Proposition

Aqua Track provides:

> **Real-time visibility into the journey of a student's laundry from collection to delivery.**

For staff, Aqua Track provides:

> **A structured, QR-based system for tracking every physical handoff of laundry.**

---

# 2. Core Product Principle

Every meaningful physical event should produce a corresponding digital event.

Examples:

Physical event:
Delivery boy receives a laundry bag.

Digital event:
`COLLECTED`

Physical event:
Bag reaches washing facility.

Digital event:
`RECEIVED_AT_FACILITY`

Physical event:
Washing starts.

Digital event:
`UNDER_WASHING`

Physical event:
Washing completes.

Digital event:
`READY_FOR_DELIVERY`

Physical event:
Delivery boy takes the bag for delivery.

Digital event:
`OUT_FOR_DELIVERY`

Physical event:
Student receives the bag.

Digital event:
`DELIVERED`

This principle must guide the database, backend, UI, audit trail, and notification architecture.

---

# 3. Terminology

## User / Student

The customer who owns/submits laundry.

## Delivery Boy

The staff member responsible for collecting laundry from students and delivering processed laundry back to students.

## Washing Staff

Staff responsible for receiving and processing laundry at the washing facility.

## Admin

System operator responsible for managing users, staff, facilities, laundry operations, complaints, and system configuration.

## Bag

The physical laundry bag with a permanent Aqua Track QR identity.

## Laundry Order

A single laundry transaction created when a student submits a bag.

A physical bag can be reused for many laundry orders over time.

## Pickup Session

A scheduled collection window at a particular hostel.

## Washing Batch

A group of laundry orders processed/received together at a washing facility.

## Delivery Batch

A group of ready laundry orders taken by a delivery boy for delivery to a hostel.

---

# 4. Actors and Permissions

## 4.1 Student

Can:

* authenticate
* view their profile
* view pickup announcements relevant to them
* view active laundry
* view laundry details
* view status history
* view laundry history
* receive notifications
* mark notifications as read
* report laundry problems
* view their complaints
* communicate with relevant delivery staff

Cannot:

* scan bags as part of normal operations
* modify laundry status
* access other students' laundry
* create staff batches
* modify users
* modify system configuration

---

## 4.2 Delivery Boy

Can:

* view assigned pickup sessions
* create pickup sessions where authorized
* announce pickup
* start pickup
* scan bags for collection
* accept valid bags
* view collection progress
* view assigned delivery batches
* create delivery batches where authorized
* start delivery
* scan bags during delivery
* confirm delivery
* record failed delivery attempts
* communicate with relevant students

Cannot:

* modify arbitrary orders
* change their own role
* access unrelated operational data
* modify system configuration
* bypass valid status transitions

---

## 4.3 Washing Staff

Can:

* view assigned facility
* view incoming washing batches
* receive laundry
* scan bags
* start washing
* mark laundry as washed
* view relevant processing queues

Cannot:

* deliver laundry
* modify arbitrary student records
* change roles
* access unrelated facilities
* bypass status transitions

---

## 4.4 Admin

Can:

* manage users
* manage hostels
* manage facilities
* manage bags
* view all laundry orders
* view all batches
* manage complaints
* view audit logs
* perform controlled administrative corrections
* view operational analytics
* configure system settings

Administrative actions must be auditable.

---

# 5. Laundry Lifecycle

The standard lifecycle is:

```text
COLLECTED
    ↓
RECEIVED_AT_FACILITY
    ↓
UNDER_WASHING
    ↓
READY_FOR_DELIVERY
    ↓
OUT_FOR_DELIVERY
    ↓
DELIVERED
```

Additional operational status:

```text
OUT_FOR_DELIVERY
    ↓
DELIVERY_ATTEMPTED
    ↓
OUT_FOR_DELIVERY
```

`PICKUP_AVAILABLE` is NOT a laundry order status.

Pickup availability belongs to the pickup session.

---

# 6. Status Transition Rules

Valid transitions:

| Current Status       | Next Status          | Authorized Role |
| -------------------- | -------------------- | --------------- |
| COLLECTED            | RECEIVED_AT_FACILITY | Washing Staff   |
| RECEIVED_AT_FACILITY | UNDER_WASHING        | Washing Staff   |
| UNDER_WASHING        | READY_FOR_DELIVERY   | Washing Staff   |
| READY_FOR_DELIVERY   | OUT_FOR_DELIVERY     | Delivery Boy    |
| OUT_FOR_DELIVERY     | DELIVERED            | Delivery Boy    |
| OUT_FOR_DELIVERY     | DELIVERY_ATTEMPTED   | Delivery Boy    |
| DELIVERY_ATTEMPTED   | OUT_FOR_DELIVERY     | Delivery Boy    |

Invalid arbitrary transitions must be rejected.

Example:

```text
COLLECTED → DELIVERED
```

must not be allowed during normal operation.

Administrative corrections require an explicit admin operation and a reason.

---

# 7. Physical Bag Architecture

Every physical bag has a permanent identity.

Example:

```text
BAG-AQ-001283
```

The QR code must contain a secure token or equivalent non-sensitive identifier.

The QR must NOT expose:

* student name
* phone number
* room number
* email
* other sensitive personal information

The same bag can be reused.

Example:

```text
BAG-AQ-001283

September 10
→ Order A

September 17
→ Order B

September 23
→ Order C
```

Every submission creates a new laundry order.

---

# 8. Laundry Order Architecture

A laundry order represents one specific submission event.

Example:

```text
Order:
ORD-20260923-001283

Student:
Bichel

Bag:
BAG-AQ-001283

Status:
UNDER_WASHING
```

A completed order must never be deleted as part of normal delivery.

Instead:

```text
status = DELIVERED
completed_at = timestamp
```

The order remains available in history.

This is required for:

* complaints
* disputes
* customer support
* analytics
* auditability
* historical records

---

# 9. Pickup Workflow

## Step 1 — Create Pickup Session

Delivery staff creates a session:

```text
Hostel: KP5A
Date: 23 September
Start: 10:00 AM
End: 12:00 PM
```

Initial status:

`SCHEDULED`

---

## Step 2 — Announce Pickup

Session becomes:

`ANNOUNCED`

Relevant students receive a notification.

Example:

> Laundry pickup is available today at KP5A reception from 10:00 AM to 12:00 PM.

---

## Step 3 — Start Pickup

Session becomes:

`ACTIVE`.

At the same time, the system creates one `Washing Batch` for the pickup session.

```text
Pickup Session
      ↓
Washing Batch
      ↓
Collected orders
```

The batch is associated with the single active washing facility.

The delivery boy opens the universal scanner once and keeps it available throughout the pickup operation.

---

## Step 4 — Student Submits Bag

Student physically gives the bag to the delivery boy.

Student does not normally scan anything.

---

## Step 5 — Universal Scanner

The delivery boy uses one continuously available scanner.

The scanner accepts either:

* QR code
* roll number fallback

The scanner does not decide the business operation itself. It sends the identifier to the server.

The backend resolves:

```text
QR / Roll Number
        ↓
Bag / Student
        ↓
Current active order, if any
        ↓
Current operational context
        ↓
Authorized action
```

After a successful operation, the scanner automatically returns to the ready state for the next person.

The same scanner can be used for both dirty-laundry collection and clean-laundry delivery during an active hostel operation.

---

## Step 6 — Validate Collection

If the identified bag has no active laundry order, the system evaluates collection eligibility.

It must verify:

* identifier is valid
* bag exists
* bag is active
* owner exists
* owner belongs to the relevant hostel
* bag does not already have an active laundry order
* pickup session is active
* delivery boy is authorized for the session

If valid, the scanner shows a collection confirmation.

---

## Step 7 — Create Laundry Order

After collection is confirmed, create:

```text
Laundry Order
status = COLLECTED
```

Also create:

```text
status_history
notification
```

The new order is automatically attached to the `Washing Batch` belonging to the current pickup session.

The client must never choose the washing batch.

Student immediately sees the updated status.

---

## Step 8 — Continue Scanning

After collection succeeds:

```text
Collection confirmed
        ↓
Scanner resets
        ↓
Ready for next scan
```

No scanner restart or navigation away from the scanner is required.

---

## Step 9 — Finish Pickup

When collection is finished, the delivery boy completes the pickup session.

The pickup session becomes:

`COMPLETED`

The associated washing batch remains:

`CREATED`

The physical batch is then transported to the washing facility.

Completing the pickup must not mark individual orders as `RECEIVED_AT_FACILITY`. Facility receipt is a separate whole-batch operation.

---

## Step 10 — Mixed Collection and Delivery at the Same Hostel

The same universal scanner can be used when clean laundry is being delivered.

If the scanned bag has an active order with status:

`OUT_FOR_DELIVERY`

the scanner shows the delivery confirmation operation instead of collection.

Therefore the operator can process people in any order:

```text
Student A → dirty bag → COLLECT
Student B → clean bag → DELIVER
Student C → dirty bag → COLLECT
Student D → clean bag → DELIVER
```

The backend decides which operation is valid from the current order status and operational context.

# 10. Duplicate Bag Protection

A bag with an active laundry order cannot create another active laundry order.

Example:

```text
BAG-AQ-001283
Current active order:
ORD-20260923-001283
```

A second collection attempt must produce a clear error.

Example:

> This bag already has an active laundry order.

No duplicate order should be created.

---

# 11. Wrong Hostel Protection

If a pickup session is for KP5A and the scanned bag belongs to a student assigned to KP5B:

The operation must be rejected by default.

Example:

> This bag belongs to a different pickup location.

Any exception must be explicitly handled by authorized staff/admin.

---

# 12. Washing Workflow

## Step 1 — Receive Washing Batch

Laundry reaches the single washing facility.

Washing staff does not scan every bag to receive the shipment.

Instead, washing staff receives the entire washing batch.

The batch transitions:

```text
CREATED
→
RECEIVED
```

The system records the batch receipt timestamp.

All laundry orders attached to that batch are now considered to have reached the facility.

The corresponding orders transition through the centralized status-transition service:

```text
COLLECTED
→
RECEIVED_AT_FACILITY
```

This is a batch-level physical handoff, not an individual bag-receiving scan.

---

## Step 2 — Process Bags Individually

After the batch has been received, washing staff processes bags one at a time.

The washing interface provides a continuously accessible scanner.

Washing staff scans the bag QR.

The backend resolves:

```text
QR
 ↓
Bag
 ↓
Active laundry order
 ↓
Washing batch
 ↓
Current status
```

The system validates that:

* the bag belongs to an active order
* the order belongs to the received washing batch
* the order is currently `RECEIVED_AT_FACILITY`
* the washing staff is authorized for the facility

If valid, the interface shows the action:

`Start Washing`

---

## Step 3 — Start Washing

Authorized washing staff starts processing the scanned bag.

The order transitions:

```text
RECEIVED_AT_FACILITY
→
UNDER_WASHING
```

The batch moves to:

`PROCESSING`

when processing begins according to the batch workflow.

---

## Step 4 — Complete Washing

When processing for an individual order is complete:

```text
UNDER_WASHING
→
READY_FOR_DELIVERY
```

The student receives a notification.

The completed order becomes eligible to join a delivery batch.

---

## Step 5 — Complete Washing Batch

When all orders in the washing batch have completed their washing workflow, the washing batch becomes:

`COMPLETED`

The batch lifecycle is:

```text
CREATED
→
RECEIVED
→
PROCESSING
→
COMPLETED
```

Individual laundry orders retain their own lifecycle and status history.

# 13. Delivery Workflow

Delivery staff sees ready laundry grouped by hostel.

Ready orders can be added to a `Delivery Batch`.

Example:

```text
Delivery Batch:
DB-20260923-001

Hostel:
KP5A

Orders:
18
```

A delivery batch contains only orders that are eligible for delivery and belong to the relevant hostel.

---

# 14. Prepare and Start Delivery Batch

When the delivery batch is complete, it becomes:

`READY`

The delivery boy picks up the physical batch from the washing facility.

When delivery starts, the whole delivery batch becomes:

`OUT_FOR_DELIVERY`.

The orders in the batch transition:

```text
READY_FOR_DELIVERY
→
OUT_FOR_DELIVERY
```

Students in the delivery batch receive a notification that their laundry is out for delivery.

Example:

> Your laundry is out for delivery today.

The batch lifecycle is:

```text
CREATED
→
READY
→
OUT_FOR_DELIVERY
→
COMPLETED
```

The batch must not be started if it contains orders that are not eligible for delivery.

---

# 15. Universal Hostel Scanner and Confirm Delivery

At the hostel, the delivery boy opens the same universal scanner used for collection.

The scanner remains active and can process students continuously.

When a student arrives with clean laundry:

```text
Scan QR / enter roll number
        ↓
Resolve bag
        ↓
Resolve active order
        ↓
Verify OUT_FOR_DELIVERY
        ↓
Verify order belongs to this delivery batch
        ↓
Show delivery confirmation
```

The backend validates:

* identifier is valid
* bag exists
* bag has an active order
* order belongs to the delivery batch
* order is `OUT_FOR_DELIVERY`
* delivery boy is authorized
* bag/order has not already been delivered

After confirmation:

```text
OUT_FOR_DELIVERY
→
DELIVERED
```

Set:

```text
completed_at = timestamp
```

Create:

* status history
* notification
* audit information where applicable

After successful delivery:

```text
Delivery confirmed
        ↓
Scanner resets
        ↓
Ready for next scan
```

The delivery batch becomes `COMPLETED` when all of its orders have reached their terminal delivery outcome according to the batch rules.

---

# 15.1 Universal Scanner During Mixed Hostel Operations

The delivery boy may receive both clean-laundry recipients and new dirty-laundry submissions during the same hostel operation.

The universal scanner must therefore support both operations without requiring navigation between separate scanner pages.

Example:

```text
Scan Student A's bag
        ↓
No active order
        ↓
Collection confirmation
        ↓
COLLECTED
        ↓
Scanner ready

Scan Student B's bag
        ↓
OUT_FOR_DELIVERY
        ↓
Delivery confirmation
        ↓
DELIVERED
        ↓
Scanner ready

Scan Student C's bag
        ↓
No active order
        ↓
Collection confirmation
        ↓
COLLECTED
```

The backend remains the source of truth for determining the valid operation.

The QR code itself is identity only.

# 16. Failed Delivery

If the student is unavailable:

```text
OUT_FOR_DELIVERY
→
DELIVERY_ATTEMPTED
```

A reason must be recorded.

Example:

```text
STUDENT_UNAVAILABLE
```

The order remains active.

It can later transition:

```text
DELIVERY_ATTEMPTED
→
OUT_FOR_DELIVERY
```

---

# 17. Status History

Every status transition creates an immutable history event.

Fields conceptually:

```text
laundry_order_id
from_status
to_status
changed_by
reason
created_at
```

Example:

```text
10:32 AM
NULL → COLLECTED
Delivery Boy

12:18 PM
COLLECTED → RECEIVED_AT_FACILITY
Washing Staff

1:04 PM
RECEIVED_AT_FACILITY → UNDER_WASHING
Washing Staff

5:32 PM
UNDER_WASHING → READY_FOR_DELIVERY
Washing Staff

8:10 AM
READY_FOR_DELIVERY → OUT_FOR_DELIVERY
Delivery Boy

11:14 AM
OUT_FOR_DELIVERY → DELIVERED
Delivery Boy
```

History should never be silently overwritten.

---

# 18. Central Status Transition Service

All normal status changes must pass through one centralized business operation.

Conceptually:

```text
transitionOrderStatus(
    orderId,
    targetStatus,
    actor,
    reason?
)
```

It must:

1. authenticate actor
2. determine actor role
3. fetch order
4. validate current status
5. validate target status
6. validate role permission
7. validate ownership/assignment/facility relationship
8. update order
9. insert status history
10. create relevant notification
11. update related batch state if required
12. commit atomically

Do not allow arbitrary direct status updates from client-side code.

---

# 19. Administrative Status Override

Admins may need to correct operational mistakes.

Admin override must:

* require admin authorization
* require a reason
* update the order through a controlled server-side operation
* create status history
* create audit log

Example:

```text
Admin corrected:
DELIVERED → OUT_FOR_DELIVERY

Reason:
Bag was incorrectly marked delivered.
```

---

# 20. Database Entities

The initial database consists conceptually of:

```text
profiles
hostels
facilities
bags
pickup_sessions
laundry_orders
washing_batches
delivery_batches
status_history
notifications
complaints
messages
audit_logs
```

---

# 21. Profiles

Fields:

```text
id
full_name
phone
role
hostel_id
room_number
avatar_url
is_active
created_at
updated_at
```

Authentication identity is managed by Supabase Auth.

`profiles.id` corresponds to the authenticated Supabase user ID.

---

# 22. Hostels

Fields:

```text
id
name
code
address
is_active
created_at
updated_at
```

`code` must be unique.

---

# 23. Facilities

Fields:

```text
id
name
code
address
is_active
created_at
updated_at
```

`code` must be unique.

---

# 24. Bags

Fields:

```text
id
bag_code
qr_token
owner_id
is_active
created_at
updated_at
```

Constraints:

* `bag_code` unique
* `qr_token` unique
* owner required
* inactive bags cannot normally be used

---

# 25. Pickup Sessions

Fields:

```text
id
hostel_id
delivery_boy_id
scheduled_date
start_time
end_time
status
announced_at
started_at
completed_at
created_at
updated_at
```

Statuses:

```text
SCHEDULED
ANNOUNCED
ACTIVE
COMPLETED
CANCELLED
```

---

# 26. Laundry Orders

Fields:

```text
id
order_number
bag_id
student_id
pickup_session_id
washing_batch_id
delivery_batch_id
status
submitted_at
completed_at
created_at
updated_at
```

`order_number` must be unique.

An active bag cannot have multiple active orders.

---

# 27. Washing Batches

Fields:

```text
id
batch_number
facility_id
created_by
status
received_at
started_at
completed_at
created_at
updated_at
```

Statuses:

```text
CREATED
RECEIVED
PROCESSING
COMPLETED
```

---

# 28. Delivery Batches

Fields:

```text
id
batch_number
hostel_id
delivery_boy_id
status
started_at
completed_at
created_at
updated_at
```

Statuses:

```text
CREATED
READY
OUT_FOR_DELIVERY
COMPLETED
```

---

# 29. Notifications

Fields:

```text
id
user_id
type
title
message
laundry_order_id
is_read
created_at
```

Notifications should be generated automatically for relevant lifecycle events.

---

# 30. Complaints

Fields:

```text
id
complaint_number
laundry_order_id
reported_by
assigned_to
type
description
status
resolved_at
created_at
updated_at
```

Complaint types:

```text
MISSING_ITEM
DAMAGED_ITEM
WRONG_LAUNDRY
DELIVERY_PROBLEM
OTHER
```

Complaint statuses:

```text
OPEN
IN_REVIEW
RESOLVED
CLOSED
```

---

# 31. Messages

V1 fields:

```text
id
sender_id
receiver_id
laundry_order_id
message
read_at
created_at
```

Messaging should remain simple in V1.

A full conversation/thread abstraction can be added later.

---

# 32. Audit Logs

Fields:

```text
id
actor_id
action
entity_type
entity_id
metadata
created_at
```

Use audit logs for significant administrative and exceptional actions.

Examples:

```text
ADMIN_UPDATED_USER
ADMIN_DISABLED_BAG
ADMIN_RESOLVED_COMPLAINT
ADMIN_CHANGED_ROLE
ADMIN_OVERRIDE_STATUS
```

---

# 33. Data Retention

Do not delete completed laundry orders as part of normal operations.

Do not cascade-delete historical laundry data simply because a user or bag is deactivated.

Prefer:

```text
is_active = false
```

for operational deactivation.

Historical records should remain available to authorized administrators.

---

# 34. Security Architecture

Supabase Row Level Security must be enabled.

## Student

Can access only:

* own profile
* own bags
* own laundry orders
* own status history
* own notifications
* own complaints
* own messages

## Delivery Boy

Can access only:

* assigned pickup sessions
* assigned delivery batches
* relevant orders
* relevant bags
* required student information

## Washing Staff

Can access:

* their assigned facility
* relevant washing batches
* relevant orders

## Admin

Can access the operational dataset according to administrative permissions.

Do not trust client-side role information.

Authorization must be enforced server-side and/or through RLS.

---

# 35. Frontend Architecture

Technology:

* Next.js
* TypeScript
* Tailwind CSS
* shadcn/ui

Application should be responsive.

Student, delivery, and washing interfaces should be mobile-first.

Admin should be desktop-first but responsive.

---

# 36. Route Structure

Conceptually:

```text
/auth/login
/auth/forgot-password

/dashboard
/laundry
/laundry/[id]
/history
/notifications
/complaints
/profile

/delivery/dashboard
/delivery/pickups
/delivery/pickups/[id]
/delivery/deliveries
/delivery/scan

/washing/dashboard
/washing/batches
/washing/queue
/washing/scan

/admin/dashboard
/admin/users
/admin/orders
/admin/bags
/admin/batches
/admin/facilities
/admin/complaints
/admin/analytics
/admin/settings
```

Exact routing may be adjusted during implementation while preserving role separation.

---

# 37. Student UX

The student dashboard must immediately answer:

1. Is pickup available?
2. Where is my laundry?
3. Do I need to do anything?

Main navigation:

```text
Home
Laundry
Notifications
History
Profile
```

Core components:

```text
PickupAnnouncement
ActiveLaundryCard
LaundryTimeline
NotificationCard
ComplaintCard
StatusBadge
```

---

# 38. Delivery UX

The delivery interface must prioritize speed and minimal typing.

Main navigation:

```text
Dashboard
Pickups
Deliveries
Scan
Profile
```

Important components:

```text
PickupSessionCard
CollectionProgress
UniversalQRScanner
BagConfirmation
DeliveryBatchCard
DeliveryConfirmation
```

QR scanning must be easily accessible.

---

# 39. Washing Staff UX

Main navigation:

```text
Dashboard
Batches
Queue
Scan
Profile
```

Prioritize:

* incoming work
* current processing count
* ready count
* QR scanning
* batch receipt and individual bag processing
* one-click status actions

---

# 40. Admin UX

Main navigation:

```text
Dashboard
Orders
Users
Bags
Batches
Facilities
Complaints
Analytics
Settings
```

Admin should have:

* search
* filtering
* pagination
* status filtering
* hostel filtering
* date filtering
* audit visibility
* operational statistics

---

# 41. QR and Universal Scanner Architecture

QR scanning is an interface mechanism, not a business-logic mechanism.

The QR identifies the physical bag. It does not determine the operation.

The delivery scanner also supports roll-number fallback when QR scanning is unavailable.

Flow:

```text
Camera OR Roll Number
 ↓
Identifier
 ↓
Server action
 ↓
Validate identifier
 ↓
Resolve bag / student
 ↓
Resolve active order
 ↓
Resolve operational context
 ↓
Validate authorized operation
 ↓
Perform operation
 ↓
Return scanner to ready state
```

For delivery staff, the same universal scanner supports:

```text
No active order
→
Collection operation, when an active pickup session exists

OUT_FOR_DELIVERY
→
Delivery operation, when the order belongs to the active delivery batch

Other active status
→
Show current status / appropriate operational result

DELIVERED
→
Already delivered / historical result
```

The backend must determine the valid action.

Never trust information encoded directly in the QR.

Never trust the client to choose the laundry order, batch, student, or target status.

---

# 42. Realtime

Supabase Realtime should be used for relevant live updates.

Example:

```text
Washing Staff
     ↓
marks order READY_FOR_DELIVERY
     ↓
Database update
     ↓
Supabase Realtime
     ↓
Student dashboard
     ↓
UI updates without refresh
```

Realtime must not bypass authorization.

---

# 43. Notifications

Important lifecycle events should create notifications.

Examples:

### Pickup

> Laundry pickup is available today.

### Collection

> Your laundry has been collected.

### Facility

> Your laundry has reached the washing facility.

### Washing

> Your laundry is now being washed.

### Ready

> Your laundry is ready for delivery.

### Delivery

> Your laundry is out for delivery.

### Delivered

> Your laundry has been delivered.

---

# 44. Error Handling

Use structured errors.

Example:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_STATUS_TRANSITION",
    "message": "This laundry cannot be marked as delivered."
  }
}
```

Initial error codes:

```text
UNAUTHORIZED
FORBIDDEN
NOT_FOUND
VALIDATION_ERROR
INVALID_QR
BAG_ALREADY_ACTIVE
WRONG_HOSTEL
INVALID_STATUS_TRANSITION
BATCH_MISMATCH
ORDER_NOT_ASSIGNED
SESSION_NOT_ACTIVE
```

User-facing messages should be understandable.

Do not expose database internals or sensitive information.

---

# 45. Validation

Use a schema validation library such as Zod.

Validate all external inputs.

Examples:

```text
createPickupSessionSchema
scanBagSchema
createComplaintSchema
createDeliveryBatchSchema
messageSchema
```

Never assume browser-side validation is sufficient.

Server-side validation is mandatory.

---

# 46. Service Layer

Business logic should be organized into services.

Conceptually:

```text
services/
    laundry.service.ts
    pickup.service.ts
    washing.service.ts
    delivery.service.ts
    notification.service.ts
    complaint.service.ts
```

The frontend should not contain critical business rules.

---

# 47. Project Structure

Recommended structure:

```text
app/
components/
features/
lib/
services/
types/
utils/
supabase/
tests/
public/
```

Feature-specific logic should remain grouped.

Avoid creating a giant collection of unrelated global components.

---

# 48. UI Design System

Use:

* Tailwind CSS
* shadcn/ui
* reusable Aqua Track components

Important reusable components:

```text
StatusBadge
LaundryTimeline
OrderCard
StatCard
QRScanner
NotificationCard
EmptyState
ConfirmDialog
DataTable
SearchBar
```

Human-friendly status labels must be centralized.

Example:

```text
UNDER_WASHING
→
Under Washing
```

```text
READY_FOR_DELIVERY
→
Ready for Delivery
```

Do not duplicate status labels throughout the codebase.

---

# 49. Development Phases

## Phase 1 — Foundation

Implement:

* Next.js
* TypeScript
* Tailwind
* shadcn/ui
* Supabase connection
* environment configuration
* linting
* folder architecture

---

## Phase 2 — Database

Implement:

* migrations
* enums
* tables
* relationships
* constraints
* indexes
* RLS
* seed data

---

## Phase 3 — Authentication

Implement:

* login
* logout
* session handling
* profile creation
* role detection
* protected routes
* role-based redirects

---

## Phase 4 — Student MVP

Implement:

* dashboard
* pickup announcements
* active laundry
* laundry details
* timeline
* history
* notifications
* complaints

---

## Phase 5 — Delivery MVP

Implement:

* dashboard
* pickup sessions
* QR scanner
* bag collection
* collection progress
* delivery batches
* delivery scanner
* delivery confirmation
* failed delivery

---

## Phase 6 — Washing MVP

Implement:

* dashboard
* incoming batches
* QR scanner
* processing queue
* start washing
* mark washed

---

## Phase 7 — Admin

Implement:

* dashboard
* users
* orders
* bags
* hostels
* facilities
* batches
* complaints
* audit logs

---

## Phase 8 — Realtime

Implement:

* live order updates
* notifications
* dashboard counters
* relevant live operational updates

---

## Phase 9 — Testing

Implement:

* unit tests
* integration tests
* database tests
* RLS tests
* workflow tests
* QR tests
* end-to-end tests

---

## Phase 10 — Deployment

Implement:

* production Supabase project
* production database migrations
* Vercel deployment
* production environment variables
* monitoring
* error tracking
* final security review

---

# 49.1 Universal Scanner Acceptance Requirements

The delivery scanner is considered functional only when all of the following work:

```text
✓ Camera can remain active for repeated scans
✓ QR token can be recognized
✓ Roll number can be used as fallback
✓ Identifier is validated server-side
✓ Bag is resolved
✓ Current active order is resolved
✓ No-active-order collection is recognized
✓ OUT_FOR_DELIVERY delivery is recognized
✓ Already-delivered state is handled safely
✓ In-progress statuses show the appropriate result
✓ Collection confirmation creates a COLLECTED order
✓ Collected order automatically joins the active pickup's washing batch
✓ Delivery confirmation marks the order DELIVERED
✓ Successful action resets the scanner for the next person
✓ Duplicate scans do not create duplicate orders
✓ Invalid identifiers are rejected
✓ Wrong hostel is rejected
✓ Wrong delivery batch is rejected
✓ Unauthorized delivery staff is rejected
✓ Network/camera errors leave the station in a safe recoverable state
✓ Collection and delivery can be interleaved at the same scanner
```

# 50. Testing Requirements

A feature is not complete simply because its UI renders.

For QR collection, for example, the system must test:

```text
✓ Camera works
✓ QR recognized
✓ Token validated
✓ Bag exists
✓ Bag active
✓ Owner exists
✓ Owner belongs to relevant hostel
✓ No active order exists
✓ Pickup session active
✓ Delivery boy authorized
✓ Order created
✓ Status history created
✓ Notification created
✓ Realtime update works
✓ Duplicate scan rejected
✓ Invalid QR rejected
✓ Wrong hostel rejected
✓ Unauthorized user rejected
```

Equivalent tests must exist for every major workflow.

---

# 51. Important Edge Cases

The system must account for:

* duplicate QR scan
* continuous scanner reset after successful operation
* mixed collection and delivery at the same scanner
* invalid QR
* inactive bag
* wrong hostel
* wrong delivery boy
* unauthorized washing staff
* already-delivered order
* order missing from batch
* delivery attempt
* student unavailable
* damaged laundry
* missing item
* incorrect delivery confirmation
* duplicate active order
* cancelled pickup
* incomplete batch
* network interruption
* camera permission denied
* realtime connection failure

The application should fail safely.

---

# 52. MVP Scope

The first production-capable version should include:

* authentication
* role-based access
* student dashboard
* delivery dashboard
* washing dashboard
* admin dashboard
* bag registration
* QR generation
* QR scanning
* batch receipt and individual bag processing
* pickup sessions
* laundry orders
* washing workflow
* delivery workflow
* status history
* notifications
* laundry history
* complaints
* audit logs
* RLS
* realtime status updates

---

# 53. Explicitly Out of MVP

Do not implement unless later requested:

* payment processing
* subscription billing
* route optimization
* AI prediction
* advanced customer loyalty
* complex WhatsApp integration
* full-scale chat platform
* multi-vendor marketplace
* automated SMS infrastructure
* native Android/iOS apps
* advanced business intelligence

Architecture may leave room for these features, but they should not distract from the MVP.

---

# 54. Cursor Development Rules

Cursor must treat this document as the source of truth.

## Rule 1

Do not invent business requirements.

## Rule 2

Do not silently change database architecture.

## Rule 3

Do not bypass role permissions.

## Rule 4

Do not allow client-side code to perform unauthorized database operations.

## Rule 5

Do not directly mutate laundry status outside the centralized status-transition mechanism.

## Rule 6

Do not delete completed laundry orders.

## Rule 7

Do not expose sensitive student information through QR codes.

## Rule 8

Do not build future features unless explicitly requested.

## Rule 9

Prefer reusable components and services.

## Rule 10

Follow existing project conventions before introducing new patterns.

---

# 55. Handling Architectural Conflicts

If a new requirement conflicts with this specification:

1. Identify the conflict.
2. Explain the existing rule.
3. Explain the proposed change.
4. Identify affected database/business logic.
5. Ask for approval before changing an architectural decision.

Do not silently rewrite the architecture.

---

# 56. Cursor Implementation Workflow

Cursor should work incrementally.

Initial instruction:

> Read the complete Aqua Track Master Specification. Do not implement application functionality yet. Analyze the specification, identify contradictions, missing dependencies, or technically ambiguous requirements, and produce an implementation plan.

After approval:

```text
Phase 1
→ Foundation

Phase 2
→ Database

Phase 3
→ Authentication

Phase 4
→ Student

Phase 5
→ Delivery

Phase 6
→ Washing

Phase 7
→ Admin

Phase 8
→ Realtime

Phase 9
→ Testing

Phase 10
→ Deployment
```

Each phase must be completed and verified before moving to the next major phase.

---

# 56.1 Updated Batch and Scanner Definition

The core operational definition is:

```text
PICKUP SESSION
    ↓
START
    ↓
WASHING BATCH CREATED
    ↓
UNIVERSAL SCANNER
    ↓
COLLECT ORDERS
    ↓
PICKUP COMPLETED
    ↓
WHOLE BATCH TO FACILITY
    ↓
BATCH RECEIVED
    ↓
INDIVIDUAL WASHING SCANS
    ↓
READY FOR DELIVERY
    ↓
DELIVERY BATCH
    ↓
WHOLE BATCH OUT FOR DELIVERY
    ↓
UNIVERSAL HOSTEL SCANNER
    ↓
DELIVER / COLLECT INTERLEAVED
    ↓
DELIVERED
```

The scanner identifies the physical bag; the current order status and operational context determine the valid action.

# 57. Definition of Done

A feature is complete only when:

* UI implemented
* loading state implemented
* empty state implemented
* error state implemented
* server-side validation implemented
* authorization implemented
* database operation implemented
* relevant audit/history behavior implemented
* notifications implemented where applicable
* realtime behavior implemented where applicable
* tests implemented
* edge cases considered

---

# 58. Product Success Criteria

Aqua Track's core workflow is considered functional when the following scenario works end-to-end:

```text
1. Delivery boy schedules pickup.
2. Students receive pickup notification.
3. Delivery boy starts pickup.
4. Student gives bag.
5. Delivery boy scans QR.
6. System creates laundry order.
7. Student immediately sees COLLECTED.
8. Washing staff receives bag.
9. Student sees RECEIVED_AT_FACILITY.
10. Washing staff starts washing.
11. Student sees UNDER_WASHING.
12. Washing staff completes washing.
13. Student sees READY_FOR_DELIVERY.
14. Delivery boy creates delivery batch.
15. Order becomes OUT_FOR_DELIVERY.
16. Student receives notification.
17. Delivery boy scans bag.
18. Delivery is confirmed.
19. Order becomes DELIVERED.
20. Student sees completed laundry.
21. Order remains in history.
22. Complete status history is preserved.
```

This is the **critical end-to-end acceptance test** for Aqua Track.

---

# 59. Architectural Philosophy

Aqua Track should be built as a production-quality workflow system, not as a simple CRUD demonstration.

The architecture must prioritize:

* correctness
* traceability
* authorization
* clear state transitions
* auditability
* maintainability
* responsive UX
* operational simplicity

The student experience should remain simple even though the underlying system is sophisticated.

The complexity belongs in the system, not in the user's head.

---

# 60. Current Technology Stack

The initially selected stack is:

```text
Frontend:
Next.js
TypeScript
Tailwind CSS
shadcn/ui

Backend/Application:
Next.js server-side logic
Server Actions/API routes as appropriate

Infrastructure:
Supabase

Database:
PostgreSQL

Authentication:
Supabase Auth

Storage:
Supabase Storage

Realtime:
Supabase Realtime

Serverless logic:
Supabase Edge Functions where appropriate

Deployment:
Vercel + Supabase

QR:
Browser camera QR scanning + QR generation library

Validation:
Zod

Testing:
Unit + Integration + E2E
```

Technology choices can be revisited only through an explicit architectural decision.

---

# 61. Final Product Definition

Aqua Track is:

> **A QR-based laundry tracking and workflow management platform that gives students real-time visibility into their laundry while allowing delivery and washing staff to digitally track every physical handoff from collection through washing to final delivery.**

Core loop:

```text
ANNOUNCE
    ↓
COLLECT
    ↓
SCAN
    ↓
TRACK
    ↓
RECEIVE
    ↓
WASH
    ↓
READY
    ↓
DELIVER
    ↓
SCAN
    ↓
COMPLETE
```

This document is the canonical starting point for implementation.

# Event-Based Notification System Documentation

## base url ws://localhost:5050/notification

The notification system uses an **event-driven architecture** where application events trigger real-time WebSocket notifications. The system consists of three main layers:

1. **Event Emission Layer** - Services emit events when actions occur
2. **Event Listening Layer** - NotificationListener catches and processes events
3. **Notification Delivery Layer** - NotificationGateway broadcasts to connected clients

---

## Event Types and Their Handlers

### Event Type 1: Customer Inquiry Alert

**Event Name:** `CustomerInquiryAlert_CREATE`

**When Emitted:**
- Customer submits contact form
- Inquiry form is successfully saved to database
- System needs to notify support staff immediately

**Event Payload Structure:**

**`payload.meta` (Notification Content):**
- `senderEmail` - Email address of customer submitting inquiry
- `title` - Subject or title of the inquiry
- `message` - Full inquiry message content from customer

**`payload.info` (System Information):**
- `subject` - Categorized subject of inquiry
- `date` - Timestamp when inquiry was submitted
- `recipients` - Array of user objects who should receive notification
  - Each recipient has: `id`, and potentially `name`, `email`

**Handler Behavior:**
- Logs inquiry details: sender email and title
- Creates standardized notification object with type "CustomerInquiryAlert"
- Formats title as: "New Inquiry: {title}"
- Extracts recipient IDs from payload
- Broadcasts to all recipients via WebSocket event: `customer-inquiry-alert`
- Logs confirmation with count of notified users

**WebSocket Event Sent:** `customer-inquiry-alert`

**Who Should Emit This Event:**
- Contact form submission services
- Customer support ticket creation services
- Inquiry management systems
- Any service handling customer communications

---

### Event Type 2: User Registration

**Event Name:** `USERREGISTRATION_CREATE`

**When Emitted:**
- New user successfully completes registration
- User account created in database
- Email verification completed (if required)
- System needs to notify administrators

**Event Payload Structure:**

**`payload.info` (User Information):**
- `id` - Unique identifier of newly created user
- `email` - Email address of new user
- `name` - Optional full name of user
- `role` - Assigned role (CUSTOMER, VENDOR, ADMIN, etc.)
- `recipients` - Array of admin users who should be notified
  - Each recipient has: `id`, and potentially `name`, `email`

**Handler Behavior:**
- Logs new registration with user email
- Creates notification with type "UserRegistration"
- Uses user's name if available, otherwise falls back to email in message
- Formats message as: "{Name or Email} has registered"
- Extracts recipient IDs (typically administrators)
- Broadcasts to all recipients via WebSocket event: `user-registration`
- Logs confirmation identifying recipients as "admin(s)"

**WebSocket Event Sent:** `user-registration`

**Who Should Emit This Event:**
- User authentication services
- Registration controllers
- Account creation services
- Onboarding workflow services
- User management systems



---

### Event Type 4: Product Approval Update

**Event Name:** `productApproveUpdateMeta_UPDATE`

**When Emitted:**
- Administrator reviews submitted product
- Product status changes from PENDING to APPROVED or REJECTED
- Vendor needs notification about decision
- Product workflow state changes

**Event Payload Structure:**

**`payload.info` (Approval Information):**
- `productId` - Unique identifier of the product
- `approverId` - User ID of admin who made the decision
- `status` - Approval status: "APPROVED" or "REJECTED"
- `recipients` - Array of users who should be notified
  - Typically includes product owner/vendor
  - Each recipient has: `id`, and potentially `name`, `email`

**Handler Behavior:**
- Logs product status update with product ID and status
- Creates notification with type "ProductApproveUpdate"
- Formats title as: "Product {STATUS}" (e.g., "Product APPROVED")
- Formats message as: "Your product has been {status}" (lowercase)
- Extracts recipient IDs from payload
- Broadcasts to all recipients via WebSocket event: `product-approve-update`
- Does not log confirmation (silent success)

**WebSocket Event Sent:** `product-approve-update`

**Who Should Emit This Event:**
- Product review services
- Admin approval controllers
- Product moderation systems
- Content management systems
- Vendor management modules

---

## Event Payload Standards

### Common Payload Structure

All events follow a consistent payload structure with two main sections:

**1. `info` Section (System Data):**
- Contains IDs, references, and system-level information
- Includes the `recipients` array
- Data used for routing and tracking
- Typically includes entity IDs, timestamps, status values

**2. `meta` Section (Display Data):**
- Contains human-readable content
- Data shown to end users in notifications
- Includes messages, titles, descriptions
- User-facing information

### Recipients Array Format

The `recipients` field appears in `payload.info` and contains:
- Array of user objects
- Minimum required field: `id` (string)
- Optional fields: `name`, `email`, custom properties
- Used to determine who receives the notification

**Example Recipients:**
```
recipients: [
  { id: 'user-123', name: 'John Doe', email: 'john@example.com' },
  { id: 'user-456', name: 'Jane Smith', email: 'jane@example.com' }
]
```

---

## Notification Object Standard

### Standardized Output Format

Every event handler creates a notification object with this structure:

**Required Fields:**
- `type` - String matching the notification type enum
- `title` - Short headline for the notification
- `message` - Main notification message body
- `createdAt` - JavaScript Date object (converted to ISO string when sent)

**Meta Object:**
- Custom metadata specific to notification type
- Contains IDs and references for client-side actions
- Allows clients to perform context-specific operations
- Structured differently per notification type

### Type-Specific Meta Objects

**CustomerInquiryAlert Meta:**
- `senderEmail` - Contact email of inquiry sender
- `subject` - Categorized inquiry subject
- `date` - When inquiry was submitted

**UserRegistration Meta:**
- `userId` - New user's ID for profile links
- `email` - User's email address
- `role` - User's assigned role



**ProductApproveUpdate Meta:**
- `productId` - For navigating to product page
- `approverId` - For showing who approved
- `status` - APPROVED or REJECTED

---

## Logging Strategy

### Log Levels and Purposes

**Informational Logs (Always Logged):**

1. **Event Receipt Logs**
   - Logged when event is received by handler
   - Includes emoji for quick visual scanning
   - Contains key identifiers (email, ID, status)
   - Format: `📨 Customer Inquiry Alert: email@example.com - Subject`
   - Format: `👤 New User Registration: email@example.com`
   
   - Format: `📦 Product prod789 APPROVED`

2. **Delivery Confirmation Logs**
   - Logged after successful broadcast (some events)
   - Includes count of notified users
   - Format: `✅ Notified 3 user(s) about new inquiry`
   - Format: `✅ Notified 2 admin(s) about new registration`
   - Not all handlers log this (NewMessage and ProductApprove don't)


- Invalid payloads



---




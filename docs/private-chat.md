```markdown
# Private Chat API Documentation

**For Frontend Developers**  
_(One-to-One Chat for Garage Owners)_

This document explains how to implement **real-time private messaging** in your frontend app using the provided NestJS backend.  
It covers both **HTTP REST endpoints** (for initial loading) and **WebSocket (Socket.IO)** connections (for real-time messaging).

### Base URL
```

https://domainname/pv/message

````

### Authentication
All endpoints require a **Bearer JWT token** in the `Authorization` header:

```http
Authorization: Bearer <your-jwt-token>
````

The same token is used for WebSocket connection.

---

### 1. WebSocket Connection (Real-Time Chat)

#### Namespace

```
/pv/message
```

#### Connection Example (using socket.io-client)

```js
import io from 'socket.io-client';

const token = localStorage.getItem('accessToken'); 

const socket = io('https://your-api-domain.com/pv/message', {
  auth: { token: `Bearer ${token}` },
  // OR via query (some versions)
  // query: { token: `Bearer ${token}` }
});

socket.on('connect', () => {
  console.log('Connected to private chat WebSocket');
});

socket.on('private:success', (userId) => {
  console.log('Authenticated as user:', userId);
});

socket.on('private:error', (error) => {
  console.error('WebSocket error:', error.message);
  // Likely invalid/expired token → redirect to login
});

socket.on('disconnect', () => {
  console.log('Disconnected from private chat');
});
```

#### Important Events

| Event                              | Direction | Description                                           | Payload                          |
| ---------------------------------- | --------- | ----------------------------------------------------- | -------------------------------- |
| `private:load_conversations`       | → Server  | Request list of all conversations                     | none                             |
| `private:conversation_list`        | ← Server  | List of conversations with last message               | array of conversations           |
| `private:load_single_conversation` | → Server  | Load full messages of one conversation                | `conversationId` (string)        |
| `private:new_conversation`         | ← Server  | Updated conversation list (sent when new chat starts) | array of conversations           |
| `private:new_message`              | ← Server  | New incoming message (real-time)                      | message object                   |
| `private:send_message`             | → Server  | Send a new message                                    | `SendMessagePayload` (see below) |

---

### 2. REST API Endpoints

#### GET /private-chat

**Get all conversations with last message**

```http
GET /private-chat
Authorization: Bearer <token>
```

**Response**

```json
{
  "success": true,
  "data": [
    {
      "type": "private",
      "chatId": "conv-uuid",
      "participant": {
        "id": "user-uuid",
        "fullName": "John Doe",
        "profilePhoto": "https://cdn.../photo.jpg"
      },
      "lastMessage": {
        "id": "msg-uuid",
        "content": "Hello!",
        "createdAt": "2025-12-24T10:00:00Z",
        "sender": { ... },
        "file": null
      },
      "updatedAt": "2025-12-24T10:00:00Z"
    }
  ],
  "message": "Chats fetched successfully"
}
```

> Use this on app load or pull-to-refresh.

#### GET /private-chat/:conversationId

**Get full conversation messages**

```http
GET /private-chat/conv-uuid
```

**Response**

```json
{
  "conversationId": "conv-uuid",
  "participants": [
    { "id": "...", "fullName": "You", "profilePhoto": "..." },
    { "id": "...", "fullName": "Other User", "profilePhoto": "..." }
  ],
  "messages": [
    {
      "id": "msg-uuid",
      "content": "Hi there",
      "createdAt": "...",
      "sender": { "id": "...", "fullName": "...", "profilePhoto": "..." },
      "files": ["https://cdn.../image.jpg"],
      "replyToMessageId": null
    }
  ]
}
```

#### POST /private-chat/send-message/:recipientId

**Send message via HTTP (with optional file upload)**

> Use this when uploading files (up to 5 files, any type)

```http
POST /private-chat/send-message/user-uuid-123
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

**Form fields:**

| Field            | Type   | Required | Description                        |
| ---------------- | ------ | -------- | ---------------------------------- |
| content          | text   | Yes      | Message text                       |
| file             | file[] | No       | Up to 5 files (images, docs, etc.) |
| replyToMessageId | text   | No       | UUID of message being replied to   |

**Example (using Fetch)**

```js
const formData = new FormData();
formData.append('content', 'Check this out!');
formData.append('file', fileInput.files[0]); // optional
// add more files if needed

fetch(`https://your-api-domain.com/private-chat/send-message/${recipientId}`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    // DO NOT set Content-Type — browser sets it with boundary
  },
  body: formData,
})
  .then((res) => res.json())
  .then((data) => console.log('Message sent:', data));
```

**Response**

```json
{
  "success": true,
  "message": {
    "id": "msg-uuid",
    "content": "Check this out!",
    "files": ["https://your-cdn.com/uploads/...jpg"],
    "sender": { ... },
    "createdAt": "..."
  }
}
```

> The backend will emit `private:new_message` via WebSocket to both users.

---

### 3. Sending Message via WebSocket (No Files)

Use this for **text-only messages** (faster, no upload needed)

```js
socket.emit('private:send_message', {
  recipientId: 'user-uuid-123',
  content: 'Hello from socket!',
  replyToMessageId: 'optional-msg-uuid', 
});
```

> If conversation doesn't exist, it will be created automatically.  
> Both users will receive `private:new_message` and possibly updated conversation list.

---

### Message Object Structure (Received)

```json
{
  "id": "uuid",
  "content": "Hello world",
  "files": [
    "https://cdn.example.com/uploads/image.jpg",
    "https://cdn.example.com/uploads/doc.pdf"
  ],
  "createdAt": "2025-12-24T10:00:00.000Z",
  "sender": {
    "id": "user-uuid",
    "fullName": "Ahmed Ali",
    "profilePhoto": "https://cdn.../photo.jpg"
  },
  "replyToMessageId": "uuid" // or null
}
```

---

### Flow Recommendation for Frontend

1. On login/app start:
   - Connect to WebSocket `/pv/message`
   - On connect → emit `private:load_conversations`
   - Display conversation list

2. When user opens a chat:
   - If messages not loaded → emit `private:load_single_conversation` with `conversationId`
   - OR use HTTP GET `/private-chat/:id` for initial load

3. Sending message:
   - If **no files** → use WebSocket `private:send_message`
   - If **has files** → use HTTP POST with `multipart/form-data`

4. Receiving messages:
   - Listen to `private:new_message` → add to current chat
   - Update conversation list if needed

5. Mark as read (optional):
   - Currently only server-side on delivery. No client-side "seen" yet.

---

### Tips

- Always sort messages by `createdAt` ascending.
- Show sender's profile photo + name.
- Support image preview for file URLs ending in `.jpg|.png|.gif|.webp`.
- Handle WebSocket reconnect on network loss.

You're all set to build a smooth real-time private chat experience! 🚀

If you need Swagger/OpenAPI docs, they are available at:  
`/api` or `/swagger` (depending on config)

```

**How to download:**
1. Copy the entire content above.
2. Paste it into a new file.
3. Save the file as `private-chat-api-documentation.md`.
```

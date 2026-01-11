# Garage Location API - Frontend Integration Guide

## Overview
This API provides two ways to get nearby garage locations:
1. **REST API** - For one-time requests
2. **WebSocket** - For real-time location tracking

---

## REST API Endpoints

### 1. Get Nearby Garages
**Endpoint:** `GET /garages/nearby`

**Description:** Fetch garages within a specified radius of user's location.

**Query Parameters:**
| Parameter | Type | Required | Description | Example | Default |
|-----------|------|----------|-------------|---------|---------|
| `lat` | Number | Yes | User latitude (-90 to 90) | `25.2048` | - |
| `lng` | Number | Yes | User longitude (-180 to 180) | `55.2708` | - |
| `radius` | Number | No | Search radius in km (1-100) | `10` | `10` |

**Example Request:**
```
GET /garages/nearby?lat=25.2048&lng=55.2708&radius=10
```

**Example Response:**
```json
{
  "garages": [
    {
      "id": "garage-id-123",
      "name": "Downtown Garage",
      "location": {
        "lat": 25.2050,
        "lng": 55.2710
      },
      "distance": 0.25,
      "address": "123 Main Street"
    }
  ],
  "total": 1
}
```

---

### 2. Get Single Garage
**Endpoint:** `GET /garages/:id`

**Description:** Get details of a specific garage with optional distance calculation.

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | String | Yes | Garage ID |

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userLat` | Number | No | User latitude for distance calculation |
| `userLng` | Number | No | User longitude for distance calculation |

**Example Request:**
```
GET /garages/garage-id-123?userLat=25.2048&userLng=55.2708
```

**Example Response:**
```json
{
  "id": "garage-id-123",
  "name": "Downtown Garage",
  "location": {
    "lat": 25.2050,
    "lng": 55.2710
  },
  "distance": 0.25,
  "address": "123 Main Street",
  "services": ["oil change", "tire rotation"]
}
```

---

## WebSocket API (Real-time Tracking)

### Connection
**Namespace:** `/garage-location`

**Connection URL:** `ws://your-api-domain/garage-location`

### Events

#### 1. Connect to WebSocket
When you connect, you'll receive a confirmation:

**Event:** `connected`

**Payload:**
```json
{
  "message": "Real-time garage tracking active"
}
```

---

#### 2. Send Location Updates
Send your location to get nearby garages in real-time.

**Event:** `updateLocation`

**Payload:**
```json
{
  "userLat": 25.2048,
  "userLng": 55.2708,
  "radius": 10
}
```

**Validation Rules:**
- `userLat`: -90 to 90
- `userLng`: -180 to 180
- `radius`: 1 to 100 km (optional, defaults to 10)

---

#### 3. Receive Nearby Garages
After sending location, you'll receive nearby garages.

**Event:** `nearbyGarages`

**Payload:**
```json
{
  "garages": [
    {
      "id": "garage-id-123",
      "name": "Downtown Garage",
      "location": {
        "lat": 25.2050,
        "lng": 55.2710
      },
      "distance": 0.25,
      "address": "123 Main Street"
    }
  ],
  "total": 1,
  "userLocation": {
    "lat": 25.2048,
    "lng": 55.2708
  },
  "radius": 10,
  "timestamp": "2024-01-20T10:30:00.000Z"
}
```

---

#### 4. Error Handling
If there's an error, you'll receive:

**Event:** `error`

**Payload:**
```json
{
  "message": "Invalid location or radius"
}
```

or

```json
{
  "message": "Failed to load nearby garages"
}
```

---

## Frontend Implementation Examples

### JavaScript/TypeScript with Socket.IO Client

```javascript
import io from 'socket.io-client';

// Connect to WebSocket
const socket = io('ws://your-api-domain/garage-location', {
  transports: ['websocket']
});

// Listen for connection
socket.on('connected', (data) => {
  console.log(data.message);
});

// Send location update
function updateLocation(lat, lng, radius = 10) {
  socket.emit('updateLocation', {
    userLat: lat,
    userLng: lng,
    radius: radius
  });
}

// Listen for nearby garages
socket.on('nearbyGarages', (data) => {
  console.log('Nearby garages:', data.garages);
  console.log('Total found:', data.total);
  // Update your UI here
});

// Listen for errors
socket.on('error', (error) => {
  console.error('Error:', error.message);
  // Show error message to user
});

// Example: Update location every 5 seconds
if (navigator.geolocation) {
  navigator.geolocation.watchPosition(
    (position) => {
      updateLocation(
        position.coords.latitude,
        position.coords.longitude,
        10
      );
    },
    (error) => {
      console.error('Geolocation error:', error);
    },
    { enableHighAccuracy: true }
  );
}
```

---

### Fetch API (REST)

```javascript
async function getNearbyGarages(lat, lng, radius = 10) {
  try {
    const response = await fetch(
      `https://your-api-domain/garages/nearby?lat=${lat}&lng=${lng}&radius=${radius}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch garages');
    }
    
    const data = await response.json();
    console.log('Nearby garages:', data.garages);
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
}

async function getGarageDetails(garageId, userLat, userLng) {
  try {
    let url = `https://your-api-domain/garages/${garageId}`;
    
    if (userLat && userLng) {
      url += `?userLat=${userLat}&userLng=${userLng}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch garage details');
    }
    
    const data = await response.json();
    console.log('Garage details:', data);
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
}
```

---

## Use Cases

### 1. Static Map View (REST API)
Use REST API when you want to load garages once based on a single location:
- User opens map view
- Fetch garages based on current location
- Display markers on map

### 2. Real-time Tracking (WebSocket)
Use WebSocket when you need continuous updates:
- User is driving/moving
- App tracks location changes
- Automatically updates nearby garages as user moves
- Provides live distance updates

---

## Best Practices

1. **Validation:** Always validate latitude/longitude on the frontend before sending
2. **Error Handling:** Implement proper error handling for both connection issues and data errors
3. **Debouncing:** When using WebSocket with frequent location updates, debounce updates to avoid overwhelming the server
4. **Disconnection:** Handle socket disconnection gracefully and implement reconnection logic
5. **User Permissions:** Request location permissions from users before attempting to access geolocation
6. **Loading States:** Show loading indicators while waiting for data
7. **Fallback:** If WebSocket fails, fallback to REST API

---

## Error Codes & Messages

| Error Message | Cause | Solution |
|---------------|-------|----------|
| `Invalid location or radius` | Coordinates or radius out of range | Check validation rules |
| `Failed to load nearby garages` | Server error during query | Retry request |
| Connection timeout | WebSocket connection failed | Check network/server status |

---

## Rate Limiting & Performance

- WebSocket updates should be throttled to reasonable intervals (recommended: 5-10 seconds minimum)
- REST API calls should be cached when appropriate
- Consider user's data plan when implementing real-time tracking

---

## Support

For additional questions or issues, contact the backend development team.
# 🎟️ Event Ticket Booking & Concurrency API Documentation

This document provides a comprehensive reference for all available REST API endpoints in the **Event Ticket Concurrency API**.

---

## 📌 Global Configuration & Base URL

- **Base URL:** `http://localhost:3000/api/v1`
- **Global API Prefix:** `/api/v1`
- **Content-Type:** `application/json`
- **Authentication:** Bearer Token via HTTP Header (`Authorization: Bearer <JWT_TOKEN>`)
- **Default Seed Users:**
  - `user1@gmail.com` / `password123`
  - `user2@gmail.com` / `password123`
  - `user3@gmail.com` / `password123`
  - `user4@gmail.com` / `password123`
  - `user5@gmail.com` / `password123`

---

## 🗺️ API Endpoints Summary

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/v1` | Health check / Hello endpoint | ❌ No |
| **POST** | `/api/v1/auth/register` | Register a new user account | ❌ No |
| **POST** | `/api/v1/auth/login` | Login with email and password to get JWT token | ❌ No |
| **GET** | `/api/v1/auth/profile` | Get authenticated user profile | 🔒 **Yes (Bearer JWT)** |
| **GET** | `/api/v1/users` | List all registered users | ❌ No |
| **GET** | `/api/v1/users/:id` | Get user details by UUID | ❌ No |
| **POST** | `/api/v1/users` | Create user (admin / test helper) | ❌ No |
| **GET** | `/api/v1/events` | List all available events | ❌ No |
| **GET** | `/api/v1/events/:id` | Get event details by UUID | ❌ No |
| **GET** | `/api/v1/events/:id/seats` | Get seat layout for an event *(Redis Cached 10s)* | ❌ No |
| **POST** | `/api/v1/seats/:id/hold` | Hold seat for 5 mins *(Redis Lock + BullMQ Queue)* | ❌ No |
| **POST** | `/api/v1/bookings/checkout` | Complete payment checkout *(DB Transaction)* | ❌ No |
| **GET** | `/api/v1/bookings/user/:userId` | List all bookings for a specific user | ❌ No |
| **GET** | `/api/v1/bookings/:id` | Get booking details by UUID | ❌ No |

---

## 🔐 1. Authentication Endpoints (`/auth`)

### 1.1 Register New User
Creates a new user in the system with a hashed password.

- **Method:** `POST`
- **URL:** `/api/v1/auth/register`
- **Request Headers:**
  ```http
  Content-Type: application/json
  ```
- **Request Body:**
  ```json
  {
    "name": "John Doe",
    "email": "johndoe@example.com",
    "password": "password123"
  }
  ```
- **Validation Rules:**
  - `name`: String, required.
  - `email`: Valid email format, required, unique.
  - `password`: String, minimum 6 characters.
- **Success Response (`201 Created`):**
  ```json
  {
    "id": "e0b96839-44d5-45dc-bf6a-12e367807be5",
    "email": "johndoe@example.com",
    "name": "John Doe",
    "createdAt": "2026-08-23T06:00:00.000Z",
    "updatedAt": "2026-08-23T06:00:00.000Z"
  }
  ```
- **Error Responses:**
  - `409 Conflict`: User with email already exists.
  - `400 Bad Request`: Validation failure.

---

### 1.2 User Login
Authenticates credentials and returns a signed JWT access token.

- **Method:** `POST`
- **URL:** `/api/v1/auth/login`
- **Request Body:**
  ```json
  {
    "email": "user1@gmail.com",
    "password": "password123"
  }
  ```
- **Success Response (`200 OK` / `201 Created`):**
  ```json
  {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "76495df0-a9cb-4c9f-bfa4-046cf36c0a0c",
      "email": "user1@gmail.com",
      "name": "User One",
      "createdAt": "2026-08-23T05:00:00.000Z",
      "updatedAt": "2026-08-23T05:00:00.000Z"
    }
  }
  ```
- **Error Response:**
  - `401 Unauthorized`: Invalid email or password.

---

### 1.3 Get Authenticated Profile
Retrieves current user details extracted from the JWT token.

- **Method:** `GET`
- **URL:** `/api/v1/auth/profile`
- **Request Headers:**
  ```http
  Authorization: Bearer <YOUR_ACCESS_TOKEN>
  ```
- **Success Response (`200 OK`):**
  ```json
  {
    "id": "76495df0-a9cb-4c9f-bfa4-046cf36c0a0c",
    "email": "user1@gmail.com",
    "name": "User One",
    "createdAt": "2026-08-23T05:00:00.000Z"
  }
  ```
- **Error Response:**
  - `401 Unauthorized`: Missing or invalid Bearer token.

---

## 👥 2. User Management Endpoints (`/users`)

### 2.1 Get All Users
Returns a list of all registered users (excluding password hashes).

- **Method:** `GET`
- **URL:** `/api/v1/users`
- **Success Response (`200 OK`):**
  ```json
  [
    {
      "id": "76495df0-a9cb-4c9f-bfa4-046cf36c0a0c",
      "email": "user1@gmail.com",
      "name": "User One",
      "createdAt": "2026-08-23T05:00:00.000Z"
    },
    {
      "id": "89f3152d-986c-4861-9cbb-c266858e7fca",
      "email": "user2@gmail.com",
      "name": "User Two",
      "createdAt": "2026-08-23T05:00:00.000Z"
    }
  ]
  ```

---

### 2.2 Get User by ID
Fetch individual user info by UUID.

- **Method:** `GET`
- **URL:** `/api/v1/users/:id`
- **Path Parameters:**
  - `id`: User UUID
- **Success Response (`200 OK`):**
  ```json
  {
    "id": "76495df0-a9cb-4c9f-bfa4-046cf36c0a0c",
    "email": "user1@gmail.com",
    "name": "User One",
    "createdAt": "2026-08-23T05:00:00.000Z"
  }
  ```
- **Error Response:**
  - `404 Not Found`: `User with ID <id> not found`

---

### 2.3 Create User (Helper / Admin)
- **Method:** `POST`
- **URL:** `/api/v1/users`
- **Request Body:**
  ```json
  {
    "email": "developer@example.com",
    "name": "Developer Test",
    "password": "password123"
  }
  ```
- **Success Response (`201 Created`):**
  ```json
  {
    "id": "18f50cba-d4f1-4dbf-a398-356a31c51a1e",
    "email": "developer@example.com",
    "name": "Developer Test",
    "createdAt": "2026-08-23T06:05:00.000Z",
    "updatedAt": "2026-08-23T06:05:00.000Z"
  }
  ```

---

## 🎪 3. Events Endpoints (`/events`)

### 3.1 Get All Events
Retrieves all events available in the system.

- **Method:** `GET`
- **URL:** `/api/v1/events`
- **Success Response (`200 OK`):**
  ```json
  [
    {
      "id": "908208d1-d2f6-4993-8cfb-60a66d03d3c7",
      "title": "NestJS Concurrency & Performance Masterclass",
      "description": "Experience NestJS Concurrency & Performance Masterclass with high performance and interactive sessions.",
      "venue": "Convention Hall A",
      "eventDate": "2026-08-24T05:00:00.000Z",
      "totalSeats": 50,
      "createdAt": "2026-08-23T05:00:00.000Z",
      "updatedAt": "2026-08-23T05:00:00.000Z"
    }
  ]
  ```

---

### 3.2 Get Event Details
- **Method:** `GET`
- **URL:** `/api/v1/events/:id`
- **Path Parameters:**
  - `id`: Event UUID
- **Success Response (`200 OK`):**
  ```json
  {
    "id": "908208d1-d2f6-4993-8cfb-60a66d03d3c7",
    "title": "NestJS Concurrency & Performance Masterclass",
    "description": "Experience NestJS Concurrency & Performance Masterclass with high performance and interactive sessions.",
    "venue": "Convention Hall A",
    "eventDate": "2026-08-24T05:00:00.000Z",
    "totalSeats": 50,
    "createdAt": "2026-08-23T05:00:00.000Z",
    "updatedAt": "2026-08-23T05:00:00.000Z"
  }
  ```
- **Error Response:**
  - `404 Not Found`: `Event with ID <id> not found`

---

### 3.3 Get Seat Layout for Event
Fetches all seats and their current availability for an event.
> ⚡ **Performance Note:** Uses **Redis Cache-Aside Pattern** with a 10-second TTL (`cache:event:<eventId>:seats`). Automatically invalidated when a seat is held.

- **Method:** `GET`
- **URL:** `/api/v1/events/:id/seats`
- **Path Parameters:**
  - `id`: Event UUID
- **Success Response (`200 OK`):**
  ```json
  [
    {
      "id": "3bbfe716-e565-4ef5-bc10-09a25b6a71cb",
      "eventId": "908208d1-d2f6-4993-8cfb-60a66d03d3c7",
      "seatNumber": "A-1",
      "price": 50.00,
      "status": "AVAILABLE",
      "heldByUserId": null,
      "heldUntil": null,
      "version": 1,
      "createdAt": "2026-08-23T05:00:00.000Z",
      "updatedAt": "2026-08-23T05:00:00.000Z"
    },
    {
      "id": "764ea604-be3a-4da2-8158-b6395ec40d7c",
      "eventId": "908208d1-d2f6-4993-8cfb-60a66d03d3c7",
      "seatNumber": "A-2",
      "price": 50.00,
      "status": "HELD",
      "heldByUserId": "76495df0-a9cb-4c9f-bfa4-046cf36c0a0c",
      "heldUntil": "2026-08-23T06:10:00.000Z",
      "version": 2,
      "createdAt": "2026-08-23T05:00:00.000Z",
      "updatedAt": "2026-08-23T06:05:00.000Z"
    }
  ]
  ```

---

## ⚡ 4. Seat Reservation & Concurrency (`/seats`)

### 4.1 Hold Seat (5-Minute Temporary Reservation)
Acquires a temporary hold on an available seat. 

**Under the Hood:**
1. Acquires a **Redis Distributed Lock** (`lock:seat:<seatId>`, 5000ms TTL) to handle extreme concurrency.
2. Checks current status in PostgreSQL database.
3. Sets status to `HELD`, assigns `heldByUserId`, and calculates `heldUntil` (now + 5 minutes).
4. Creates a `PENDING` booking record.
5. Enqueues a **BullMQ delayed job** (`seat-expiration`) scheduled to run in 5 minutes to release the seat if unpaid.
6. Invalidates the Redis seat layout cache.
7. Releases the Redis distributed lock.

- **Method:** `POST`
- **URL:** `/api/v1/seats/:id/hold`
- **Path Parameters:**
  - `id`: Seat UUID
- **Request Body:**
  ```json
  {
    "userId": "76495df0-a9cb-4c9f-bfa4-046cf36c0a0c"
  }
  ```
- **Success Response (`200 OK`):**
  ```json
  {
    "seat": {
      "id": "3bbfe716-e565-4ef5-bc10-09a25b6a71cb",
      "eventId": "908208d1-d2f6-4993-8cfb-60a66d03d3c7",
      "seatNumber": "A-1",
      "price": 50.00,
      "status": "HELD",
      "heldByUserId": "76495df0-a9cb-4c9f-bfa4-046cf36c0a0c",
      "heldUntil": "2026-08-23T06:10:00.000Z",
      "version": 2,
      "createdAt": "2026-08-23T05:00:00.000Z",
      "updatedAt": "2026-08-23T06:05:00.000Z"
    },
    "booking": {
      "id": "2da16bc8-745a-4cb6-a67b-1cb2b1968853",
      "userId": "76495df0-a9cb-4c9f-bfa4-046cf36c0a0c",
      "seatId": "3bbfe716-e565-4ef5-bc10-09a25b6a71cb",
      "amount": 50.00,
      "status": "PENDING",
      "expiresAt": "2026-08-23T06:10:00.000Z",
      "createdAt": "2026-08-23T06:05:00.000Z",
      "updatedAt": "2026-08-23T06:05:00.000Z"
    }
  }
  ```
- **Error Responses:**
  - `404 Not Found`: Seat not found.
  - `409 Conflict`: 
    - `Seat <seatNumber> is no longer available (Status: HELD / BOOKED).`
    - `Seat is currently being processed by another user. Please try again.`

---

## 💳 5. Bookings & Checkout Endpoints (`/bookings`)

### 5.1 Checkout Booking (Complete Payment)
Completes payment checkout for a held seat within the 5-minute window.

**Under the Hood:**
1. Starts an atomic **Database Transaction** (`queryRunner`).
2. Validates booking ownership, expiration timestamp, and `PENDING` status.
3. Atomically updates:
   - `Seat.status` = `BOOKED`, clears hold fields.
   - `Booking.status` = `CONFIRMED`.
4. Commits the transaction.

- **Method:** `POST`
- **URL:** `/api/v1/bookings/checkout`
- **Request Body:**
  ```json
  {
    "bookingId": "2da16bc8-745a-4cb6-a67b-1cb2b1968853",
    "userId": "76495df0-a9cb-4c9f-bfa4-046cf36c0a0c",
    "paymentMethod": "CREDIT_CARD"
  }
  ```
- **Validation Rules:**
  - `bookingId`: Valid UUID, required.
  - `userId`: Valid UUID, required.
  - `paymentMethod`: String, required (e.g. `KBZ_PAY`, `WAVE_PAY`, `CREDIT_CARD`, `PAYPAL`).
- **Success Response (`200 OK`):**
  ```json
  {
    "id": "2da16bc8-745a-4cb6-a67b-1cb2b1968853",
    "userId": "76495df0-a9cb-4c9f-bfa4-046cf36c0a0c",
    "seatId": "3bbfe716-e565-4ef5-bc10-09a25b6a71cb",
    "amount": 50.00,
    "status": "CONFIRMED",
    "expiresAt": "2026-08-23T06:10:00.000Z",
    "createdAt": "2026-08-23T06:05:00.000Z",
    "updatedAt": "2026-08-23T06:06:00.000Z",
    "seat": {
      "id": "3bbfe716-e565-4ef5-bc10-09a25b6a71cb",
      "eventId": "908208d1-d2f6-4993-8cfb-60a66d03d3c7",
      "seatNumber": "A-1",
      "price": 50.00,
      "status": "BOOKED",
      "heldByUserId": null,
      "heldUntil": null,
      "version": 3,
      "createdAt": "2026-08-23T05:00:00.000Z",
      "updatedAt": "2026-08-23T06:06:00.000Z"
    }
  }
  ```
- **Error Responses:**
  - `404 Not Found`: Booking not found.
  - `403 Forbidden`: `You do not have access to this booking.`
  - `409 Conflict`: 
    - `Booking <id> has expired past the 5-minute payment window.`
    - `Booking <id> cannot be checked out because its status is CONFIRMED / EXPIRED.`
    - `Seat is no longer held by you.`

---

### 5.2 Get User Bookings
Retrieves all historical and active bookings for a user.

- **Method:** `GET`
- **URL:** `/api/v1/bookings/user/:userId`
- **Path Parameters:**
  - `userId`: User UUID
- **Success Response (`200 OK`):**
  ```json
  [
    {
      "id": "2da16bc8-745a-4cb6-a67b-1cb2b1968853",
      "userId": "76495df0-a9cb-4c9f-bfa4-046cf36c0a0c",
      "seatId": "3bbfe716-e565-4ef5-bc10-09a25b6a71cb",
      "amount": 50.00,
      "status": "CONFIRMED",
      "expiresAt": "2026-08-23T06:10:00.000Z",
      "createdAt": "2026-08-23T06:05:00.000Z",
      "updatedAt": "2026-08-23T06:06:00.000Z",
      "seat": {
        "id": "3bbfe716-e565-4ef5-bc10-09a25b6a71cb",
        "seatNumber": "A-1",
        "price": 50.00,
        "status": "BOOKED",
        "event": {
          "id": "908208d1-d2f6-4993-8cfb-60a66d03d3c7",
          "title": "NestJS Concurrency & Performance Masterclass",
          "venue": "Convention Hall A",
          "eventDate": "2026-08-24T05:00:00.000Z"
        }
      }
    }
  ]
  ```

---

### 5.3 Get Booking Details
Retrieves details of a single booking, including joined Seat, Event, and User entities.

- **Method:** `GET`
- **URL:** `/api/v1/bookings/:id`
- **Path Parameters:**
  - `id`: Booking UUID
- **Success Response (`200 OK`):**
  ```json
  {
    "id": "2da16bc8-745a-4cb6-a67b-1cb2b1968853",
    "userId": "76495df0-a9cb-4c9f-bfa4-046cf36c0a0c",
    "seatId": "3bbfe716-e565-4ef5-bc10-09a25b6a71cb",
    "amount": 50.00,
    "status": "CONFIRMED",
    "expiresAt": "2026-08-23T06:10:00.000Z",
    "createdAt": "2026-08-23T06:05:00.000Z",
    "updatedAt": "2026-08-23T06:06:00.000Z",
    "user": {
      "id": "76495df0-a9cb-4c9f-bfa4-046cf36c0a0c",
      "email": "user1@gmail.com",
      "name": "User One"
    },
    "seat": {
      "id": "3bbfe716-e565-4ef5-bc10-09a25b6a71cb",
      "seatNumber": "A-1",
      "price": 50.00,
      "status": "BOOKED",
      "event": {
        "id": "908208d1-d2f6-4993-8cfb-60a66d03d3c7",
        "title": "NestJS Concurrency & Performance Masterclass",
        "venue": "Convention Hall A",
        "eventDate": "2026-08-24T05:00:00.000Z"
      }
    }
  }
  ```
- **Error Response:**
  - `404 Not Found`: `Booking with ID <id> not found`

---

## 🔄 End-to-End Booking Lifecycle

```
[User Browses Events] ──> GET /api/v1/events
          │
          ▼
[View Seat Availability] ─> GET /api/v1/events/:id/seats (Redis Cached 10s)
          │
          ▼
[Select & Hold Seat] ────> POST /api/v1/seats/:id/hold
          │                ├─ Acquired Redis Distributed Lock
          │                ├─ Seat status = HELD (5 mins)
          │                ├─ Booking status = PENDING
          │                └─ BullMQ delayed job queued (5 min delay)
          │
   ┌──────┴───────────────────────────────────────┐
   │                                              │
[User Pays within 5 Mins]             [User Does Not Pay within 5 Mins]
   │                                              │
   ▼                                              ▼
POST /api/v1/bookings/checkout        [BullMQ Worker executes expire-seat]
   ├─ DB Transaction                             ├─ Seat status reverts to AVAILABLE
   ├─ Seat status = BOOKED                       ├─ Booking status = EXPIRED
   └─ Booking status = CONFIRMED                 └─ Seat released for other users
```

---

## 💻 Quick cURL Examples

### 1. Register a User
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Developer",
    "email": "alice@example.com",
    "password": "password123"
  }'
```

### 2. Login to get Access Token
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user1@gmail.com",
    "password": "password123"
  }'
```

### 3. Get User Profile (Protected)
```bash
curl -X GET http://localhost:3000/api/v1/auth/profile \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

### 4. Fetch All Events
```bash
curl -X GET http://localhost:3000/api/v1/events
```

### 5. Fetch Seats for Event
```bash
curl -X GET http://localhost:3000/api/v1/events/<EVENT_ID>/seats
```

### 6. Hold a Seat (Concurreny Safe)
```bash
curl -X POST http://localhost:3000/api/v1/seats/<SEAT_ID>/hold \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "<USER_ID>"
  }'
```

### 7. Checkout & Pay for Booking
```bash
curl -X POST http://localhost:3000/api/v1/bookings/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "<BOOKING_ID>",
    "userId": "<USER_ID>",
    "paymentMethod": "KBZ_PAY"
  }'
```

### 8. View User's Bookings
```bash
curl -X GET http://localhost:3000/api/v1/bookings/user/<USER_ID>
```

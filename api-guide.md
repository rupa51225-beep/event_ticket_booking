# Event Ticket Booking API - Testing & API Reference Guide (`api-guide.md`)

> **Base URL**: `http://localhost:3000/api/v1`  
> **Headers**: `Content-Type: application/json`

---

## 📌 API Quick Reference

| Category | Method | Endpoint | Description |
|---|---|---|---|
| **Auth** | `POST` | `/api/v1/auth/register` | Register a new user account |
| **Auth** | `POST` | `/api/v1/auth/login` | Authenticate & receive JWT access token |
| **Auth** | `GET` | `/api/v1/auth/profile` | Get current user profile (Requires Bearer JWT) |
| **Users** | `GET` | `/api/v1/users` | List all dummy test users (Get User UUIDs) |
| **Users** | `POST` | `/api/v1/users` | Create a new user |
| **Events** | `GET` | `/api/v1/events` | List 20 active events |
| **Events** | `GET` | `/api/v1/events/:id` | Get event details |
| **Seats** | `GET` | `/api/v1/events/:id/seats` | Get seat matrix layout (Redis Cached) |
| **Seats** | `POST` | `/api/v1/seats/:id/hold` | Hold seat for 5 mins (Redis Atomic Lock) |
| **Bookings** | `POST` | `/api/v1/bookings/checkout` | Confirm payment & complete booking |
| **Bookings** | `GET` | `/api/v1/bookings/user/:userId` | Get user booking history |
| **Bookings** | `GET` | `/api/v1/bookings/:id` | Get booking details |

---

## 🧪 Step-by-Step Postman / cURL Testing Guide

### Step 0: User Registration & JWT Login

**Register User (`POST /api/v1/auth/register`)**:

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "name": "John Doe",
    "password": "password123"
  }'
```

**Login & Receive JWT (`POST /api/v1/auth/login`)**:

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Get Authenticated Profile (`GET /api/v1/auth/profile`)**:

```bash
curl -X GET http://localhost:3000/api/v1/auth/profile \
  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>"
```

---

### Step 1: Get Dummy User UUID
`GET /api/v1/users` ကို ခေါ်ယူပြီး စမ်းသပ်မည့် User ၏ `id` (UUID) ကို ရယူပါ:

```bash
curl -X GET http://localhost:3000/api/v1/users
```

**Sample Response**:
```json
[
  {
    "id": "7b82f6e9-1122-4433-8899-abcdef123456",
    "email": "user1@gmail.com",
    "name": "User One"
  }
]
```

---

### Step 2: Get Events & Seat Layout
`GET /api/v1/events` မှတစ်ဆင့် Event ID ကို ယူပါ:

```bash
curl -X GET http://localhost:3000/api/v1/events
```

ရရှိလာသော Event ID ဖြင့် ထိုပွဲတွင် ရှိသော ခုံ ၅၀ ၏ Status (`AVAILABLE`, `HELD`, `BOOKED`) Matrix ကို ကြည့်ပါ:

```bash
curl -X GET http://localhost:3000/api/v1/events/<EVENT_ID>/seats
```

**Sample Response (Seat Object)**:
```json
[
  {
    "id": "seat-uuid-a1",
    "eventId": "event-uuid-1",
    "seatNumber": "A-1",
    "price": "50.00",
    "status": "AVAILABLE",
    "heldByUserId": null,
    "heldUntil": null
  }
]
```

---

### Step 3: Hold a Seat for 5 Minutes (Redis Atomic Locking)
ခုံ `A-1` ၏ `id` (UUID) နှင့် User ၏ `id` (UUID) တို့ကို သုံး၍ **၅ မိနစ် ခေတ္တ Reserve** ပြုလုပ်ပါ:

```bash
curl -X POST http://localhost:3000/api/v1/seats/<SEAT_ID>/hold \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "7b82f6e9-1122-4433-8899-abcdef123456"
  }'
```

**Sample Response**:
```json
{
  "seat": {
    "id": "seat-uuid-a1",
    "seatNumber": "A-1",
    "status": "HELD",
    "heldByUserId": "7b82f6e9-1122-4433-8899-abcdef123456",
    "heldUntil": "2026-07-31T22:00:00.000Z"
  },
  "booking": {
    "id": "booking-uuid-123",
    "userId": "7b82f6e9-1122-4433-8899-abcdef123456",
    "seatId": "seat-uuid-a1",
    "amount": "50.00",
    "status": "PENDING",
    "expiresAt": "2026-07-31T22:00:00.000Z"
  }
}
```

---

### Step 4: Pay & Confirm Booking (Checkout API)
Step 3 မှ ရရှိလာသော `bookingId` နှင့် `userId` တို့ဖြင့် ၅ မိနစ်အတွင်း ငွေချေအတည်ပြုပါ:

```bash
curl -X POST http://localhost:3000/api/v1/bookings/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "booking-uuid-123",
    "userId": "7b82f6e9-1122-4433-8899-abcdef123456",
    "paymentMethod": "KPay"
  }'
```

**Sample Response**:
```json
{
  "id": "booking-uuid-123",
  "userId": "7b82f6e9-1122-4433-8899-abcdef123456",
  "amount": "50.00",
  "status": "CONFIRMED",
  "seat": {
    "id": "seat-uuid-a1",
    "seatNumber": "A-1",
    "status": "BOOKED"
  }
}
```

---

### Step 5: Test 5-Minute Auto-Release (BullMQ Worker)
1. Step 3 အတိုင်း ခုံတစ်ခုကို Hold ပြုလုပ်ပါ။
2. **ငွေမချေဘဲ (Checkout မခေါ်ဘဲ) ၅ မိနစ် စောင့်ပါ။**
3. ၅ မိနစ်ပြည့်သည်နှင့် NestJS Console Log တွင် အောက်ပါအတိုင်း BullMQ Worker နှိုးလာမည်ဖြစ်သည်:
   ```text
   [SeatExpirationProcessor] ⏱️ Processing 5-minute expiration check for Seat ID: ...
   [SeatExpirationProcessor] ⏰ 5-Minute Timeout! Seat A-2 automatically RELEASED back to AVAILABLE.
   ```
4. `GET /api/v1/events/<EVENT_ID>/seats` ကို ပြန်ခေါ်ကြည့်ပါက ထိုခုံသည် `AVAILABLE` သို့ အလိုအလျောက် ပြန်လည် ရောက်ရှိသွားသည်ကို မြင်တွေ့ရပါမည်။

---

## ⚡ Concurrency Stress Test Command

ခုံတစ်ခုံထဲသို့ **Request ၁၀၀ တစ်ပြိုင်နက်** ပစ်သွင်း၍ Double-Booking မဖြစ်ကြောင်း သက်သေပြရန်:

```bash
npm run test:concurrency
```

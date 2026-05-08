# API Reference — Atelier Shop

This frontend talks to a single REST-style API. Today it's mocked locally in
`js/api/client.js` (which dispatches to `js/api/mock-data.js` and a tiny
localStorage layer), but every endpoint below is the real contract we expect
from a backend.

To swap to a live backend:

1. Open `js/api/client.js`.
2. Set `USE_MOCK = false`.
3. Set `BASE_URL = 'https://your-api.example.com/v1'`.
4. Make sure your server matches the request/response shapes documented here.
5. Make sure your server sets the session cookie with `Set-Cookie:
   atelier_sid=…; HttpOnly; Secure; SameSite=Lax; Path=/`. The frontend already
   sends `credentials: 'include'`.

All endpoints return JSON and use standard HTTP status codes (`200`, `201`,
`400`, `401`, `403`, `404`, `409`, `500`).

---

## Authentication

The API uses a **session cookie** named `atelier_sid`. After a successful
login or registration, the server sets the cookie and the browser sends it
automatically on every subsequent request.

| Cookie name      | Purpose                                          | Lifetime |
|------------------|--------------------------------------------------|----------|
| `atelier_sid`    | Session id (used by server to look up the user)  | 7 days   |
| `atelier_guest`  | Anonymous cart owner id (set automatically)      | 30 days  |

In production the session cookie should be `HttpOnly`, `Secure`, and
`SameSite=Lax`. The mock implementation uses a regular cookie so the demo
can show how it works.

---

## Products

### `GET /products`

List all products. All filter parameters are optional and combinable.

**Query parameters**

| Name        | Type    | Description                                            |
|-------------|---------|--------------------------------------------------------|
| `search`    | string  | Free-text search (name, description, tags)            |
| `category`  | string  | Category id, e.g. `kitchen`. Use `all` or omit for all |
| `minPrice`  | number  | Minimum price (inclusive)                              |
| `maxPrice`  | number  | Maximum price (inclusive)                              |
| `sort`      | string  | `newest` \| `price-asc` \| `price-desc` \| `rating`     |

**Response 200**
```json
{
  "items": [
    {
      "id": "p_001",
      "name": "Aged Brass Desk Lamp",
      "slug": "aged-brass-desk-lamp",
      "category": "lighting",
      "price": 189.00,
      "currency": "EUR",
      "stock": 12,
      "description": "Short description…",
      "longDescription": "Full description…",
      "image": "https://…",
      "images": ["https://…", "https://…"],
      "tags": ["lighting", "brass"],
      "rating": 4.7,
      "reviews": 38,
      "createdAt": "2025-09-12T10:00:00Z"
    }
  ],
  "total": 12
}
```

### `GET /products/:id`

Fetch a single product.

**Response 200** — same shape as one item from `/products`.
**Response 404** — `{ "message": "Product not found" }`.

### `GET /categories`

**Response 200**
```json
{
  "items": [
    { "id": "lighting", "label": "Lighting" },
    { "id": "kitchen",  "label": "Kitchen"  }
  ]
}
```

---

## Auth

### `POST /auth/register`

Create an account and start a session.

**Request body**
```json
{ "email": "alice@example.com", "password": "password123", "name": "Alice" }
```

**Response 201**
```json
{
  "user": {
    "id": "u_xyz",
    "email": "alice@example.com",
    "name": "Alice",
    "role": "customer",
    "createdAt": "2026-05-08T10:00:00Z"
  },
  "sessionId": "sess_xyz"
}
```
The server should also set the `atelier_sid` cookie.

**Response 409** — email already taken.

### `POST /auth/login`

**Request body**
```json
{ "email": "alice@example.com", "password": "password123" }
```

**Response 200** — same shape as `/auth/register`.
**Response 401** — invalid credentials.

### `POST /auth/admin/login`

Same shape as `/auth/login`, but rejects (`403`) if the user's `role` is not
`admin`. Used by the dedicated admin portal.

### `POST /auth/logout`

Invalidate the current session and clear the cookie.

**Response 200** — `{ "ok": true }`.

### `GET /auth/me`

Return the current user, if any.

**Response 200**
```json
{ "user": { "id": "u_xyz", "email": "…", "name": "…", "role": "customer" } }
```

If not logged in, return `{ "user": null }` (or `401`; the client handles both).

---

## Cart

The cart is keyed off the session: logged-in users get a stable cart, guests
get one keyed by `atelier_guest`. When a guest logs in, a real backend should
merge their guest cart into their account cart.

### `GET /cart`

**Response 200**
```json
{
  "items": [
    {
      "productId": "p_001",
      "name": "Aged Brass Desk Lamp",
      "price": 189.00,
      "currency": "EUR",
      "image": "https://…",
      "quantity": 2,
      "subtotal": 378.00
    }
  ],
  "subtotal": 378.00,
  "itemCount": 2,
  "currency": "EUR"
}
```

### `POST /cart/items`

Add a product to the cart. If it's already there, increment.

**Request body**
```json
{ "productId": "p_001", "quantity": 1 }
```

**Response 200** — full cart object (same shape as `GET /cart`).

### `PUT /cart/items/:productId`

Set the quantity of an item. `quantity: 0` is equivalent to a `DELETE`.

**Request body**
```json
{ "quantity": 3 }
```

**Response 200** — full cart object.

### `DELETE /cart/items/:productId`

Remove an item from the cart.

**Response 200** — full cart object.

### `DELETE /cart`

Empty the entire cart.

**Response 200** — empty cart object.

---

## Admin

All `/admin/*` endpoints require an authenticated user with `role === "admin"`.
The mock layer enforces this and returns `403 Admin access required` otherwise.

### `POST /admin/products`

Create a new product.

**Request body**
```json
{
  "name": "Linen Tea Towel",
  "category": "home",
  "price": 22.0,
  "stock": 40,
  "description": "Heavy linen, stonewashed.",
  "longDescription": "…",
  "image": "https://…",
  "tags": ["home", "linen"]
}
```

**Response 201** — the created product.

### `PUT /admin/products/:id`

Update an existing product. Body accepts any subset of the product fields.

**Response 200** — the updated product.

### `DELETE /admin/products/:id`

**Response 200** — `{ "ok": true }`.

---

## Error format

All non-2xx responses use the same shape:

```json
{ "message": "Human-readable error.", "details": { "field": "email" } }
```

The frontend's `ApiError` class (exported from `client.js`) carries `status`,
`message`, and `details`.

---

## Demo accounts

These accounts are seeded into the mock backend on first load:

| Role      | Email                  | Password      |
|-----------|------------------------|---------------|
| Customer  | `alice@example.com`    | `password123` |
| Customer  | `bob@example.com`      | `password123` |
| Admin     | `admin@atelier.shop`   | `admin1234`   |

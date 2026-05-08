# Atelier — Frontend Shop (HTML / CSS / JS)

A complete, framework-free e-commerce frontend built with vanilla HTML, CSS,
and ES modules. Comes with a mock REST API that mirrors a real backend, so
you can develop the UI today and swap in a live server later by changing two
lines of code.

## Features

- **Shop page** with a search box, category pills, sort, and a responsive grid.
- **Product detail page** with a gallery, quantity stepper, and add-to-cart.
- **Cart page** with quantity editing, line totals, summary, and clear-cart.
- **User authentication** — login, register, logout. Header reflects the
  current user.
- **Sessions via cookies** — the `atelier_sid` cookie carries the session id;
  the mock backend keeps the `sid -> userId` map separately, exactly the way
  a real server would.
- **Guest cart** — non-logged-in users get a per-browser cart keyed by an
  `atelier_guest` cookie.
- **Admin portal** — separate login that gates an admin dashboard. Admins
  can create, edit, and delete products; changes appear instantly on the
  shop.
- **Mock REST API** — every server call goes through `js/api/client.js`,
  which currently dispatches to local mock data. Set `USE_MOCK = false` and
  point `BASE_URL` at your backend to go live.

## Running

No build step. No dependencies. Just serve the folder over HTTP — opening
the files via `file://` will not work because the modules use absolute paths
and CORS rules apply.

```bash
# any one of these works:
npx http-server .       # if you have node
python3 -m http.server  # if you have python
php -S localhost:8000   # if you have php
```

Then visit `http://localhost:8000/`.

## Demo accounts

| Role      | Email                  | Password      |
|-----------|------------------------|---------------|
| Customer  | `alice@example.com`    | `password123` |
| Customer  | `bob@example.com`      | `password123` |
| Admin     | `admin@atelier.shop`   | `admin1234`   |

## Project structure

```
shop-app/
├── index.html               # Redirects to the shop page
│
├── ui/
│   ├── shared/
│   │   ├── main.css          # Tokens, header, footer, buttons, forms
│   │   └── components.css    # Page-specific styles (shop, product, cart, etc.)
│   └── pages/
│       ├── shop/
│       │   ├── index.html
│       │   ├── styles.css
│       │   └── page.js
│       ├── product/
│       │   ├── index.html
│       │   ├── styles.css
│       │   └── page.js
│       ├── cart/
│       │   ├── index.html
│       │   ├── styles.css
│       │   └── page.js
│       ├── login/
│       │   ├── index.html
│       │   ├── styles.css
│       │   └── page.js
│       ├── register/
│       │   ├── index.html
│       │   ├── styles.css
│       │   └── page.js
│       ├── admin/
│       │   ├── index.html
│       │   ├── styles.css
│       │   └── page.js
│       └── admin-dashboard/
│           ├── index.html
│           ├── styles.css
│           └── page.js
│
├── js/
│   ├── api/
│   │   ├── client.js        # ⭐ API client — single entry point to "the server"
│   │   └── mock-data.js     # Seed data for the mock backend
│   │
│   └── modules/
│       ├── session.js       # Current-user state + subscriptions
│       ├── cart.js          # Cart state + subscriptions
│       └── ui.js            # Header/footer rendering, toasts, formatters
│
├── API_REFERENCE.md         # Full REST contract
└── README.md
```

### How the layers fit together

```
┌────────────────────────────────────────────────────────────┐
│  HTML pages                                                │
│  ui/pages/*/index.html                                     │
└─────────────┬──────────────────────────────────────────────┘
              │ load
              ▼
┌────────────────────────────────────────────────────────────┐
│  Page scripts (ui/pages/*/page.js)                         │
│  one file per page, owns the page's DOM events             │
└─────────────┬──────────────────────────────────────────────┘
              │ use
              ▼
┌────────────────────────────────────────────────────────────┐
│  Modules (js/modules/*.js)                                 │
│  session · cart · ui — shared state and helpers            │
└─────────────┬──────────────────────────────────────────────┘
              │ call
              ▼
┌────────────────────────────────────────────────────────────┐
│  API client (js/api/client.js)                             │
│  the only file that talks to "the server"                  │
└─────────────┬──────────────────────────────────────────────┘
              │ dispatches to
   ┌──────────┴──────────┐
   ▼                     ▼
mock-data.js +        fetch() to
localStorage          your real API
(USE_MOCK = true)     (USE_MOCK = false)
```

**Why this matters**: only one file (`client.js`) needs to change when you
swap the mock for a real backend. Page scripts and modules are oblivious to
where the data comes from.

## Going live (real backend)

1. Build a backend that implements the contract in [`API_REFERENCE.md`](API_REFERENCE.md).
2. Edit `js/api/client.js`:
   ```js
   const USE_MOCK = false;
   const BASE_URL = 'https://your-api.example.com/v1';
   ```
3. Make sure your server:
   - Sets the session cookie as `Set-Cookie: atelier_sid=…; HttpOnly;
     Secure; SameSite=Lax; Path=/`.
   - Allows credentials in CORS (`Access-Control-Allow-Credentials: true`,
     and a specific origin — not `*`).

The frontend already passes `credentials: 'include'` on every request.

## Sessions and cookies

This demo uses two cookies:

- `atelier_sid` — opaque session id, set on login. The server-side store
  maps it to a user. In the mock implementation this map lives in
  `localStorage` under the `atelier.sessions` key. In a real backend it
  lives in your session store (Redis, DB, etc.).
- `atelier_guest` — opaque id used to key a guest cart so it survives page
  reloads even when the user is not logged in.

Both cookies are deliberately short-lived and can be cleared from devtools
to reset the demo.

## Resetting the mock data

The mock backend persists products, users, sessions, and carts to
`localStorage`. To start fresh:

```js
['atelier.products', 'atelier.users', 'atelier.sessions', 'atelier.carts']
  .forEach(k => localStorage.removeItem(k));
location.reload();
```

Or just open devtools → Application → Storage → Clear site data.

## License

Provided as a reference / starter. Do whatever you like with it.

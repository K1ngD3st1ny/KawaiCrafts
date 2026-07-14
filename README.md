<p align="center">
  <a href="https://kawai-crafts.vercel.app/"><img src="https://img.shields.io/badge/🌸_Visit_Store-kawai--crafts.vercel.app-ff69b4?style=for-the-badge" alt="Visit KawaiCrafts" /></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React 18" />
  <img src="https://img.shields.io/badge/TypeScript-5.6-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Express-4-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/Drizzle_ORM-0.39-C5F74F?style=for-the-badge&logo=drizzle&logoColor=black" alt="Drizzle ORM" />
  <img src="https://img.shields.io/badge/Razorpay-Live-0C2451?style=for-the-badge&logo=razorpay&logoColor=white" alt="Razorpay" />
  <img src="https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
</p>

# ✂️ KawaiCrafts

> *Your premier destination for anime papercraft PDFs — bringing your favorite characters to life, one fold at a time.*

🔗 **Live Store:** [**https://kawai-crafts.vercel.app**](https://kawai-crafts.vercel.app/)

**KawaiCrafts** is an online store where anime fans can discover, purchase, and instantly download beautifully designed papercraft PDF templates of their favorite characters. From iconic Naruto shinobi to beloved Dragon Ball heroes — each template is a printable, foldable craft sheet that transforms flat paper into stunning 3D anime figures.

The store is organized by anime series, making it easy to find templates from your favorite shows. Simply browse the catalogue, add items to your cart, pay securely with Razorpay (UPI, cards, wallets — all supported), and download your PDFs instantly. No waiting, no shipping — just print, cut, fold, and display.

**Built as a full-stack TypeScript application**, KawaiCrafts features a pastel kawaii-inspired design, seamless Google sign-in, a wishlist to save your favorites, order history with re-downloadable files, and a powerful admin dashboard for managing the entire product catalogue.

---

## ✨ Features

### 🛒 Storefront
- **Product Catalogue** — Browse papercraft PDFs with search, sort, and filter by anime series
- **Featured Anime Series** — Curated horizontal carousel with cover images for quick filtering
- **Shopping Cart** — Persistent cart with `localStorage` syncing and global state management
- **Wishlist** — Save favorite templates for later purchase
- **Instant Downloads** — Secure PDF delivery via Supabase Storage after payment
- **Order History** — Track past purchases and re-download files

### 🔐 Authentication
- **Google OAuth** — Seamless sign-in powered by [Arctic](https://arctic.js.org/) (no email/password)
- **Admin Auto-Assignment** — Admin role granted automatically via `ADMIN_EMAIL` env variable
- **JWT Sessions** — Stateless auth with HTTP-only cookies

### 💳 Payments
- **Razorpay Integration** — Full payment flow with order creation and signature verification
- **INR Currency** — Supports UPI, Visa, Mastercard, Google Pay, Apple Pay, and more
- **Post-Payment Fulfillment** — Automatic download access + order record creation

### 👤 User Profile
- **Extended Profiles** — First/last name, display name, date of birth, gender, phone numbers
- **Profile Image Upload** — Stored in Supabase public bucket
- **Address Management** — Multiple addresses with default shipping/billing support

### 🛠️ Admin Dashboard
- **Product Management** — Create, edit, and toggle products with thumbnail/PDF uploads
- **Series Management** — Manage anime series with cover images and display ordering
- **Dashboard Analytics** — Overview of products, orders, and revenue (via Recharts)

### 🎨 Design
- **Kawaii Aesthetic** — Pastel pink/lavender palette with neon cyan accents
- **Responsive Layout** — Mobile-first design with touch-friendly interactions
- **Micro-Animations** — Hover effects, smooth transitions, and branded loading screen
- **Custom Typography** — Baloo 2 headings + Nunito body text

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, TailwindCSS 3, Radix UI, Framer Motion |
| **Routing** | Wouter (client-side SPA routing) |
| **State** | React Context (Auth, Cart), TanStack React Query |
| **Backend** | Express 4, TypeScript, Node.js |
| **Database** | PostgreSQL (Neon Serverless) |
| **ORM** | Drizzle ORM + Drizzle Kit |
| **Auth** | Google OAuth 2.0 via Arctic, JWT |
| **Payments** | Razorpay (INR) |
| **File Storage** | Supabase Storage (PDFs, thumbnails, profile images, series covers) |
| **Deployment** | Vercel (serverless functions + static) |
| **Validation** | Zod + Drizzle-Zod |
| **UI Components** | shadcn/ui (Radix + TailwindCSS) |

---

## 📁 Project Structure

```
KawaiCrafts/
├── api/                    # Vercel serverless entry point
├── client/
│   └── src/
│       ├── components/     # React UI components
│       │   ├── ui/         # shadcn/ui primitives
│       │   ├── profile/    # Profile-related components
│       │   ├── Header.tsx
│       │   ├── Footer.tsx
│       │   ├── Hero.tsx
│       │   ├── FeaturedSeries.tsx
│       │   ├── ProductCard.tsx
│       │   ├── ProductGrid.tsx
│       │   ├── ShoppingCart.tsx
│       │   ├── HowItWorks.tsx
│       │   └── LoadingScreen.tsx
│       ├── hooks/          # Custom React hooks
│       │   ├── useAuth.tsx
│       │   ├── useCart.tsx
│       │   └── useWishlist.tsx
│       ├── lib/            # Utility functions & query client
│       ├── pages/          # Page-level components
│       │   ├── admin/      # Admin dashboard pages
│       │   ├── HomePage.tsx
│       │   ├── CheckoutPage.tsx
│       │   ├── ProfilePage.tsx
│       │   ├── MyDownloadsPage.tsx
│       │   ├── MyOrdersPage.tsx
│       │   └── WishlistPage.tsx
│       ├── App.tsx         # Root component with routing
│       ├── main.tsx        # React entry point
│       └── index.css       # Global styles & design tokens
├── server/
│   ├── routes/             # Express API route handlers
│   │   ├── admin.ts        # Admin CRUD operations
│   │   ├── products.ts     # Public product queries
│   │   ├── series.ts       # Anime series endpoints
│   │   ├── payment.ts      # Razorpay integration
│   │   ├── downloads.ts    # Secure file download
│   │   ├── wishlist.ts     # Wishlist management
│   │   ├── profile.ts      # User profile & addresses
│   │   └── googleAuth.ts   # Google OAuth flow
│   ├── middleware/          # Express middleware (auth, etc.)
│   ├── db.ts               # Database connection (Neon)
│   ├── supabase.ts         # Supabase client & bucket setup
│   ├── index.ts            # Server entry point
│   ├── routes.ts           # Route registration
│   └── vite.ts             # Vite dev server integration
├── shared/
│   └── schema.ts           # Drizzle ORM schema & Zod validators
├── drizzle.config.ts       # Drizzle Kit configuration
├── vite.config.ts          # Vite build configuration
├── tailwind.config.ts      # TailwindCSS theme & design tokens
├── vercel.json             # Vercel deployment configuration
├── package.json
└── tsconfig.json
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- A **PostgreSQL** database (recommended: [Neon](https://neon.tech/))
- A **Supabase** project (for file storage)
- A **Google Cloud** OAuth 2.0 client
- A **Razorpay** account

### 1. Clone the Repository

```bash
git clone https://github.com/K1ngD3st1ny/KawaiCrafts.git
cd KawaiCrafts
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```env
# ── Database ───────────────────────────────────────────
DATABASE_URL=postgresql://user:password@host:5432/dbname

# ── Supabase (File Storage) ────────────────────────────
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# ── Google OAuth ───────────────────────────────────────
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback

# ── Razorpay (Payments) ───────────────────────────────
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your-razorpay-secret

# ── Auth ───────────────────────────────────────────────
JWT_SECRET=your-jwt-secret
ADMIN_EMAIL=your-admin@gmail.com

# ── App ────────────────────────────────────────────────
CLIENT_URL=http://localhost:5000
```

### 4. Push the Database Schema

```bash
npm run db:push
```

### 5. Start the Development Server

```bash
npm run dev
```

The app will be available at **http://localhost:5000**.

---

## 📦 Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the development server with HMR |
| `npm run build` | Build client (Vite) + server (esbuild) for production |
| `npm start` | Run the production server |
| `npm run check` | TypeScript type checking |
| `npm run db:push` | Push Drizzle schema changes to the database |

---

## 🌐 Deployment

KawaiCrafts is configured for **Vercel** deployment:

1. Connect your GitHub repository to Vercel
2. Set all environment variables in the Vercel dashboard
3. Update `GOOGLE_REDIRECT_URI` and `CLIENT_URL` to your production domain
4. Deploy — Vercel handles the build automatically via `vercel.json`

The deployment uses:
- **Vercel Serverless Functions** for the Express API (`/api/*`)
- **Static hosting** for the Vite-built React SPA

---

## 🗄️ Database Schema

The PostgreSQL database is managed via Drizzle ORM with the following core tables:

| Table | Purpose |
|---|---|
| `users` | User accounts with Google OAuth + extended profile fields |
| `addresses` | Shipping/billing addresses per user |
| `anime_series` | Anime series metadata with cover images |
| `products` | Papercraft PDF products with pricing, thumbnails, and difficulty |
| `orders` | Purchase records with payment status tracking |
| `order_items` | Individual items within each order |
| `downloads` | Tracks user download access and counts |
| `wishlists` | User wishlisted products |

---

## 🔒 Security

- **Google OAuth Only** — No password storage, no password-related attack surface
- **HMAC-SHA256 Verification** — Razorpay payment signatures are cryptographically verified
- **JWT HTTP-Only Cookies** — Stateless sessions resistant to XSS
- **Supabase RLS Bypass** — Server-side only; service role key never exposed to the client
- **Input Validation** — All endpoints validated with Zod schemas

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Made with ❤️ for anime fans worldwide
</p>

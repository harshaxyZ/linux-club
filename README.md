# ⚡ Linux Open Source Coding Club (DBIT)

<div align="center">

[![Live Production](https://img.shields.io/badge/Live-webuildnow.in-E11D48?style=for-the-badge&logo=vercel&logoColor=white)](https://webuildnow.in)
[![Next.js 16](https://img.shields.io/badge/Next.js%2016-Turbopack-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3FCF8E?style=for-the-badge&logo=supabase&logoColor=black)](https://supabase.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Resend](https://img.shields.io/badge/Resend-Email%20API-000000?style=for-the-badge&logo=resend&logoColor=white)](https://resend.com)

<br />

**The official full-stack portal and membership platform for the Linux Open Source Coding Club at Don Bosco Institute of Technology (DBIT).**

[Explore Live Site](https://webuildnow.in) · [Apply for Membership](https://webuildnow.in/apply) · [Admin Portal](https://webuildnow.in/admin)

</div>

---

## 🌌 Overview

The **Linux Open Source Coding Club** platform is built with a hyper-minimalist black, white, grey, and crimson red aesthetic, engineered for **120 FPS GPU-accelerated motion**, fast interactions, and zero-latency member application management.

### 🎯 Key Highlights

- **⚡ 120 FPS GPU-Accelerated UI**: Subpixel rendering, hardware-accelerated transforms (`translate3d`), smooth scrolling, and dark-mode autofill protection.
- **💻 Interactive Linux Sandbox**: Built-in interactive browser terminal supporting club commands (`help`, `about`, `events`, `focus`, `apply`, `sudo`, `clear`).
- **📝 Member Application Flow (`/apply`)**: Instant form validation, clean 10-digit mobile number normalization, profile link aggregation (GitHub, LinkedIn, LeetCode, HackerRank), and multi-provider auth verification (Google OAuth, Email OTP, Password).
- **🛡️ Executive Admin Console (`/admin`)**: Real-time application filtering (by Year, Status, Search), applicant evaluation workflow (Pending / Under Review / Accepted / Rejected), 1-click CSV data export, and admin invitations.
- **📬 Automated Email Notifications**: Instant confirmation emails to applicants and dispatch alerts to the executive team via the Resend API.
- **🔐 Cloud Infrastructure**: Powered by Supabase PostgreSQL with Row Level Security (RLS) policies and Next.js server route isolation.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | [Next.js 16 (App Router)](https://nextjs.org/) + [React 19](https://react.dev/) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) + Custom Design Tokens |
| **Typography** | `Plus Jakarta Sans` & `JetBrains Mono` |
| **Icons & Motion** | [Lucide React](https://lucide.dev/) + [Framer Motion](https://www.framer.com/motion/) |
| **Database & Auth** | [Supabase Cloud](https://supabase.com/) (PostgreSQL + RLS + GoTrue Auth) |
| **Email Infrastructure** | [Resend](https://resend.com/) |
| **Hosting & CI/CD** | [Vercel](https://vercel.com/) (Custom Domain: `webuildnow.in`) |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)
- A [Supabase](https://supabase.com/) project
- A [Resend](https://resend.com/) API Key

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/harshaxyZ/linux-club.git
   cd linux-club
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy the example environment file and fill in your keys:
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   RESEND_API_KEY=re_your_api_key
   ADMIN_EMAIL=admin@linuxossclub.org
   NEXT_PUBLIC_APP_URL=https://webuildnow.in
   ```

4. **Start the local development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Build for production**:
   ```bash
   npm run build
   ```

---

## 📁 Project Structure

```
linux-club/
├── src/
│   ├── app/
│   │   ├── account/          # User profile view
│   │   ├── admin/            # Executive Super Admin portal
│   │   ├── api/
│   │   │   ├── admin/invite/ # Admin invitation email route
│   │   │   └── apply/        # Application processor + Resend alert
│   │   ├── apply/            # Member application & auth gate
│   │   ├── globals.css       # 120 FPS CSS tokens & GPU animations
│   │   ├── icon.svg          # Club vector favicon
│   │   ├── layout.tsx        # Global fonts and metadata
│   │   └── page.tsx          # Landing page (Hero, Terminal, Focus, etc.)
│   ├── components/
│   │   ├── home/             # Hero, About, Terminal, FocusAreas, Roadmap
│   │   ├── layout/           # Header, Footer
│   │   └── ui/               # Logo, BackgroundGrid, TechMarquee, ScrollProgress
│   └── lib/
│       ├── supabase/         # Client and server-side Supabase factories
│       └── utils.ts          # Utility functions
├── supabase/
│   └── migrations/           # PostgreSQL schemas, RLS, and seed scripts
└── tailwind.config.js        # Minimalist monochrome + crimson color scale
```

---

## 🔒 Security & Privacy

- **Row Level Security (RLS)**: Enforced on all Supabase tables (`applications`, `admins`, `admin_invitations`).
- **Server Route Isolation**: Sensitive mutations and Resend dispatches execute on server routes with isolated `SUPABASE_SERVICE_ROLE_KEY`.
- **Stealth Admin Route**: Admin management is protected and accessible exclusively at `/admin`.

---

## 📜 License & Attribution

Crafted with ❤️ for the students of **Don Bosco Institute of Technology (DBIT)** and the open source community.
Licensed under the [MIT License](LICENSE).

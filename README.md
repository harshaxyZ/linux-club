# Linux Open Source Coding Club

<div align="center">

[![Production Deployment](https://img.shields.io/badge/Production-webuildnow.in-111111?style=flat-square&logo=vercel&logoColor=white)](https://webuildnow.in)
[![Next.js](https://img.shields.io/badge/Next.js-16%20Turbopack-111111?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-111111?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%26%20Auth-111111?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-111111?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-111111?style=flat-square)](LICENSE)

<br />

**Official web portal and member application platform for the Linux Open Source Coding Club at Don Bosco Institute of Technology (DBIT).**

[Live Application](https://webuildnow.in) &nbsp;|&nbsp; [Membership Portal](https://webuildnow.in/apply) &nbsp;|&nbsp; [Executive Console](https://webuildnow.in/admin)

</div>

---

## Overview

The Linux Open Source Coding Club platform is an engineering-focused web application designed with a minimalist monochrome palette and crimson accents. The platform provides interactive system utilities, real-time member registrations, automated email notifications, and an executive administration dashboard.

---

## Architecture and Core Modules

### 1. Landing Page
A monochrome hero with typewriter headline, tech marquee, domain tracks, recruitment process, first-month roadmap, and Discord/GitHub links.

### 2. Member Application Pipeline (`/apply`)
A structured intake system featuring:
- Client-side input validation and 10-digit mobile number normalization.
- Aggregation of developer profiles (GitHub, LinkedIn, LeetCode, Codeforces, HackerRank).
- Authentication verification via Supabase GoTrue (Google OAuth, Email OTP, and Password).
- Automated confirmation dispatch to applicants and notification routing to club leadership.

### 3. Executive Administration Dashboard (`/admin`)
A protected management workspace featuring:
- Multi-dimensional filtering by academic year, application status, and full-text search.
- Review workflow (Pending, Under Review, Accepted, Rejected).
- CSV export utility for candidate records.
- Executive team invitation system.

### 4. High-Performance Design System
- GPU-accelerated layer promotion (`translate3d`, `will-change`) for 120 FPS rendering.
- Subpixel font rendering with `Plus Jakarta Sans` and `JetBrains Mono`.
- Browser autofill color correction for dark theme inputs.

---

## Technology Stack

| Layer | Specifications |
| :--- | :--- |
| **Framework** | Next.js 16 (App Router), React 19 |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS, Custom Token Architecture |
| **Icons & Motion** | Lucide React, Framer Motion |
| **Database & Auth** | Supabase PostgreSQL, Row-Level Security (RLS), GoTrue Auth |
| **Email Service** | Resend API |
| **Hosting & CI/CD** | Vercel (Production Domain: `webuildnow.in`) |

---

## Getting Started

### Prerequisites

- Node.js (v18.0.0 or higher)
- npm, pnpm, or yarn
- Supabase Project Instance
- Resend API Account

### Local Setup

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
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   RESEND_API_KEY=re_your_resend_api_key
   BREVO_API_KEY=xkeysib_your_brevo_key
   EMAIL_FROM=Linux OSS Club <onboarding@resend.dev>
   ADMIN_EMAILS=lead@dbit.edu,core2@dbit.edu
   NEXT_PUBLIC_APP_URL=https://webuildnow.in
   NEXT_PUBLIC_DISCORD_URL=https://discord.gg/AC276UE4NF
   NEXT_PUBLIC_GITHUB_URL=https://github.com/LOSSC-DBIT
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```
   Access the application at `http://localhost:3000`.

5. **Production Build**:
   ```bash
   npm run build
   ```

---

## Directory Structure

```
linux-club/
├── src/
│   ├── app/
│   │   ├── account/          # User profile view
│   │   ├── admin/            # Executive administration portal
│   │   ├── api/
│   │   │   ├── admin/invite/ # Admin invitation handler
│   │   │   └── apply/        # Application processor & Resend dispatcher
│   │   ├── apply/            # Member application portal
│   │   ├── globals.css       # Performance utilities and design tokens
│   │   ├── icon.svg          # Vector favicon
│   │   ├── layout.tsx        # Root layout, fonts, and metadata
│   │   └── page.tsx          # Landing page
│   ├── components/
│   │   ├── home/             # Landing page sections (Hero, Terminal, Focus Areas)
│   │   ├── layout/           # Global Header and Footer
│   │   └── ui/               # Reusable UI primitives
│   └── lib/
│       ├── supabase/         # Client and server database clients
│       └── utils.ts          # Helper utilities
├── supabase/
│   └── migrations/           # Database schemas, policies, and seeds
├── LICENSE                   # MIT License
├── package.json              # Project dependencies and scripts
├── tailwind.config.js        # Design tokens and theme configuration
└── tsconfig.json             # TypeScript compiler configuration
```

---

## Security and Data Protection

- **Row-Level Security (RLS)**: Enforced across all PostgreSQL tables (`applications`, `admins`, `admin_invitations`).
- **Server Route Isolation**: Sensitive database transactions and email dispatches execute on Next.js server routes using isolated service keys.
- **Route Protection**: The executive administration portal is unlisted and accessible exclusively via `/admin`.

---

## License

This project is open-source software licensed under the [MIT License](LICENSE).

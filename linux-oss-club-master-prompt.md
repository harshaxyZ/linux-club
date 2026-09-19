# Linux Open Source Coding Club - Master Build Prompt for Antigravity

Two things before the prompt itself: the stack decisions and the design system. Then the actual prompt to paste into Antigravity, ready to go.

---

## 1. Tech stack (researched, not guessed)

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 15 (App Router) + TypeScript | Server components for the CMS/admin, static generation for the landing page = both goals at once |
| Styling | Tailwind CSS | Non-negotiable per your spec, pairs cleanly with everything below |
| Animation | Framer Motion (component-level) + GSAP + ScrollTrigger (scroll-driven sequences) | Framer Motion handles React state-driven transitions; GSAP/ScrollTrigger is what actually gets you the "scrubbed" 120fps-feeling scroll sequences awwwards sites use. Using both is standard practice, not overkill - they don't fight each other |
| Auth + DB | Supabase (Postgres + Auth + Row Level Security) | Free tier covers 50k MAU and 500MB DB - a club with hundreds of applicants is nowhere near the ceiling. Use `@supabase/ssr` (not the old auth-helpers), middleware-based route protection, PKCE flow for Google OAuth |
| Email | Resend | Clean API, generous free tier, good with Next.js edge/server actions |
| Hosting | Vercel | Native Next.js support, preview deployments per PR, works with Antigravity's git flow |
| Repo | GitHub | CI, PR previews via Vercel |

**Auth pattern:** Supabase Auth with Google OAuth (PKCE), session handled via `@supabase/ssr` middleware, protected routes checked server-side before render - not just a client-side redirect.

**Admin roles pattern (multi-admin, invite-based):** Don't hardcode "admin" as a boolean on the user row. Use an `admins` table (`user_id`, `email`, `invited_by`, `created_at`) plus an `admin_invitations` table (`id`, `email`, `token`, `invited_by`, `expires_at`, `accepted_at`). RLS policies check membership in `admins` via a `SECURITY DEFINER` function, not a JWT claim (JWT claims go stale if a role changes mid-session). Inviting an admin = row in `admin_invitations` + Resend email with a tokenized link → the invitee sets their password → row moves into `admins`. This scales to as many admins as you want without ever touching code again.

**Scale note:** for "hundreds of students," the only two things that matter are (1) an index on `applications(year, course)` so the admin filter stays instant, and (2) using Supabase's `service_role` key only on the server for admin bulk actions - never expose it client-side.

**Environment setup:** the Supabase CLI and Resend CLI are already authenticated locally in this environment (`supabase login` / `resend login` have been run). Antigravity should use them directly - `supabase link`, `supabase projects api-keys`, `resend domains create` etc. - to pull real keys into `.env.local` itself, instead of asking for keys to be pasted in manually.

---

## 2. Design system

**Fonts:** Space Grotesk (headings) + Inter (body), with JetBrains Mono for labels, tags, USN fields, and any code-flavored UI accents. Space Grotesk has just enough geometric character to feel "technical" without being loud; Inter disappears into readability for body copy and forms. Both are free on Google Fonts and pair cleanly - this is one of the most reliable tech-site pairings available right now, and you've already used Space Grotesk successfully before, so it'll feel consistent with your other work.

**Colour palette - light, minimal, zero gradient nonsense:**

| Token | Hex | Use |
|---|---|---|
| `background` | `#FAFAF9` | Page background - warm off-white, not clinical `#FFF` |
| `surface` | `#FFFFFF` | Cards, form panels |
| `ink` | `#0B0F19` | Primary text - near-black, not pure black |
| `ink-muted` | `#5B6472` | Secondary text, captions |
| `border` | `#E7E9EE` | Dividers, card borders |
| `accent` | `#2F5FFF` | CTA buttons, links, active states - one confident signal blue, used sparingly |
| `accent-terminal` | `#16A34A` | Small Linux/terminal nod - success states, "applied" badges, code-block accents only. Never as a primary color |

One accent color used deliberately reads as more premium than three fighting for attention. No gradients anywhere - flat color + generous whitespace + a subtle 1px border does more for "clean" than any gradient will.

**Logo direction (brief for Antigravity/whoever designs it):** avoid literal `<>` or terminal-prompt clichés. Direction that reads as "real": a monogram built from an open bracket `[` merged with a terminal cursor block, rendered as a single continuous geometric mark - works at favicon size, works in one color, works without the club name next to it. Second option: an abstracted node-graph mark (a few connected dots/lines) representing "open source community," kept to 2-3 anchor points max so it doesn't turn into clip-art.

**Motion direction:** restrained, physics-based easing (no bounce, no overshoot) - `power2.out` in GSAP, `ease: [0.16, 1, 0.3, 1]` in Framer Motion. Scroll-triggered fade+rise on section entry, a pinned hero section with a subtle parallax on scroll, a thin scroll-progress bar fixed to the top (this is your "reactive scrolling bar"), and a mouse-reactive dot-grid or subtle gradient-mesh *background texture* (not a foreground gradient) behind the hero - animated with low opacity so it reads as texture, not decoration.

---

## 3. The master prompt - paste this into Antigravity

```
You are building the landing page, registration platform, and admin CMS for a
real college technical club called "Linux Open Source Coding Club" at DBIT,
Bengaluru. This is a production site, not a demo. Treat it like a paid client
project - no placeholder Lorem Ipsum in the final build, no generic AI-template
layout, no default shadcn landing page structure.

STACK
- Next.js 15, App Router, TypeScript, strict mode
- Tailwind CSS for all styling
- Framer Motion for component-level transitions, GSAP + ScrollTrigger for
  scroll-driven sequences (pin the hero, scroll-scrub any large sequences)
- Supabase (Postgres + Auth + Storage) using @supabase/ssr, PKCE flow,
  middleware-based route protection
- Resend for all transactional email
- Deploy target: Vercel. Repo: GitHub.

DESIGN SYSTEM (follow exactly - do not substitute fonts or colors)
- Theme: light only. No dark mode toggle needed.
- Fonts: Space Grotesk for all headings (700/600 weight), Inter for body text
  and UI, JetBrains Mono for labels, tags, USN display, and any code-flavored
  UI elements. Load via next/font, not a CDN link tag.
- Colors (use as CSS variables / Tailwind theme tokens, not hardcoded hex in
  components):
  background #FAFAF9, surface #FFFFFF, ink #0B0F19, ink-muted #5B6472,
  border #E7E9EE, accent #2F5FFF, accent-terminal #16A34A (use this second
  color sparingly - success states and small terminal-flavored accents only).
- Absolutely no purple/pink gradients, no default "AI SaaS template" bluish-
  pink gradient blobs, no glassmorphism cliches. Flat color, generous
  whitespace, confident single-accent-color usage. Minimalist but not boring - use scale, type-weight contrast, and motion to create energy, not extra
  colors.
- No em dashes or en dashes anywhere in any copy on the site. Use periods,
  commas, or separate sentences instead.
- Motion: restrained physics-based easing only (no bounce/overshoot). Scroll-
  triggered fade+rise on section entry. Pinned hero with subtle parallax.
  A thin scroll-progress bar fixed to the top of the viewport. A subtle
  mouse-reactive dot-grid or low-opacity gradient-mesh texture behind the
  hero section (background texture, not a loud foreground gradient).
- Fully responsive: mobile, tablet, laptop, large desktop. Test breakpoints
  at 375px, 768px, 1024px, 1440px minimum.

LOGO
Design a real wordmark/mark for "Linux Open Source Coding Club" - not a
generic "<>" bracket cliche. Direction: a monogram merging an open bracket
shape with a terminal-cursor block into one continuous geometric mark, OR an
abstracted 3-4-point node graph representing an open source community. Must
work at favicon size, in a single color, and without the club name next to
it.

PUBLIC SITE - PAGES & SECTIONS
1. Header: logo, nav (About, Focus Areas, Events - anchor links), "Apply Now"
   CTA button (accent color, always visible).
2. Hero section: club name, one strong sentence on what the club is, Apply
   Now CTA. No people photos anywhere on the site - use abstract/geometric
   visuals, code-flavored graphics, or generative shapes instead.
3. About/mission section: 2-3 sentences on what the club does - we guide
   students and help them learn and build in Linux, AI, web development, app
   development, full stack development, and DSA (DSA is the main focus).
   Mention daily lab access with high-spec machines, guided basics, and
   regular tests/events/hackathons.
4. Focus areas section: Linux, AI, Web Development, App Development, Full
   Stack Development, DSA - as a clean grid of cards, each with a short
   one-line description and a simple icon (no stock icon packs that look
   generic - custom-drawn line icons preferred).
5. "Why join" or "What you get" section: lab access, mentorship, events,
   hackathons, community.
6. Footer: club name, quick links, social/GitHub links, contact.
7. A second scroll-triggered CTA near the bottom before the footer.

AUTHENTICATION & APPLICATION FLOW (student side)
- "Apply Now" leads to Google OAuth sign-in via Supabase Auth (PKCE flow via
  @supabase/ssr, protected server-side, not just client redirect).
- After sign-in, show the application form:
  Required: full name, year (dropdown 1st/2nd/3rd/4th), section, USN
  (uppercase enforced in the input), course (dropdown: CSE, ECE, EEE, AI ML,
  AI DS, IOT, ISE, MECHANICAL, CIVIL, Others - "Others" reveals a free-text
  field), email (prefilled from Google, editable), phone number (+91,
  10-digit validated).
  Optional: GitHub URL, LinkedIn URL (optional, not required), plus a
  repeatable "+ Add another link" control capped at 3 extra links for
  competitive/dev profiles (LeetCode, HackerRank, HackerEarth, HackTheBox,
  TryHackMe, or any other URL) - each with a label + URL field.
  Required: a short textarea (3-4 lines, ~400 char limit) - "Tell us more
  about yourself and why you want to be part of this."
- On submit: save to Supabase `applications` table, show a confirmation
  screen: "Thank you for taking interest. The team will review your profile
  and get back to you as soon as possible."
- Student account area (simple, e.g. /account): view their submitted
  application, view application status (Pending / Under Review / Accepted /
  Rejected), log out, delete account (with confirmation).

DATABASE (Supabase / Postgres, with RLS enabled on every table)
- `applications`: id, user_id (fk to auth.users), full_name, year, section,
  usn, course, course_other (nullable), email, phone, github_url,
  linkedin_url (nullable), extra_links (jsonb array of {label, url}, max 3),
  about_text, status (enum: pending/under_review/accepted/rejected, default
  pending), created_at, updated_at.
  Index on (year, course) for fast admin filtering.
- `admins`: id, user_id (fk to auth.users), email, invited_by (nullable fk
  to admins.id), created_at.
- `admin_invitations`: id, email, token (unique), invited_by (fk to
  admins.id), expires_at, accepted_at (nullable), created_at.
- RLS: students can only select/update their own application row. Only rows
  in `admins` (checked via a SECURITY DEFINER helper function, not a JWT
  claim, so role changes take effect immediately) can select all
  applications or update status. Admin bulk actions run through server
  actions/route handlers using the service_role key, never exposed to the
  client.

ADMIN PANEL (/admin)
- Email + password login (separate from student Google OAuth), rate-limited
  on failed attempts.
- harsha210108@gmail.com is the first/super admin, seeded directly.
- Dashboard: list of all applications with name, year, course visible at a
  glance. Filter system across year and course (multi-select, so an admin
  can view e.g. "3rd year CSE + 2nd year ISE" together). Clicking a student
  opens their full application (all fields, all links clickable, opening in
  new tabs).
- "Add Admin" flow: super admin (and any admin) can invite a new admin by
  email. This creates an `admin_invitations` row and sends a Resend email
  with a tokenized link. The invitee visits the link, enters email, password,
  and confirm password, and becomes a full admin with the same powers as
  everyone else - able to invite further admins.
- Build the UI for Accept/Reject buttons on each application now (updates
  `status` in the DB), but the actual "send Resend email on accept/reject"
  automation can be stubbed as a TODO/server action placeholder - that part
  ships in a follow-up pass.
- This is a lightweight CMS for the super admin - structure the admin routes
  and components so adding a "manage site content" panel later (editing
  hero copy, focus area text, etc. from the DB instead of hardcoded strings)
  is straightforward, even if you don't build that panel in this pass.

GENERAL RULES
- No Lorem Ipsum, no placeholder images left in the final build.
- No em dashes or en dashes in any copy, anywhere, including admin UI
  microcopy.
- No purple/pink gradients, no generic AI-SaaS-template visual language.
- No people photos anywhere.
- Every interactive element needs a real hover/focus/active state, not
  browser defaults.
- Ship this as a clean, well-organized Next.js project structure (app router
  route groups for (public), (auth), (admin)) with environment variables
  documented in a .env.example.
- Zero tolerance for visual bugs: no layout shift, no overlapping elements,
  no broken breakpoints, no clipped text, no misaligned grids, no console
  errors or hydration warnings. Before considering any page done, check it
  at 375px, 768px, 1024px, and 1440px, in both a fresh load and after
  scrolling through every animation. If something looks even slightly off,
  fix it before moving to the next page. Pixel-perfect execution is a
  requirement, not a nice-to-have.

ENVIRONMENT
The Supabase CLI and Resend CLI are already installed and authenticated in
this environment. Use them directly to provision and connect real
infrastructure instead of asking for API keys to be pasted in:
- Run `supabase link --project-ref <ref>` against the created project, then
  `supabase projects api-keys --project-ref <ref>` to pull the anon and
  service role keys into `.env.local`. Use `@supabase/ssr` for all
  client/server Supabase clients.
- Run the DB schema in section "DATABASE" above as Supabase migrations
  (`supabase migration new`), not ad hoc SQL run once and forgotten.
- Use the Resend CLI to create/verify the sending domain and manage the
  application-confirmation and (stubbed) accept/reject email templates.
  Store the Resend API key in `.env.local` as `RESEND_API_KEY`, server-side
  only.
- If a step genuinely requires a human (DNS record propagation, an OAuth
  consent screen setting in Google Cloud Console), stop and say exactly what
  needs to be done manually instead of guessing or skipping it silently.
```

---

## 5. End-to-end QA pass - paste this once the build is done

```
The build is functionally complete. Now test it end to end like a real user
would, across the full flow, and fix everything you find before calling it
done.

1. Student flow: land on the homepage cold, scroll through every section,
   check every animation triggers correctly and doesn't jank. Click Apply
   Now, sign in with Google, fill the application form including edge cases
   (USN in lowercase - confirm it uppercases, an invalid phone number, the
   "Others" course option, adding and removing extra social links up to the
   cap of 3, a 0-character and a max-length "why you want to join" answer).
   Submit, confirm the thank-you screen, go to the account page, confirm the
   application and status show correctly, test logout, test delete account.
2. Duplicate/edge cases: try applying twice with the same Google account.
   Try submitting the form with required fields empty. Try an extremely long
   name or GitHub URL and confirm layout doesn't break.
3. Admin flow: log in at /admin, confirm rate limiting kicks in after
   repeated failed logins, browse the applications list, filter by year and
   course together, open an individual application, confirm every link
   opens correctly in a new tab, test Accept/Reject status updates.
4. Admin invite flow: invite a new admin, confirm the Resend email sends
   with a working tokenized link, complete the set-password flow as the
   invitee, confirm the new admin can log in and has full admin access
   including inviting further admins.
5. Responsiveness: repeat the student flow at 375px and 768px specifically,
   not just resize-and-glance. Confirm the form is usable one-handed on a
   real phone width, no horizontal scroll anywhere on any page.
6. Report back: list anything you found and fixed, and flag anything you
   could not fully verify (e.g. actual email deliverability) so it can be
   checked manually.
```


---

## 4. A few things worth adding that you didn't ask for

- **An "Events" or "Upcoming" section** on the landing page even if empty at launch - a simple "first hackathon coming soon" card gives juniors a reason to keep checking back and apply now to not miss it.
- **A public leaderboard/showcase page later** (not v1) - top DSA solvers, project showcases from members. Huge for making the club look alive to juniors browsing the site, and it's a natural use of the CMS panel you're already structuring.
- **An `/about` page that's actually the core team**, once you're comfortable - real names, real focus (Linux/DSA/etc), builds trust the way a faceless club page never does. You said no people images sitewide for the hero/marketing pages, which is the right call for that section; a dedicated team page is a different context and can be added separately if the team's fine with it.
- **A simple status webhook to your own Discord/WhatsApp** when someone applies, so the core team doesn't have to keep checking the admin panel manually - small Resend-adjacent addition, easy with a Supabase Edge Function.

**On club routine**, since you asked: a simple, repeatable weekly shape works better than ad-hoc sessions - - 2-3 fixed weekly lab slots for open coding/DSA practice, supervised but self-directed.
- One structured "basics" session per week rotating through the focus areas (Linux fundamentals one week, web dev basics the next, etc.) so 1st/2nd years always have an entry point.
- Monthly contest or mini-hackathon (even a 3-hour one) to keep momentum and give the site's "Events" section something real to show.
- A running DSA sheet/tracker the club maintains, since DSA is your main focus - this doubles as content for that future leaderboard page.

Everything above is reflected in the prompt. Paste section 3 straight into Antigravity as-is.
in the footer, mention our college name "DBIT" don bosco institute of technology, kumbalagodu
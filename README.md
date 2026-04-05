# IdeaVault AI

A mobile-first AI-powered idea management platform that helps users capture, analyze, expand, and visualize their ideas using Cloudflare Workers AI.

---

## Tech Stack

### Frontend
- **React 18** — UI framework
- **TypeScript** — type safety
- **Vite** — build tool and dev server
- **Tailwind CSS** — utility-first styling
- **shadcn/ui** — accessible UI component library
- **Framer Motion** — animations
- **React Router v6** — client-side routing
- **TanStack React Query** — data fetching and caching
- **Lucide React** — icon library
- **jsPDF** — PDF generation

### Backend
- **Supabase** — backend as a service
  - PostgreSQL database
  - Row Level Security (RLS)
  - Edge Functions (Deno runtime)
  - Auth (email/password + OAuth)

### AI
- **Cloudflare Workers AI**
  - `@cf/meta/llama-3.1-8b-instruct` — text generation (analyze, expand, translate, prompt)
  - `@cf/stabilityai/stable-diffusion-xl-base-1.0` — image generation

### PWA
- **vite-plugin-pwa** — service worker and offline support
- **Workbox** — caching strategies

---

## Features

### Idea Management
- Create, edit, and delete ideas
- Voice input for hands-free idea capture
- Version history tracking
- Offline writing with automatic sync when back online

### AI Features (require internet)
- **Analyze with AI** — deep analysis including summary, suggestions, features, evaluation, market check, feasibility score, and innovation score
- **Expand Idea** — generates a full product vision with roadmap, monetization model, and growth strategies
- **Generate Image** — creates a smartphone app mockup image visualizing how the idea looks as a mobile app
- **Translate** — translates idea to English, Amharic, or Arabic (Afan Oromo coming soon)
- **Generate Prompt** — produces a detailed, production-ready AI builder prompt with 10 sections ready to use in Cursor or ChatGPT

### Export
- **Download PDF** — exports the generated AI prompt and all analysis to a PDF file
- **Save Image** — downloads the generated app mockup image to the device

### Language Support
- English
- Amharic (አማርኛ)
- Afan Oromo (Afaan Oromoo) — UI only, AI translation coming soon
- Arabic (العربية)

### PWA / Offline
- Installable on any device (Android, iOS, Desktop)
- Works offline for reading and writing ideas
- Auto-syncs offline ideas when internet is restored
- Offline banner notifies users of connection status

### Auth
- Email and password signup/login
- Google OAuth (requires Google Cloud setup)
- Secure session management via Supabase Auth

---

## Database Schema

### `ideas`
| Column | Type | Description |
|---|---|---|
| id | uuid | Primary key |
| user_id | uuid | Owner (references auth.users) |
| title | text | Idea title |
| description | text | Idea description |
| language | text | Language code (en, am, om, ar) |
| ai_summary | text | AI-generated summary |
| ai_suggestions | text | AI improvement suggestions |
| ai_features | text | AI-suggested features |
| ai_evaluation | text | AI evaluation |
| ai_market_check | text | AI market analysis |
| ai_expanded | text | AI expanded idea |
| generated_image_url | text | Base64 image from AI |
| feasibility_score | int | 1–10 score |
| innovation_score | int | 1–10 score |
| version | int | Current version number |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update timestamp |

### `idea_versions`
| Column | Type | Description |
|---|---|---|
| id | uuid | Primary key |
| idea_id | uuid | References ideas |
| user_id | uuid | Owner |
| title | text | Version title |
| description | text | Version description |
| version | int | Version number |
| created_at | timestamptz | Creation timestamp |

---

## Edge Functions

| Function | Description |
|---|---|
| `analyze-idea` | Handles analyze, expand, and translate modes using Llama 3.1 |
| `generate-image` | Generates smartphone app mockup using Stable Diffusion XL |
| `generate-prompt` | Generates a detailed AI builder prompt using Llama 3.1 |

---

## Environment Variables

### Frontend (.env)
```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_PROJECT_ID=
```

### Supabase Edge Function Secrets
```
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_ACCOUNT_ID=
```

---

## Project Structure

```
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── ui/            # shadcn/ui components
│   │   ├── BottomNav.tsx
│   │   ├── IdeaCard.tsx
│   │   ├── Layout.tsx
│   │   └── VoiceInput.tsx
│   ├── contexts/          # React contexts
│   │   ├── AuthContext.tsx
│   │   ├── LanguageContext.tsx
│   │   └── ThemeContext.tsx
│   ├── hooks/             # Custom hooks
│   │   ├── useOnlineStatus.ts
│   │   └── use-mobile.tsx
│   ├── integrations/
│   │   └── supabase/      # Supabase client and types
│   ├── lib/
│   │   ├── i18n.ts        # Translations
│   │   └── utils.ts
│   └── pages/
│       ├── Auth.tsx
│       ├── CreateIdea.tsx
│       ├── IdeaDetail.tsx
│       ├── Index.tsx
│       └── Settings.tsx
├── supabase/
│   ├── functions/
│   │   ├── analyze-idea/
│   │   ├── generate-image/
│   │   └── generate-prompt/
│   └── migrations/
└── public/
    └── manifest.json      # PWA manifest
```

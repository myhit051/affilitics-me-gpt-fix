# Project Structure

## Root Directory
```
├── src/                    # Source code
├── public/                 # Static assets (favicon, images)
├── .kiro/                  # Kiro AI assistant configuration
├── .git/                   # Git repository
├── package.json            # Dependencies and scripts
├── vite.config.ts          # Vite build configuration
├── tailwind.config.ts      # Tailwind CSS configuration
├── components.json         # shadcn/ui component configuration
├── tsconfig.json           # TypeScript configuration
└── eslint.config.js        # ESLint configuration
```

## Source Directory Structure (`src/`)
```
src/
├── components/             # React components
│   ├── ui/                # shadcn/ui base components
│   ├── AdPlanning.tsx     # Ad planning functionality
│   ├── CampaignTable.tsx  # Campaign data tables
│   ├── Header.tsx         # App header
│   ├── Sidebar.tsx        # Navigation sidebar
│   └── [other components] # Feature-specific components
├── hooks/                 # Custom React hooks
│   ├── use-mobile.tsx     # Mobile detection
│   ├── use-toast.ts       # Toast notifications
│   └── [data hooks]       # Data fetching hooks
├── lib/                   # Utility libraries
│   ├── utils.ts           # General utilities (cn, etc.)
│   ├── mockData.ts        # Mock data for development
│   └── affiliateData.ts   # Affiliate-specific data
├── pages/                 # Route components
│   ├── Index.tsx          # Main dashboard page
│   └── NotFound.tsx       # 404 page
├── utils/                 # Business logic utilities
│   ├── adPlanningCalculations.ts
│   └── affiliateCalculations.ts
├── App.tsx                # Main app component with routing
├── main.tsx               # React app entry point
├── index.css              # Global styles and CSS variables
└── vite-env.d.ts          # Vite type definitions
```

## Component Organization
- **UI Components** (`components/ui/`): Base shadcn/ui components
- **Feature Components** (`components/`): Business logic components
- **Page Components** (`pages/`): Route-level components
- **Custom Hooks** (`hooks/`): Reusable stateful logic
- **Utilities** (`lib/`, `utils/`): Helper functions and calculations

## Naming Conventions
- **Components**: PascalCase (e.g., `CampaignTable.tsx`)
- **Hooks**: camelCase with "use" prefix (e.g., `useAffiliateStats.tsx`)
- **Utilities**: camelCase (e.g., `affiliateCalculations.ts`)
- **Pages**: PascalCase (e.g., `Index.tsx`)

## Import Aliases
- `@/` maps to `src/` directory
- `@/components` for components
- `@/lib` for utilities
- `@/hooks` for custom hooks
- `@/pages` for page components

## Routing Structure
- `/` - Main dashboard (Index.tsx)
- `/*` - Catch-all for 404 (NotFound.tsx)
- New routes should be added above the catch-all route in App.tsx
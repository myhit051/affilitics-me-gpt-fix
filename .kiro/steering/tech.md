# Technology Stack

## Build System & Framework
- **Vite**: Fast build tool and dev server
- **React 18**: UI framework with modern hooks
- **TypeScript**: Type-safe JavaScript with relaxed configuration
- **React Router DOM**: Client-side routing

## UI & Styling
- **shadcn/ui**: Component library built on Radix UI primitives
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Radix UI**: Headless UI components for accessibility
- **Lucide React**: Icon library
- **next-themes**: Theme management (dark mode support)

## State Management & Data
- **TanStack Query (React Query)**: Server state management and caching
- **React Hook Form**: Form handling with Zod validation
- **Zod**: Schema validation
- **date-fns**: Date manipulation utilities

## Charts & Visualization
- **Recharts**: Chart library for data visualization
- **Embla Carousel**: Carousel component

## Development Tools
- **ESLint**: Code linting with TypeScript support
- **PostCSS**: CSS processing
- **Autoprefixer**: CSS vendor prefixing

## Common Commands

### Development
```bash
npm run dev          # Start development server (localhost:8080)
npm run build        # Production build
npm run build:dev    # Development build
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Package Management
- Uses npm with package-lock.json
- Also has bun.lockb indicating Bun compatibility

## Configuration Notes
- Path alias `@/*` maps to `./src/*`
- TypeScript configured with relaxed rules (no implicit any warnings)
- ESLint configured to ignore unused variables
- Vite configured with SWC for fast React compilation
- Development server runs on port 8080 with IPv6 support
# Architecture — Bookings App

## Stack
- React Native (Expo)
- TypeScript
- State (note what you use: Context, Zustand, Redux, etc.)
- Supabase (auth, DB)

## Folders
- `src/`
  - `screens/` main views (e.g., CalendarWeek, BookingDetail)
  - `components/` reusable UI (e.g., BookingCard, StaffBadge)
  - `hooks/` shared hooks (e.g., useBookings, useAuth)
  - `lib/` clients and utils (e.g., `supabase.ts`, date helpers)
  - `types/` DTOs and global types
- `assets/` images, fonts

## Data model (draft)
- `staff`: id, name, color
- `services`: id, name, durationMin, price
- `bookings`: id, customerName, staffId, serviceId, startISO, endISO, notes
- Prevent overlap: booking time ranges must not intersect for same `staffId`

## App flow
Auth → Dashboard → CalendarWeek → BookingDetail → Save → Sync to Supabase

## API / Clients
- `src/lib/supabase.ts` creates the client
- All data access through small service modules, not directly in screens

## State rules
- Screens are dumb; they call hooks/services
- Keep async calls out of components where possible

## Testing (placeholder)
- Unit: pure functions in `lib/` and `hooks/`
- Later: component tests for critical screens

# ELAYA — Product Requirements Document

## Original Problem Statement
Design and develop ELAYA, a mobile flower marketplace for Biñan, Laguna, with an Interactive 360° bouquet view, GPS/maps for location-based ordering, three delivery options with tracking, GCash + Cash-on-Delivery payments, and a Shop Owner Registration + Admin Approval system. Imported from an existing GitHub repo (Expo + FastAPI + MongoDB) and extended.

## Architecture
- Frontend: Expo Router (React Native), 3 role zones — `(customer)`, `(owner)`, `(admin)` — plus `(auth)`. Theme tokens in `src/theme.ts` (blush/burgundy floral).
- Backend: FastAPI (`backend/server.py`) + MongoDB (motor). JWT email/password auth, 3 roles.
- Storage: Emergent Managed Object Storage (`backend/storage.py`) for bouquet photos & business permits via `/api/upload` + `/api/files/{path}`.
- Payments: PayMongo GCash (Payment Intent → attach → redirect; polling reconciliation, no webhook secret) + COD.
- Maps: OpenStreetMap/Leaflet in a WebView (`src/components/LeafletMap.tsx`); Google Maps key can be added later.
- 360° viewer: `src/components/Rotate360.tsx` (drag/swipe through multiple photos).

## User Personas
- Customer: browses bouquets, inspects 360°, finds nearby shops via GPS, orders with a delivery method + GCash/COD, tracks delivery.
- Shop Owner: registers, submits application for approval, manages bouquets (multi-photo 360), orders, delivery methods, shares live rider location.
- Admin: reviews shop applications (view permit + details), approves/rejects, monitors counts and all orders/users.

## Core Requirements (static)
1. Interactive 360° view from multiple owner-uploaded photos — DONE
2. GPS + nearby-shop matching, all Biñan shops shown, sorted by distance — DONE
3. Three delivery methods (In-House w/ tracking, Third-Party simulated, Pick-Up) — DONE
4. GCash (PayMongo, records reference, notifies owner on paid) + COD — DONE
5. Shop Owner Registration + Admin Approval (pending/approved/rejected, re-apply) — DONE
6. Business permit file upload — DONE

## Implemented (2026-06)- Recreated missing `.env` files; fixed storage init (lazy key read); removed 3D studio & flower/wrapping flows.
- Backend: owner application + approval endpoints, object-storage upload/download, products with `images[]`, shops with lat/lng + distance, orders with per-method `status_flow`, rider location, PayMongo GCash + COD, notifications, admin overview/shop-owners/orders.
- Frontend: sign-up (basic owner account → application), owner application form (permit + GPS pin), owner dashboard with approval gating, add-bouquet multi-photo uploader, products/orders/order-detail (status advance + live location), owner profile (shop info + delivery methods). Customer home (360 highlight), shops map (GPS), shop detail, product 360 viewer, checkout (delivery method + GCash/COD), tracking (map + status + pay). Admin overview, shop-owner management (approve/reject + permit), all-orders, users.
- Testing: 29/29 backend tests pass; frontend smoke passes; no critical bugs.

## Ratings & Reviews (2026-06)
- Verified-buyer only: a customer can review a bouquet only if they have an order containing it (`POST /reviews` returns 403 otherwise). 1–5 stars + comment; one review per (user, product), editable.
- Endpoints: `GET /products/{id}/reviews`, `GET /shops/{id}/reviews`, `GET /reviews/eligibility`, `POST /reviews`. Aggregates `rating_avg`/`rating_count` stored on product & shop and recomputed on each review; owner gets a "New review" notification.
- UI: star summary + review list + gated "Write/Edit review" composer on product detail; shop rating + reviews on shop detail; star badges on marketplace cards. Reusable `src/components/Stars.tsx`.

## Fix — Restored after GitHub import (2026-06-29)
- Root cause: gitignored `.env` files were not imported, so backend crashed (`KeyError: MONGO_URL`) and the app was fully down. Because `EXPO_PUBLIC_BACKEND_URL` was empty, owner-uploaded product photos (served as `/api/files/...`) resolved to broken URLs and the whole product feed failed — this was the "customers can't see photos" report.
- Recreated `backend/.env` (MONGO_URL, DB_NAME, JWT_SECRET, PAYMONGO_SECRET_KEY, EMERGENT_LLM_KEY for object storage, APP_URL) and `frontend/.env` (EXPO_PUBLIC_BACKEND_URL + packager vars).
- Verified end-to-end via API: `/api/upload` → object storage → `/api/files/{path}` returns HTTP 200; product create with multi-angle `images[]` persists `image` + full `images` array; product detail returns all angles; marketplace renders photos + 360° badges (screenshot confirmed).
- Owner multi-photo uploader cap raised 8 → 12 angles for smoother 360.

## Seeded Accounts
See `/app/memory/test_credentials.md`.

## Backlog / Remaining
- P1: Real Google Maps API key + native `react-native-maps`; real Lalamove/Grab courier API; PayMongo webhook signing for instant confirmation.
- P2: Order state machine hardening (forward-only), upload size/MIME caps, permit file auth, push notifications (on request), ratings/reviews, promo codes.

## Next Tasks
- Add Google Maps key when provided; wire third-party courier API if keys given.

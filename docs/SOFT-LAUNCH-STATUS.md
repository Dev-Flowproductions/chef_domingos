# Soft-launch POS checklist — status (PP)

**Environment:** LKM pré-produção (`api-loyalty-pp.mymobile.pt`)  
**Date prepared:** 2026-07-31

## Backend verified (automated)

- [x] Edge functions ACTIVE: `lkm-account`, `lkm-points`, `lkm-transactions`, `lkm-vouchers`, `lkm-scan`, `reward-offers`, `delete-account`
- [x] `lkm_runtime_config` populated (PP URL + tokens + store `2` + grupo `5156`)
- [x] `menu_items` seeded
- [x] Money / promo offers present in `reward_offers`
- [x] Admin user `admin@chefdomingos.app` (`is_admin = true`); password rotated for go-live
- [x] Legal pages live (see STORE-RELEASE.md)

## Must run at the restaurant (human + POS)

Print and fill from `docs/RESTAURANT-POS-TESTING-AND-GO-LIVE.md`:

- [ ] A1–A6 Registration & card QR
- [ ] B1–B* Earn points via WinRest scan
- [ ] C* Redeem money voucher + staff validate
- [ ] D* Menu promo claim + validate
- [ ] Admin: Editar menu / create offer

## Blockers for public store (not soft-launch)

- [ ] EAS login + `npm run eas:setup` + preview/prod builds
- [ ] Auth redirect URL `chefdomingos://auth/reset` confirmed in dashboard
- [ ] LKM production credentials + `scripts/switch-lkm-to-prod.sql`
- [ ] Apple / Google store accounts + submit

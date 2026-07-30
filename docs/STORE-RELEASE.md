# Store release checklist — Chef Domingos

Use this after the code readiness work. Items below still need a human / accounts / LKM.

## Done in code (this pass)

- [x] Account deletion (edge function `delete-account` + Account UI)
- [x] Password reset from email login
- [x] Removed misleading “login with phone” button
- [x] In-app Terms / Privacy (no placeholder banner)
- [x] Web HTML copies in `store-listing/` for Play/App Store privacy URL
- [x] `ITSAppUsesNonExemptEncryption: false`
- [x] Portuguese camera permission string
- [x] Splash uses branded icon
- [x] App scheme `chefdomingos` (password reset deep link)
- [x] Admin access: dedicated admin account (`users.is_admin`), no staff PIN

## You must still do manually

### 1. EAS project

```bash
npx eas-cli login
npx eas-cli init
# replaces REPLACE_WITH_EAS_PROJECT_ID in app.json
```

### 2. EAS secrets / env for production builds

```bash
eas env:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://wrawujclqgxdnbddwokv.supabase.co" --environment production
eas env:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "<anon key>" --environment production
# After hosting legal pages:
eas env:create --name EXPO_PUBLIC_PRIVACY_URL --value "https://…" --environment production
eas env:create --name EXPO_PUBLIC_TERMS_URL --value "https://…" --environment production
```

### 3. Host privacy + terms URLs

Upload `store-listing/privacy-policy.html` and `store-listing/terms-of-service.html` to any public HTTPS host (company site, Vercel, Netlify).  
Paste those URLs into App Store Connect + Google Play Console **and** into `EXPO_PUBLIC_PRIVACY_URL` / `EXPO_PUBLIC_TERMS_URL`.

Have legal counsel review the copy before public launch if required.

### 4. Supabase Auth redirect

In Supabase → Authentication → URL configuration, add:

- `chefdomingos://auth/reset`

### 5. Deploy delete-account function

```bash
npx supabase functions deploy delete-account --project-ref wrawujclqgxdnbddwokv
```

### 6. Switch LKM to production (when LKM signs off)

Update `lkm_runtime_config` / secrets:

- `LKM_BASE_URL=https://api-loyalty.myclient.pt`
- production `LKM_TOKEN_APP`, `LKM_HMAC_SECRET`, `LKM_STORE_EXTERNAL_ID`

### 7. Store assets

- Screenshots (iPhone 6.7" + Android phone) from a real build
- Optional: feature graphic (Play)

### 8. Build & submit

```bash
npm run build:prod
npm run submit:ios
npm run submit:android
```

Apple Developer + Google Play Console accounts and `eas submit` credentials required.

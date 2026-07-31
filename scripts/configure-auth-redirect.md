# Configure password-reset redirect (Supabase Auth)

The app calls `resetPasswordForEmail` with:

```text
chefdomingos://auth/reset
```

## Dashboard (required if Management API token is unavailable)

1. Open [Auth → URL Configuration](https://supabase.com/dashboard/project/wrawujclqgxdnbddwokv/auth/url-configuration)
2. Under **Redirect URLs**, add exactly:
   - `chefdomingos://auth/reset`
3. Save

## Verify

1. On the login screen, request password reset for a test account
2. Open the email link on a device with the app installed
3. Confirm the app opens to the reset flow (scheme `chefdomingos`)

## Management API (optional CI)

```bash
curl -X PATCH "https://api.supabase.com/v1/projects/wrawujclqgxdnbddwokv/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"uri_allow_list\":\"chefdomingos://auth/reset\"}"
```

Merge with any existing redirect URLs already in the project before PATCHing.

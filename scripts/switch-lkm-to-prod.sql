-- Switch LKM runtime config from pré-produção to production.
-- ONLY run after LKM provides production credentials and POS sign-off.
-- Do NOT run with PP tokens against the prod URL.

-- Fill these values from LKM before executing:
--   LKM_TOKEN_APP
--   LKM_HMAC_SECRET (PartnerKey)
--   LKM_STORE_EXTERNAL_ID (confirm Mar Shopping Loulé)
--   LKM_GRUPO_DESCONTO (confirm; currently 5156 on PP)

BEGIN;

UPDATE public.lkm_runtime_config
SET value = 'https://api-loyalty.myclient.pt'
WHERE key = 'LKM_BASE_URL';

UPDATE public.lkm_runtime_config
SET value = 'REPLACE_WITH_PROD_LKM_TOKEN_APP'
WHERE key = 'LKM_TOKEN_APP';

UPDATE public.lkm_runtime_config
SET value = 'REPLACE_WITH_PROD_LKM_HMAC_SECRET'
WHERE key = 'LKM_HMAC_SECRET';

UPDATE public.lkm_runtime_config
SET value = 'REPLACE_WITH_PROD_STORE_EXTERNAL_ID'
WHERE key = 'LKM_STORE_EXTERNAL_ID';

-- Uncomment if LKM confirms a different grupo for production:
-- UPDATE public.lkm_runtime_config
-- SET value = 'REPLACE_WITH_PROD_GRUPO_DESCONTO'
-- WHERE key = 'LKM_GRUPO_DESCONTO';

DELETE FROM public.lkm_token_cache
WHERE key = 'app_token';

COMMIT;

-- Smoke-test after apply:
-- 1. Register / sign-in → lkm-account links card
-- 2. Ganhar shows QR
-- 3. lkm-points returns balance
-- 4. Claim voucher + admin validate

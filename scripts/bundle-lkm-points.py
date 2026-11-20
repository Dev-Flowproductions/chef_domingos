from pathlib import Path

root = Path("supabase/functions")
md5 = (root / "_shared/md5.ts").read_text(encoding="utf-8").replace(
    "export function md5Hex", "function md5Hex"
)
client = (root / "_shared/lkm-client.ts").read_text(encoding="utf-8")
client = client.replace("import { md5Hex } from './md5.ts';\n", "")
cors = (root / "_shared/cors.ts").read_text(encoding="utf-8")
index = (root / "lkm-points/index.ts").read_text(encoding="utf-8")
index = index.replace("import { corsHeaders, handleCors } from '../_shared/cors.ts';\n", "")
index = index.replace(
    """import {
  lkmFetch,
  getClientToken,
  getSupabaseUser,
  getLkmCard,
  serviceDb,
  jsonResponse,
  errorResponse,
  LkmApiError,
} from '../_shared/lkm-client.ts';
""",
    "",
)
bundled = "// bundled lkm-points\n" + md5 + "\n" + cors + "\n" + client + "\n" + index
Path("tmp-lkm-points-bundled.ts").write_text(bundled, encoding="utf-8")
print("bytes", len(bundled))

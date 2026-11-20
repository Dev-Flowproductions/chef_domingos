import pathlib
import re

root = pathlib.Path(__file__).resolve().parents[1] / "supabase" / "functions"
cors = (root / "_shared" / "cors.ts").read_text(encoding="utf-8")
md5 = (root / "_shared" / "md5.ts").read_text(encoding="utf-8")
lkm = (root / "_shared" / "lkm-client.ts").read_text(encoding="utf-8")

cors_body = cors.replace("export const", "const").replace("export function", "function")
md5_body = md5.replace("export function", "function")
lkm_body = (
    lkm.replace("import { md5Hex } from './md5.ts';", "")
    .replace("import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';", "")
    .replace("export let", "let")
    .replace("export async function", "async function")
    .replace("export function", "function")
    .replace("export class", "class")
    .replace("export interface", "interface")
)
IMPORT_LINE = "import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';\n\n"


def bundle(src_name: str) -> None:
    src = (root / src_name / "index.ts").read_text(encoding="utf-8")
    src = re.sub(
        r"import \{[^}]+\}\s*from\s*'../_shared/cors\.ts';\s*",
        "",
        src,
    )
    src = re.sub(
        r"import \{[^}]+\}\s*from\s*'../_shared/lkm-client\.ts';\s*",
        "",
        src,
    )
    out = (
        "// bundled for MCP deploy\n"
        + IMPORT_LINE
        + cors_body
        + "\n"
        + md5_body
        + "\n"
        + lkm_body
        + "\n"
        + src
    )
    path = root / src_name / "index.bundled.ts"
    path.write_text(out, encoding="utf-8")
    print(src_name, len(out), "->", path)


bundle("reward-offers")
bundle("lkm-points")
bundle("lkm-transactions")
bundle("staff-points")

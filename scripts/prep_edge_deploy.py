import json
import pathlib
import shutil

root = pathlib.Path(__file__).resolve().parents[1] / "supabase" / "functions"
shared = root / "_shared"


def prep(fn: str) -> dict:
    src_dir = root / fn
    staging = root / f".deploy-{fn}"
    if staging.exists():
        shutil.rmtree(staging)
    staging.mkdir()
    shared_staging = staging / "_shared"
    shared_staging.mkdir()
    for name in ("cors.ts", "lkm-client.ts", "md5.ts"):
        shutil.copy(shared / name, shared_staging / name)
    index = (src_dir / "index.ts").read_text(encoding="utf-8")
    fn_dir = staging / fn
    fn_dir.mkdir()
    (fn_dir / "index.ts").write_text(index, encoding="utf-8")

    files = [
        {"name": f"{fn}/index.ts", "content": index},
        {"name": "_shared/cors.ts", "content": (shared_staging / "cors.ts").read_text(encoding="utf-8")},
        {
            "name": "_shared/lkm-client.ts",
            "content": (shared_staging / "lkm-client.ts").read_text(encoding="utf-8"),
        },
        {"name": "_shared/md5.ts", "content": (shared_staging / "md5.ts").read_text(encoding="utf-8")},
    ]
    out = {
        "name": fn,
        "entrypoint_path": f"{fn}/index.ts",
        "verify_jwt": False,
        "files": files,
    }
    out_path = root / f".deploy-{fn}.json"
    out_path.write_text(json.dumps(out), encoding="utf-8")
    print(fn, "files", len(files), "bytes", out_path.stat().st_size)
    return out


prep("reward-offers")
prep("lkm-points")
prep("lkm-transactions")
prep("staff-points")

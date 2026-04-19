from flask import Blueprint, request, jsonify, send_file
import io, json, textwrap
from datetime import datetime
import tempfile, subprocess, os
from database.mongo_client import mongo
from app.services.semgrep_service import run_audit
from dotenv import load_dotenv
from app.services.semgrep_service import run_audit_repo

ci_bp = Blueprint("ci", __name__)

# ============================================================
# 1️⃣ Generate GitHub Actions YAML file
# ============================================================

@ci_bp.route("/api/ci/generate-yml", methods=["POST"])
def generate_yml():
    """
    Endpoint untuk menghasilkan file audit.yml.
    User cukup POST {"repo": "username/repo"}.
    """
    data = request.json
    repo = data.get("repo")
    token = data.get("token", "YOUR_SECUREAUDIT_TOKEN")

    if not repo:
        return jsonify({"error": "Repository name is required"}), 400

    yaml_content = textwrap.dedent(f"""\
    name: SecureAudit
    on:
      push:
        branches: [ main, dev ]
    jobs:
      sast_scan:
        runs-on: ubuntu-latest
        steps:
          - name: Checkout repository
            uses: actions/checkout@v4

          - name: Send repo to SecureAudit
            run: |
              curl -X POST https://yourdomain.com/api/ci/webhook \\
              -H "Authorization: Bearer {token}" \\
              -H "Content-Type: application/json" \\
              -d '{{"repo": "{repo}", "commit": "${{{{ github.sha }}}}", "branch": "${{{{ github.ref_name }}}}"}}'
    """)

    # kirim sebagai file download
    return send_file(
        io.BytesIO(yaml_content.encode("utf-8")),
        as_attachment=True,
        download_name="secureaudit.yml",
        mimetype="text/plain"
    )


# ============================================================
# 2️⃣ Endpoint Webhook untuk menerima audit request
# ============================================================

load_dotenv()
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")

@ci_bp.route("/api/ci/webhook", methods=["POST"])
def ci_webhook():
    try:
        data = request.json
        repo_name = data.get("repo")
        commit_hash = data.get("commit")
        branch = data.get("branch", "main")

        tmp_dir = tempfile.mkdtemp()
        GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
        repo_url = f"https://{GITHUB_TOKEN}:x-oauth-basic@github.com/{repo_name}.git"

        print(f"🔍 Cloning {repo_url} into {tmp_dir} ...")
        subprocess.run(
            ["git", "clone", "--depth", "1", repo_url, tmp_dir],
            check=True,
            capture_output=True,
            text=True
        )
        print("✅ Clone success!")

        # Jalankan audit
        print("🔍 Running audit...")
        result = run_audit_repo(tmp_dir)
        print("✅ Audit result:", result)

        # Simpan hasil ke MongoDB
        mongo.db.audit_results.insert_one({
            "repo": repo_name,
            "commit": commit_hash,
            "branch": branch,
            "result": result,
            "timestamp": datetime.utcnow()
        })

        return jsonify({"status": "success", "message": "Audit completed"}), 200

    except subprocess.CalledProcessError as e:
        print("❌ Git clone failed:\n", e.stderr)
        return jsonify({"error": "Git clone failed", "stderr": e.stderr}), 500
    except Exception as e:
        import traceback
        print("❌ General error:\n", traceback.format_exc())
        return jsonify({"error": str(e)}), 500


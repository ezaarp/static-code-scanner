import tempfile, shutil, subprocess, os, json
from app.services.file_handler import handle_uploaded_file
from app.services.file_handler import allowed_archive, allowed_single
from database.mongo_client import mongo
from datetime import datetime

MAX_UPLOAD_SIZE = 200 * 1024 * 1024  # 200 MB
SEMGREP_CMD_BASE = ["semgrep", "scan"]
SEMGREP_TIMEOUT = 180
GIT_TIMEOUT = 90

AVAILABLE_CONFIGS = {
    "auto": "Auto (multi-language default)",
    "p/security-audit": "Security Audit (all languages)",
    "p/javascript": "JavaScript",
    "p/python": "Python",
    "p/php": "PHP",
    "p/nodejs": "Node.js",
}

def run_semgrep_json(target_dir: str, config: str):
    cmd = SEMGREP_CMD_BASE + ["--json", "--config", config, "--no-git-ignore", target_dir]
    proc = subprocess.run(cmd, capture_output=True, text=True, timeout=SEMGREP_TIMEOUT)
    return proc.stdout

def severity_to_cvss(sev: str) -> float:
    sev = (sev or "").upper()
    return {"HIGH": 8.0, "ERROR": 8.0, "MEDIUM": 5.0, "LOW": 2.0, "INFO": 0.1}.get(sev, 5.0)

def cvss_category(score: float) -> str:
    if score == 0.0: return "None"
    if 0.1 <= score <= 3.9: return "Low"
    if 4.0 <= score <= 6.9: return "Medium"
    if 7.0 <= score <= 8.9: return "High"
    if 9.0 <= score <= 10.0: return "Critical"
    return "Unknown"

def run_audit(request, github_token=None):
    """
    Menjalankan proses audit dengan Semgrep dan mengembalikan hasil JSON.
    Hasil audit juga otomatis disimpan ke MongoDB.
    """
    cl = request.content_length
    if cl and cl > MAX_UPLOAD_SIZE:
        return None, f"Upload terlalu besar (maksimum {MAX_UPLOAD_SIZE} bytes)"

    temp_root = tempfile.mkdtemp(prefix="semgrep-audit-")
    repo_dir = os.path.join(temp_root, "repo")
    os.makedirs(repo_dir, exist_ok=True)

    try:
        selected_config = "auto"
        uploaded = None
        git_url = ""

        if request.is_json:
            data = request.get_json()
            git_url = data.get("git_url", "").strip()
            selected_config = data.get("config", "auto").strip()
        else:
            uploaded = request.files.get("archive")
            git_url = request.form.get("git_url", "").strip()
            selected_config = request.form.get("config", "auto").strip()

        if selected_config not in AVAILABLE_CONFIGS:
            selected_config = "auto"

        if not uploaded and not git_url:
            return None, "Tidak ada file atau URL repository yang dikirim."

        # 🔹 Jika upload file
        repo_name = "uploaded_repo"
        if uploaded and uploaded.filename:
            try:
                handle_uploaded_file(uploaded, temp_root, repo_dir)
                repo_name = os.path.splitext(uploaded.filename)[0]
            except ValueError as e:
                return None, str(e)

        # 🔹 Jika git repo URL
        elif git_url:
            if github_token and "github.com" in git_url:
                if git_url.startswith("git@github.com:"):
                    repo_path = git_url.replace("git@github.com:", "").replace(".git", "")
                    authenticated_url = f"https://{github_token}@github.com/{repo_path}.git"
                elif git_url.startswith("https://github.com/"):
                    authenticated_url = git_url.replace("https://github.com/", f"https://{github_token}@github.com/")
                else:
                    authenticated_url = git_url
                print(f"🔐 Cloning private repo with authentication...")
            else:
                authenticated_url = git_url
                print(f"🔓 Cloning public repo...")

            subprocess.run(
                ["git", "clone", "--depth", "1", authenticated_url, repo_dir],
                capture_output=True,
                text=True,
                timeout=GIT_TIMEOUT,
                check=True
            )
            print(f"✅ Repository cloned successfully")
            repo_name = os.path.basename(authenticated_url).replace(".git", "")

        # 🔹 Jalankan Semgrep
        raw_json = run_semgrep_json(repo_dir, selected_config)
        data = json.loads(raw_json)

        findings = []
        for r in data.get("results", []):
            sev = r.get("extra", {}).get("severity", "MEDIUM")
            cvss_score = severity_to_cvss(sev)
            findings.append({
                "cvss_score": cvss_score,
                "cvss_severity": cvss_category(cvss_score),
                "check_id": r.get("check_id"),
                "path": r.get("path"),
                "line": r.get("start", {}).get("line"),
                "message": r.get("extra", {}).get("message"),
                "code": r.get("extra", {}).get("lines", "").strip(),
            })

        # ====================================
        # ✅ Simpan hasil ke MongoDB
        # ====================================
        audit_data = {
            "repo_name": repo_name,
            "config_used": selected_config,
            "timestamp": datetime.utcnow(),
            "findings": findings
        }

        try:
            mongo.db.audit_results.insert_one(audit_data)
            print(f"✅ Hasil audit '{repo_name}' tersimpan ke MongoDB.")
        except Exception as db_err:
            print(f"⚠️ Gagal menyimpan hasil audit ke MongoDB: {db_err}")

        # Kembalikan hasil ke frontend
        return findings, None

    except Exception as e:
        return None, f"Terjadi error: {e}"

    finally:
        shutil.rmtree(temp_root, ignore_errors=True)

def run_audit_repo(repo_path: str, config: str = "auto"):
    """
    Jalankan audit langsung dari folder repo (tanpa Flask request).
    Digunakan oleh endpoint CI/CD webhook.
    """
    try:
        print(f"🔍 Running Semgrep on {repo_path} with config '{config}'")

        if not os.path.exists(repo_path):
            return None, f"Folder {repo_path} tidak ditemukan."

        if config not in AVAILABLE_CONFIGS:
            config = "auto"

        # Jalankan semgrep dan ambil hasil JSON
        raw_json = run_semgrep_json(repo_path, config)
        data = json.loads(raw_json)

        findings = []
        for r in data.get("results", []):
            sev = r.get("extra", {}).get("severity", "MEDIUM")
            cvss_score = severity_to_cvss(sev)
            findings.append({
                "cvss_score": cvss_score,
                "cvss_severity": cvss_category(cvss_score),
                "check_id": r.get("check_id"),
                "path": r.get("path"),
                "line": r.get("start", {}).get("line"),
                "message": r.get("extra", {}).get("message"),
                "code": r.get("extra", {}).get("lines", "").strip(),
            })

        # Simpan ke MongoDB
        audit_data = {
            "repo_name": os.path.basename(repo_path),
            "config_used": config,
            "timestamp": datetime.utcnow(),
            "findings": findings
        }

        try:
            mongo.db.audit_results.insert_one(audit_data)
            print(f"✅ Audit result for '{repo_path}' saved to MongoDB.")
        except Exception as db_err:
            print(f"⚠️ Failed to save audit result: {db_err}")

        return findings, None

    except Exception as e:
        print(f"❌ Error in run_audit_repo: {e}")
        return None, str(e)
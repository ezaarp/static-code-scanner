# app/routes/main_routes.py
from flask import Blueprint, render_template, request, jsonify, redirect, url_for, session
from app.services.semgrep_service import run_audit, AVAILABLE_CONFIGS
from app.oauth.github_oauth import get_github_user, is_github_logged_in, logout_github, get_user_repos
from app.oauth.jwt_auth import require_auth, verify_token
from flask_dance.contrib.github import github
from database.mongo_client import mongo
import requests

main_bp = Blueprint("main", __name__)

# ====================== LANDING ===========================
@main_bp.route("/", methods=["GET"])
def home():
    return render_template("index.html")

# ====================== LOGIN PAGE =========================
@main_bp.route("/login", methods=["GET"])
def login_page():
    """Halaman login"""
    if "github_user" in session:
        return redirect(url_for("main.dashboard"))
    return render_template("login.html")

# ====================== GITHUB LOGIN =======================
@main_bp.route("/github/login")
def github_login():
    """Mulai login GitHub"""
    from flask import url_for
    print("🔍 DEBUG: /github/login endpoint dipanggil")

    if github.authorized and "github_user" in session:
        print(f"✅ User sudah login: {session['github_user'].get('login')}")
        return redirect(url_for("main.dashboard"))

    login_url = url_for("github.login")
    # paksa pilih akun
    login_url = login_url + ("&" if "?" in login_url else "?") + "prompt=login"

    print(f"🔍 Redirecting ke GitHub OAuth dengan URL: {login_url}")
    return redirect(login_url)

# ====================== LOGOUT =============================
@main_bp.route("/github/logout")
def github_logout():
    """Logout penuh dan redirect ke FE"""
    print("🔄 LOGOUT: Clearing session and OAuth tokens...")

    # hapus semua session
    session.clear()

    # hapus token GitHub OAuth
    try:
        if github.authorized:
            del github.token
    except Exception as e:
        print(f"⚠️ Error deleting OAuth token: {e}")

    # redirect ke FE React/Next.js login page
    frontend_login_url = "http://localhost:3000/login"
    print(f"➡️ Redirecting to frontend: {frontend_login_url}")
    return redirect(frontend_login_url)

# ====================== CALLBACK (HTML ➜ auto redirect) ===
@main_bp.route("/auth/callback-success")
def callback_success():
    """
    Intermediate page setelah OAuth callback berhasil.
    Tampilkan konfirmasi + auto-redirect ke dashboard.
    """
    print("🔄 CALLBACK-SUCCESS: Intermediate page loaded")
    print(f"🔄 Session keys: {list(session.keys())}")
    print(f"🔄 github_user in session: {'github_user' in session}")
    print(f"🔄 jwt_token in session: {'jwt_token' in session}")

    if "github_user" not in session or "jwt_token" not in session:
        print("❌ CALLBACK-SUCCESS: No github_user or jwt_token in session, redirect ke /login")
        return redirect("/login")

    user = session.get("github_user")
    jwt_token = session.get("jwt_token")

    print(f"✅ CALLBACK-SUCCESS: User {user.get('login')} confirmed")
    print(f"✅ CALLBACK-SUCCESS: JWT token exists")

    return render_template("callback_success.html",
                           username=user.get("login"),
                           jwt_token=jwt_token)

# ====================== DASHBOARD ==========================
@main_bp.route("/dashboard", methods=["GET"])
def dashboard():
    """Halaman dashboard setelah login"""
    if "github_user" not in session:
        return redirect(url_for("main.login_page"))
    return render_template("dashboard.html", configs=AVAILABLE_CONFIGS)

# ====================== AUDIT ==============================
@main_bp.route("/audit", methods=["POST"])
@require_auth
def audit(current_user):
    """Run security audit (JWT protected)"""
    print(f"🔍 Running audit for user: {current_user['login']}")

    github_token = current_user.get("github_token")
    findings, error = run_audit(request, github_token=github_token)
    if error:
        return jsonify({"status": "error", "message": error}), 400

    # opsional ringkas simpan disini juga (detail sudah disave di service jika kamu aktifkan)
    try:
        mongo.db.audit_results.insert_one({
            "user_login": current_user["login"],
            "user_id": current_user.get("github_id"),
            "total_findings": len(findings),
            "results": findings,
        })
    except Exception as e:
        print(f"⚠️ Gagal menyimpan ringkas audit dari route: {e}")

    return jsonify({
        "status": "success",
        "total_findings": len(findings),
        "results": findings
    }), 200

# ====================== TEST SESSION =======================
@main_bp.route("/test/session", methods=["GET"])
def test_session():
    """Test endpoint untuk debug session"""
    print("🔍 DEBUG /test/session:")
    print(f"  - Session keys: {list(session.keys())}")
    print(f"  - is_github_logged_in(): {is_github_logged_in() if 'github_user' in session else False}")
    print(f"  - github.authorized: {getattr(github, 'authorized', False)}")
    print(f"  - Request cookies: {dict(request.cookies)}")

    if "github_user" in session:
        user = session["github_user"]
        return jsonify({
            "status": "authenticated",
            "user": user,
            "message": f"Session active for user: {user.get('login')}"
        }), 200

    return jsonify({
        "status": "no_session",
        "message": "No github_user in session",
        "session_keys": list(session.keys())
    }), 200

# ====================== GITHUB REPOS =======================
@main_bp.route("/github/repos", methods=["GET"])
@require_auth
def github_repos(current_user):
    """Get GitHub repositories via JWT Auth"""
    print("🔍 DEBUG /github/repos (JWT AUTH):")
    print(f"  - Authenticated user: {current_user['login']}")
    print(f"  - User ID: {current_user.get('github_id')}")

    github_token = current_user.get("github_token")
    if not github_token:
        print("❌ No GitHub token in JWT")
        return jsonify({"status": "error", "message": "No GitHub token found"}), 400

    headers = {"Authorization": f"token {github_token}"}
    resp = requests.get(
        "https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member",
        headers=headers
    )

    if resp.status_code != 200:
        print(f"❌ Error getting repos: {resp.text}")
        return jsonify({"status": "error", "message": f"Failed to fetch repositories: {resp.text}"}), 400

    repos = resp.json()
    simplified_repos = [
        {
            "name": r["name"],
            "full_name": r["full_name"],
            "private": r["private"],
            "html_url": r["html_url"],
            "clone_url": r["clone_url"],
        }
        for r in repos
    ]
    print(f"✅ Returning {len(simplified_repos)} repos for user {current_user['login']}")
    return jsonify({"status": "success", "count": len(simplified_repos), "repos": simplified_repos}), 200

# ====================== CHECK AUTH =========================
@main_bp.route("/auth/check", methods=["GET"])
def check_auth():
    """Check if user is authenticated (JWT based)"""
    print("🔍 DEBUG /auth/check (JWT):")

    auth_header = request.headers.get("Authorization")
    if not auth_header:
        print("❌ No Authorization header")
        return jsonify({"status": "unauthenticated"}), 401

    try:
        token_type, token = auth_header.split(" ")
        if token_type.lower() != "bearer":
            print("❌ Invalid token type")
            return jsonify({"status": "unauthenticated"}), 401

        user_data, error = verify_token(token)
        if error:
            print(f"❌ Token verification failed: {error}")
            return jsonify({"status": "unauthenticated", "message": error}), 401

        print(f"✅ User authenticated via JWT: {user_data['login']}")
        return jsonify({
            "status": "authenticated",
            "user": {
                "login": user_data.get("login"),
                "avatar_url": user_data.get("avatar_url"),
                "html_url": user_data.get("html_url")
            }
        }), 200

    except Exception as e:
        print(f"❌ Auth check error: {str(e)}")
        return jsonify({"status": "unauthenticated"}), 401

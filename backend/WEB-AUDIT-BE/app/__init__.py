# app/__init__.py
from flask import Flask, session, redirect
from flask_cors import CORS
from flask_session import Session
from flask_dance.contrib.github import make_github_blueprint
from flask_dance.consumer import oauth_authorized
from app.routes.main_routes import main_bp
from app.oauth.jwt_auth import generate_token
from database.mongo_client import init_app as init_mongo
from dotenv import load_dotenv
from datetime import datetime
import os
from app.routes.ci_routes import ci_bp


def create_app():
    app = Flask(__name__)
    app.secret_key = "supersecretkey"

    # 🔐 Session config
    app.config.update(
        SESSION_PERMANENT=True,
        PERMANENT_SESSION_LIFETIME=3600,
        SESSION_TYPE="filesystem",
        SESSION_FILE_DIR="./flask_session",
        SESSION_FILE_THRESHOLD=100,
        SESSION_COOKIE_NAME="web_audit_session",
        SESSION_COOKIE_SAMESITE="Lax",
        SESSION_COOKIE_SECURE=False,
        SESSION_COOKIE_HTTPONLY=False,
        SESSION_COOKIE_DOMAIN=None,
        SESSION_COOKIE_PATH="/",
    )
    Session(app)

    # 🌍 CORS (FE next/react di 3000)
    CORS(
        app,
        supports_credentials=True,
        origins=["http://localhost:3000", "http://127.0.0.1:3000"],
        allow_headers=["Content-Type", "Authorization", "Cookie"],
        expose_headers=["Set-Cookie"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    )

    # 🧩 Load .env & MongoDB
    load_dotenv()
    app.config["MONGO_URI"] = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017/sastdb")
    init_mongo(app)

    # 🔑 GitHub OAuth Setup
    os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"
    os.environ["OAUTHLIB_RELAX_TOKEN_SCOPE"] = "1"

    github_bp = make_github_blueprint(
        client_id=os.getenv("GITHUB_CLIENT_ID"),
        client_secret=os.getenv("GITHUB_CLIENT_SECRET"),
        scope="read:user repo user:email",
        redirect_to="main.callback_success",  # flow stabil
    )
    app.register_blueprint(github_bp, url_prefix="/login")

    # 🧭 blueprint routes
    app.register_blueprint(main_bp)

    # blueprint ci_bp
    app.register_blueprint(ci_bp)

    # ✅ OAuth Callback (STABIL)
    @oauth_authorized.connect_via(github_bp)
    def github_logged_in(blueprint, token):
        from database.mongo_client import mongo

        try:
            print("🎯 OAuth signal dipanggil")
            print(f"🎯 Token received: {token is not None}")
            if not token:
                print("❌ No token received")
                return redirect("/login")

            resp = blueprint.session.get("/user")
            if not resp.ok:
                print(f"❌ Failed to get user info (status {resp.status_code})")
                return redirect("/login")

            user_info = resp.json()
            print(f"🧩 user_info: {user_info}")

            # guard mencegah KeyError
            if "id" not in user_info or "login" not in user_info:
                print("❌ user_info tidak lengkap")
                return redirect("/login")

            # payload untuk DB + JWT (boleh 'lebih'—memuat github_token)
            user_data = {
                "github_id": user_info["id"],
                "login": user_info["login"],
                "avatar_url": user_info.get("avatar_url"),
                "html_url": user_info.get("html_url"),
                "github_token": token.get("access_token"),  # simpan untuk clone private repo
                "last_login": datetime.utcnow(),
            }

            # simpan / update di MongoDB
            existing = mongo.db.users.find_one({"github_id": user_info["id"]})
            if existing:
                mongo.db.users.update_one(
                    {"github_id": user_info["id"]},
                    {"$set": {
                        "avatar_url": user_info.get("avatar_url"),
                        "html_url": user_info.get("html_url"),
                        "github_token": token.get("access_token"),
                        "last_login": datetime.utcnow()
                    }},
                )
                print(f"♻️ Update user: {user_info['login']}")
            else:
                doc = dict(user_data)
                doc["created_at"] = datetime.utcnow()
                mongo.db.users.insert_one(doc)
                print(f"✅ User {user_info['login']} tersimpan di MongoDB")

            # minimal data ke session (untuk server-rendered pages)
            session["github_user"] = {
                "login": user_info["login"],
                "avatar_url": user_info.get("avatar_url"),
                "html_url": user_info.get("html_url"),
            }

            # Generate JWT (isi lengkap termasuk github_token)
            jwt_token = generate_token(user_data)
            session["jwt_token"] = jwt_token

            print(f"✅ Login sukses untuk {user_info['login']}")
            # flow stabil: tampilkan halaman callback lalu auto-redirect ke /dashboard
            return redirect("/auth/callback-success")

        except Exception as e:
            print(f"❌ ERROR di github_logged_in: {e}")
            return redirect("/login")

    return app

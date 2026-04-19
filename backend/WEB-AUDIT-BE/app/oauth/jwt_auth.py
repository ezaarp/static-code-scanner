# app/oauth/jwt_auth.py
import os
import time
import jwt
from functools import wraps
from flask import request, jsonify, session

JWT_SECRET = os.getenv("JWT_SECRET", "supersecretkeyjwt")
JWT_ALG = "HS256"
JWT_TTL_SECONDS = int(os.getenv("JWT_TTL_SECONDS", "86400"))  # 24h

def generate_token(user_data: dict) -> str:
    now = int(time.time())
    payload = {
        "sub": str(user_data.get("github_id") or user_data.get("login")),
        "iat": now,
        "exp": now + JWT_TTL_SECONDS,
        "login": user_data.get("login"),
        "github_id": user_data.get("github_id"),
        "avatar_url": user_data.get("avatar_url"),
        "html_url": user_data.get("html_url"),
        "github_token": user_data.get("github_token"),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

def verify_token(token: str):
    try:
        data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        return data, None
    except Exception as e:
        return None, str(e)

def require_auth(view_func):
    @wraps(view_func)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        token = None

        if auth_header and " " in auth_header:
            scheme, token = auth_header.split(" ", 1)
            if scheme.lower() != "bearer":
                return jsonify({"status": "error", "message": "Invalid token type"}), 401

        if not token:
            token = session.get("jwt_token")

        if not token:
            return jsonify({"status": "error", "message": "Missing token"}), 401

        user_data, error = verify_token(token)
        if error or not user_data:
            return jsonify({"status": "error", "message": f"Invalid token: {error}"}), 401

        kwargs["current_user"] = user_data
        return view_func(*args, **kwargs)
    return wrapper

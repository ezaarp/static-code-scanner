# app/oauth/github_oauth.py
from flask_dance.contrib.github import github

def get_github_user():
    if not github.authorized:
        return None
    resp = github.get("/user")
    if not resp.ok:
        return None
    return resp.json()

def is_github_logged_in():
    return bool(github.authorized)

def logout_github():
    try:
        if github.authorized:
            del github.token
    except Exception:
        pass

def get_user_repos():
    if not github.authorized:
        return []
    resp = github.get("/user/repos?per_page=100&sort=updated")
    if not resp.ok:
        return []
    return resp.json()

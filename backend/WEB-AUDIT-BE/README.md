# Web Audit Backend

Security vulnerability scanning backend powered by Semgrep and Flask.

## Prerequisites

- Python 3.8 or higher
- pip
- Git
- Semgrep installed on system

## Installation

### Step 1: Clone Repository

```bash
git clone https://github.com/nevmock/WEB-AUDIT-BE.git
cd WEB-AUDIT-BE
```

### Step 2: Install Dependencies

```bash
pip install -r requirement.txt
```

### Step 3: Install Semgrep

```bash
pip install semgrep
```

### Step 4: Create Environment File

Create a file named `.env` in the root directory:

```bash
touch .env
```

Add the following content to `.env`:

```
GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret
```

#### How to Get GitHub OAuth Credentials:

1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Click "New OAuth App"
3. Fill in the form:
   - Application name: Web Audit
   - Homepage URL: http://localhost:3000
   - Authorization callback URL: http://localhost:5000/login/github/authorized
4. Click "Register application"
5. Copy the Client ID and generate a Client Secret
6. Paste both values into your .env file

### Step 5: Run the Application

```bash
python run.py
```

The backend will start on `http://localhost:5000`

## API Endpoints

- `GET /` - Landing page
- `GET /github/login` - Initiate GitHub OAuth
- `GET /auth/callback-success` - OAuth callback handler
- `GET /github/repos` - Get user repositories (requires JWT)
- `POST /audit` - Run security scan (requires JWT)
- `GET /github/logout` - Logout user

## Testing

Access the test session endpoint:

```bash
curl http://localhost:5000/test/session
```

## Project Structure

```
WEB-AUDIT-BE/
├── app/
│   ├── __init__.py           # Flask app initialization
│   ├── oauth/
│   │   ├── github_oauth.py   # GitHub OAuth functions
│   │   └── jwt_auth.py       # JWT authentication
│   ├── routes/
│   │   └── main_routes.py    # API routes
│   ├── services/
│   │   ├── file_handler.py   # File upload handler
│   │   └── semgrep_service.py # Semgrep integration
│   └── templates/            # HTML templates
├── flask_session/            # Session storage
├── requirement.txt           # Python dependencies
└── run.py                    # Application entry point
```

## Notes

- Make sure frontend is running on port 3000
- Session data is stored in flask_session/ directory
- JWT tokens are valid for 24 hours
- Default host: localhost, port: 5000


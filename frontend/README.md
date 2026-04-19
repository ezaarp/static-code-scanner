# Web Audit Frontend

Next.js frontend application for security vulnerability scanning interface.

## Prerequisites

- Node.js 18.0 or higher
- npm or yarn
- Backend API running on port 5000

## Installation

### Step 1: Clone Repository

```bash
git clone https://github.com/nevmock/WEB-AUDIT-FE.git
cd WEB-AUDIT-FE
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Create Environment File (Optional)

Create a file named `.env.local` in the root directory:

```bash
touch .env.local
```

Add the following content (optional, defaults are provided):

```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Step 4: Run Development Server

```bash
npm run dev
```

The application will start on `http://localhost:3000`

## Build for Production

```bash
npm run build
npm start
```

## Available Pages

- `/` - Landing page
- `/login` - GitHub OAuth login page
- `/dashboard` - User dashboard with repositories
- `/scan/[repoName]` - Scan results page
- `/about` - About us page

## Features

- GitHub OAuth authentication with JWT
- Repository listing and management
- Real-time security scanning
- Vulnerability report with severity levels
- JSON export functionality
- Responsive design

## Project Structure

```
WEB-AUDIT-FE/
├── app/
│   ├── page.tsx              # Landing page
│   ├── login/
│   │   └── page.tsx          # Login page
│   ├── dashboard/
│   │   └── page.tsx          # Dashboard
│   ├── scan/
│   │   └── [repoName]/
│   │       └── page.tsx      # Scan results
│   ├── about/
│   │   └── page.tsx          # About page
│   └── globals.css           # Global styles
├── components/               # Reusable components
├── lib/
│   ├── api.ts                # API client
│   └── utils.ts              # Utility functions
└── public/                   # Static assets
```

## Configuration

API base URL is configured in `lib/api.ts`:

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
```

## Notes

- Make sure backend is running on port 5000
- Use localhost (not 127.0.0.1) for both frontend and backend
- JWT token is stored in browser localStorage
- Token expires after 24 hours

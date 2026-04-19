import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Token storage keys
const TOKEN_KEY = 'web_audit_jwt_token';
const USER_KEY = 'web_audit_user';

// Get JWT token from localStorage
export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
};

// Save JWT token to localStorage
export const saveToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
  console.log('✅ Token saved to localStorage');
};

// Remove JWT token from localStorage
export const removeToken = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  console.log('🗑️ Token removed from localStorage');
};

// Save user data to localStorage
export const saveUser = (user: any): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

// Get user data from localStorage
export const getUser = (): any | null => {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
};

// Create axios instance with JWT authentication
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT token to every request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 JWT token attached to request');
    } else {
      console.warn('⚠️ No JWT token found');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 responses (token expired/invalid)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('❌ Authentication failed - token may be expired');
      removeToken();
      // Redirect to login will be handled by the component
    }
    return Promise.reject(error);
  }
);

export interface Repository {
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  clone_url: string;
}

export interface ScanFinding {
  cvss_score: number;
  cvss_severity: string;
  check_id: string;
  path: string;
  line: number;
  message: string;
  code: string;
}

export interface ScanResponse {
  status: string;
  total_findings: number;
  results: ScanFinding[];
}

export interface ReposResponse {
  status: string;
  count: number;
  repos: Repository[];
}

export interface AuditHistoryItem {
  _id: string;
  repo_name: string;
  timestamp: string;
  total_findings: number;
  config_used: string;
  severity_counts?: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export interface AuditHistoryResponse {
  status: string;
  count: number;
  history: AuditHistoryItem[];
}

export interface AuditDetailResponse {
  status: string;
  audit: {
    _id: string;
    repo_name: string;
    timestamp: string;
    total_findings: number;
    config_used: string;
    results: ScanFinding[];
    findings: ScanFinding[];
  };
}

export interface MonitoredRepo {
  name: string;
  full_name: string;
  last_scan: string | null;
  total_findings: number;
  severity_breakdown: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  status: 'active' | 'inactive';
}

export interface MonitoredReposResponse {
  status: string;
  repos: MonitoredRepo[];
  webhook_url: string;
  count: number;
}

export interface FindingDetail {
  _id?: string;
  check_id: string;
  path: string;
  start?: { line: number; col: number };
  end?: { line: number; col: number };
  line?: number; // Fallback for different data structures
  message: string;
  severity?: string;
  cvss_severity: string;
  metadata?: {
    confidence?: string;
    impact?: string;
    likelihood?: string;
    references?: string[];
    cwe?: string[];
  };
}

export interface RepoFindingsResponse {
  status: string;
  repo_name: string;
  findings: FindingDetail[];
  total_findings: number;
  severity_breakdown: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  last_scan: string;
}

export const api = {
  // Get user repositories
  async getRepos(): Promise<Repository[]> {
    try {
      console.log('🔍 API: Fetching repos...');
      const response = await axiosInstance.get<ReposResponse>('/github/repos');
      console.log('✅ API: Repos fetched successfully', response.data);
      return response.data.repos;
    } catch (error: any) {
      console.error('❌ API: Error fetching repos:', error.response?.data || error.message);
      console.error('❌ API: Status:', error.response?.status);
      console.error('❌ API: Headers:', error.response?.headers);
      throw error;
    }
  },

  // Run security scan
  async runScan(gitUrl: string, config: string = 'auto'): Promise<ScanResponse> {
    try {
      console.log('🔍 API: Running scan for:', gitUrl);
      const response = await axiosInstance.post<ScanResponse>(
        '/audit',
        { git_url: gitUrl, config }
      );
      console.log('✅ API: Scan completed', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ API: Error running scan:', error.response?.data || error.message);
      throw error;
    }
  },

  // GitHub OAuth login
  githubLogin() {
    console.log('🔗 API: Redirecting to GitHub OAuth...');
    window.location.href = `${API_BASE_URL}/github/login`;
  },

  // Check if user is authenticated
  async checkAuth() {
    try {
      console.log('🔍 API: Checking authentication...');
      const response = await axiosInstance.get('/auth/check');
      console.log('✅ API: Auth check passed', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ API: Auth check failed:', error.response?.data || error.message);
      throw error;
    }
  },

  // Logout
  logout() {
    console.log('🔗 API: Logging out...');
    console.log('🗑️ Removing token from localStorage...');
    removeToken();
    console.log('🔄 Redirecting to backend logout...');
    // Call backend logout untuk clear OAuth session
    setTimeout(() => {
      window.location.href = `${API_BASE_URL}/github/logout`;
    }, 100); // Small delay untuk pastikan console log terlihat
  },

  // Check if user has valid token
  isAuthenticated(): boolean {
    const token = getToken();
    return !!token;
  },

  // Get audit history
  async getAuditHistory(): Promise<AuditHistoryItem[]> {
    try {
      console.log('🔍 API: Fetching audit history...');
      const response = await axiosInstance.get<AuditHistoryResponse>('/audit/history');
      console.log('✅ API: Audit history fetched successfully', response.data);
      return response.data.history;
    } catch (error: any) {
      console.error('❌ API: Error fetching audit history:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get audit detail by ID
  async getAuditDetail(auditId: string): Promise<AuditDetailResponse['audit']> {
    try {
      console.log('🔍 API: Fetching audit detail for ID:', auditId);
      const response = await axiosInstance.get<AuditDetailResponse>(`/audit/detail/${auditId}`);
      console.log('✅ API: Audit detail fetched successfully', response.data);
      return response.data.audit;
    } catch (error: any) {
      console.error('❌ API: Error fetching audit detail:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get monitored repositories for CI/CD
  async getMonitoredRepos(): Promise<MonitoredReposResponse> {
    try {
      console.log('🔍 API: Fetching monitored repositories...');
      const response = await axiosInstance.get<MonitoredReposResponse>('/api/ci/monitored-repos');
      console.log('✅ API: Monitored repos fetched successfully', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ API: Error fetching monitored repos:', error.response?.data || error.message);
      console.error('❌ API: Status:', error.response?.status);
      console.error('❌ API: Headers:', error.response?.headers);
      throw error;
    }
  },

  // Get detailed findings for a specific monitored repository
  async getRepoFindings(repoName: string): Promise<RepoFindingsResponse> {
    try {
      console.log('🔍 API: Fetching findings for repo:', repoName);
      const response = await axiosInstance.get<RepoFindingsResponse>(`/api/ci/repo-findings/${encodeURIComponent(repoName)}`);
      console.log('✅ API: Repo findings fetched successfully', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ API: Error fetching repo findings:', error.response?.data || error.message);
      throw error;
    }
  },

  // Generate YML workflow
  async generateYML(repo: string, webhookUrl: string, token: string): Promise<string> {
    try {
      console.log('🔍 API: Generating YML for repo:', repo);
      const response = await axiosInstance.post('/api/ci/generate-yml', {
        repo,
        webhook_url: webhookUrl,
        token
      });
      console.log('✅ API: YML generated successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ API: Error generating YML:', error.response?.data || error.message);
      throw error;
    }
  },
};


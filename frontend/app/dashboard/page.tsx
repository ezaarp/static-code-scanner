'use client';

import AuditHistorySidebar from '@/components/AuditHistorySidebar';
import Button from '@/components/Button';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import RepoCard from '@/components/RepoCard';
import { api, getToken, Repository, saveToken, saveUser, ScanResponse } from '@/lib/api';
import { AlertCircle, Filter, FolderGit, History, Loader, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const router = useRouter();
  const [repos, setRepos] = useState<Repository[]>([]);
  const [filteredRepos, setFilteredRepos] = useState<Repository[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'public' | 'private'>('all');
  const [scanningRepo, setScanningRepo] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    // Extract JWT token from URL hash (if present)
    const hash = window.location.hash;
    if (hash && hash.includes('token=')) {
      const tokenParam = hash.split('token=')[1];
      if (tokenParam) {
        const token = decodeURIComponent(tokenParam);
        console.log('✅ JWT token received from OAuth callback');
        saveToken(token);
        
        // Clear the hash from URL
        window.history.replaceState(null, '', window.location.pathname);
        
        // Verify token and get user info
        api.checkAuth().then(result => {
          if (result.status === 'authenticated') {
            console.log('✅ User authenticated:', result.user);
            saveUser(result.user);
          }
        }).catch(err => {
          console.error('❌ Auth check failed:', err);
        });
      }
    }

    // Check if already has token
    const existingToken = getToken();
    if (!existingToken) {
      console.log('❌ No token found, redirecting to login...');
      router.push('/login');
      return;
    }

    // Fetch repos
    fetchRepos();
  }, []);

  useEffect(() => {
    let filtered = repos;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(repo =>
        repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repo.full_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply privacy filter
    if (filter !== 'all') {
      filtered = filtered.filter(repo =>
        filter === 'public' ? !repo.private : repo.private
      );
    }

    setFilteredRepos(filtered);
  }, [repos, searchQuery, filter]);

  const fetchRepos = async () => {
    try {
      setIsLoading(true);
      const data = await api.getRepos();
      setRepos(data);
      setFilteredRepos(data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching repos:', err);
      if (err.response?.status === 401) {
        // Delay redirect untuk menghindari loop
        console.log('Unauthorized - redirecting to login...');
        setTimeout(() => {
          router.push('/login');
        }, 1000);
      } else {
        setError('Failed to fetch repositories. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleScan = async (repo: Repository) => {
    try {
      setScanningRepo(repo.full_name);
      
      const result: ScanResponse = await api.runScan(repo.clone_url, 'auto');
      
      // Store scan results in sessionStorage to pass to results page
      sessionStorage.setItem('scanResults', JSON.stringify({
        repo: repo,
        results: result.results,
        total: result.total_findings,
      }));

      // Navigate to results page
      router.push(`/scan/${encodeURIComponent(repo.name)}`);
    } catch (err: any) {
      console.error('Error scanning repo:', err);
      alert('Failed to scan repository. Please try again.');
    } finally {
      setScanningRepo(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar isLoggedIn={true} />
        <div className="pt-24 pb-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col items-center justify-center py-20">
              <Loader className="h-12 w-12 text-primary-600 animate-spin mb-4" />
              <p className="text-gray-600">Loading your repositories...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar isLoggedIn={true} />
        <div className="pt-24 pb-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col items-center justify-center py-20">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <p className="text-red-600 text-lg mb-4">{error}</p>
              <Button onClick={fetchRepos}>Try Again</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar isLoggedIn={true} />
      
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  Your Repositories
                </h1>
                <p className="text-gray-600">
                  Select a repository to scan for security vulnerabilities
                </p>
              </div>
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-md hover:shadow-lg"
              >
                <History className="h-5 w-5" />
                <span className="font-medium">Repo History</span>
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Repositories</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{repos.length}</p>
                </div>
                <FolderGit className="h-12 w-12 text-primary-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Public Repositories</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {repos.filter(r => !r.private).length}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-2xl">🌐</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Private Repositories</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {repos.filter(r => r.private).length}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <span className="text-2xl">🔒</span>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search repositories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-400" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                >
                  <option value="all">All Repositories</option>
                  <option value="public">Public Only</option>
                  <option value="private">Private Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Repository List */}
          {filteredRepos.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <FolderGit className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No repositories found
              </h3>
              <p className="text-gray-600">
                {searchQuery || filter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No repositories available in your GitHub account'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredRepos.map((repo) => (
                <RepoCard
                  key={repo.full_name}
                  repo={repo}
                  onScan={handleScan}
                  isScanning={scanningRepo === repo.full_name}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
      
      {/* Audit History Sidebar */}
      <AuditHistorySidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
    </div>
  );
}


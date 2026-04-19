'use client';

import Button from '@/components/Button';
import Footer from '@/components/Footer';
import MonitoredRepoCard from '@/components/MonitoredRepoCard';
import Navbar from '@/components/Navbar';
import { api, getToken, MonitoredRepo } from '@/lib/api';
import { Activity, AlertCircle, Loader, RefreshCw, ShieldCheck, ShieldOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export default function MonitoringPage() {
  const router = useRouter();
  const [repos, setRepos] = useState<MonitoredRepo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [previousData, setPreviousData] = useState<any>(null);
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);

  const fetchMonitoredRepos = useCallback(async (isAutoRefresh = false) => {
    try {
      if (isAutoRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      
      // Fetch repos using API helper
      const data = await api.getMonitoredRepos();
      
      // Check for changes in data
      if (previousData && isAutoRefresh) {
        const hasChanges = JSON.stringify(data.repos) !== JSON.stringify(previousData.repos);
        if (hasChanges) {
          console.log('🔄 Data changes detected! Updating UI...');
          setShowUpdateNotification(true);
          // Auto-hide notification after 3 seconds
          setTimeout(() => setShowUpdateNotification(false), 3000);
        }
      }
      
      setRepos(data.repos || []);
      setPreviousData(data);
      if (data.webhook_url) {
        setWebhookUrl(data.webhook_url);
      }
      setLastRefresh(new Date());
      console.log('✅ Monitored repos refreshed:', data.repos?.length || 0, 'repos');
      
      // Log findings count for debugging
      data.repos?.forEach(repo => {
        console.log(`📊 ${repo.full_name}: ${repo.total_findings} findings (${repo.status})`);
        console.log(`   Severity: Critical=${repo.severity_breakdown?.critical || 0}, High=${repo.severity_breakdown?.high || 0}, Medium=${repo.severity_breakdown?.medium || 0}, Low=${repo.severity_breakdown?.low || 0}`);
        console.log(`   Last scan: ${repo.last_scan}`);
      });
    } catch (err: any) {
      console.error('Error fetching monitored repos:', err);
      setError(err.response?.data?.error || err.message || 'Failed to load monitored repositories');
      
      // If unauthorized, redirect to login
      if (err.response?.status === 401) {
        router.push('/login');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    // Check auth
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    // Initial fetch
    fetchMonitoredRepos();
  }, [fetchMonitoredRepos, router]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      // More aggressive polling for real-time updates
      interval = setInterval(() => {
        console.log('🔄 Auto-refreshing monitored repos...');
        fetchMonitoredRepos(true); // Pass isAutoRefresh = true
      }, 10000); // Refresh every 10 seconds for real-time updates
    }
    return () => clearInterval(interval);
  }, [autoRefresh, fetchMonitoredRepos]);

  const totalMonitored = repos.length;
  const activeMonitored = repos.filter(repo => repo.status === 'active').length;
  const totalFindings = repos.reduce((sum, repo) => sum + repo.total_findings, 0);

  const formatLastRefresh = () => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - lastRefresh.getTime()) / 1000);
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    return `${Math.floor(diffInSeconds / 3600)}h ago`;
  };

  if (isLoading && repos.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar isLoggedIn={true} />
        <div className="pt-24 pb-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col items-center justify-center py-20">
              <Loader className="h-12 w-12 text-primary-600 animate-spin mb-4" />
              <p className="text-gray-600">Loading CI/CD monitoring data...</p>
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
          {/* Update Notification */}
          {showUpdateNotification && (
            <div className="fixed top-20 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
              <RefreshCw className="h-4 w-4" />
              <span>Data updated! New scan results available.</span>
            </div>
          )}
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">CI/CD Monitoring</h1>
            <p className="text-gray-600">
              Monitor the security status of your repositories integrated with CI/CD workflows.
            </p>
            <div className="flex items-center gap-2 mt-2">
              {lastRefresh && (
                <p className="text-sm text-gray-500">
                  Last updated: {formatLastRefresh()}
                </p>
              )}
              {isRefreshing && (
                <div className="flex items-center gap-1 text-sm text-blue-600">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Refreshing...</span>
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Monitored Repos</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{totalMonitored}</p>
                </div>
                <Activity className="h-12 w-12 text-primary-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Scans</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">{activeMonitored}</p>
                </div>
                <ShieldCheck className="h-12 w-12 text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Findings</p>
                  <p className="text-3xl font-bold text-red-600 mt-1">{totalFindings}</p>
                </div>
                <AlertCircle className="h-12 w-12 text-red-500" />
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 text-gray-700">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="form-checkbox h-4 w-4 text-primary-600 rounded"
                />
                <span>Auto-refresh (30s)</span>
              </label>
              {autoRefresh && (
                <span className="text-sm text-gray-500">
                  Next refresh in {30 - (Math.floor((new Date().getTime() - lastRefresh.getTime()) / 1000) % 30)}s
                </span>
              )}
            </div>
            <Button onClick={() => fetchMonitoredRepos(false)} variant="secondary" disabled={isLoading || isRefreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} /> 
              Refresh
            </Button>
          </div>

          {/* Repository List */}
          {error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center">
              <AlertCircle className="h-5 w-5 mr-3" />
              <span>{error}</span>
            </div>
          ) : repos.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <ShieldOff className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Repositories Under CI/CD Monitoring
              </h3>
              <p className="text-gray-600 mb-4">
                Integrate your GitHub repositories with SecureAudit to start monitoring.
              </p>
              <p className="text-sm text-gray-500">
                Scan a repository from the "Repositories" page first, then click "Generate Workflow YML" on its card here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {repos.map((repo) => (
                <MonitoredRepoCard key={repo.full_name} repo={repo} webhookUrl={webhookUrl} />
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
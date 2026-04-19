'use client';

import Button from '@/components/Button';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import VulnerabilityCard from '@/components/VulnerabilityCard';
import { Repository, ScanFinding } from '@/lib/api';
import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle,
    Download,
    FileCode,
    Filter,
    TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ScanResults {
  repo: Repository;
  results: ScanFinding[];
  total: number;
}

export default function ScanResultsPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const [scanResults, setScanResults] = useState<ScanResults | null>(null);
  const [filteredResults, setFilteredResults] = useState<ScanFinding[]>([]);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc'); // desc = high to low, asc = low to high
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadScanResults = async () => {
      try {
        // Check if fresh data is requested (from monitoring page)
        const isFresh = searchParams.get('fresh') === 'true';
        
        if (isFresh && params.repoName) {
          // Force fetch fresh data from backend (for monitoring page)
          console.log('🔄 Fresh data requested, fetching from backend for:', params.repoName);
          await fetchFromBackend(params.repoName as string);
        } else {
          // Try sessionStorage first (for manual scan results)
          const storedResults = sessionStorage.getItem('scanResults');
          const storedAuditDetail = sessionStorage.getItem('auditDetail');
          
          if (storedResults) {
            const data = JSON.parse(storedResults);
            setScanResults(data);
            setFilteredResults(data.results);
            setIsLoading(false);
          } else if (storedAuditDetail) {
            // Load from audit history
            const data = JSON.parse(storedAuditDetail);
            setScanResults(data);
            setFilteredResults(data.results);
            setIsLoading(false);
          } else if (params.repoName) {
            // If no sessionStorage but we have repo name in URL, fetch from backend
            console.log('🔍 No sessionStorage found, fetching from backend for:', params.repoName);
            await fetchFromBackend(params.repoName as string);
          } else {
            // If no results found and no repo name, redirect to dashboard
            router.push('/dashboard');
          }
        }
      } catch (err) {
        console.error('❌ Error loading scan results:', err);
        setError('Failed to load scan results');
        setIsLoading(false);
      }
    };

    loadScanResults();
  }, [router, params.repoName, searchParams]);

  const fetchFromBackend = async (repoName: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Decode repo name from URL
      const decodedRepoName = decodeURIComponent(repoName);
      console.log('🔍 Fetching LATEST findings for:', decodedRepoName);
      
      // Import api here to avoid circular dependency
      const { api } = await import('@/lib/api');
      const data = await api.getRepoFindings(decodedRepoName);
      
      console.log('✅ Fetched LATEST findings from backend:', {
        repo: decodedRepoName,
        total_findings: data.total_findings,
        last_scan: data.last_scan,
        severity_breakdown: data.severity_breakdown
      });
      
      // Transform the data to match ScanResults format
      const scanData: ScanResults = {
        repo: {
          name: decodedRepoName.split('/').pop() || decodedRepoName,
          full_name: decodedRepoName,
          private: false,
          html_url: `https://github.com/${decodedRepoName}`,
          clone_url: `https://github.com/${decodedRepoName}.git`,
        },
        results: data.findings || [],
        total: data.total_findings || 0,
      };
      
      console.log(`📊 Displaying ${scanData.total} findings (FRESH from backend)`);
      
      setScanResults(scanData);
      setFilteredResults(scanData.results);
    } catch (err: any) {
      console.error('❌ Error fetching from backend:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch scan results');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!scanResults) return;

    let filtered = scanResults.results;

    // Apply filter
    if (severityFilter !== 'all') {
      filtered = filtered.filter(
        (finding) => finding.cvss_severity.toLowerCase() === severityFilter.toLowerCase()
      );
    }

    // Apply sorting by severity
    const severityOrder: { [key: string]: number } = {
      'critical': 0,
      'high': 1,
      'medium': 2,
      'low': 3,
      'none': 4
    };

    filtered = [...filtered].sort((a, b) => {
      const orderA = severityOrder[a.cvss_severity.toLowerCase()] ?? 5;
      const orderB = severityOrder[b.cvss_severity.toLowerCase()] ?? 5;
      
      // desc = high to low (Critical first), asc = low to high (Low first)
      return sortOrder === 'desc' ? orderA - orderB : orderB - orderA;
    });

    setFilteredResults(filtered);
  }, [scanResults, severityFilter, sortOrder]);

  const getSeverityStats = () => {
    if (!scanResults) return { critical: 0, high: 0, medium: 0, low: 0 };

    return {
      critical: scanResults.results.filter((f) => f.cvss_severity.toLowerCase() === 'critical').length,
      high: scanResults.results.filter((f) => f.cvss_severity.toLowerCase() === 'high').length,
      medium: scanResults.results.filter((f) => f.cvss_severity.toLowerCase() === 'medium').length,
      low: scanResults.results.filter((f) => f.cvss_severity.toLowerCase() === 'low').length,
    };
  };

  const downloadReport = () => {
    if (!scanResults) return;

    const report = {
      repository: scanResults.repo,
      scan_date: new Date().toISOString(),
      total_findings: scanResults.total,
      findings: scanResults.results,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-report-${scanResults.repo.name}-${new Date().getTime()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar isLoggedIn={true} />
        <div className="pt-24 pb-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
              <p className="text-gray-600">Loading scan results...</p>
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
            <div className="bg-white rounded-lg border border-red-200 p-8 text-center">
              <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Failed to Load Scan Results
              </h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="flex items-center justify-center gap-4">
                <Link href="/dashboard" className="inline-block">
                  <Button variant="secondary">Back to Dashboard</Button>
                </Link>
                <Link href="/dashboard/monitoring" className="inline-block">
                  <Button>Go to Monitoring</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!scanResults) {
    return null;
  }

  const stats = getSeverityStats();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar isLoggedIn={true} />

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Link>
              <span className="text-gray-300">|</span>
              <Link
                href="/dashboard/monitoring"
                className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Monitoring</span>
              </Link>
            </div>

            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-bold text-gray-900">
                    Security Scan Results
                  </h1>
                  {searchParams.get('fresh') === 'true' && (
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      Latest Results
                    </span>
                  )}
                </div>
                <p className="text-gray-600">
                  Repository: <span className="font-semibold">{scanResults.repo.full_name}</span>
                </p>
              </div>

              <button
                onClick={downloadReport}
                className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-primary-500 transition-all font-medium"
              >
                <Download className="h-4 w-4" />
                <span>JSON</span>
              </button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Findings</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{scanResults.total}</p>
                </div>
                <FileCode className="h-10 w-10 text-gray-400" />
              </div>
            </div>

            <div className="bg-white rounded-lg border-2 border-red-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Critical</p>
                  <p className="text-3xl font-bold text-red-600 mt-1">{stats.critical}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border-2 border-orange-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">High</p>
                  <p className="text-3xl font-bold text-orange-600 mt-1">{stats.high}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border-2 border-yellow-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Medium</p>
                  <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.medium}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                  <span className="text-xl">⚠️</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border-2 border-blue-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Low</p>
                  <p className="text-3xl font-bold text-blue-600 mt-1">{stats.low}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-xl">ℹ️</span>
                </div>
              </div>
            </div>
          </div>

          {/* Overall Security Score */}
          <div className="bg-gradient-to-r from-primary-600 to-blue-600 rounded-xl p-8 mb-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Overall Security Assessment</h2>
                <p className="text-blue-100">
                  {scanResults.total === 0
                    ? '✅ No vulnerabilities detected! Your code looks secure.'
                    : stats.critical > 0
                    ? '🚨 Critical vulnerabilities found! Immediate action required.'
                    : stats.high > 0
                    ? '⚠️ High priority vulnerabilities detected. Please review and fix.'
                    : '📋 Some vulnerabilities found. Review recommended.'}
                </p>
              </div>
              {scanResults.total === 0 && <CheckCircle className="h-16 w-16" />}
              {scanResults.total > 0 && <AlertTriangle className="h-16 w-16" />}
            </div>
          </div>

          {/* Filter & Sort */}
          {scanResults.total > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                {/* Filter Section */}
                <div className="flex items-center space-x-4">
                  <Filter className="h-5 w-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Filter:</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSeverityFilter('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      severityFilter === 'all'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All ({scanResults.total})
                  </button>
                  {stats.critical > 0 && (
                    <button
                      onClick={() => setSeverityFilter('critical')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        severityFilter === 'critical'
                          ? 'bg-red-600 text-white'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      Critical ({stats.critical})
                    </button>
                  )}
                  {stats.high > 0 && (
                    <button
                      onClick={() => setSeverityFilter('high')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        severityFilter === 'high'
                          ? 'bg-orange-600 text-white'
                          : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                      }`}
                    >
                      High ({stats.high})
                    </button>
                  )}
                  {stats.medium > 0 && (
                    <button
                      onClick={() => setSeverityFilter('medium')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        severityFilter === 'medium'
                          ? 'bg-yellow-600 text-white'
                          : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                      }`}
                    >
                      Medium ({stats.medium})
                    </button>
                  )}
                  {stats.low > 0 && (
                    <button
                      onClick={() => setSeverityFilter('low')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        severityFilter === 'low'
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      Low ({stats.low})
                    </button>
                  )}
                </div>
              </div>

              {/* Sort Section */}
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-700">Sort by:</span>
                <button
                  onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <span className="text-sm font-medium text-gray-700">Severity</span>
                  {sortOrder === 'desc' ? (
                    <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
          )}

          {/* Vulnerability List */}
          {scanResults.total === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                No Vulnerabilities Found!
              </h3>
              <p className="text-gray-600 mb-6">
                Your repository passed the security scan. Great job! 🎉
              </p>
              <Link href="/dashboard" className="inline-block">
                <Button>Scan Another Repository</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Vulnerability Details ({filteredResults.length})
              </h2>
              {filteredResults.map((finding, index) => (
                <VulnerabilityCard key={index} finding={finding} />
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}



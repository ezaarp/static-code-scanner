'use client';

import { api, AuditHistoryItem } from '@/lib/api';
import { AlertCircle, ChevronRight, Clock, FileText, History, Loader, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface AuditHistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuditHistorySidebar({ isOpen, onClose }: AuditHistorySidebarProps) {
  const router = useRouter();
  const [history, setHistory] = useState<AuditHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen]);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getAuditHistory();
      console.log('📊 Audit history received:', data);
      console.log('📅 First item timestamp:', data[0]?.timestamp);
      setHistory(data);
    } catch (err: any) {
      console.error('Error fetching audit history:', err);
      setError('Failed to load audit history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleHistoryClick = async (item: AuditHistoryItem) => {
    try {
      // Fetch detail audit
      const detail = await api.getAuditDetail(item._id);
      
      // Store in sessionStorage untuk halaman hasil
      sessionStorage.setItem('auditDetail', JSON.stringify({
        auditId: item._id,
        repo: {
          name: item.repo_name,
          full_name: item.repo_name,
        },
        results: detail.findings || detail.results || [],
        total: item.total_findings,
        timestamp: item.timestamp,
        config_used: item.config_used,
      }));

      // Navigate ke halaman hasil dengan audit ID
      router.push(`/scan/${encodeURIComponent(item.repo_name)}?audit_id=${item._id}`);
      onClose();
    } catch (err) {
      console.error('Error loading audit detail:', err);
      alert('Failed to load audit details. Please try again.');
    }
  };

  const formatDate = (timestamp: string) => {
    try {
      if (!timestamp) return 'Unknown';
      
      // Parse timestamp - backend sends ISO 8601 format
      const date = new Date(timestamp);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.error('Invalid date:', timestamp);
        return 'Unknown';
      }
      
      const now = new Date();
      const diffInMs = now.getTime() - date.getTime();
      const diffInSeconds = Math.floor(diffInMs / 1000);
      const diffInMinutes = Math.floor(diffInSeconds / 60);
      const diffInHours = Math.floor(diffInMinutes / 60);
      const diffInDays = Math.floor(diffInHours / 24);

      // Debug log
      console.log(`Time diff for ${timestamp}:`, {
        now: now.toISOString(),
        date: date.toISOString(),
        diffInSeconds,
        diffInMinutes,
        diffInHours
      });

      if (diffInSeconds < 60) {
        return 'Just now';
      } else if (diffInMinutes < 60) {
        return diffInMinutes === 1 ? '1 min ago' : `${diffInMinutes} mins ago`;
      } else if (diffInHours < 24) {
        return diffInHours === 1 ? '1 hour ago' : `${diffInHours} hours ago`;
      } else if (diffInDays === 1) {
        return 'Yesterday';
      } else if (diffInDays < 7) {
        return `${diffInDays} days ago`;
      } else {
        return date.toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
      }
    } catch (err) {
      console.error('Error formatting date:', err);
      return 'Unknown';
    }
  };

  const getSeverityBadgeClass = (severity: 'critical' | 'high' | 'medium' | 'low') => {
    const classes = {
      critical: 'bg-red-500 text-white',
      high: 'bg-orange-500 text-white',
      medium: 'bg-yellow-500 text-white',
      low: 'bg-blue-500 text-white',
    };
    return classes[severity];
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-primary-600 to-primary-700">
          <div className="flex items-center space-x-3">
            <History className="h-6 w-6 text-white" />
            <h2 className="text-xl font-bold text-white">Repo History</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="h-[calc(100%-88px)] overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader className="h-12 w-12 text-primary-600 animate-spin mb-4" />
              <p className="text-gray-600">Loading audit history...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 px-6">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <p className="text-red-600 text-center mb-4">{error}</p>
              <button
                onClick={fetchHistory}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <FileText className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No History Yet
              </h3>
              <p className="text-gray-600 text-sm">
                Audit history will appear here after you scan repositories.
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {history.map((item) => (
                <button
                  key={item._id}
                  onClick={() => handleHistoryClick(item)}
                  className="w-full text-left bg-white border border-gray-200 rounded-lg p-4 hover:border-primary-500 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate group-hover:text-primary-600 transition-colors">
                        {item.repo_name}
                      </h3>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-primary-600 flex-shrink-0 ml-2" />
                  </div>

                  <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
                    <Clock className="h-4 w-4" />
                    <span>{formatDate(item.timestamp)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    {/* Severity Badges */}
                    <div className="flex items-center gap-1.5">
                      {item.severity_counts && 
                       (item.severity_counts.critical > 0 || 
                        item.severity_counts.high > 0 || 
                        item.severity_counts.medium > 0 || 
                        item.severity_counts.low > 0) ? (
                        <>
                          {item.severity_counts.critical > 0 && (
                            <span 
                              className={`px-2 py-1 rounded text-xs font-bold ${getSeverityBadgeClass('critical')}`}
                              title={`${item.severity_counts.critical} Critical`}
                            >
                              {item.severity_counts.critical}
                            </span>
                          )}
                          {item.severity_counts.high > 0 && (
                            <span 
                              className={`px-2 py-1 rounded text-xs font-bold ${getSeverityBadgeClass('high')}`}
                              title={`${item.severity_counts.high} High`}
                            >
                              {item.severity_counts.high}
                            </span>
                          )}
                          {item.severity_counts.medium > 0 && (
                            <span 
                              className={`px-2 py-1 rounded text-xs font-bold ${getSeverityBadgeClass('medium')}`}
                              title={`${item.severity_counts.medium} Medium`}
                            >
                              {item.severity_counts.medium}
                            </span>
                          )}
                          {item.severity_counts.low > 0 && (
                            <span 
                              className={`px-2 py-1 rounded text-xs font-bold ${getSeverityBadgeClass('low')}`}
                              title={`${item.severity_counts.low} Low`}
                            >
                              {item.severity_counts.low}
                            </span>
                          )}
                        </>
                      ) : item.total_findings === 0 ? (
                        <span 
                          className="px-2 py-1 rounded text-xs font-bold bg-green-500 text-white"
                          title="No vulnerabilities found"
                        >
                          0
                        </span>
                      ) : (
                        <span 
                          className="px-2.5 py-1 rounded text-xs font-semibold bg-gray-500 text-white"
                          title={`${item.total_findings} findings (no breakdown available)`}
                        >
                          {item.total_findings}
                        </span>
                      )}
                    </div>

                    {/* Config Badge */}
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {item.config_used || 'auto'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}


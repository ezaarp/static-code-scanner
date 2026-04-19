'use client';
import { api, FindingDetail } from '@/lib/api';
import { AlertTriangle, Code, ExternalLink, FileText, Shield, ShieldAlert, ShieldCheck, ShieldX, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import Button from './Button';

interface FindingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  repoName: string;
}

export default function FindingsModal({ isOpen, onClose, repoName }: FindingsModalProps) {
  const [findings, setFindings] = useState<FindingDetail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [severityBreakdown, setSeverityBreakdown] = useState({
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  });
  const [lastScan, setLastScan] = useState<string>('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');

  useEffect(() => {
    if (isOpen && repoName) {
      fetchFindings();
    }
  }, [isOpen, repoName]);

  const fetchFindings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('🔍 Fetching findings for repo:', repoName);
      const data = await api.getRepoFindings(repoName);
      console.log('🔍 Raw findings data:', data);
      console.log('🔍 First finding structure:', data.findings?.[0]);
      setFindings(data.findings);
      setSeverityBreakdown(data.severity_breakdown);
      setLastScan(data.last_scan);
    } catch (err: any) {
      console.error('❌ Error fetching findings:', err);
      console.error('❌ Error details:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message
      });
      
      let errorMessage = 'Failed to load findings';
      if (err.response?.status === 404) {
        errorMessage = 'No scan data found for this repository';
      } else if (err.response?.status === 401) {
        errorMessage = 'Authentication required. Please login again.';
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityIcon = (severity: string) => {
    const severityLower = severity.toLowerCase();
    switch (severityLower) {
      case 'critical':
        return <ShieldX className="h-4 w-4 text-red-500" />;
      case 'high':
        return <ShieldAlert className="h-4 w-4 text-orange-500" />;
      case 'medium':
        return <Shield className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <ShieldCheck className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityBadgeClass = (severity: string) => {
    const severityLower = severity.toLowerCase();
    switch (severityLower) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredFindings = selectedSeverity === 'all' 
    ? findings 
    : findings.filter(f => f.cvss_severity.toLowerCase() === selectedSeverity);

  const formatDate = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return 'Unknown';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-[100]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Security Findings</h2>
            <p className="text-gray-600 mt-1">{repoName}</p>
            {lastScan && (
              <p className="text-sm text-gray-500 mt-1">
                Last scan: {formatDate(lastScan)}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Stats and Filters */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Total:</span>
                <span className="px-2 py-1 bg-gray-200 text-gray-800 rounded text-sm font-medium">
                  {findings.length}
                </span>
              </div>
              {severityBreakdown.critical > 0 && (
                <div className="flex items-center gap-1">
                  <ShieldX className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-700">{severityBreakdown.critical} Critical</span>
                </div>
              )}
              {severityBreakdown.high > 0 && (
                <div className="flex items-center gap-1">
                  <ShieldAlert className="h-4 w-4 text-orange-500" />
                  <span className="text-sm text-orange-700">{severityBreakdown.high} High</span>
                </div>
              )}
              {severityBreakdown.medium > 0 && (
                <div className="flex items-center gap-1">
                  <Shield className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-yellow-700">{severityBreakdown.medium} Medium</span>
                </div>
              )}
              {severityBreakdown.low > 0 && (
                <div className="flex items-center gap-1">
                  <ShieldCheck className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-blue-700">{severityBreakdown.low} Low</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Filter:</span>
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span className="ml-3 text-gray-600">Loading findings...</span>
            </div>
          ) : error ? (
            <div className="text-red-600 bg-red-50 p-4 rounded-lg text-center">
              <div className="mb-2">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                <p className="font-semibold">Error Loading Findings</p>
              </div>
              <p className="text-sm mb-3">{error}</p>
              <button 
                onClick={fetchFindings}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : filteredFindings.length === 0 ? (
            <div className="text-center py-10">
              <ShieldCheck className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {selectedSeverity === 'all' ? 'No Security Issues Found' : `No ${selectedSeverity} Issues Found`}
              </h3>
              <p className="text-gray-600">
                {selectedSeverity === 'all' 
                  ? 'This repository appears to be secure!'
                  : `No ${selectedSeverity} severity issues found. Try selecting a different severity level.`
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFindings.map((finding, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getSeverityIcon(finding.cvss_severity || 'unknown')}
                      <div>
                        <h4 className="font-semibold text-gray-900">{finding.check_id || 'Unknown Check'}</h4>
                        <p className="text-sm text-gray-600">{finding.path || 'Unknown Path'}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${getSeverityBadgeClass(finding.cvss_severity || 'unknown')}`}>
                      {(finding.cvss_severity || 'UNKNOWN').toUpperCase()}
                    </span>
                  </div>
                  
                  <p className="text-gray-700 mb-3">{finding.message || 'No message available'}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      <span>
                        Line {finding.start?.line || finding.line || 'N/A'}-{finding.end?.line || finding.start?.line || finding.line || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Code className="h-4 w-4" />
                      <span>
                        Col {finding.start?.col || 0}-{finding.end?.col || finding.start?.col || 0}
                      </span>
                    </div>
                    {finding.metadata?.cwe && finding.metadata.cwe.length > 0 && (
                      <div className="flex items-center gap-1">
                        <ExternalLink className="h-4 w-4" />
                        <span>CWE-{finding.metadata.cwe[0]}</span>
                      </div>
                    )}
                  </div>
                  
                  {finding.metadata?.references && finding.metadata.references.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-sm font-medium text-gray-700 mb-2">References:</p>
                      <div className="space-y-1">
                        {finding.metadata.references.slice(0, 3).map((ref, refIndex) => (
                          <a
                            key={refIndex}
                            href={ref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 underline block truncate"
                          >
                            {ref}
                          </a>
                        ))}
                        {finding.metadata.references.length > 3 && (
                          <p className="text-sm text-gray-500">
                            +{finding.metadata.references.length - 3} more references
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end items-center p-6 border-t border-gray-200 bg-gray-50">
          <Button onClick={onClose} variant="secondary">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

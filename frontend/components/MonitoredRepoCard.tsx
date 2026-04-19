'use client';
import { MonitoredRepo } from '@/lib/api';
import { Clock, Eye, GitBranch, GitPullRequest, ShieldCheck, ShieldOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Button from './Button';
import YMLGenerator from './YMLGenerator';

interface MonitoredRepoCardProps {
  repo: MonitoredRepo;
  webhookUrl: string;
}

export default function MonitoredRepoCard({ repo, webhookUrl }: MonitoredRepoCardProps) {
  const router = useRouter();
  const [isYMLModalOpen, setIsYMLModalOpen] = useState(false);
  
  const handleViewFindings = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    // Clear sessionStorage to force fresh fetch from backend
    sessionStorage.removeItem('scanResults');
    sessionStorage.removeItem('auditDetail');
    
    // Redirect to /scan/[repoName] with fresh=true query param
    const encodedRepoName = encodeURIComponent(repo.full_name);
    router.push(`/scan/${encodedRepoName}?fresh=true`);
  };

  const formatDate = (timestamp: string | null) => {
    if (!timestamp) return 'Never scanned';
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return 'Invalid date';

      const now = new Date();
      const diffInMs = now.getTime() - date.getTime();
      const diffInSeconds = Math.floor(diffInMs / 1000);
      const diffInMinutes = Math.floor(diffInSeconds / 60);
      const diffInHours = Math.floor(diffInMinutes / 60);
      const diffInDays = Math.floor(diffInHours / 24);

      if (diffInSeconds < 60) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes} mins ago`;
      if (diffInHours < 24) return `${diffInHours} hours ago`;
      if (diffInDays === 1) return 'Yesterday';
      if (diffInDays < 7) return `${diffInDays} days ago`;
      return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return 'Unknown';
    }
  };

  const getStatusClass = (status: 'active' | 'inactive') => {
    if (status === 'active') return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
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
      <div 
        className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-primary-300"
        onClick={handleViewFindings}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{repo.full_name}</h3>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mt-1 ${getStatusClass(repo.status)}`}>
              {repo.status === 'active' ? <ShieldCheck className="h-3 w-3 mr-1" /> : <ShieldOff className="h-3 w-3 mr-1" />}
              {repo.status === 'active' ? 'Active Monitoring' : 'Inactive Monitoring'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={handleViewFindings} 
              variant="secondary" 
              size="sm"
            >
              <Eye className="h-4 w-4 mr-2" /> View Findings
            </Button>
            <Button 
              onClick={(e) => {
                e.stopPropagation();
                setIsYMLModalOpen(true);
              }} 
              variant="secondary" 
              size="sm"
            >
              <GitPullRequest className="h-4 w-4 mr-2" /> Generate YML
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center text-gray-600 text-sm">
            <Clock className="h-4 w-4 mr-2" /> Last Scan: {formatDate(repo.last_scan)}
          </div>
          <div className="flex items-center text-gray-600 text-sm">
            <GitBranch className="h-4 w-4 mr-2" /> Branch: main/master
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-gray-200 pt-4">
          <div className="flex items-center gap-1.5">
            {repo.severity_breakdown.critical > 0 && (
              <span className={`px-2 py-1 rounded text-xs font-bold ${getSeverityBadgeClass('critical')}`} title={`${repo.severity_breakdown.critical} Critical`}>
                {repo.severity_breakdown.critical}
              </span>
            )}
            {repo.severity_breakdown.high > 0 && (
              <span className={`px-2 py-1 rounded text-xs font-bold ${getSeverityBadgeClass('high')}`} title={`${repo.severity_breakdown.high} High`}>
                {repo.severity_breakdown.high}
              </span>
            )}
            {repo.severity_breakdown.medium > 0 && (
              <span className={`px-2 py-1 rounded text-xs font-bold ${getSeverityBadgeClass('medium')}`} title={`${repo.severity_breakdown.medium} Medium`}>
                {repo.severity_breakdown.medium}
              </span>
            )}
            {repo.severity_breakdown.low > 0 && (
              <span className={`px-2 py-1 rounded text-xs font-bold ${getSeverityBadgeClass('low')}`} title={`${repo.severity_breakdown.low} Low`}>
                {repo.severity_breakdown.low}
              </span>
            )}
            {repo.total_findings === 0 && (
              <span className="px-2 py-1 rounded text-xs font-bold bg-green-500 text-white" title="No vulnerabilities found">
                0
              </span>
            )}
          </div>
          <span className="text-sm font-medium text-gray-700">Total Findings: {repo.total_findings}</span>
        </div>
      </div>

      <YMLGenerator
        isOpen={isYMLModalOpen}
        onClose={() => setIsYMLModalOpen(false)}
        repoFullName={repo.full_name}
        webhookUrl={webhookUrl}
      />
    </>
  );
}
'use client';

import { Repository } from '@/lib/api';
import { ExternalLink, Github, Globe, Lock } from 'lucide-react';
import Button from './Button';

interface RepoCardProps {
  repo: Repository;
  onScan: (repo: Repository) => void;
  isScanning?: boolean;
}

export default function RepoCard({ repo, onScan, isScanning = false }: RepoCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <Github className="h-6 w-6 text-gray-400 mt-1" />
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-gray-900">{repo.name}</h3>
              {repo.private ? (
                <Lock className="h-4 w-4 text-orange-500" />
              ) : (
                <Globe className="h-4 w-4 text-green-500" />
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">{repo.full_name}</p>
            <a
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-700 mt-2"
            >
              <span>View on GitHub</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            repo.private 
              ? 'bg-orange-100 text-orange-800' 
              : 'bg-green-100 text-green-800'
          }`}>
            {repo.private ? 'Private' : 'Public'}
          </span>
        </div>
        
        <Button
          onClick={() => onScan(repo)}
          isLoading={isScanning}
          size="sm"
        >
          {isScanning ? 'Scanning...' : 'Scan Repository'}
        </Button>
      </div>
    </div>
  );
}



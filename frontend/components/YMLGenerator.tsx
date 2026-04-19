'use client';

import { Check, Copy, Download, X } from 'lucide-react';
import { useState } from 'react';

interface YMLGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  repoName: string;
  webhookUrl: string;
}

export default function YMLGenerator({ isOpen, onClose, repoName, webhookUrl }: YMLGeneratorProps) {
  const [copied, setCopied] = useState(false);

  const ymlContent = `name: SecureAudit SAST Scan

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Trigger SecureAudit Scan
        run: |
          curl -X POST ${webhookUrl}/api/ci/webhook \\
            -H "Content-Type: application/json" \\
            -H "Authorization: Bearer \${{ secrets.AUDIT_TOKEN }}" \\
            -d '{
              "repo": "\${{ github.repository }}",
              "commit": "\${{ github.sha }}",
              "branch": "\${{ github.ref_name }}",
              "config": "auto",
              "debug": true
            }'
      
      - name: Display Scan Status
        run: |
          echo "✅ Security scan triggered for commit \${{ github.sha }}"
          echo "📊 View results in your SecureAudit dashboard"
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(ymlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([ymlContent], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'secureaudit.yml';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-primary-600 to-primary-700">
            <div>
              <h2 className="text-2xl font-bold text-white">GitHub Actions Workflow</h2>
              <p className="text-primary-100 text-sm mt-1">Repository: {repoName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            <div className="mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">Setup Instructions:</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 text-sm">
                <li>Create <code className="bg-gray-100 px-2 py-0.5 rounded">.github/workflows/secureaudit.yml</code> in your repository</li>
                <li>Copy the content below and paste it into the file</li>
                <li>(Optional) Add <code className="bg-gray-100 px-2 py-0.5 rounded">AUDIT_TOKEN</code> secret in repository settings</li>
                <li>Commit and push - the workflow will run automatically!</li>
              </ol>
            </div>

            {/* YML Content */}
            <div className="relative">
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono">
                <code>{ymlContent}</code>
              </pre>

              {/* Copy Button (Floating) */}
              <button
                onClick={handleCopy}
                className={`absolute top-3 right-3 flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
                  copied
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span className="text-sm">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span className="text-sm">Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Info Box */}
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">💡 Important Notes:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Webhook URL: <code className="bg-blue-100 px-1 rounded">{webhookUrl}</code></li>
                <li>• This workflow triggers on push to <code className="bg-blue-100 px-1 rounded">main</code> or <code className="bg-blue-100 px-1 rounded">master</code> branches</li>
                <li>• Also triggers on pull requests</li>
                <li>• Scan results will appear in your dashboard automatically</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={handleDownload}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Download YML</span>
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Copy className="h-4 w-4" />
              <span>Copy to Clipboard</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}



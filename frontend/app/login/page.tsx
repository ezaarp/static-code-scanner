'use client';

import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { api } from '@/lib/api';
import { CheckCircle, Github, Lock, Shield, Zap } from 'lucide-react';

export default function LoginPage() {
  const handleGithubLogin = () => {
    api.githubLogin();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-blue-50 to-indigo-50">
      <Navbar />
      
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Login Form */}
            <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
              <div className="text-center mb-8">
                <div className="flex justify-center mb-6">
                  <div className="bg-primary-100 p-4 rounded-full">
                    <Shield className="h-12 w-12 text-primary-600" />
                  </div>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-3">
                  Welcome to SecureAudit
                </h1>
                <p className="text-gray-600">
                  Sign in with your GitHub account to start scanning your repositories
                </p>
              </div>

              <button
                onClick={handleGithubLogin}
                className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all transform hover:scale-105 shadow-lg"
              >
                <Github className="h-6 w-6" />
                <span className="text-lg font-semibold">Sign in with GitHub</span>
              </button>

              <div className="mt-8 pt-8 border-t border-gray-200">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-gray-900">Secure OAuth</h3>
                      <p className="text-sm text-gray-600">
                        We use GitHub's official OAuth for secure authentication
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-gray-900">No Code Storage</h3>
                      <p className="text-sm text-gray-600">
                        Your code is scanned temporarily and never stored
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-gray-900">Full Privacy</h3>
                      <p className="text-sm text-gray-600">
                        Access to both public and private repositories
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Features */}
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Powerful Security Scanning at Your Fingertips
                </h2>
                <p className="text-lg text-gray-600">
                  Get instant security insights for your GitHub repositories with our advanced scanning engine
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-primary-100 p-3 rounded-lg">
                    <Zap className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Lightning Fast Scans
                    </h3>
                    <p className="text-gray-600">
                      Powered by Semgrep, get comprehensive security reports in seconds
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <Lock className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Enterprise Security
                    </h3>
                    <p className="text-gray-600">
                      Industry-standard security practices with CVSS scoring
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-orange-100 p-3 rounded-lg">
                    <Github className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      GitHub Integration
                    </h3>
                    <p className="text-gray-600">
                      Seamless integration with your existing GitHub workflow
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-primary-600 to-blue-600 rounded-xl p-6 text-white">
                <h3 className="text-xl font-bold mb-2">Start Your First Scan</h3>
                <p className="text-blue-100">
                  Join thousands of developers protecting their code with SecureAudit
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}


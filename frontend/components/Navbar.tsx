'use client';

import { api } from '@/lib/api';
import { Github, LogOut, Shield } from 'lucide-react';
import Link from 'next/link';

interface NavbarProps {
  isLoggedIn?: boolean;
}

export default function Navbar({ isLoggedIn = false }: NavbarProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-bold text-gray-900">SecureAudit</span>
          </Link>

          <div className="flex items-center space-x-6">
            {isLoggedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-gray-700 hover:text-primary-600 transition-colors font-medium"
                >
                  Repositories
                </Link>
                <Link
                  href="/dashboard/monitoring"
                  className="text-gray-700 hover:text-primary-600 transition-colors font-medium"
                >
                  CI/CD Monitor
                </Link>
                <button
                  onClick={() => api.logout()}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/about"
                  className="text-gray-700 hover:text-primary-600 transition-colors font-medium"
                >
                  About
                </Link>
                <Link
                  href="/login"
                  className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Github className="h-4 w-4" />
                  <span>Login</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}



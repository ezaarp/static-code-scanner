'use client';

import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { AlertTriangle, CheckCircle, Github, Lock, Shield, Zap } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

export default function HomePage() {
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Create intersection observer for scroll animations
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set(prev).add(entry.target.id));
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px',
      }
    );

    // Observe all sections
    const sections = document.querySelectorAll('[data-animate]');
    sections.forEach((section) => {
      if (observerRef.current) {
        observerRef.current.observe(section);
      }
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-primary-500 blur-3xl opacity-20 animate-pulse"></div>
                <Shield className="h-20 w-20 text-primary-600 relative animate-float" />
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Secure Your Code with
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-blue-600"> AI-Powered Auditing</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Automatically scan your GitHub repositories for security vulnerabilities. 
              Get detailed reports powered by Semgrep and protect your applications from cyber threats.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Link
                href="/login"
                className="flex items-center space-x-2 px-8 py-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all transform hover:scale-105 shadow-lg"
              >
                <Github className="h-5 w-5" />
                <span className="font-semibold">Start Free Audit</span>
              </Link>
              
              <Link
                href="#features"
                className="px-8 py-4 bg-white text-primary-600 border-2 border-primary-600 rounded-lg hover:bg-primary-50 transition-all"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section 
        id="stats" 
        data-animate
        className={`py-16 bg-white border-y border-gray-200 transition-all duration-1000 ${
          visibleSections.has('stats') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary-600 mb-2">10,000+</div>
              <div className="text-gray-600">Repositories Scanned</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-600 mb-2">50,000+</div>
              <div className="text-gray-600">Vulnerabilities Found</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-600 mb-2">99.9%</div>
              <div className="text-gray-600">Accuracy Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section 
        id="features" 
        data-animate
        className={`py-20 px-4 sm:px-6 lg:px-8 transition-all duration-1000 ${
          visibleSections.has('features') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose SecureAudit?
            </h2>
            <p className="text-xl text-gray-600">
              Advanced security scanning with enterprise-grade features
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl border border-gray-200 hover:shadow-xl transition-shadow">
              <div className="bg-primary-100 w-16 h-16 rounded-lg flex items-center justify-center mb-6">
                <Zap className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Lightning Fast</h3>
              <p className="text-gray-600">
                Scan entire repositories in seconds with our optimized scanning engine powered by Semgrep.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl border border-gray-200 hover:shadow-xl transition-shadow">
              <div className="bg-green-100 w-16 h-16 rounded-lg flex items-center justify-center mb-6">
                <Lock className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Secure & Private</h3>
              <p className="text-gray-600">
                Your code stays private. We use GitHub OAuth for secure authentication and never store your code.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl border border-gray-200 hover:shadow-xl transition-shadow">
              <div className="bg-orange-100 w-16 h-16 rounded-lg flex items-center justify-center mb-6">
                <AlertTriangle className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Detailed Reports</h3>
              <p className="text-gray-600">
                Get comprehensive vulnerability reports with CVSS scores, severity levels, and fix recommendations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section 
        id="how-it-works" 
        data-animate
        className={`py-20 bg-gray-50 px-4 sm:px-6 lg:px-8 transition-all duration-1000 ${
          visibleSections.has('how-it-works') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Get started in just 3 simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Connect GitHub</h3>
              <p className="text-gray-600">
                Sign in securely with your GitHub account using OAuth authentication.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Select Repository</h3>
              <p className="text-gray-600">
                Choose any public or private repository you want to scan for vulnerabilities.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Get Results</h3>
              <p className="text-gray-600">
                Receive detailed security reports with actionable insights and recommendations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Languages Section */}
      <section 
        id="languages" 
        data-animate
        className={`py-20 px-4 sm:px-6 lg:px-8 transition-all duration-1000 ${
          visibleSections.has('languages') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Supported Languages
            </h2>
            <p className="text-xl text-gray-600">
              Comprehensive security scanning for multiple programming languages
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {['JavaScript', 'Python', 'PHP', 'Node.js', 'TypeScript', 'Java', 'Go', 'Ruby'].map((lang) => (
              <div key={lang} className="bg-white p-6 rounded-lg border border-gray-200 text-center hover:border-primary-500 transition-colors">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <span className="font-semibold text-gray-900">{lang}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section 
        id="cta" 
        data-animate
        className={`py-20 bg-gradient-to-r from-primary-600 to-blue-600 px-4 sm:px-6 lg:px-8 transition-all duration-1000 ${
          visibleSections.has('cta') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Secure Your Code?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of developers who trust SecureAudit to protect their applications
          </p>
          <Link
            href="/login"
            className="inline-flex items-center space-x-2 px-8 py-4 bg-white text-primary-600 rounded-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-xl font-semibold"
          >
            <Github className="h-5 w-5" />
            <span>Get Started Free</span>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}



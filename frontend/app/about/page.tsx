'use client';

import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { Github, Linkedin, Mail, Users } from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  const teamMembers = [
    { id: 1, role: 'MBC Intern' },
    { id: 2, role: 'MBC Intern' },
    { id: 3, role: 'MBC Intern' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="flex justify-center mb-6">
              <div className="bg-primary-100 p-4 rounded-full">
                <Users className="h-12 w-12 text-primary-600" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              About <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-blue-600">SecureAudit</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built by passionate interns at MBC Laboratory, dedicated to making code security accessible to everyone.
            </p>
          </div>

          {/* Mission Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Our Mission</h2>
            <p className="text-lg text-gray-600 text-center max-w-3xl mx-auto leading-relaxed">
              We believe that security should be simple, accessible, and automated. 
              SecureAudit empowers developers to identify vulnerabilities early in the development cycle, 
              helping teams build more secure applications without slowing down their workflow.
            </p>
          </div>

          {/* Team Section */}
          <div className="mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 text-center">Meet Our Team</h2>
            <p className="text-xl text-gray-600 text-center mb-12">
              MBC Interns - Building the future of code security
            </p>

            {/* Team Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="bg-white rounded-xl border-2 border-gray-200 p-8 hover:shadow-xl hover:border-primary-500 transition-all group"
                >
                  {/* Avatar Placeholder */}
                  <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-primary-400 to-blue-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Users className="h-16 w-16 text-white" />
                  </div>

                  {/* Info */}
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Team Member
                    </h3>
                    <p className="text-primary-600 font-semibold mb-4">
                      {member.role}
                    </p>
                    <p className="text-gray-600 text-sm mb-6">
                      Contributing to making the web more secure, one scan at a time.
                    </p>

                    {/* Social Links Placeholder */}
                    <div className="flex justify-center space-x-3">
                      <button className="p-2 bg-gray-100 rounded-full hover:bg-primary-100 transition-colors">
                        <Github className="h-5 w-5 text-gray-600" />
                      </button>
                      <button className="p-2 bg-gray-100 rounded-full hover:bg-primary-100 transition-colors">
                        <Linkedin className="h-5 w-5 text-gray-600" />
                      </button>
                      <button className="p-2 bg-gray-100 rounded-full hover:bg-primary-100 transition-colors">
                        <Mail className="h-5 w-5 text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Values Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">🎯</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Innovation</h3>
              <p className="text-gray-600">
                Pushing boundaries with cutting-edge security scanning technology.
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">🤝</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Collaboration</h3>
              <p className="text-gray-600">
                Working together to build a safer digital ecosystem for everyone.
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">⚡</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Excellence</h3>
              <p className="text-gray-600">
                Committed to delivering the highest quality security solutions.
              </p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-primary-600 to-blue-600 rounded-2xl p-12 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Join Us in Building Secure Software
            </h2>
            <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
              Start scanning your repositories today and be part of the secure coding revolution
            </p>
            <Link
              href="/login"
              className="inline-flex items-center space-x-2 px-8 py-4 bg-white text-primary-600 rounded-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-xl font-semibold"
            >
              <Github className="h-5 w-5" />
              <span>Get Started Free</span>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}


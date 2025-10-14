import type { MetaFunction } from "@remix-run/node";
import { useState } from "react";
import { MagnifyingGlassIcon, CubeIcon, SparklesIcon, RocketLaunchIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";

export const meta: MetaFunction = () => {
  return [
    { title: "GitMesh - The GitHub Project Combinator" },
    { name: "description", content: "Google-like search for GitHub repositories with AI-powered project combination and smart discovery features" },
  ];
};

export default function Index() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    // TODO: Implement search logic
    setTimeout(() => setIsSearching(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-mesh-primary/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-mesh-secondary/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        </div>

        {/* Navigation */}
        <nav className="relative z-10 p-6">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <motion.div 
              className="flex items-center space-x-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <CubeIcon className="h-8 w-8 text-mesh-primary" />
              <span className="text-2xl font-bold gradient-text">GitMesh</span>
            </motion.div>
            
            <motion.div 
              className="hidden md:flex space-x-6 text-sm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <a href="#discover" className="hover:text-mesh-primary transition-colors">Discover</a>
              <a href="#combine" className="hover:text-mesh-primary transition-colors">Combine</a>
              <a href="#trending" className="hover:text-mesh-primary transition-colors">Trending</a>
            </motion.div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 px-6 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h1 
              className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              The
              <span className="gradient-text"> GitHub </span>
              Project
              <br />
              <span className="gradient-text">Combinator</span>
            </motion.h1>
            
            <motion.p 
              className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Discover, search, and intelligently combine the best GitHub repositories. 
              Like Google for code, but with superpowers.
            </motion.p>

            {/* Search Bar */}
            <motion.div 
              className="max-w-2xl mx-auto mb-12"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <div className="relative">
                <div className="glass-card rounded-2xl p-2 search-glow">
                  <div className="flex items-center space-x-4">
                    <MagnifyingGlassIcon className="h-6 w-6 text-mesh-primary ml-4" />
                    <input
                      type="text"
                      placeholder="Search repositories, combine projects, discover code..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className="flex-1 bg-transparent text-white placeholder-gray-400 border-0 focus:ring-0 text-lg py-4"
                    />
                    <button
                      onClick={handleSearch}
                      disabled={isSearching || !searchQuery.trim()}
                      className="bg-gradient-to-r from-mesh-primary to-mesh-secondary px-8 py-4 rounded-xl font-semibold hover:shadow-lg hover:shadow-mesh-primary/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSearching ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        'Search'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Feature Cards */}
            <motion.div 
              className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <div className="glass-card p-6 rounded-2xl hover:border-mesh-primary/30 transition-all duration-300 group">
                <MagnifyingGlassIcon className="h-12 w-12 text-mesh-primary mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-semibold mb-3">Smart Discovery</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  AI-powered search that understands context. Find the perfect repositories with intelligent filtering and quality scoring.
                </p>
              </div>
              
              <div className="glass-card p-6 rounded-2xl hover:border-mesh-secondary/30 transition-all duration-300 group">
                <SparklesIcon className="h-12 w-12 text-mesh-secondary mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-semibold mb-3">Project Mixing</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Combine multiple repositories into cohesive projects. Smart merging with conflict resolution and structure optimization.
                </p>
              </div>
              
              <div className="glass-card p-6 rounded-2xl hover:border-mesh-accent/30 transition-all duration-300 group">
                <RocketLaunchIcon className="h-12 w-12 text-mesh-accent mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-semibold mb-3">Instant Deploy</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Generate production-ready code from your combinations. Deploy to Vercel, Netlify, or download as starter template.
                </p>
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mt-12"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <button className="bg-gradient-to-r from-mesh-primary to-mesh-secondary px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-lg hover:shadow-mesh-primary/25 transition-all duration-300">
                Start Exploring
              </button>
              <button className="border border-mesh-primary/50 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-mesh-primary/10 hover:border-mesh-primary transition-all duration-300">
                View Examples
              </button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <motion.div 
        className="relative z-10 py-20 border-t border-white/10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1 }}
      >
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">50M+</div>
              <div className="text-gray-400 text-sm">Repositories</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">100+</div>
              <div className="text-gray-400 text-sm">Languages</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">AI</div>
              <div className="text-gray-400 text-sm">Powered</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">∞</div>
              <div className="text-gray-400 text-sm">Possibilities</div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
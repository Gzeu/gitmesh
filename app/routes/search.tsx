import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from '@remix-run/node';
import { useLoaderData, useFetcher, Form } from '@remix-run/react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MagnifyingGlassIcon, 
  AdjustmentsHorizontalIcon,
  StarIcon,
  CodeBracketIcon,
  ClockIcon,
  UserGroupIcon,
  CubeIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import { GitHubSearchEngine, type Repository, type SearchFilters } from '../lib/github-api';

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q') || '';
  const language = url.searchParams.get('language') || '';
  const minStars = url.searchParams.get('minStars') ? parseInt(url.searchParams.get('minStars')!) : undefined;
  const page = url.searchParams.get('page') ? parseInt(url.searchParams.get('page')!) : 1;
  
  const github = new GitHubSearchEngine();
  
  if (query) {
    const filters: SearchFilters = {
      language: language || undefined,
      minStars,
      sortBy: 'stars',
      order: 'desc'
    };
    
    try {
      const results = await github.searchRepositories(query, filters, page);
      return json({ results, query, filters, error: null });
    } catch (error) {
      return json({ results: null, query, filters, error: 'Failed to search repositories' });
    }
  }
  
  return json({ results: null, query, filters: {}, error: null });
}

export default function Search() {
  const { results, query: initialQuery, error } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [query, setQuery] = useState(initialQuery);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRepos, setSelectedRepos] = useState<Repository[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({
    minStars: 10,
    sortBy: 'stars',
    order: 'desc'
  });

  const languages = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust', 'C++', 'C#',
    'PHP', 'Ruby', 'Swift', 'Kotlin', 'Dart', 'Scala', 'Clojure'
  ];

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (filters.language) params.set('language', filters.language);
    if (filters.minStars) params.set('minStars', filters.minStars.toString());
    
    fetcher.load(`/search?${params.toString()}`);
  };

  const toggleRepoSelection = (repo: Repository) => {
    setSelectedRepos(prev => {
      const exists = prev.find(r => r.id === repo.id);
      if (exists) {
        return prev.filter(r => r.id !== repo.id);
      } else {
        return [...prev, repo];
      }
    });
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getQualityColor = (score: number): string => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <div className="border-b border-white/10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CubeIcon className="h-8 w-8 text-mesh-primary" />
              <span className="text-2xl font-bold gradient-text">GitMesh</span>
            </div>
            
            {selectedRepos.length > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-r from-mesh-primary to-mesh-secondary px-6 py-2 rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-mesh-primary/25 transition-all"
              >
                Combine {selectedRepos.length} Projects
              </motion.button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Main Search */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for React dashboards, Vue e-commerce, Python ML tools..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full bg-white/10 border border-white/20 rounded-xl pl-12 pr-4 py-4 text-white placeholder-gray-400 focus:border-mesh-primary focus:ring-1 focus:ring-mesh-primary transition-colors"
                />
              </div>
            </div>
            
            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="bg-white/10 border border-white/20 rounded-xl px-6 py-4 hover:bg-white/20 transition-colors flex items-center space-x-2"
            >
              <AdjustmentsHorizontalIcon className="h-5 w-5" />
              <span>Filters</span>
            </button>
            
            {/* Search Button */}
            <button
              onClick={handleSearch}
              disabled={!query.trim()}
              className="bg-gradient-to-r from-mesh-primary to-mesh-secondary px-8 py-4 rounded-xl font-semibold hover:shadow-lg hover:shadow-mesh-primary/25 transition-all disabled:opacity-50"
            >
              Search
            </button>
          </div>

          {/* Advanced Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 glass-card rounded-xl p-6"
              >
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Language Filter */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Programming Language</label>
                    <select
                      value={filters.language || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, language: e.target.value || undefined }))}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:border-mesh-primary"
                    >
                      <option value="">Any Language</option>
                      {languages.map(lang => (
                        <option key={lang} value={lang} className="bg-slate-800">{lang}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Stars Filter */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Minimum Stars</label>
                    <select
                      value={filters.minStars || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, minStars: e.target.value ? parseInt(e.target.value) : undefined }))}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:border-mesh-primary"
                    >
                      <option value="" className="bg-slate-800">Any Stars</option>
                      <option value="10" className="bg-slate-800">10+ Stars</option>
                      <option value="100" className="bg-slate-800">100+ Stars</option>
                      <option value="500" className="bg-slate-800">500+ Stars</option>
                      <option value="1000" className="bg-slate-800">1000+ Stars</option>
                      <option value="5000" className="bg-slate-800">5000+ Stars</option>
                    </select>
                  </div>
                  
                  {/* Sort Options */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Sort By</label>
                    <select
                      value={`${filters.sortBy}-${filters.order}`}
                      onChange={(e) => {
                        const [sortBy, order] = e.target.value.split('-') as [typeof filters.sortBy, typeof filters.order];
                        setFilters(prev => ({ ...prev, sortBy, order }));
                      }}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:border-mesh-primary"
                    >
                      <option value="stars-desc" className="bg-slate-800">Most Stars</option>
                      <option value="updated-desc" className="bg-slate-800">Recently Updated</option>
                      <option value="created-desc" className="bg-slate-800">Recently Created</option>
                      <option value="name-asc" className="bg-slate-800">Alphabetical</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Results */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 mb-6">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {results && (
          <div>
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <h2 className="text-2xl font-semibold">
                  Found {formatNumber(results.totalCount)} repositories
                </h2>
                {selectedRepos.length > 0 && (
                  <div className="bg-mesh-primary/20 px-3 py-1 rounded-full text-sm">
                    {selectedRepos.length} selected for combination
                  </div>
                )}
              </div>
            </div>

            {/* Repository Grid */}
            <div className="grid gap-6">
              {results.repositories.map((repo, index) => {
                const isSelected = selectedRepos.some(r => r.id === repo.id);
                
                return (
                  <motion.div
                    key={repo.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`repo-card rounded-xl p-6 relative ${
                      isSelected ? 'ring-2 ring-mesh-primary border-mesh-primary/50' : ''
                    }`}
                  >
                    {/* Selection Checkbox */}
                    <button
                      onClick={() => toggleRepoSelection(repo)}
                      className={`absolute top-4 right-4 w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                        isSelected 
                          ? 'bg-mesh-primary border-mesh-primary' 
                          : 'border-white/30 hover:border-mesh-primary'
                      }`}
                    >
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-white text-sm"
                        >
                          ✓
                        </motion.div>
                      )}
                    </button>

                    <div className="flex items-start space-x-4">
                      {/* Owner Avatar */}
                      <img
                        src={repo.owner.avatar_url}
                        alt={repo.owner.login}
                        className="w-12 h-12 rounded-full border border-white/20"
                      />
                      
                      <div className="flex-1 min-w-0">
                        {/* Repository Header */}
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-semibold text-white truncate">
                            <a 
                              href={repo.html_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="hover:text-mesh-primary transition-colors"
                            >
                              {repo.full_name}
                            </a>
                          </h3>
                          
                          {repo.qualityScore && (
                            <div className={`text-sm font-medium ${getQualityColor(repo.qualityScore)}`}>
                              Q{repo.qualityScore}
                            </div>
                          )}
                        </div>
                        
                        {/* Description */}
                        {repo.description && (
                          <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                            {repo.description}
                          </p>
                        )}
                        
                        {/* Topics */}
                        {repo.topics.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {repo.topics.slice(0, 6).map(topic => (
                              <span
                                key={topic}
                                className="bg-mesh-primary/20 text-mesh-primary px-2 py-1 rounded-md text-xs"
                              >
                                {topic}
                              </span>
                            ))}
                            {repo.topics.length > 6 && (
                              <span className="text-gray-400 text-xs py-1">
                                +{repo.topics.length - 6} more
                              </span>
                            )}
                          </div>
                        )}
                        
                        {/* Stats */}
                        <div className="flex items-center space-x-6 text-sm text-gray-400">
                          <div className="flex items-center space-x-1">
                            <StarSolid className="h-4 w-4 text-yellow-400" />
                            <span>{formatNumber(repo.stargazers_count)}</span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <CodeBracketIcon className="h-4 w-4" />
                            <span>{repo.language || 'Unknown'}</span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <UserGroupIcon className="h-4 w-4" />
                            <span>{formatNumber(repo.forks_count)} forks</span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <ClockIcon className="h-4 w-4" />
                            <span>Updated {new Date(repo.updated_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Load More */}
            {results.hasMore && (
              <div className="text-center mt-8">
                <button className="bg-white/10 hover:bg-white/20 border border-white/20 px-8 py-3 rounded-xl transition-colors">
                  Load More Repositories
                </button>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!results && !error && (
          <div className="text-center py-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-md mx-auto"
            >
              <MagnifyingGlassIcon className="h-20 w-20 text-gray-600 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold mb-4">Start Your Discovery</h3>
              <p className="text-gray-400 mb-6">
                Search for repositories, discover hidden gems, and combine projects to create something amazing.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {['React dashboard', 'Vue e-commerce', 'Python API', 'TypeScript utils'].map(suggestion => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setQuery(suggestion);
                      handleSearch();
                    }}
                    className="bg-white/10 hover:bg-mesh-primary/20 border border-white/20 hover:border-mesh-primary/50 px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Selected Repositories Sidebar */}
      <AnimatePresence>
        {selectedRepos.length > 0 && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="fixed right-0 top-0 h-full w-80 bg-slate-900/95 backdrop-blur-md border-l border-white/20 p-6 overflow-y-auto z-50"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Selected for Combination</h3>
              <button
                onClick={() => setSelectedRepos([])}
                className="text-gray-400 hover:text-white"
              >
                Clear All
              </button>
            </div>
            
            <div className="space-y-3 mb-6">
              {selectedRepos.map(repo => (
                <div key={repo.id} className="bg-white/10 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{repo.name}</p>
                      <p className="text-xs text-gray-400 truncate">{repo.owner.login}</p>
                    </div>
                    <button
                      onClick={() => toggleRepoSelection(repo)}
                      className="text-red-400 hover:text-red-300 ml-2"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <button className="w-full bg-gradient-to-r from-mesh-primary to-mesh-secondary py-3 rounded-xl font-semibold hover:shadow-lg transition-all">
              🚀 Combine Projects
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
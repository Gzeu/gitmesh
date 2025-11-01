import { Octokit } from '@octokit/rest';
import type { Repository, SearchFilters, SearchResult } from './github-api';

export interface EnhancedSearchFilters extends SearchFilters {
  vulnerabilities?: 'none' | 'low' | 'medium' | 'high';
  license?: string[];
  size?: 'small' | 'medium' | 'large';
  activity?: 'active' | 'maintained' | 'stale';
  codeQuality?: 'excellent' | 'good' | 'fair' | 'poor';
  teamSize?: 'solo' | 'small' | 'medium' | 'large';
}

export interface TrendingAnalysis {
  repositories: Repository[];
  insights: {
    topLanguages: { language: string; count: number; growth: number }[];
    emergingTopics: { topic: string; momentum: number }[];
    qualityTrends: { avgStars: number; avgQuality: number };
    activityMetrics: { avgCommits: number; avgContributors: number };
  };
}

export interface SecurityAnalysis {
  vulnerabilities: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  dependencyRisks: {
    outdated: string[];
    vulnerable: string[];
    alternatives: Array<{ current: string; suggested: string; reason: string }>;
  };
  securityScore: number;
  recommendations: string[];
}

export class EnhancedGitHubAPI {
  private octokit: Octokit;
  private rateLimitManager: RateLimitManager;
  private cache: Map<string, any> = new Map();
  private cacheTimeout = 1000 * 60 * 15; // 15 minutes

  constructor(token?: string) {
    this.octokit = new Octokit({ 
      auth: token || process.env.GITHUB_TOKEN,
      throttle: {
        onRateLimit: (retryAfter, options) => {
          console.warn(`Rate limit exceeded, retrying after ${retryAfter} seconds`);
          return true;
        },
        onSecondaryRateLimit: (retryAfter, options) => {
          console.warn(`Secondary rate limit, retrying after ${retryAfter} seconds`);
          return true;
        },
      },
    });
    this.rateLimitManager = new RateLimitManager();
  }

  /**
   * Enhanced repository search with advanced filtering
   */
  async enhancedSearch(
    query: string,
    filters: EnhancedSearchFilters = {},
    page: number = 1
  ): Promise<SearchResult> {
    const cacheKey = `search-${query}-${JSON.stringify(filters)}-${page}`;
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    await this.rateLimitManager.waitIfNeeded();

    try {
      const searchQuery = this.buildEnhancedQuery(query, filters);
      
      const response = await this.octokit.rest.search.repos({
        q: searchQuery,
        sort: filters.sortBy === 'name' ? undefined : (filters.sortBy || 'stars'),
        order: filters.order || 'desc',
        per_page: 50, // Increased for better results
        page
      });

      // Enhanced repository enrichment
      const enrichedRepos = await this.enhancedEnrichment(response.data.items);
      
      // Apply advanced filters
      const filteredRepos = this.applyAdvancedFilters(enrichedRepos, filters);
      
      const result: SearchResult = {
        repositories: filteredRepos,
        totalCount: response.data.total_count,
        hasMore: filteredRepos.length === 50,
        nextPage: filteredRepos.length === 50 ? page + 1 : undefined
      };

      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      console.error('Enhanced search error:', error);
      throw new Error('Enhanced search failed');
    }
  }

  /**
   * Get trending repositories with detailed analysis
   */
  async getTrendingWithAnalysis(
    timeframe: 'daily' | 'weekly' | 'monthly' = 'weekly',
    language?: string
  ): Promise<TrendingAnalysis> {
    const cacheKey = `trending-${timeframe}-${language || 'all'}`;
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    const dateThreshold = this.getDateThreshold(timeframe);
    let searchQuery = `created:>${dateThreshold} stars:>5`;
    
    if (language) {
      searchQuery += ` language:${language}`;
    }

    const result = await this.enhancedSearch(searchQuery, {
      sortBy: 'stars',
      order: 'desc',
      archived: false,
      fork: false
    });

    const analysis = this.analyzeTrends(result.repositories);
    
    const trendingAnalysis: TrendingAnalysis = {
      repositories: result.repositories.slice(0, 30),
      insights: analysis
    };

    this.cache.set(cacheKey, {
      data: trendingAnalysis,
      timestamp: Date.now()
    });

    return trendingAnalysis;
  }

  /**
   * Perform security analysis on repositories
   */
  async analyzeRepositorySecurity(repo: Repository): Promise<SecurityAnalysis> {
    await this.rateLimitManager.waitIfNeeded();

    try {
      // Get repository vulnerabilities (would need GitHub Security API access)
      const vulnerabilities = await this.fetchVulnerabilities(repo.full_name);
      
      // Analyze dependencies
      const dependencies = await this.analyzeDependencies(repo.full_name);
      
      // Calculate security score
      const securityScore = this.calculateSecurityScore(vulnerabilities, dependencies, repo);
      
      return {
        vulnerabilities,
        dependencyRisks: dependencies,
        securityScore,
        recommendations: this.generateSecurityRecommendations(vulnerabilities, dependencies)
      };
    } catch (error) {
      console.error('Security analysis error:', error);
      return this.getFallbackSecurityAnalysis();
    }
  }

  /**
   * Smart repository recommendations based on user preferences
   */
  async getSmartRecommendations(
    userHistory: Repository[],
    preferences: { languages: string[]; topics: string[]; minStars?: number }
  ): Promise<Repository[]> {
    // Analyze user patterns
    const patterns = this.analyzeUserPatterns(userHistory, preferences);
    
    // Build recommendation query
    const queries = this.buildRecommendationQueries(patterns);
    
    // Fetch and score recommendations
    const recommendations = await Promise.all(
      queries.map(query => this.enhancedSearch(query, { minStars: preferences.minStars || 10 }))
    );
    
    // Merge and deduplicate
    const allRepos = recommendations.flatMap(r => r.repositories);
    const uniqueRepos = this.deduplicateRepositories(allRepos);
    
    // Score based on user preferences
    const scoredRepos = uniqueRepos.map(repo => ({
      ...repo,
      recommendationScore: this.calculateRecommendationScore(repo, patterns)
    }));
    
    return scoredRepos
      .sort((a, b) => (b.recommendationScore || 0) - (a.recommendationScore || 0))
      .slice(0, 20);
  }

  /**
   * Advanced project compatibility analysis
   */
  async analyzeProjectCompatibility(repos: Repository[]): Promise<{
    compatibilityScore: number;
    conflicts: Array<{ type: string; description: string; severity: 'low' | 'medium' | 'high' }>;
    suggestions: string[];
  }> {
    if (repos.length < 2) {
      return {
        compatibilityScore: 100,
        conflicts: [],
        suggestions: ['Add more repositories to analyze compatibility']
      };
    }

    // Analyze frameworks
    const frameworks = await this.detectFrameworksDetailed(repos);
    
    // Check license compatibility
    const licenseCompatibility = await this.analyzeLicenseCompatibility(repos);
    
    // Analyze dependencies
    const dependencyConflicts = await this.analyzeDependencyCompatibility(repos);
    
    // Calculate overall score
    const compatibilityScore = this.calculateCompatibilityScore(
      frameworks,
      licenseCompatibility,
      dependencyConflicts
    );

    return {
      compatibilityScore,
      conflicts: [...dependencyConflicts, ...licenseCompatibility.conflicts],
      suggestions: this.generateCompatibilitySuggestions(frameworks, dependencyConflicts)
    };
  }

  private buildEnhancedQuery(query: string, filters: EnhancedSearchFilters): string {
    const parts = [query];
    
    // Apply enhanced filters
    if (filters.license && filters.license.length > 0) {
      filters.license.forEach(license => {
        parts.push(`license:${license}`);
      });
    }
    
    if (filters.size) {
      const sizeRanges = {
        small: 'size:<1000',
        medium: 'size:1000..10000',
        large: 'size:>10000'
      };
      parts.push(sizeRanges[filters.size]);
    }
    
    if (filters.activity) {
      const now = new Date();
      const thresholds = {
        active: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        maintained: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        stale: '<' + new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };
      
      if (filters.activity !== 'stale') {
        parts.push(`pushed:>${thresholds[filters.activity]}`);
      } else {
        parts.push(`pushed:${thresholds.stale}`);
      }
    }
    
    // Exclude personal repositories and common noise
    parts.push('-user:Gzeu', '-user:octocat', 'NOT tutorial', 'NOT example');
    
    return parts.join(' ');
  }

  private async enhancedEnrichment(repos: any[]): Promise<Repository[]> {
    return Promise.all(
      repos.map(async (repo) => {
        // Get additional repository data
        const [languages, contributors] = await Promise.all([
          this.getRepositoryLanguages(repo.full_name).catch(() => ({})),
          this.getTopContributors(repo.full_name).catch(() => [])
        ]);

        const qualityScore = this.calculateEnhancedQualityScore(repo, languages, contributors);
        
        return {
          id: repo.id,
          name: repo.name,
          full_name: repo.full_name,
          description: repo.description,
          html_url: repo.html_url,
          language: repo.language,
          stargazers_count: repo.stargazers_count,
          forks_count: repo.forks_count,
          open_issues_count: repo.open_issues_count,
          updated_at: repo.updated_at,
          created_at: repo.created_at,
          topics: repo.topics || [],
          owner: {
            login: repo.owner.login,
            avatar_url: repo.owner.avatar_url,
          },
          qualityScore,
          // Enhanced metadata
          languages: Object.keys(languages),
          contributorCount: contributors.length,
          lastCommit: repo.pushed_at,
          license: repo.license?.name
        } as Repository & {
          languages: string[];
          contributorCount: number;
          lastCommit: string;
          license?: string;
        };
      })
    );
  }

  // ... Additional helper methods would be implemented here
  private calculateEnhancedQualityScore(repo: any, languages: any, contributors: any[]): number {
    // Enhanced quality scoring algorithm
    let score = 0;
    
    // Stars (logarithmic scale, max 25 points)
    score += Math.min(Math.log10(repo.stargazers_count + 1) * 5, 25);
    
    // Activity (max 20 points)
    const daysSinceUpdate = (Date.now() - new Date(repo.updated_at).getTime()) / (1000 * 60 * 60 * 24);
    score += Math.max(20 - daysSinceUpdate / 7, 0);
    
    // Documentation (max 15 points)
    if (repo.description && repo.description.length > 20) score += 10;
    if (repo.topics && repo.topics.length > 0) score += 5;
    
    // Community (max 20 points)
    score += Math.min(contributors.length * 2, 15);
    score += Math.min(repo.forks_count / 10, 5);
    
    // Language diversity (max 10 points)
    const languageCount = Object.keys(languages).length;
    score += Math.min(languageCount * 2, 10);
    
    // Issue management (max 10 points)
    const issueRatio = repo.open_issues_count / (repo.stargazers_count + 1);
    score += Math.max(10 - issueRatio * 50, 0);
    
    return Math.round(Math.min(score, 100));
  }

  private applyAdvancedFilters(repos: Repository[], filters: EnhancedSearchFilters): Repository[] {
    return repos.filter(repo => {
      // Apply quality filter
      if (filters.codeQuality) {
        const qualityThresholds = {
          excellent: 85,
          good: 70,
          fair: 55,
          poor: 0
        };
        if ((repo.qualityScore || 0) < qualityThresholds[filters.codeQuality]) {
          return false;
        }
      }
      
      return true;
    });
  }

  // Placeholder methods for complex implementations
  private async getRepositoryLanguages(fullName: string): Promise<Record<string, number>> {
    try {
      const response = await this.octokit.rest.repos.listLanguages({
        owner: fullName.split('/')[0],
        repo: fullName.split('/')[1]
      });
      return response.data;
    } catch {
      return {};
    }
  }

  private async getTopContributors(fullName: string): Promise<any[]> {
    try {
      const response = await this.octokit.rest.repos.listContributors({
        owner: fullName.split('/')[0],
        repo: fullName.split('/')[1],
        per_page: 10
      });
      return response.data;
    } catch {
      return [];
    }
  }

  // Additional method stubs...
  private getDateThreshold(timeframe: string): string {
    const now = new Date();
    switch (timeframe) {
      case 'daily': now.setDate(now.getDate() - 1); break;
      case 'weekly': now.setDate(now.getDate() - 7); break;
      case 'monthly': now.setMonth(now.getMonth() - 1); break;
    }
    return now.toISOString().split('T')[0];
  }

  private analyzeTrends(repositories: Repository[]): TrendingAnalysis['insights'] {
    // Implementation for trend analysis
    return {
      topLanguages: [],
      emergingTopics: [],
      qualityTrends: { avgStars: 0, avgQuality: 0 },
      activityMetrics: { avgCommits: 0, avgContributors: 0 }
    };
  }

  // ... More methods would be implemented here
  private async fetchVulnerabilities(fullName: string): Promise<SecurityAnalysis['vulnerabilities']> {
    return { critical: 0, high: 0, medium: 0, low: 0 };
  }

  private async analyzeDependencies(fullName: string): Promise<SecurityAnalysis['dependencyRisks']> {
    return { outdated: [], vulnerable: [], alternatives: [] };
  }

  private calculateSecurityScore(vulnerabilities: any, dependencies: any, repo: Repository): number {
    return 85; // Placeholder
  }

  private generateSecurityRecommendations(vulnerabilities: any, dependencies: any): string[] {
    return ['Keep dependencies updated', 'Enable security alerts'];
  }

  private getFallbackSecurityAnalysis(): SecurityAnalysis {
    return {
      vulnerabilities: { critical: 0, high: 0, medium: 0, low: 0 },
      dependencyRisks: { outdated: [], vulnerable: [], alternatives: [] },
      securityScore: 70,
      recommendations: ['Security analysis temporarily unavailable']
    };
  }

  // ... Additional placeholder methods
  private analyzeUserPatterns(history: Repository[], preferences: any): any {
    return { languages: preferences.languages, topics: preferences.topics };
  }

  private buildRecommendationQueries(patterns: any): string[] {
    return [`language:${patterns.languages[0]}`];
  }

  private deduplicateRepositories(repos: Repository[]): Repository[] {
    const seen = new Set();
    return repos.filter(repo => {
      if (seen.has(repo.id)) return false;
      seen.add(repo.id);
      return true;
    });
  }

  private calculateRecommendationScore(repo: Repository, patterns: any): number {
    return repo.qualityScore || 50;
  }

  private async detectFrameworksDetailed(repos: Repository[]): Promise<any[]> {
    return [];
  }

  private async analyzeLicenseCompatibility(repos: Repository[]): Promise<any> {
    return { conflicts: [] };
  }

  private async analyzeDependencyCompatibility(repos: Repository[]): Promise<any[]> {
    return [];
  }

  private calculateCompatibilityScore(frameworks: any, licenses: any, dependencies: any): number {
    return 85;
  }

  private generateCompatibilitySuggestions(frameworks: any, dependencies: any): string[] {
    return ['Projects appear to be compatible'];
  }
}

/**
 * Rate limiting manager to handle GitHub API limits effectively
 */
class RateLimitManager {
  private lastRequestTime = 0;
  private requestCount = 0;
  private resetTime = 0;
  private remaining = 5000;

  async waitIfNeeded(): Promise<void> {
    const now = Date.now();
    
    // Reset counter if past reset time
    if (now > this.resetTime) {
      this.requestCount = 0;
      this.remaining = 5000;
    }
    
    // Check if we need to wait
    if (this.remaining <= 100) {
      const waitTime = Math.max(0, this.resetTime - now);
      if (waitTime > 0) {
        console.log(`Rate limit approaching, waiting ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    // Enforce minimum time between requests
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minInterval = 100; // 100ms minimum between requests
    
    if (timeSinceLastRequest < minInterval) {
      await new Promise(resolve => 
        setTimeout(resolve, minInterval - timeSinceLastRequest)
      );
    }
    
    this.lastRequestTime = Date.now();
    this.requestCount++;
    this.remaining--;
  }

  updateLimits(remaining: number, resetTime: number): void {
    this.remaining = remaining;
    this.resetTime = resetTime * 1000; // Convert to milliseconds
  }
}

export const enhancedGitHubAPI = new EnhancedGitHubAPI();
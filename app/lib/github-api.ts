import { Octokit } from '@octokit/rest';

export interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  updated_at: string;
  created_at: string;
  topics: string[];
  owner: {
    login: string;
    avatar_url: string;
  };
  qualityScore?: number;
}

export interface SearchFilters {
  language?: string;
  minStars?: number;
  maxStars?: number;
  topics?: string[];
  hasIssues?: boolean;
  hasWiki?: boolean;
  hasPages?: boolean;
  archived?: boolean;
  fork?: boolean;
  sortBy?: 'stars' | 'updated' | 'created' | 'name';
  order?: 'asc' | 'desc';
}

export interface SearchResult {
  repositories: Repository[];
  totalCount: number;
  hasMore: boolean;
  nextPage?: number;
}

export class GitHubSearchEngine {
  private octokit: Octokit;
  private exclusionList: string[] = ['Gzeu']; // Smart exclusion list
  private qualityWeights = {
    stars: 0.3,
    forks: 0.2,
    issues: 0.1,
    updates: 0.2,
    documentation: 0.2
  };

  constructor(token?: string) {
    this.octokit = new Octokit({ 
      auth: token || process.env.GITHUB_TOKEN 
    });
  }

  /**
   * Intelligent GitHub search with smart exclusions
   */
  async searchRepositories(
    query: string, 
    filters: SearchFilters = {}, 
    page: number = 1
  ): Promise<SearchResult> {
    try {
      const searchQuery = this.buildSmartQuery(query, filters);
      
      const response = await this.octokit.rest.search.repos({
        q: searchQuery,
        sort: filters.sortBy || 'stars',
        order: filters.order || 'desc',
        per_page: 30,
        page
      });

      const repositories = await this.enrichRepositories(response.data.items);
      
      return {
        repositories,
        totalCount: response.data.total_count,
        hasMore: response.data.items.length === 30,
        nextPage: response.data.items.length === 30 ? page + 1 : undefined
      };
    } catch (error) {
      console.error('GitHub search error:', error);
      throw new Error('Failed to search repositories');
    }
  }

  /**
   * Build intelligent search query with exclusions
   */
  private buildSmartQuery(query: string, filters: SearchFilters): string {
    const parts: string[] = [query];
    
    // Add exclusions
    this.exclusionList.forEach(user => {
      parts.push(`-user:${user}`);
    });
    
    // Add filters
    if (filters.language) {
      parts.push(`language:${filters.language}`);
    }
    
    if (filters.minStars !== undefined) {
      parts.push(`stars:>=${filters.minStars}`);
    }
    
    if (filters.maxStars !== undefined) {
      parts.push(`stars:<=${filters.maxStars}`);
    }
    
    if (filters.topics && filters.topics.length > 0) {
      filters.topics.forEach(topic => {
        parts.push(`topic:${topic}`);
      });
    }
    
    if (filters.hasIssues !== undefined) {
      parts.push(filters.hasIssues ? 'has:issues' : '-has:issues');
    }
    
    if (filters.hasWiki !== undefined) {
      parts.push(filters.hasWiki ? 'has:wiki' : '-has:wiki');
    }
    
    if (filters.hasPages !== undefined) {
      parts.push(filters.hasPages ? 'has:pages' : '-has:pages');
    }
    
    if (filters.archived !== undefined) {
      parts.push(filters.archived ? 'archived:true' : 'archived:false');
    }
    
    if (filters.fork !== undefined) {
      parts.push(filters.fork ? 'fork:true' : 'fork:false');
    }
    
    return parts.filter(Boolean).join(' ');
  }

  /**
   * Enrich repositories with quality scores and additional data
   */
  private async enrichRepositories(repos: any[]): Promise<Repository[]> {
    return Promise.all(
      repos.map(async (repo) => {
        const qualityScore = this.calculateQualityScore(repo);
        
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
          qualityScore
        };
      })
    );
  }

  /**
   * Calculate repository quality score (0-100)
   */
  private calculateQualityScore(repo: any): number {
    let score = 0;
    
    // Stars factor (logarithmic scale)
    const starScore = Math.min(Math.log10(repo.stargazers_count + 1) * 10, 30);
    score += starScore * this.qualityWeights.stars;
    
    // Forks factor
    const forkScore = Math.min(Math.log10(repo.forks_count + 1) * 10, 20);
    score += forkScore * this.qualityWeights.forks;
    
    // Activity factor (recent updates)
    const daysSinceUpdate = (Date.now() - new Date(repo.updated_at).getTime()) / (1000 * 60 * 60 * 24);
    const activityScore = Math.max(20 - daysSinceUpdate / 30, 0);
    score += activityScore * this.qualityWeights.updates;
    
    // Documentation factor
    const hasReadme = repo.description && repo.description.length > 50;
    const hasTopics = repo.topics && repo.topics.length > 0;
    const docScore = (hasReadme ? 15 : 0) + (hasTopics ? 5 : 0);
    score += docScore * this.qualityWeights.documentation;
    
    // Issue management (lower open issues is better)
    const issueRatio = repo.open_issues_count / (repo.stargazers_count + 1);
    const issueScore = Math.max(10 - issueRatio * 50, 0);
    score += issueScore * this.qualityWeights.issues;
    
    return Math.round(Math.min(score, 100));
  }

  /**
   * Get trending repositories with smart filtering
   */
  async getTrendingRepositories(timeframe: 'daily' | 'weekly' | 'monthly' = 'weekly'): Promise<Repository[]> {
    const dateThreshold = this.getDateThreshold(timeframe);
    
    return this.searchRepositories(
      `created:>${dateThreshold} stars:>10`,
      {
        sortBy: 'stars',
        order: 'desc',
        archived: false,
        fork: false
      }
    ).then(result => result.repositories.slice(0, 20));
  }

  /**
   * Find repositories similar to a given repo
   */
  async findSimilarRepositories(repo: Repository): Promise<Repository[]> {
    const searchTerms = [
      repo.language || '',
      ...repo.topics.slice(0, 3),
      repo.description?.split(' ').slice(0, 3).join(' ') || ''
    ].filter(Boolean);
    
    const query = searchTerms.join(' ');
    
    const result = await this.searchRepositories(query, {
      language: repo.language || undefined,
      minStars: Math.max(repo.stargazers_count / 10, 5),
      topics: repo.topics.slice(0, 2)
    });
    
    return result.repositories
      .filter(r => r.id !== repo.id)
      .slice(0, 10);
  }

  private getDateThreshold(timeframe: string): string {
    const now = new Date();
    switch (timeframe) {
      case 'daily':
        now.setDate(now.getDate() - 1);
        break;
      case 'weekly':
        now.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        now.setMonth(now.getMonth() - 1);
        break;
    }
    return now.toISOString().split('T')[0];
  }

  /**
   * Add user to exclusion list
   */
  addToExclusionList(username: string) {
    if (!this.exclusionList.includes(username)) {
      this.exclusionList.push(username);
    }
  }

  /**
   * Remove user from exclusion list
   */
  removeFromExclusionList(username: string) {
    this.exclusionList = this.exclusionList.filter(user => user !== username);
  }

  /**
   * Get current exclusion list
   */
  getExclusionList(): string[] {
    return [...this.exclusionList];
  }
}
import type { Repository } from './github-api';

export interface CombinationRequest {
  repositories: Repository[];
  projectName: string;
  description?: string;
  targetFramework?: 'react' | 'vue' | 'angular' | 'nextjs' | 'remix' | 'express';
  features: string[];
}

export interface CombinationResult {
  id: string;
  name: string;
  description: string;
  structure: ProjectStructure;
  files: GeneratedFile[];
  dependencies: string[];
  scripts: Record<string, string>;
  instructions: string[];
  deploymentConfig?: DeploymentConfig;
}

export interface ProjectStructure {
  folders: string[];
  entryPoints: string[];
  configFiles: string[];
  assetFolders: string[];
}

export interface GeneratedFile {
  path: string;
  content: string;
  type: 'component' | 'config' | 'style' | 'api' | 'utility' | 'test';
  source: string; // Original repository
}

export interface DeploymentConfig {
  platform: 'vercel' | 'netlify' | 'railway';
  envVars: string[];
  buildCommand: string;
  outputDirectory: string;
}

export class ProjectCombinator {
  private combinations: Map<string, CombinationResult> = new Map();

  /**
   * Intelligently combine multiple GitHub repositories
   */
  async combineProjects(request: CombinationRequest): Promise<CombinationResult> {
    const combinationId = this.generateCombinationId(request);
    
    // Analyze each repository structure
    const analyses = await Promise.all(
      request.repositories.map(repo => this.analyzeRepository(repo))
    );
    
    // Smart merge strategy
    const mergeStrategy = this.determineMergeStrategy(analyses, request.targetFramework);
    
    // Generate project structure
    const structure = this.generateProjectStructure(analyses, mergeStrategy);
    
    // Merge and generate files
    const files = await this.generateFiles(analyses, structure, mergeStrategy);
    
    // Resolve dependencies
    const dependencies = this.resolveDependencies(analyses);
    
    // Generate scripts
    const scripts = this.generateScripts(request.targetFramework, structure);
    
    // Create deployment config
    const deploymentConfig = this.generateDeploymentConfig(request.targetFramework);
    
    // Generate setup instructions
    const instructions = this.generateInstructions(request, structure);
    
    const result: CombinationResult = {
      id: combinationId,
      name: request.projectName,
      description: request.description || `Combined project from ${request.repositories.length} repositories`,
      structure,
      files,
      dependencies,
      scripts,
      instructions,
      deploymentConfig
    };
    
    // Cache the result
    this.combinations.set(combinationId, result);
    
    return result;
  }

  /**
   * Analyze repository structure and extract key components
   */
  private async analyzeRepository(repo: Repository): Promise<RepositoryAnalysis> {
    // This would normally fetch and analyze the actual repository content
    // For now, we'll simulate based on the repository metadata
    
    return {
      repository: repo,
      framework: this.detectFramework(repo),
      components: this.extractComponents(repo),
      dependencies: this.extractDependencies(repo),
      structure: this.analyzeStructure(repo),
      features: this.identifyFeatures(repo),
      codeQuality: repo.qualityScore || 0
    };
  }

  /**
   * Detect framework from repository metadata
   */
  private detectFramework(repo: Repository): string {
    const name = repo.name.toLowerCase();
    const description = (repo.description || '').toLowerCase();
    const topics = repo.topics.map(t => t.toLowerCase());
    
    const allText = `${name} ${description} ${topics.join(' ')}`;
    
    if (allText.includes('nextjs') || allText.includes('next.js')) return 'nextjs';
    if (allText.includes('remix')) return 'remix';
    if (allText.includes('react')) return 'react';
    if (allText.includes('vue')) return 'vue';
    if (allText.includes('angular')) return 'angular';
    if (allText.includes('express')) return 'express';
    if (allText.includes('fastapi')) return 'fastapi';
    if (allText.includes('django')) return 'django';
    
    return 'unknown';
  }

  /**
   * Extract potential components from repository
   */
  private extractComponents(repo: Repository): string[] {
    const components: string[] = [];
    const topics = repo.topics || [];
    const description = repo.description || '';
    
    // Common component patterns
    const patterns = [
      'authentication', 'auth', 'login',
      'dashboard', 'admin', 'panel',
      'chat', 'messaging', 'communication',
      'payment', 'stripe', 'billing',
      'database', 'orm', 'prisma',
      'api', 'rest', 'graphql',
      'ui', 'components', 'design-system',
      'charts', 'visualization', 'analytics',
      'file-upload', 'storage', 'aws',
      'email', 'notifications', 'smtp'
    ];
    
    patterns.forEach(pattern => {
      if (topics.includes(pattern) || description.toLowerCase().includes(pattern)) {
        components.push(pattern);
      }
    });
    
    return components;
  }

  /**
   * Extract dependencies based on repository metadata
   */
  private extractDependencies(repo: Repository): string[] {
    // This would normally parse package.json, requirements.txt, etc.
    // For now, we'll infer from topics and description
    
    const deps: string[] = [];
    const framework = this.detectFramework(repo);
    
    // Framework-specific dependencies
    switch (framework) {
      case 'nextjs':
        deps.push('next', 'react', 'react-dom');
        break;
      case 'remix':
        deps.push('@remix-run/node', '@remix-run/react');
        break;
      case 'react':
        deps.push('react', 'react-dom');
        break;
      case 'vue':
        deps.push('vue');
        break;
    }
    
    // Topic-based dependencies
    repo.topics.forEach(topic => {
      switch (topic.toLowerCase()) {
        case 'typescript':
          deps.push('typescript');
          break;
        case 'tailwindcss':
          deps.push('tailwindcss');
          break;
        case 'prisma':
          deps.push('prisma');
          break;
        case 'stripe':
          deps.push('stripe');
          break;
        case 'framer-motion':
          deps.push('framer-motion');
          break;
      }
    });
    
    return [...new Set(deps)];
  }

  /**
   * Analyze repository structure patterns
   */
  private analyzeStructure(repo: Repository): ProjectStructure {
    const framework = this.detectFramework(repo);
    
    // Default structures based on framework
    const structures: Record<string, ProjectStructure> = {
      nextjs: {
        folders: ['app', 'components', 'lib', 'public', 'styles'],
        entryPoints: ['app/page.tsx', 'app/layout.tsx'],
        configFiles: ['next.config.js', 'tailwind.config.js'],
        assetFolders: ['public', 'assets']
      },
      remix: {
        folders: ['app', 'app/routes', 'app/components', 'app/lib', 'public'],
        entryPoints: ['app/root.tsx', 'app/routes/_index.tsx'],
        configFiles: ['remix.config.js', 'tailwind.config.js'],
        assetFolders: ['public']
      },
      react: {
        folders: ['src', 'src/components', 'src/hooks', 'src/utils', 'public'],
        entryPoints: ['src/App.tsx', 'src/main.tsx'],
        configFiles: ['vite.config.ts', 'tailwind.config.js'],
        assetFolders: ['public', 'src/assets']
      }
    };
    
    return structures[framework] || structures.react;
  }

  /**
   * Identify key features from repository
   */
  private identifyFeatures(repo: Repository): string[] {
    const features: string[] = [];
    const allText = `${repo.name} ${repo.description} ${repo.topics.join(' ')}`.toLowerCase();
    
    const featurePatterns = {
      'User Authentication': ['auth', 'login', 'jwt', 'oauth'],
      'Database Integration': ['database', 'orm', 'prisma', 'mongodb', 'postgresql'],
      'Payment Processing': ['payment', 'stripe', 'billing', 'checkout'],
      'File Upload': ['upload', 'storage', 'aws', 's3', 'cloudinary'],
      'Real-time Features': ['websocket', 'realtime', 'socket.io', 'sse'],
      'API Integration': ['api', 'rest', 'graphql', 'fetch'],
      'UI Components': ['components', 'ui', 'design-system', 'tailwind'],
      'Charts & Analytics': ['charts', 'analytics', 'visualization', 'd3'],
      'Search Functionality': ['search', 'elasticsearch', 'algolia', 'fuse'],
      'Email System': ['email', 'smtp', 'sendgrid', 'mailgun']
    };
    
    Object.entries(featurePatterns).forEach(([feature, keywords]) => {
      if (keywords.some(keyword => allText.includes(keyword))) {
        features.push(feature);
      }
    });
    
    return features;
  }

  /**
   * Generate combination ID
   */
  private generateCombinationId(request: CombinationRequest): string {
    const repoIds = request.repositories.map(r => r.id).sort().join('-');
    return `combo-${Date.now()}-${repoIds.slice(0, 20)}`;
  }

  /**
   * Determine optimal merge strategy
   */
  private determineMergeStrategy(
    analyses: RepositoryAnalysis[], 
    targetFramework?: string
  ): MergeStrategy {
    const frameworks = analyses.map(a => a.framework);
    const dominantFramework = targetFramework || this.findDominantFramework(frameworks);
    
    return {
      type: 'intelligent',
      targetFramework: dominantFramework,
      conflictResolution: 'smart-merge',
      componentMerging: 'selective',
      dependencyStrategy: 'unified'
    };
  }

  private findDominantFramework(frameworks: string[]): string {
    const counts = frameworks.reduce((acc, fw) => {
      acc[fw] = (acc[fw] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(counts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'react';
  }

  // Additional methods would be implemented here...
  private generateProjectStructure(analyses: RepositoryAnalysis[], strategy: MergeStrategy): ProjectStructure {
    // Implementation for generating combined project structure
    return analyses[0]?.structure || {
      folders: ['src', 'components', 'lib', 'public'],
      entryPoints: ['src/App.tsx'],
      configFiles: ['package.json'],
      assetFolders: ['public']
    };
  }

  private async generateFiles(analyses: RepositoryAnalysis[], structure: ProjectStructure, strategy: MergeStrategy): Promise<GeneratedFile[]> {
    // Implementation for generating combined files
    return [];
  }

  private resolveDependencies(analyses: RepositoryAnalysis[]): string[] {
    // Merge and resolve dependencies from all repositories
    const allDeps = analyses.flatMap(a => a.dependencies);
    return [...new Set(allDeps)];
  }

  private generateScripts(framework?: string, structure?: ProjectStructure): Record<string, string> {
    const baseScripts = {
      'dev': 'npm run dev',
      'build': 'npm run build',
      'start': 'npm start',
      'lint': 'eslint . --ext .ts,.tsx',
      'type-check': 'tsc --noEmit'
    };
    
    switch (framework) {
      case 'nextjs':
        return {
          ...baseScripts,
          'dev': 'next dev',
          'build': 'next build',
          'start': 'next start'
        };
      case 'remix':
        return {
          ...baseScripts,
          'dev': 'remix dev',
          'build': 'remix build',
          'start': 'remix-serve build'
        };
      default:
        return baseScripts;
    }
  }

  private generateDeploymentConfig(framework?: string): DeploymentConfig {
    return {
      platform: 'vercel',
      envVars: ['GITHUB_TOKEN', 'DATABASE_URL'],
      buildCommand: 'npm run build',
      outputDirectory: framework === 'nextjs' ? '.next' : 'build'
    };
  }

  private generateInstructions(request: CombinationRequest, structure: ProjectStructure): string[] {
    return [
      '🚀 **Setup Instructions**',
      '',
      '1. Clone or download the generated project',
      '2. Install dependencies: `npm install`',
      '3. Copy `.env.example` to `.env` and configure your environment variables',
      '4. Start development server: `npm run dev`',
      '',
      '📁 **Project Structure**',
      ...structure.folders.map(folder => `- /${folder}/ - ${this.getFolderDescription(folder)}`),
      '',
      '🔧 **Configuration**',
      '- Update environment variables in `.env`',
      '- Customize configuration files as needed',
      '- Review and modify generated components',
      '',
      '🚀 **Deployment**',
      '- Deploy to Vercel: `vercel --prod`',
      '- Or build for production: `npm run build`',
      '',
      '📚 **Source Repositories**',
      ...request.repositories.map(repo => `- [${repo.full_name}](${repo.html_url}) - ${repo.description}`)
    ];
  }

  private getFolderDescription(folder: string): string {
    const descriptions: Record<string, string> = {
      'app': 'Main application code (Remix/Next.js)',
      'src': 'Source code directory',
      'components': 'Reusable UI components',
      'lib': 'Utility functions and services',
      'public': 'Static assets',
      'styles': 'CSS and styling files',
      'routes': 'Route components',
      'hooks': 'Custom React hooks',
      'utils': 'Utility functions',
      'types': 'TypeScript type definitions'
    };
    
    return descriptions[folder] || 'Project files';
  }

  /**
   * Get cached combination result
   */
  getCombination(id: string): CombinationResult | undefined {
    return this.combinations.get(id);
  }

  /**
   * List all cached combinations
   */
  getAllCombinations(): CombinationResult[] {
    return Array.from(this.combinations.values());
  }
}

// Supporting interfaces
interface RepositoryAnalysis {
  repository: Repository;
  framework: string;
  components: string[];
  dependencies: string[];
  structure: ProjectStructure;
  features: string[];
  codeQuality: number;
}

interface MergeStrategy {
  type: 'simple' | 'intelligent' | 'custom';
  targetFramework: string;
  conflictResolution: 'overwrite' | 'merge' | 'smart-merge';
  componentMerging: 'all' | 'selective' | 'best-of-breed';
  dependencyStrategy: 'unified' | 'separate' | 'micro-frontend';
}

// Export singleton instance
export const projectCombinator = new ProjectCombinator();
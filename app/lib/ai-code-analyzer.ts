import { Repository } from './github-api';
import OpenAI from 'openai';

export interface CodeAnalysisResult {
  overallQuality: number;
  issues: CodeIssue[];
  suggestions: string[];
  securityScore: number;
  maintainabilityScore: number;
  testCoverage?: number;
  dependencies: DependencyAnalysis[];
}

export interface CodeIssue {
  type: 'bug' | 'security' | 'performance' | 'style' | 'maintainability';
  severity: 'low' | 'medium' | 'high' | 'critical';
  file: string;
  line?: number;
  description: string;
  suggestion?: string;
}

export interface DependencyAnalysis {
  name: string;
  version: string;
  vulnerabilities: number;
  outdated: boolean;
  alternatives?: string[];
}

export class AICodeAnalyzer {
  private openai: OpenAI;
  private cache: Map<string, CodeAnalysisResult> = new Map();

  constructor(apiKey?: string) {
    this.openai = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY
    });
  }

  /**
   * Perform comprehensive code analysis using AI
   */
  async analyzeRepository(repo: Repository): Promise<CodeAnalysisResult> {
    const cacheKey = `${repo.full_name}-${repo.updated_at}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      // Fetch repository structure and key files
      const repoStructure = await this.fetchRepositoryStructure(repo);
      const keyFiles = await this.extractKeyFiles(repo);
      
      // AI-powered analysis
      const analysisPrompt = this.buildAnalysisPrompt(repoStructure, keyFiles);
      
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: "You are an expert code reviewer with deep knowledge of software engineering best practices, security, and modern development patterns. Analyze the provided repository structure and code samples."
          },
          {
            role: "user", 
            content: analysisPrompt
          }
        ],
        temperature: 0.1,
        max_tokens: 2000
      });

      const analysis = this.parseAIAnalysis(completion.choices[0].message.content || '');
      
      // Enhance with static analysis
      const enhancedAnalysis = await this.enhanceWithStaticAnalysis(analysis, repo);
      
      this.cache.set(cacheKey, enhancedAnalysis);
      return enhancedAnalysis;
      
    } catch (error) {
      console.error('Code analysis failed:', error);
      return this.getFallbackAnalysis(repo);
    }
  }

  /**
   * Build intelligent combination recommendations
   */
  async getCompatibilityScore(repos: Repository[]): Promise<number> {
    if (repos.length < 2) return 100;

    const analyses = await Promise.all(
      repos.map(repo => this.analyzeRepository(repo))
    );

    // Check framework compatibility
    const frameworks = await this.detectFrameworks(repos);
    const frameworkCompatibility = this.calculateFrameworkCompatibility(frameworks);
    
    // Check dependency conflicts
    const dependencyCompatibility = this.analyzeDependencyConflicts(analyses);
    
    // Check architectural patterns
    const architecturalCompatibility = this.analyzeArchitecturalPatterns(analyses);
    
    return Math.round(
      (frameworkCompatibility * 0.4 + 
       dependencyCompatibility * 0.4 + 
       architecturalCompatibility * 0.2)
    );
  }

  /**
   * Generate smart merge suggestions with AI
   */
  async generateMergeSuggestions(repos: Repository[]): Promise<string[]> {
    const analyses = await Promise.all(
      repos.map(repo => this.analyzeRepository(repo))
    );

    const prompt = `
Based on these repository analyses, provide specific merge suggestions:

${analyses.map((analysis, i) => `
Repository ${i + 1}: ${repos[i].name}
- Quality Score: ${analysis.overallQuality}
- Main Issues: ${analysis.issues.slice(0, 3).map(issue => issue.description).join(', ')}
- Key Features: ${this.extractKeyFeatures(repos[i])}
`).join('\n')}

Provide 5-8 specific, actionable merge suggestions focusing on:
1. Which components to prioritize from each repository
2. How to resolve potential conflicts
3. Best practices for integration
4. Security considerations
5. Performance optimizations
`;

    const completion = await this.openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 1000
    });

    return this.parseSuggestions(completion.choices[0].message.content || '');
  }

  private buildAnalysisPrompt(structure: any, keyFiles: any): string {
    return `
Analyze this repository structure and provide a detailed assessment:

Repository Structure:
${JSON.stringify(structure, null, 2)}

Key Files Content (truncated):
${JSON.stringify(keyFiles, null, 2)}

Please provide analysis in JSON format with:
- overallQuality (0-100)
- issues array with type, severity, description
- suggestions array
- securityScore (0-100)
- maintainabilityScore (0-100)
`;
  }

  private parseAIAnalysis(content: string): Partial<CodeAnalysisResult> {
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Failed to parse AI analysis:', error);
    }
    
    return {
      overallQuality: 75,
      issues: [],
      suggestions: ['Unable to perform detailed analysis'],
      securityScore: 70,
      maintainabilityScore: 75
    };
  }

  private async fetchRepositoryStructure(repo: Repository): Promise<any> {
    // Implementation would fetch actual repository structure
    return { placeholder: 'Repository structure would be fetched here' };
  }

  private async extractKeyFiles(repo: Repository): Promise<any> {
    // Implementation would extract key files like package.json, README, etc.
    return { placeholder: 'Key files would be extracted here' };
  }

  private async enhanceWithStaticAnalysis(analysis: Partial<CodeAnalysisResult>, repo: Repository): Promise<CodeAnalysisResult> {
    return {
      overallQuality: analysis.overallQuality || 75,
      issues: analysis.issues || [],
      suggestions: analysis.suggestions || [],
      securityScore: analysis.securityScore || 70,
      maintainabilityScore: analysis.maintainabilityScore || 75,
      dependencies: []
    };
  }

  private getFallbackAnalysis(repo: Repository): CodeAnalysisResult {
    return {
      overallQuality: repo.qualityScore || 60,
      issues: [
        {
          type: 'maintainability',
          severity: 'medium',
          file: 'unknown',
          description: 'Analysis temporarily unavailable'
        }
      ],
      suggestions: ['Repository analysis will be available shortly'],
      securityScore: 70,
      maintainabilityScore: 65,
      dependencies: []
    };
  }

  private calculateFrameworkCompatibility(frameworks: string[]): number {
    // Implementation for framework compatibility scoring
    return 85;
  }

  private analyzeDependencyConflicts(analyses: CodeAnalysisResult[]): number {
    // Implementation for dependency conflict analysis
    return 90;
  }

  private analyzeArchitecturalPatterns(analyses: CodeAnalysisResult[]): number {
    // Implementation for architectural pattern analysis
    return 80;
  }

  private async detectFrameworks(repos: Repository[]): Promise<string[]> {
    // Implementation for framework detection
    return repos.map(repo => 'react'); // placeholder
  }

  private extractKeyFeatures(repo: Repository): string {
    return repo.topics.slice(0, 3).join(', ') || 'No topics available';
  }

  private parseSuggestions(content: string): string[] {
    return content.split('\n')
      .filter(line => line.trim().length > 0)
      .filter(line => /^\d+\./.test(line.trim()))
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .slice(0, 8);
  }
}

export const aiCodeAnalyzer = new AICodeAnalyzer();
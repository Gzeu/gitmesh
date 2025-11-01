import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from '@remix-run/node';
import { useLoaderData, useActionData, Form, useNavigation } from '@remix-run/react';
import { useState } from 'react';
import { ChartBarIcon, ShieldCheckIcon, LightBulbIcon, TrendingUpIcon } from '@heroicons/react/24/outline';
import { enhancedGitHubAPI } from '~/lib/enhanced-github-api';
import { aiCodeAnalyzer } from '~/lib/ai-code-analyzer';
import type { Repository } from '~/lib/github-api';

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const repos = url.searchParams.get('repos');
  
  if (!repos) {
    return json({ insights: null, trending: null });
  }

  try {
    const repoList: Repository[] = JSON.parse(decodeURIComponent(repos));
    
    // Get AI insights for the repositories
    const [compatibilityAnalysis, trendingData] = await Promise.all([
      enhancedGitHubAPI.analyzeProjectCompatibility(repoList),
      enhancedGitHubAPI.getTrendingWithAnalysis('weekly')
    ]);

    return json({ 
      insights: {
        compatibility: compatibilityAnalysis,
        repositories: repoList
      },
      trending: trendingData
    });
  } catch (error) {
    console.error('AI insights error:', error);
    return json({ insights: null, trending: null, error: 'Failed to load insights' });
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get('intent') as string;
  
  if (intent === 'analyze-quality') {
    const repoData = formData.get('repository') as string;
    
    try {
      const repository: Repository = JSON.parse(repoData);
      const [codeAnalysis, securityAnalysis] = await Promise.all([
        aiCodeAnalyzer.analyzeRepository(repository),
        enhancedGitHubAPI.analyzeRepositorySecurity(repository)
      ]);
      
      return json({ 
        analysis: {
          code: codeAnalysis,
          security: securityAnalysis
        }
      });
    } catch (error) {
      return json({ error: 'Analysis failed' }, { status: 500 });
    }
  }
  
  if (intent === 'get-recommendations') {
    const reposData = formData.get('repositories') as string;
    
    try {
      const repositories: Repository[] = JSON.parse(reposData);
      const mergeSuggestions = await aiCodeAnalyzer.generateMergeSuggestions(repositories);
      
      return json({ recommendations: mergeSuggestions });
    } catch (error) {
      return json({ error: 'Recommendations failed' }, { status: 500 });
    }
  }
  
  return json({ error: 'Invalid request' }, { status: 400 });
}

export default function AIInsights() {
  const { insights, trending, error } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [activeTab, setActiveTab] = useState<'compatibility' | 'trending' | 'analysis'>('compatibility');

  const isLoading = navigation.state === 'submitting';

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h2 className="text-red-800 dark:text-red-200 text-lg font-semibold mb-2">Analysis Error</h2>
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <LightBulbIcon className="h-8 w-8 text-blue-500" />
                AI-Powered Insights
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Advanced analysis and recommendations for your selected repositories
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'compatibility', label: 'Compatibility Analysis', icon: ShieldCheckIcon },
              { id: 'trending', label: 'Trending Insights', icon: TrendingUpIcon },
              { id: 'analysis', label: 'Code Analysis', icon: ChartBarIcon }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm
                    ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'compatibility' && insights && (
          <CompatibilityAnalysis 
            compatibility={insights.compatibility} 
            repositories={insights.repositories}
          />
        )}

        {activeTab === 'trending' && trending && (
          <TrendingInsights trending={trending} />
        )}

        {activeTab === 'analysis' && (
          <CodeAnalysisTab 
            repositories={insights?.repositories || []}
            actionData={actionData}
            isLoading={isLoading}
            onSelectRepo={setSelectedRepo}
            selectedRepo={selectedRepo}
          />
        )}

        {!insights && !trending && (
          <div className="text-center py-16">
            <LightBulbIcon className="mx-auto h-16 w-16 text-gray-300 dark:text-gray-600" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              No Analysis Available
            </h3>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              Select repositories from the search or combine page to see AI-powered insights.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function CompatibilityAnalysis({ 
  compatibility, 
  repositories 
}: { 
  compatibility: any; 
  repositories: Repository[];
}) {
  return (
    <div className="space-y-6">
      {/* Compatibility Score */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Overall Compatibility Score
          </h2>
          <div className={`
            text-3xl font-bold px-4 py-2 rounded-lg
            ${
              compatibility.compatibilityScore >= 80
                ? 'text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/30'
                : compatibility.compatibilityScore >= 60
                ? 'text-yellow-700 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-900/30'
                : 'text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/30'
            }
          `}>
            {compatibility.compatibilityScore}%
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {repositories.map(repo => (
            <div key={repo.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                {repo.name}
              </h3>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">{repo.language}</span>
                <span className="text-gray-600 dark:text-gray-400">
                  {repo.stargazers_count} ⭐
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Conflicts */}
      {compatibility.conflicts && compatibility.conflicts.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Potential Conflicts
          </h2>
          <div className="space-y-3">
            {compatibility.conflicts.map((conflict: any, index: number) => (
              <div key={index} className={`
                p-4 rounded-lg border-l-4
                ${
                  conflict.severity === 'high'
                    ? 'bg-red-50 border-red-400 dark:bg-red-900/20 dark:border-red-600'
                    : conflict.severity === 'medium'
                    ? 'bg-yellow-50 border-yellow-400 dark:bg-yellow-900/20 dark:border-yellow-600'
                    : 'bg-blue-50 border-blue-400 dark:bg-blue-900/20 dark:border-blue-600'
                }
              `}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {conflict.type}
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 mt-1">
                      {conflict.description}
                    </p>
                  </div>
                  <span className={`
                    px-2 py-1 text-xs font-medium rounded
                    ${
                      conflict.severity === 'high'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                        : conflict.severity === 'medium'
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    }
                  `}>
                    {conflict.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Integration Suggestions
        </h2>
        <div className="space-y-2">
          {compatibility.suggestions.map((suggestion: string, index: number) => (
            <div key={index} className="flex items-start gap-3">
              <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <p className="text-gray-700 dark:text-gray-300">{suggestion}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TrendingInsights({ trending }: { trending: any }) {
  return (
    <div className="space-y-6">
      {/* Top Languages */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Trending Languages
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {trending.insights.topLanguages.slice(0, 8).map((lang: any, index: number) => (
            <div key={index} className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {lang.count}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {lang.language}
              </div>
              <div className={`text-xs mt-1 ${
                lang.growth > 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {lang.growth > 0 ? '+' : ''}{lang.growth}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trending Repositories */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          This Week's Trending Repositories
        </h2>
        <div className="space-y-4">
          {trending.repositories.slice(0, 10).map((repo: Repository) => (
            <div key={repo.id} className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  <a href={repo.html_url} target="_blank" rel="noopener noreferrer" 
                     className="hover:text-blue-600 dark:hover:text-blue-400">
                    {repo.full_name}
                  </a>
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 line-clamp-2">
                  {repo.description}
                </p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <span>{repo.language}</span>
                  <span>{repo.stargazers_count} ⭐</span>
                  <span>{repo.forks_count} forks</span>
                </div>
              </div>
              <div className="ml-4 text-right">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {repo.qualityScore}%
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Quality</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CodeAnalysisTab({ 
  repositories, 
  actionData, 
  isLoading, 
  onSelectRepo, 
  selectedRepo 
}: {
  repositories: Repository[];
  actionData: any;
  isLoading: boolean;
  onSelectRepo: (repo: Repository) => void;
  selectedRepo: Repository | null;
}) {
  return (
    <div className="space-y-6">
      {/* Repository Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Select Repository for Analysis
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {repositories.map(repo => (
            <button
              key={repo.id}
              onClick={() => onSelectRepo(repo)}
              className={`
                p-4 text-left border-2 rounded-lg transition-colors
                ${
                  selectedRepo?.id === repo.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }
              `}
            >
              <h3 className="font-medium text-gray-900 dark:text-white">
                {repo.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                {repo.description}
              </p>
              <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                <span>{repo.language}</span>
                <span>{repo.stargazers_count} ⭐</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Analysis Form */}
      {selectedRepo && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <Form method="post" className="space-y-4">
            <input type="hidden" name="intent" value="analyze-quality" />
            <input type="hidden" name="repository" value={JSON.stringify(selectedRepo)} />
            
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Analyze: {selectedRepo.name}
              </h2>
              <button
                type="submit"
                disabled={isLoading}
                className="
                  px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                  disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center gap-2
                "
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <ChartBarIcon className="h-4 w-4" />
                    Run Analysis
                  </>
                )}
              </button>
            </div>
          </Form>
        </div>
      )}

      {/* Analysis Results */}
      {actionData?.analysis && (
        <div className="space-y-6">
          {/* Code Quality */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Code Quality Analysis
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {actionData.analysis.code.overallQuality}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Overall Quality</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {actionData.analysis.security.securityScore}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Security Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {actionData.analysis.code.maintainabilityScore}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Maintainability</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {actionData.analysis.code.issues.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Issues Found</div>
              </div>
            </div>
            
            {/* Issues */}
            {actionData.analysis.code.issues.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Issues</h4>
                <div className="space-y-2">
                  {actionData.analysis.code.issues.map((issue: any, index: number) => (
                    <div key={index} className={`
                      p-3 rounded-lg border-l-4
                      ${
                        issue.severity === 'critical' || issue.severity === 'high'
                          ? 'bg-red-50 border-red-400 dark:bg-red-900/20 dark:border-red-600'
                          : issue.severity === 'medium'
                          ? 'bg-yellow-50 border-yellow-400 dark:bg-yellow-900/20 dark:border-yellow-600'
                          : 'bg-blue-50 border-blue-400 dark:bg-blue-900/20 dark:border-blue-600'
                      }
                    `}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {issue.type}
                            </span>
                            <span className={`
                              px-2 py-1 text-xs font-medium rounded
                              ${
                                issue.severity === 'critical' || issue.severity === 'high'
                                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                  : issue.severity === 'medium'
                                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                              }
                            `}>
                              {issue.severity}
                            </span>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 text-sm mt-1">
                            {issue.description}
                          </p>
                          {issue.suggestion && (
                            <p className="text-gray-600 dark:text-gray-400 text-sm mt-2 italic">
                              💡 {issue.suggestion}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
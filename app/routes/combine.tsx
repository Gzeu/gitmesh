import { json, type ActionFunctionArgs } from '@remix-run/node';
import { useActionData, useFetcher, Form } from '@remix-run/react';
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CubeIcon,
  SparklesIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  PlayIcon,
  CogIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { projectCombinator, type CombinationRequest, type CombinationResult } from '../lib/project-combinator';
import type { Repository } from '../lib/github-api';

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const action = formData.get('_action');
  
  if (action === 'combine') {
    try {
      const combinationRequest: CombinationRequest = {
        repositories: JSON.parse(formData.get('repositories') as string),
        projectName: formData.get('projectName') as string,
        description: formData.get('description') as string,
        targetFramework: formData.get('targetFramework') as any,
        features: JSON.parse(formData.get('features') as string || '[]')
      };
      
      const result = await projectCombinator.combineProjects(combinationRequest);
      return json({ success: true, result, error: null });
    } catch (error) {
      return json({ success: false, result: null, error: (error as Error).message });
    }
  }
  
  return json({ success: false, result: null, error: 'Invalid action' });
}

export default function Combine() {
  const actionData = useActionData<typeof action>();
  const [selectedRepos, setSelectedRepos] = useState<Repository[]>([]);
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [targetFramework, setTargetFramework] = useState<string>('react');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [step, setStep] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const frameworks = [
    { id: 'react', name: 'React', icon: '⚛️', description: 'Pure React application' },
    { id: 'nextjs', name: 'Next.js', icon: '▲', description: 'Full-stack React framework' },
    { id: 'remix', name: 'Remix', icon: '🔀', description: 'Modern web framework' },
    { id: 'vue', name: 'Vue.js', icon: '💚', description: 'Progressive framework' },
  ];

  const availableFeatures = [
    'User Authentication',
    'Database Integration', 
    'Payment Processing',
    'File Upload',
    'Real-time Features',
    'API Integration',
    'UI Components',
    'Charts & Analytics',
    'Search Functionality',
    'Email System'
  ];

  const handleRepoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const repos = JSON.parse(e.target?.result as string);
          setSelectedRepos(repos);
        } catch (error) {
          console.error('Invalid JSON file');
        }
      };
      reader.readAsText(file);
    }
  };

  const removeRepo = (id: number) => {
    setSelectedRepos(prev => prev.filter(repo => repo.id !== id));
  };

  const canProceed = (currentStep: number) => {
    switch (currentStep) {
      case 1: return selectedRepos.length >= 2;
      case 2: return projectName.trim().length > 0;
      case 3: return true;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <div className="border-b border-white/10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-3">
            <CubeIcon className="h-8 w-8 text-mesh-primary" />
            <span className="text-2xl font-bold gradient-text">GitMesh</span>
            <SparklesIcon className="h-6 w-6 text-mesh-secondary" />
            <span className="text-xl font-medium">Project Combinator</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-center space-x-8">
            {[1, 2, 3, 4].map((stepNum) => {
              const isActive = step === stepNum;
              const isCompleted = step > stepNum;
              const canAccess = stepNum === 1 || canProceed(stepNum - 1);
              
              return (
                <div key={stepNum} className="flex items-center">
                  <button
                    onClick={() => canAccess && setStep(stepNum)}
                    disabled={!canAccess}
                    className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-semibold transition-all ${
                      isCompleted
                        ? 'bg-mesh-primary border-mesh-primary text-white'
                        : isActive
                        ? 'border-mesh-primary text-mesh-primary'
                        : canAccess
                        ? 'border-white/30 text-white/70 hover:border-mesh-primary/50'
                        : 'border-white/20 text-white/30 cursor-not-allowed'
                    }`}
                  >
                    {isCompleted ? <CheckCircleIcon className="h-6 w-6" /> : stepNum}
                  </button>
                  {stepNum < 4 && (
                    <div className={`w-16 h-0.5 ml-4 ${
                      step > stepNum ? 'bg-mesh-primary' : 'bg-white/20'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="text-center mt-4">
            <p className="text-gray-400">
              Step {step} of 4: {[
                'Select Repositories',
                'Configure Project',
                'Choose Features',
                'Generate & Deploy'
              ][step - 1]}
            </p>
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {/* Step 1: Repository Selection */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-4">Select Repositories to Combine</h2>
                <p className="text-gray-400 max-w-2xl mx-auto">
                  Choose 2 or more repositories that you want to intelligently combine into a single project.
                </p>
              </div>

              {/* Upload JSON */}
              <div className="glass-card rounded-xl p-6 text-center">
                <h3 className="text-lg font-semibold mb-4">Import from Search Results</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Upload a JSON file with selected repositories from your search results.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleRepoUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-mesh-primary/20 hover:bg-mesh-primary/30 border border-mesh-primary/50 px-6 py-3 rounded-lg transition-colors"
                >
                  Upload Repository List
                </button>
              </div>

              {/* Selected Repositories */}
              {selectedRepos.length > 0 && (
                <div className="glass-card rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Selected Repositories ({selectedRepos.length})
                  </h3>
                  
                  <div className="grid gap-4">
                    {selectedRepos.map(repo => (
                      <div key={repo.id} className="bg-white/10 rounded-lg p-4 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <img
                            src={repo.owner.avatar_url}
                            alt={repo.owner.login}
                            className="w-8 h-8 rounded-full"
                          />
                          <div>
                            <p className="font-medium">{repo.full_name}</p>
                            <p className="text-xs text-gray-400">{repo.language} • {repo.stargazers_count} stars</p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeRepo(repo.id)}
                          className="text-red-400 hover:text-red-300 p-1"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  {selectedRepos.length >= 2 && (
                    <div className="text-center mt-6">
                      <button
                        onClick={() => setStep(2)}
                        className="bg-gradient-to-r from-mesh-primary to-mesh-secondary px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
                      >
                        Next: Configure Project
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Instructions */}
              {selectedRepos.length === 0 && (
                <div className="text-center py-12">
                  <CubeIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Repositories Selected</h3>
                  <p className="text-gray-400 mb-6">
                    Start by searching for repositories or upload a JSON file with your selections.
                  </p>
                  <a
                    href="/search"
                    className="bg-mesh-primary hover:bg-mesh-primary/80 px-6 py-3 rounded-xl font-semibold transition-colors inline-block"
                  >
                    Go to Search
                  </a>
                </div>
              )}
            </motion.div>
          )}

          {/* Step 2: Project Configuration */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-4">Configure Your Combined Project</h2>
                <p className="text-gray-400 max-w-2xl mx-auto">
                  Set up the basic configuration for your new combined project.
                </p>
              </div>

              <div className="glass-card rounded-xl p-8 max-w-2xl mx-auto">
                <div className="space-y-6">
                  {/* Project Name */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Project Name *</label>
                    <input
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="my-awesome-project"
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-mesh-primary focus:ring-1 focus:ring-mesh-primary"
                    />
                  </div>
                  
                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe what your combined project will do..."
                      rows={3}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-mesh-primary focus:ring-1 focus:ring-mesh-primary resize-none"
                    />
                  </div>
                  
                  {/* Target Framework */}
                  <div>
                    <label className="block text-sm font-medium mb-4">Target Framework</label>
                    <div className="grid grid-cols-2 gap-3">
                      {frameworks.map(framework => (
                        <button
                          key={framework.id}
                          onClick={() => setTargetFramework(framework.id)}
                          className={`p-4 rounded-lg border-2 transition-all text-left ${
                            targetFramework === framework.id
                              ? 'border-mesh-primary bg-mesh-primary/20'
                              : 'border-white/20 hover:border-mesh-primary/50 bg-white/5'
                          }`}
                        >
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="text-xl">{framework.icon}</span>
                            <span className="font-semibold">{framework.name}</span>
                          </div>
                          <p className="text-xs text-gray-400">{framework.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Navigation */}
                  <div className="flex justify-between pt-6">
                    <button
                      onClick={() => setStep(1)}
                      className="bg-white/10 hover:bg-white/20 border border-white/20 px-6 py-3 rounded-xl transition-colors"
                    >
                      ← Back
                    </button>
                    
                    <button
                      onClick={() => setStep(3)}
                      disabled={!projectName.trim()}
                      className="bg-gradient-to-r from-mesh-primary to-mesh-secondary px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next: Choose Features →
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Feature Selection */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-4">Select Features to Include</h2>
                <p className="text-gray-400 max-w-2xl mx-auto">
                  Choose which features from the selected repositories you want to include in your combined project.
                </p>
              </div>

              <div className="glass-card rounded-xl p-8 max-w-4xl mx-auto">
                <div className="grid md:grid-cols-2 gap-4 mb-8">
                  {availableFeatures.map(feature => {
                    const isSelected = selectedFeatures.includes(feature);
                    return (
                      <button
                        key={feature}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedFeatures(prev => prev.filter(f => f !== feature));
                          } else {
                            setSelectedFeatures(prev => [...prev, feature]);
                          }
                        }}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          isSelected
                            ? 'border-mesh-primary bg-mesh-primary/20'
                            : 'border-white/20 hover:border-mesh-primary/50 bg-white/5'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{feature}</span>
                          {isSelected && <CheckCircleIcon className="h-5 w-5 text-mesh-primary" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
                
                {/* Navigation */}
                <div className="flex justify-between">
                  <button
                    onClick={() => setStep(2)}
                    className="bg-white/10 hover:bg-white/20 border border-white/20 px-6 py-3 rounded-xl transition-colors"
                  >
                    ← Back
                  </button>
                  
                  <button
                    onClick={() => setStep(4)}
                    className="bg-gradient-to-r from-mesh-primary to-mesh-secondary px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
                  >
                    Generate Project →
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Generation & Results */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-4">Generate Combined Project</h2>
                <p className="text-gray-400 max-w-2xl mx-auto">
                  Ready to combine your selected repositories into a unified, production-ready project.
                </p>
              </div>

              {!actionData && (
                <div className="glass-card rounded-xl p-8 max-w-2xl mx-auto text-center">
                  <div className="space-y-6">
                    {/* Generation Summary */}
                    <div className="bg-white/10 rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4">Project Summary</h3>
                      <div className="space-y-2 text-left">
                        <p><span className="text-gray-400">Name:</span> {projectName}</p>
                        <p><span className="text-gray-400">Framework:</span> {frameworks.find(f => f.id === targetFramework)?.name}</p>
                        <p><span className="text-gray-400">Repositories:</span> {selectedRepos.length}</p>
                        <p><span className="text-gray-400">Features:</span> {selectedFeatures.length}</p>
                      </div>
                    </div>
                    
                    {/* Generate Button */}
                    <Form method="post">
                      <input type="hidden" name="_action" value="combine" />
                      <input type="hidden" name="repositories" value={JSON.stringify(selectedRepos)} />
                      <input type="hidden" name="projectName" value={projectName} />
                      <input type="hidden" name="description" value={description} />
                      <input type="hidden" name="targetFramework" value={targetFramework} />
                      <input type="hidden" name="features" value={JSON.stringify(selectedFeatures)} />
                      
                      <button
                        type="submit"
                        className="bg-gradient-to-r from-mesh-primary to-mesh-secondary px-12 py-4 rounded-xl font-semibold text-lg hover:shadow-lg hover:shadow-mesh-primary/25 transition-all flex items-center space-x-2 mx-auto"
                      >
                        <SparklesIcon className="h-6 w-6" />
                        <span>Generate Combined Project</span>
                      </button>
                    </Form>
                  </div>
                </div>
              )}

              {/* Results */}
              {actionData && (
                <div className="max-w-4xl mx-auto">
                  {actionData.success && actionData.result ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      <div className="glass-card rounded-xl p-8 text-center">
                        <CheckCircleIcon className="h-16 w-16 text-emerald-400 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold mb-2">Project Generated Successfully!</h3>
                        <p className="text-gray-400">
                          Your combined project "{actionData.result.name}" is ready for download and deployment.
                        </p>
                      </div>
                      
                      {/* Download Options */}
                      <div className="grid md:grid-cols-3 gap-4">
                        <button className="glass-card p-6 rounded-xl text-center hover:border-mesh-primary/50 transition-colors">
                          <DocumentArrowDownIcon className="h-8 w-8 text-mesh-primary mx-auto mb-2" />
                          <div className="font-semibold">Download ZIP</div>
                          <div className="text-xs text-gray-400">Complete project files</div>
                        </button>
                        
                        <button className="glass-card p-6 rounded-xl text-center hover:border-mesh-secondary/50 transition-colors">
                          <PlayIcon className="h-8 w-8 text-mesh-secondary mx-auto mb-2" />
                          <div className="font-semibold">Deploy to Vercel</div>
                          <div className="text-xs text-gray-400">One-click deployment</div>
                        </button>
                        
                        <button className="glass-card p-6 rounded-xl text-center hover:border-mesh-accent/50 transition-colors">
                          <CogIcon className="h-8 w-8 text-mesh-accent mx-auto mb-2" />
                          <div className="font-semibold">View Config</div>
                          <div className="text-xs text-gray-400">Project structure</div>
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="glass-card rounded-xl p-8 text-center">
                      <ExclamationTriangleIcon className="h-16 w-16 text-red-400 mx-auto mb-4" />
                      <h3 className="text-xl font-bold mb-2">Generation Failed</h3>
                      <p className="text-red-300">{actionData.error}</p>
                      <button
                        onClick={() => setStep(3)}
                        className="mt-4 bg-white/10 hover:bg-white/20 px-6 py-2 rounded-xl transition-colors"
                      >
                        Try Again
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
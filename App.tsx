import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Plus, BrainCircuit, MessageSquare, LayoutGrid, Loader2, Languages } from 'lucide-react';
import { GraphView } from './components/GraphView';
import { IdeaList } from './components/IdeaList';
import { ChatPanel } from './components/ChatPanel';
import { RelatedIdeas } from './components/RelatedIdeas';
import { EvolutionCommandUI } from './components/EvolutionCommandUI';
import { HeroSection } from './components/HeroSection';
import { distillIdeaFromText, saveIdeaToVectorDB, getAllIdeas, mergeIdeas, splitIdea, refineIdea } from './services/apiService';
import { Idea, DistilledData } from './types';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { GraphLevelManager, GraphData } from './utils/graphLevelManager';

// Initial Mock Data
const MOCK_IDEAS: Idea[] = [
  {
    idea_id: '1',
    created_at: new Date().toISOString(),
    content_raw: "Thinking about how decentralized identity works. It's basically using blockchain to give users control over their own data instead of Google or Facebook owning it.",
    distilled_data: {
      one_liner: "Decentralized identity returns data ownership to users via blockchain.",
      tags: ["Web3", "Privacy", "Identity"],
      summary: "A framework where users control their digital identity without central intermediaries.",
      graph_structure: {
        nodes: [
          { id: "did", name: "Decentralized Identity", type: "Concept", desc: "User-owned identity system" },
          { id: "blockchain", name: "Blockchain", type: "Technology", desc: "Immutable ledger technology" },
          { id: "data_ownership", name: "Data Ownership", type: "Value", desc: "Control over personal data" },
          { id: "intermediaries", name: "Intermediaries", type: "Entity", desc: "Centralized authorities like Google" }
        ],
        edges: [
          { source: "did", target: "blockchain", relation: "powered_by", desc: "Uses as infrastructure" },
          { source: "did", target: "data_ownership", relation: "enables", desc: "Grants control to user" },
          { source: "did", target: "intermediaries", relation: "disrupts", desc: "Removes need for" }
        ]
      }
    }
  }
];

function AppContent() {
  const { t, language, setLanguage } = useLanguage();
  const [ideas, setIdeas] = useState<Idea[]>(MOCK_IDEAS);
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null); // 默认 null，显示 Level 1
  const [selectedIdeaIds, setSelectedIdeaIds] = useState<Set<string>>(new Set()); // For multi-select
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingSaves, setPendingSaves] = useState<Set<string>>(new Set());
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Notification state
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const notificationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Graph Level Management
  const [graphLevelManager] = useState(() => new GraphLevelManager());
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [similarityThreshold, setSimilarityThreshold] = useState(0.7);
  const [showHero, setShowHero] = useState(false);

  const selectedIdea = ideas.find(i => i.idea_id === selectedIdeaId) || null;

  // Show notification helper
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    
    // Clear existing timer
    if (notificationTimerRef.current) {
      clearTimeout(notificationTimerRef.current);
    }
    
    // Auto-hide after 5 seconds
    notificationTimerRef.current = setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  // Load all ideas from backend on mount
  useEffect(() => {
    const loadIdeas = async () => {
      try {
        const savedIdeas = await getAllIdeas();
        console.log(`✅ Loaded ${savedIdeas.length} ideas from backend`);
        if (savedIdeas.length > 0) {
          setIdeas(savedIdeas);
          setShowHero(false);
          // 不自动选择第一个想法，保持 null 以显示 Level 1
          // setSelectedIdeaId(savedIdeas[0].idea_id);
        } else {
          // Show hero when no ideas exist
          setShowHero(true);
        }
      } catch (err) {
        console.warn("Failed to load ideas from backend, using mock data:", err);
        // Keep using MOCK_IDEAS as fallback
      } finally {
        setIsLoading(false);
      }
    };

    loadIdeas();
  }, []);

  // Update graph data when ideas change
  useEffect(() => {
    if (ideas.length > 0) {
      graphLevelManager.setIdeas(ideas);
      // 默认显示 Level 1（宏观视图）
      if (graphLevelManager.getCurrentLevel() === 1) {
        updateGraphData();
      }
    }
  }, [ideas]);

  // When selected idea changes, transition to Level 2 (micro view)
  useEffect(() => {
    if (selectedIdeaId && ideas.length > 0) {
      try {
        graphLevelManager.transitionToLevel2(selectedIdeaId);
        updateGraphData();
      } catch (error) {
        console.error('Failed to transition to Level 2:', error);
      }
    }
  }, [selectedIdeaId]);

  // Update graph data when similarity threshold changes
  useEffect(() => {
    graphLevelManager.setSimilarityThreshold(similarityThreshold);
    updateGraphData();
  }, [similarityThreshold]);

  const updateGraphData = () => {
    try {
      const data = graphLevelManager.getGraphData();
      setGraphData(data);
    } catch (error) {
      console.error('Failed to update graph data:', error);
      // Fallback to null, will use legacy mode
      setGraphData(null);
    }
  };

  // Handle graph node click (Level 1 → Level 2 transition)
  const handleGraphNodeClick = (nodeId: string) => {
    const currentLevel = graphLevelManager.getCurrentLevel();
    
    if (currentLevel === 1) {
      // Level 1: Clicking an idea node, transition to Level 2
      // This will also update selectedIdeaId, which triggers the useEffect above
      setSelectedIdeaId(nodeId);
    }
  };

  // Handle back to Level 1
  const handleBackToLevel1 = () => {
    graphLevelManager.transitionToLevel1();
    // 清除选择，回到宏观视图
    setSelectedIdeaId(null);
    updateGraphData();
  };

  const handleCreateIdea = async () => {
    if (!inputText.trim()) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Call Backend to distill the text
      const distilledData: DistilledData = await distillIdeaFromText(inputText);

      const newIdea: Idea = {
        idea_id: uuidv4(),
        created_at: new Date().toISOString(),
        content_raw: inputText,
        distilled_data: distilledData,
        embedding_vector: (distilledData as any).embedding_vector,
      };

      // Save to vector database for RAG
      if (newIdea.embedding_vector) {
        try {
          await saveIdeaToVectorDB(newIdea.idea_id, newIdea.embedding_vector, newIdea);
        } catch (saveErr) {
          console.warn("Failed to save to vector DB:", saveErr);
          // Continue anyway - idea is still usable
        }
      }

      setIdeas(prev => [newIdea, ...prev]);
      setSelectedIdeaId(newIdea.idea_id);
      setInputText('');
      
      // Hide hero when first idea is created
      if (showHero) {
        setShowHero(false);
      }
    } catch (err) {
      console.error("Failed to create idea:", err);
      setError(t('error_failed_distill'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGetStarted = () => {
    setShowHero(false);
    // Focus on the input area
    const textarea = document.querySelector('textarea');
    if (textarea) {
      textarea.focus();
    }
  };

  // Debounced save function
  const scheduleSave = (ideaId: string) => {
    setPendingSaves(prev => new Set(prev).add(ideaId));
    
    // Clear existing timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    
    // Schedule save after 2 seconds of inactivity
    saveTimerRef.current = setTimeout(() => {
      savePendingIdeas();
    }, 2000);
  };

  const savePendingIdeas = async () => {
    const idsToSave = Array.from(pendingSaves);
    if (idsToSave.length === 0) return;
    
    console.log(`💾 Saving ${idsToSave.length} idea(s) to backend...`);
    
    for (const ideaId of idsToSave) {
      const idea = ideas.find(i => i.idea_id === ideaId);
      if (idea && idea.embedding_vector) {
        try {
          await saveIdeaToVectorDB(idea.idea_id, idea.embedding_vector, idea);
        } catch (err) {
          console.warn(`Failed to save idea ${ideaId}:`, err);
        }
      }
    }
    
    setPendingSaves(new Set());
    console.log('✅ Save complete');
  };

  const handleUpdateIdea = (id: string, updates: Partial<Idea>) => {
    setIdeas(prev => prev.map(idea => {
      if (idea.idea_id === id) {
        const updatedIdea = {
          ...idea,
          ...updates,
          // If updates contain distilled_data, merge it properly
          ...(updates.distilled_data && {
            distilled_data: {
              ...idea.distilled_data,
              ...updates.distilled_data
            }
          })
        };
        
        // Schedule save instead of immediate save
        scheduleSave(id);
        
        return updatedIdea;
      }
      return idea;
    }));
  };

  // Save pending changes when switching ideas
  useEffect(() => {
    return () => {
      if (pendingSaves.size > 0) {
        savePendingIdeas();
      }
    };
  }, [selectedIdeaId]);

  // Save pending changes before unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (pendingSaves.size > 0) {
        savePendingIdeas();
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [pendingSaves]);

  // Keyboard shortcuts for graph navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // ESC key: Return to Level 1 if in Level 2
      if (e.key === 'Escape' && graphLevelManager.getCurrentLevel() === 2) {
        handleBackToLevel1();
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'zh' : 'en');
  };

  // Multi-select handlers
  const handleToggleSelection = (ideaId: string) => {
    setSelectedIdeaIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ideaId)) {
        newSet.delete(ideaId);
      } else {
        newSet.add(ideaId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    setSelectedIdeaIds(new Set(ideas.map(idea => idea.idea_id)));
  };

  const handleClearSelection = () => {
    setSelectedIdeaIds(new Set());
  };

  const handleChatWithSelected = () => {
    // TODO: Implement multi-idea chat context (Task 11)
    // For now, just select the first idea and show a console message
    const selectedIds = Array.from(selectedIdeaIds);
    if (selectedIds.length > 0) {
      console.log('Chat with selected ideas:', selectedIds);
      // Select the first idea to show the chat panel
      setSelectedIdeaId(selectedIds[0]);
      // Keep the selection for future multi-idea context implementation
    }
  };

  // Delete idea handler
  const handleDeleteIdea = async (ideaId: string) => {
    try {
      // Import deleteIdea from apiService
      const { deleteIdea } = await import('./services/apiService');
      
      // Call backend API to delete idea
      await deleteIdea(ideaId);
      
      // Remove from local state
      setIdeas(prev => prev.filter(idea => idea.idea_id !== ideaId));
      
      // If deleted idea was selected, clear selection
      if (selectedIdeaId === ideaId) {
        setSelectedIdeaId(null);
      }
      
      // Remove from multi-select if present
      if (selectedIdeaIds.has(ideaId)) {
        setSelectedIdeaIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(ideaId);
          return newSet;
        });
      }
      
      showNotification('success', t('delete_success') || '想法已删除');
      console.log('✅ Idea deleted:', ideaId);
    } catch (err) {
      console.error('Failed to delete idea:', err);
      showNotification('error', t('delete_error') || '删除失败');
    }
  };

  // Batch delete ideas handler
  const handleDeleteBatch = async (ideaIds: string[]) => {
    try {
      // Import deleteIdeasBatch from apiService
      const { deleteIdeasBatch } = await import('./services/apiService');
      
      // Call backend API to delete ideas in batch
      const result = await deleteIdeasBatch(ideaIds);
      
      // Remove deleted ideas from local state
      setIdeas(prev => prev.filter(idea => !result.deleted_ids.includes(idea.idea_id)));
      
      // If any deleted idea was selected, clear selection
      if (selectedIdeaId && result.deleted_ids.includes(selectedIdeaId)) {
        setSelectedIdeaId(null);
      }
      
      // Clear multi-select
      setSelectedIdeaIds(new Set());
      
      // Show notification with count
      const message = result.deleted_count > 1 
        ? t('delete_batch_success', result.deleted_count.toString()) || `已删除 ${result.deleted_count} 个想法`
        : t('delete_success') || '想法已删除';
      
      showNotification('success', message);
      console.log(`✅ Batch deleted ${result.deleted_count} ideas`);
      
      if (result.not_found_ids.length > 0) {
        console.warn(`⚠️  ${result.not_found_ids.length} ideas not found`);
      }
    } catch (err) {
      console.error('Failed to batch delete ideas:', err);
      showNotification('error', t('delete_error') || '删除失败');
    }
  };

  // Evolution command handlers
  const handleMerge = async (ideaIds: string[]): Promise<Idea> => {
    console.log('Merging ideas:', ideaIds);
    
    try {
      // Call backend API to merge ideas
      const mergedIdea = await mergeIdeas(ideaIds);
      
      // Add merged idea to state
      setIdeas(prev => [mergedIdea, ...prev]);
      
      // Select the new merged idea
      setSelectedIdeaId(mergedIdea.idea_id);
      
      // Clear selection
      setSelectedIdeaIds(new Set());
      
      // Show success notification
      showNotification('success', `Successfully merged ${ideaIds.length} ideas into: "${mergedIdea.distilled_data.one_liner}"`);
      
      return mergedIdea;
    } catch (error) {
      console.error('Failed to merge ideas:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      showNotification('error', `Failed to merge ideas: ${errorMsg}`);
      throw error;
    }
  };

  const handleSplit = async (ideaId: string): Promise<Idea[]> => {
    console.log('Splitting idea:', ideaId);
    
    try {
      // Call backend API to split idea
      const result = await splitIdea(ideaId);
      
      // Update parent idea with child IDs
      setIdeas(prev => prev.map(idea => {
        if (idea.idea_id === ideaId) {
          return {
            ...idea,
            child_idea_ids: result.updated_parent.child_idea_ids,
            linked_idea_ids: result.updated_parent.linked_idea_ids
          };
        }
        return idea;
      }));
      
      // Add sub-ideas to state
      setIdeas(prev => [...result.sub_ideas, ...prev]);
      
      // Select the first sub-idea
      if (result.sub_ideas.length > 0) {
        setSelectedIdeaId(result.sub_ideas[0].idea_id);
      }
      
      // Clear selection
      setSelectedIdeaIds(new Set());
      
      // Show success notification
      showNotification('success', `Successfully split idea into ${result.sub_ideas.length} sub-concepts`);
      
      return result.sub_ideas;
    } catch (error) {
      console.error('Failed to split idea:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      showNotification('error', `Failed to split idea: ${errorMsg}`);
      throw error;
    }
  };

  const handleRefine = async (ideaId: string, additionalContext: string): Promise<Idea> => {
    console.log('Refining idea:', ideaId, 'with context:', additionalContext);
    
    try {
      // Call backend API to refine idea
      const refinedIdea = await refineIdea(ideaId, additionalContext);
      
      // Update idea in state
      setIdeas(prev => prev.map(idea => 
        idea.idea_id === ideaId ? refinedIdea : idea
      ));
      
      // Show success notification
      showNotification('success', `Successfully refined idea (v${refinedIdea.version || 1}): "${refinedIdea.distilled_data.one_liner}"`);
      
      return refinedIdea;
    } catch (error) {
      console.error('Failed to refine idea:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      showNotification('error', `Failed to refine idea: ${errorMsg}`);
      throw error;
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-200 font-sans">
      {/* Hero Section - shown when no ideas exist */}
      <HeroSection show={showHero} onGetStarted={handleGetStarted} />
      {/* Sidebar: List & Input */}
      <div className="w-80 flex flex-col border-r border-slate-800 bg-slate-900/50 backdrop-blur-sm z-10">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BrainCircuit className="w-6 h-6 text-indigo-500" />
            <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
              {t('app_title')}
            </h1>
            {pendingSaves.size > 0 && (
              <span className="text-xs text-amber-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                {t('saving') || 'Saving...'}
              </span>
            )}
          </div>
          <button 
            onClick={toggleLanguage}
            className="p-1.5 hover:bg-slate-800 rounded-md transition-colors text-slate-400 hover:text-indigo-400"
            title="Switch Language"
          >
            <Languages className="w-4 h-4" />
          </button>
        </div>

        {/* Input Area */}
        <div className="p-4 border-b border-slate-800 bg-slate-900">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
            {t('capture_label')}
          </label>
          <textarea
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all resize-none text-slate-200 placeholder-slate-500"
            rows={4}
            placeholder={t('capture_placeholder')}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isProcessing}
          />
          <div className="mt-2 flex justify-end">
            <button
              onClick={handleCreateIdea}
              disabled={isProcessing || !inputText.trim()}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>{t('distilling')}</span>
                </>
              ) : (
                <>
                  <Plus className="w-3 h-3" />
                  <span>{t('capture_btn')}</span>
                </>
              )}
            </button>
          </div>
          {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
        </div>

        {/* Idea List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 pb-2">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {t('library_title')} ({ideas.length})
            </h2>
          </div>
          <IdeaList 
            ideas={ideas} 
            selectedId={selectedIdeaId} 
            onSelect={setSelectedIdeaId}
            onDelete={handleDeleteIdea}
            onDeleteBatch={handleDeleteBatch}
            selectedIds={selectedIdeaIds}
            onToggleSelection={handleToggleSelection}
            onSelectAll={handleSelectAll}
            onClearSelection={handleClearSelection}
            onChatWithSelected={handleChatWithSelected}
          />
        </div>

        {/* Evolution Commands */}
        <EvolutionCommandUI
          selectedIdeas={selectedIdeaIds.size > 0 ? Array.from(selectedIdeaIds) : (selectedIdeaId ? [selectedIdeaId] : [])}
          ideas={ideas}
          showRefine={false}
          onMerge={handleMerge}
          onSplit={handleSplit}
          onRefine={handleRefine}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative h-full">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
            <Loader2 className="w-16 h-16 mb-4 opacity-20 animate-spin" />
            <p className="text-lg font-medium">{t('loading') || 'Loading ideas...'}</p>
          </div>
        ) : ideas.length > 0 ? (
          <>
             {/* Header - Only show when an idea is selected */}
            {selectedIdea && (
              <header className="h-14 border-b border-slate-800 flex items-center px-6 justify-between bg-slate-950/80">
                <div className="flex items-center space-x-3">
                   <div className="p-1.5 bg-indigo-500/10 rounded text-indigo-400">
                      <LayoutGrid className="w-4 h-4"/>
                   </div>
                   <h2 className="font-semibold text-slate-200 truncate max-w-md">
                     {selectedIdea.distilled_data.one_liner}
                   </h2>
                </div>
                <div className="flex space-x-2">
                  {selectedIdea.distilled_data.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-xs border border-slate-700">
                      #{tag}
                    </span>
                  ))}
                </div>
              </header>
            )}

            {/* Split View: Graph and Chat (or just Graph in Level 1) */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {/* Graph View Container */}
                <div className={`flex-1 relative bg-slate-950 ${
                  graphData?.level === 2 ? 'h-1/2 lg:h-full lg:w-2/3 border-b lg:border-b-0 lg:border-r border-slate-800' : 'h-full w-full'
                }`}>
                   {graphData ? (
                     // Two-level view mode
                     <GraphView 
                       graphData={graphData}
                       onNodeClick={handleGraphNodeClick}
                       onBackToLevel1={handleBackToLevel1}
                     />
                   ) : selectedIdea ? (
                     // Legacy mode (fallback) - only when idea is selected
                     <GraphView data={selectedIdea.distilled_data.graph_structure} />
                   ) : null}
                   
                   {/* Level Indicator */}
                   {graphData && (
                     <div className="absolute top-4 right-4 bg-slate-800/90 px-3 py-1.5 rounded text-sm border border-slate-700 backdrop-blur flex items-center gap-2">
                       <span className="text-lg">
                         {graphData.level === 1 ? '🌐' : '🔬'}
                       </span>
                       <span className="font-medium">
                         {graphData.level === 1 ? '宏观视图' : '微观视图'}
                       </span>
                       {graphData.level === 1 && (
                         <span className="text-xs text-slate-400 ml-1">
                           ({graphData.metadata.totalIdeas} 想法)
                         </span>
                       )}
                     </div>
                   )}

                   {/* Similarity Threshold Control (only in Level 1) */}
                   {graphData && graphData.level === 1 && (
                     <div className="absolute bottom-4 right-4 bg-slate-800/90 p-3 rounded border border-slate-700 backdrop-blur">
                       <label className="text-xs font-semibold text-slate-400 block mb-2">
                         相似度阈值: {similarityThreshold.toFixed(2)}
                       </label>
                       <input 
                         type="range" 
                         min="0.5" 
                         max="1" 
                         step="0.05"
                         value={similarityThreshold}
                         onChange={(e) => setSimilarityThreshold(parseFloat(e.target.value))}
                         className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                       />
                       <div className="flex justify-between text-xs text-slate-500 mt-1">
                         <span>0.5</span>
                         <span>1.0</span>
                       </div>
                     </div>
                   )}
                   
                   {/* Overlay Info (only in Level 2 or legacy mode) */}
                   {selectedIdea && (!graphData || graphData.level === 2) && (
                     <div className="absolute bottom-4 left-4 bg-slate-900/90 p-3 rounded border border-slate-800 max-w-sm backdrop-blur">
                        <h3 className="text-xs font-bold text-slate-400 uppercase mb-1">{t('ai_summary_title')}</h3>
                        <p className="text-sm text-slate-300 leading-relaxed">
                          {selectedIdea.distilled_data.summary}
                        </p>
                     </div>
                   )}
                </div>

                {/* Right Panel: Related Ideas + Chat (only in Level 2) */}
                {selectedIdea && graphData?.level === 2 && (
                  <div className="h-1/2 lg:h-full lg:w-1/3 bg-slate-900 flex flex-col border-l border-slate-800">
                   {/* Related Ideas Section */}
                   <div className="border-b border-slate-800 bg-slate-900/50">
                     <RelatedIdeas 
                       currentIdea={selectedIdea}
                       onSelectIdea={setSelectedIdeaId}
                     />
                   </div>
                   
                   {/* Chat Workbench */}
                   <div className="flex-1 flex flex-col min-h-0">
                     <div className="p-3 border-b border-slate-800 flex items-center space-x-2 bg-slate-800/50">
                        <MessageSquare className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm font-semibold text-slate-300">{t('workbench_title')}</span>
                     </div>
                     <ChatPanel 
                       idea={selectedIdea} 
                       onUpdateIdea={(updates) => handleUpdateIdea(selectedIdea.idea_id, updates)}
                     />
                   </div>
                  </div>
                )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
            <BrainCircuit className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">{t('select_idea_prompt')}</p>
          </div>
        )}
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
          <div className={`px-4 py-3 rounded-lg shadow-lg border backdrop-blur-sm ${
            notification.type === 'success' 
              ? 'bg-emerald-900/90 border-emerald-700 text-emerald-100' 
              : 'bg-red-900/90 border-red-700 text-red-100'
          }`}>
            <div className="flex items-start gap-3 max-w-md">
              <div className="flex-shrink-0 mt-0.5">
                {notification.type === 'success' ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{notification.message}</p>
              </div>
              <button
                onClick={() => setNotification(null)}
                className="flex-shrink-0 ml-2 text-current opacity-70 hover:opacity-100 transition-opacity"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

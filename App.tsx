import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Plus, BrainCircuit, MessageSquare, LayoutGrid, Loader2, Languages } from 'lucide-react';
import { GraphView } from './components/GraphView';
import { IdeaList } from './components/IdeaList';
import { ChatPanel } from './components/ChatPanel';
import { RelatedIdeas } from './components/RelatedIdeas';
import { distillIdeaFromText, saveIdeaToVectorDB, getAllIdeas } from './services/apiService';
import { Idea, DistilledData } from './types';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';

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
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(MOCK_IDEAS[0].idea_id);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingSaves, setPendingSaves] = useState<Set<string>>(new Set());
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const selectedIdea = ideas.find(i => i.idea_id === selectedIdeaId) || null;

  // Load all ideas from backend on mount
  useEffect(() => {
    const loadIdeas = async () => {
      try {
        const savedIdeas = await getAllIdeas();
        console.log(`✅ Loaded ${savedIdeas.length} ideas from backend`);
        if (savedIdeas.length > 0) {
          setIdeas(savedIdeas);
          setSelectedIdeaId(savedIdeas[0].idea_id);
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
    } catch (err) {
      console.error("Failed to create idea:", err);
      setError(t('error_failed_distill'));
    } finally {
      setIsProcessing(false);
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

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'zh' : 'en');
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-200 font-sans">
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
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative h-full">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
            <Loader2 className="w-16 h-16 mb-4 opacity-20 animate-spin" />
            <p className="text-lg font-medium">{t('loading') || 'Loading ideas...'}</p>
          </div>
        ) : selectedIdea ? (
          <>
             {/* Header */}
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

            {/* Split View: Top Graph, Bottom Chat */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {/* Graph View Container */}
                <div className="flex-1 h-1/2 lg:h-full lg:w-2/3 border-b lg:border-b-0 lg:border-r border-slate-800 relative bg-slate-950">
                   <GraphView data={selectedIdea.distilled_data.graph_structure} />
                   
                   {/* Overlay Info */}
                   <div className="absolute bottom-4 left-4 bg-slate-900/90 p-3 rounded border border-slate-800 max-w-sm backdrop-blur">
                      <h3 className="text-xs font-bold text-slate-400 uppercase mb-1">{t('ai_summary_title')}</h3>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {selectedIdea.distilled_data.summary}
                      </p>
                   </div>
                </div>

                {/* Right Panel: Related Ideas + Chat */}
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
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
            <BrainCircuit className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">{t('select_idea_prompt')}</p>
          </div>
        )}
      </div>
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

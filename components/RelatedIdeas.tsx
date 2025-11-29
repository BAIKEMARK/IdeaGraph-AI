import React, { useEffect, useState } from 'react';
import { Idea } from '../types';
import { searchSimilarIdeas } from '../services/geminiService';
import { Link2, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface RelatedIdeasProps {
  currentIdea: Idea;
  onSelectIdea: (ideaId: string) => void;
}

export const RelatedIdeas: React.FC<RelatedIdeasProps> = ({ currentIdea, onSelectIdea }) => {
  const { t } = useLanguage();
  const [relatedIdeas, setRelatedIdeas] = useState<Array<{ idea_id: string; similarity: number; idea_data: Idea }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRelated = async () => {
      if (!currentIdea.embedding_vector) return;

      setLoading(true);
      try {
        const results = await searchSimilarIdeas(
          currentIdea.embedding_vector,
          3,
          currentIdea.idea_id
        );
        setRelatedIdeas(results);
      } catch (error) {
        console.error("Failed to fetch related ideas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRelated();
  }, [currentIdea.idea_id, currentIdea.embedding_vector]);

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center text-slate-500">
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        <span className="text-sm">{t('loading_related') || 'Loading related ideas...'}</span>
      </div>
    );
  }

  if (relatedIdeas.length === 0) {
    return (
      <div className="p-4 text-slate-600 text-sm text-center">
        {t('no_related_ideas') || 'No related ideas found'}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-2">
      <div className="flex items-center space-x-2 mb-3">
        <Link2 className="w-4 h-4 text-cyan-400" />
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {t('related_ideas') || 'Related Ideas'}
        </h3>
      </div>
      
      {relatedIdeas.map(({ idea_id, similarity, idea_data }) => (
        <div
          key={idea_id}
          onClick={() => onSelectIdea(idea_id)}
          className="p-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/50 rounded-lg cursor-pointer transition-all group"
        >
          <div className="flex items-start justify-between mb-2">
            <p className="text-sm text-slate-300 group-hover:text-slate-200 line-clamp-2 flex-1">
              {idea_data.distilled_data.one_liner}
            </p>
            <span className="text-xs text-cyan-400 ml-2 flex-shrink-0">
              {(similarity * 100).toFixed(0)}%
            </span>
          </div>
          <div className="flex space-x-1">
            {idea_data.distilled_data.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-500 border border-slate-800">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

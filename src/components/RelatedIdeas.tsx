import React, { useEffect, useState } from 'react';
import { Idea } from '@/types/types';
import { searchSimilarIdeas } from '@/services/apiService';
import { Link2, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

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
    <div className="p-4 space-y-3 h-full overflow-y-auto">
      {relatedIdeas.map(({ idea_id, similarity, idea_data }) => (
        <div
          key={idea_id}
          onClick={() => onSelectIdea(idea_id)}
          className="p-3 bg-zinc-800/30 hover:bg-zinc-800/50 border border-white/5 hover:border-cyan-400/30 rounded-xl cursor-pointer transition-all group active:scale-95 backdrop-blur-sm"
        >
          <div className="flex items-start justify-between mb-2">
            <p className="text-sm text-zinc-300 group-hover:text-zinc-200 line-clamp-2 flex-1 leading-relaxed">
              {idea_data.distilled_data.one_liner}
            </p>
            <div className="ml-3 flex-shrink-0">
              <span className="text-xs px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded-full border border-cyan-500/30">
                {(similarity * 100).toFixed(0)}%
              </span>
            </div>
          </div>
          <div className="flex space-x-1.5">
            {idea_data.distilled_data.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="text-xs px-2 py-0.5 rounded-md bg-zinc-950/50 text-zinc-500 border border-zinc-700/50">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

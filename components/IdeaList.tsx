import React from 'react';
import { Idea } from '../types';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface IdeaListProps {
  ideas: Idea[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export const IdeaList: React.FC<IdeaListProps> = ({ ideas, selectedId, onSelect }) => {
  const { t } = useLanguage();

  if (ideas.length === 0) {
    return <div className="p-4 text-slate-500 text-sm text-center">{t('no_ideas')}</div>;
  }

  return (
    <div className="flex flex-col space-y-1 p-2">
      {ideas.map((idea) => {
        const isSelected = idea.idea_id === selectedId;
        return (
          <div
            key={idea.idea_id}
            onClick={() => onSelect(idea.idea_id)}
            className={`
              group flex flex-col p-3 rounded-lg cursor-pointer transition-all duration-200 border
              ${isSelected 
                ? 'bg-slate-800 border-indigo-500/50 shadow-lg shadow-indigo-900/20' 
                : 'bg-transparent border-transparent hover:bg-slate-800/50 hover:border-slate-800'
              }
            `}
          >
            <div className="flex justify-between items-start">
              <p className={`text-sm font-medium line-clamp-2 ${isSelected ? 'text-slate-200' : 'text-slate-400 group-hover:text-slate-300'}`}>
                {idea.distilled_data.one_liner}
              </p>
              {isSelected && <ArrowRight className="w-3 h-3 text-indigo-400 mt-1 flex-shrink-0" />}
            </div>
            
            <div className="flex items-center space-x-2 mt-3">
              <div className="flex space-x-1">
                {idea.distilled_data.tags.slice(0, 2).map((tag) => (
                  <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950 text-slate-500 border border-slate-800">
                    #{tag}
                  </span>
                ))}
              </div>
              <span className="text-[10px] text-slate-600 ml-auto">
                {new Date(idea.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

import React from 'react';
import { Idea } from '../types';
import { ArrowRight, CheckSquare, Square, MessageSquare, Trash2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface IdeaListProps {
  ideas: Idea[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete?: (id: string) => void;
  onDeleteBatch?: (ids: string[]) => void;
  // Multi-select props
  selectedIds?: Set<string>;
  onToggleSelection?: (id: string) => void;
  onSelectAll?: () => void;
  onClearSelection?: () => void;
  onChatWithSelected?: () => void;
}

export const IdeaList: React.FC<IdeaListProps> = ({ 
  ideas, 
  selectedId, 
  onSelect,
  onDelete,
  onDeleteBatch,
  selectedIds = new Set(),
  onToggleSelection,
  onSelectAll,
  onClearSelection,
  onChatWithSelected
}) => {
  const { t } = useLanguage();
  const isMultiSelectMode = selectedIds.size > 0;

  if (ideas.length === 0) {
    return <div className="p-4 text-slate-500 text-sm text-center">{t('no_ideas')}</div>;
  }

  const handleItemClick = (ideaId: string, e: React.MouseEvent) => {
    // If multi-select mode is active, toggle selection
    if (isMultiSelectMode && onToggleSelection) {
      e.stopPropagation();
      onToggleSelection(ideaId);
    } else {
      // Normal single-select behavior
      onSelect(ideaId);
    }
  };

  const handleCheckboxClick = (ideaId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleSelection) {
      onToggleSelection(ideaId);
    }
  };

  const handleDeleteClick = (ideaId: string, ideaName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      if (confirm(`${t('confirm_delete') || '确定要删除这个想法吗？'}\n\n"${ideaName}"`)) {
        onDelete(ideaId);
      }
    }
  };

  const handleBatchDelete = () => {
    if (onDeleteBatch && selectedIds.size > 0) {
      const count = selectedIds.size;
      if (confirm(`${t('confirm_delete_batch') || '确定要删除选中的想法吗？'}\n\n${t('selected_count', count.toString()) || `已选择 ${count} 个想法`}`)) {
        onDeleteBatch(Array.from(selectedIds));
      }
    }
  };

  return (
    <div className="flex flex-col">
      {/* Selection Controls Header */}
      {(onToggleSelection || onSelectAll || onClearSelection) && (
        <div className="px-4 py-2 border-b border-slate-800 bg-slate-900/50 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-400">
                {isMultiSelectMode 
                  ? `${selectedIds.size} ${t('selected')}`
                  : t('select_mode')}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {isMultiSelectMode ? (
                <>
                  {onChatWithSelected && selectedIds.size > 0 && (
                    <button
                      onClick={onChatWithSelected}
                      className="flex items-center space-x-1 px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium transition-colors"
                      title={t('chat_with_selected')}
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>{t('chat')}</span>
                    </button>
                  )}
                  {onDeleteBatch && selectedIds.size > 0 && (
                    <button
                      onClick={handleBatchDelete}
                      className="flex items-center space-x-1 px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-medium transition-colors"
                      title={t('delete_selected')}
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>{t('delete')}</span>
                    </button>
                  )}
                  {onClearSelection && (
                    <button
                      onClick={onClearSelection}
                      className="px-2 py-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      {t('clear')}
                    </button>
                  )}
                </>
              ) : (
                onSelectAll && (
                  <button
                    onClick={onSelectAll}
                    className="px-2 py-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    {t('select_all')}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Idea List */}
      <div className="flex flex-col space-y-1 p-2">
        {ideas.map((idea) => {
          const isSelected = idea.idea_id === selectedId;
          const isChecked = selectedIds.has(idea.idea_id);
          
          return (
            <div
              key={idea.idea_id}
              onClick={(e) => handleItemClick(idea.idea_id, e)}
              className={`
                group flex items-start p-3 rounded-lg cursor-pointer transition-all duration-200 border
                ${isSelected 
                  ? 'bg-slate-800 border-indigo-500/50 shadow-lg shadow-indigo-900/20' 
                  : isChecked
                  ? 'bg-slate-800/70 border-emerald-500/30'
                  : 'bg-transparent border-transparent hover:bg-slate-800/50 hover:border-slate-800'
                }
              `}
            >
              {/* Checkbox (if multi-select is enabled) */}
              {onToggleSelection && (
                <div 
                  onClick={(e) => handleCheckboxClick(idea.idea_id, e)}
                  className="mr-3 mt-0.5 flex-shrink-0"
                >
                  {isChecked ? (
                    <CheckSquare className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />
                  )}
                </div>
              )}

              {/* Idea Content */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <p className={`text-sm font-medium line-clamp-2 flex-1 ${
                    isSelected 
                      ? 'text-slate-200' 
                      : isChecked
                      ? 'text-slate-300'
                      : 'text-slate-400 group-hover:text-slate-300'
                  }`}>
                    {idea.distilled_data.one_liner}
                  </p>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {onDelete && (
                      <button
                        onClick={(e) => handleDeleteClick(idea.idea_id, idea.distilled_data.one_liner, e)}
                        className="p-1 text-slate-600 hover:text-red-400 hover:bg-slate-800 rounded transition-colors opacity-0 group-hover:opacity-100"
                        title={t('delete') || '删除'}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                    {isSelected && <ArrowRight className="w-3 h-3 text-indigo-400" />}
                  </div>
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
            </div>
          );
        })}
      </div>
    </div>
  );
};

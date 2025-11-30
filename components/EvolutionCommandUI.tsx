import React, { useState } from 'react';
import { GitMerge, GitBranch, Sparkles, Loader2, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Idea } from '../types';

export type EvolutionCommand = 'merge' | 'split' | 'refine';

interface EvolutionCommandUIProps {
  selectedIdeas: string[];
  ideas: Idea[];
  showRefine?: boolean;
  onMerge: (ideaIds: string[]) => Promise<Idea>;
  onSplit: (ideaId: string) => Promise<Idea[]>;
  onRefine: (ideaId: string, additionalContext: string) => Promise<Idea>;
}

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
  loadingText: string;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  isLoading,
  loadingText
}) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-200">{title}</h3>
          {!isLoading && (
            <button
              onClick={onCancel}
              className="p-1 hover:bg-slate-800 rounded-md transition-colors text-slate-400 hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <p className="text-sm text-slate-300 leading-relaxed">{message}</p>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-slate-950/50 border-t border-slate-800 flex justify-end space-x-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('confirm_cancel')}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{loadingText}</span>
              </>
            ) : (
              <span>{t('confirm_yes')}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export const EvolutionCommandUI: React.FC<EvolutionCommandUIProps> = ({
  selectedIdeas,
  ideas,
  showRefine = false,
  onMerge,
  onSplit,
  onRefine
}) => {
  const { t } = useLanguage();
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: EvolutionCommand | null;
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: null,
    title: '',
    message: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determine button states
  const canMerge = selectedIdeas.length >= 2;
  const canSplit = selectedIdeas.length === 1;
  const canRefine = selectedIdeas.length === 1 && showRefine;

  const handleMergeClick = () => {
    setError(null);
    setConfirmDialog({
      isOpen: true,
      type: 'merge',
      title: t('confirm_merge_title'),
      message: t('confirm_merge_message', selectedIdeas.length.toString())
    });
  };

  const handleSplitClick = () => {
    setError(null);
    const idea = ideas.find(i => i.idea_id === selectedIdeas[0]);
    if (!idea) return;

    setConfirmDialog({
      isOpen: true,
      type: 'split',
      title: t('confirm_split_title'),
      message: t('confirm_split_message', idea.distilled_data.one_liner)
    });
  };

  const handleRefineClick = () => {
    setError(null);
    const idea = ideas.find(i => i.idea_id === selectedIdeas[0]);
    if (!idea) return;

    setConfirmDialog({
      isOpen: true,
      type: 'refine',
      title: t('confirm_refine_title'),
      message: t('confirm_refine_message', idea.distilled_data.one_liner)
    });
  };

  const handleConfirm = async () => {
    if (!confirmDialog.type) return;

    setIsLoading(true);
    setError(null);

    try {
      switch (confirmDialog.type) {
        case 'merge':
          await onMerge(selectedIdeas);
          break;
        case 'split':
          await onSplit(selectedIdeas[0]);
          break;
        case 'refine':
          // For refine, we'll pass empty string as additional context for now
          // In a full implementation, this would come from the chat context
          await onRefine(selectedIdeas[0], '');
          break;
      }

      // Close dialog on success
      setConfirmDialog({ isOpen: false, type: null, title: '', message: '' });
    } catch (err) {
      console.error('Evolution command failed:', err);
      setError(t('evolution_error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (!isLoading) {
      setConfirmDialog({ isOpen: false, type: null, title: '', message: '' });
      setError(null);
    }
  };

  const getLoadingText = () => {
    switch (confirmDialog.type) {
      case 'merge':
        return t('merging');
      case 'split':
        return t('splitting');
      case 'refine':
        return t('refining');
      default:
        return t('loading');
    }
  };

  return (
    <>
      <div className="p-4 bg-slate-900/50 border-t border-slate-800">
        <div className="mb-3">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {t('evolution_commands')}
          </h3>
        </div>

        <div className="space-y-2">
          {/* Merge Button */}
          <button
            onClick={handleMergeClick}
            disabled={!canMerge}
            title={canMerge ? t('merge_tooltip') : t('select_multiple')}
            className={`
              w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all
              ${canMerge
                ? 'bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 hover:border-indigo-500/50'
                : 'bg-slate-800/50 text-slate-600 border border-slate-800 cursor-not-allowed'
              }
            `}
          >
            <GitMerge className="w-4 h-4" />
            <span className="flex-1 text-left">{t('merge_ideas')}</span>
            {!canMerge && (
              <span className="text-xs text-slate-600">{selectedIdeas.length}/2+</span>
            )}
          </button>

          {/* Split Button */}
          <button
            onClick={handleSplitClick}
            disabled={!canSplit}
            title={canSplit ? t('split_tooltip') : t('select_one')}
            className={`
              w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all
              ${canSplit
                ? 'bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/50'
                : 'bg-slate-800/50 text-slate-600 border border-slate-800 cursor-not-allowed'
              }
            `}
          >
            <GitBranch className="w-4 h-4" />
            <span className="flex-1 text-left">{t('split_idea')}</span>
            {selectedIdeas.length !== 1 && (
              <span className="text-xs text-slate-600">{selectedIdeas.length}/1</span>
            )}
          </button>

          {/* Refine Button - Only shown when showRefine is true */}
          {showRefine && (
            <button
              onClick={handleRefineClick}
              disabled={!canRefine}
              title={t('refine_tooltip')}
              className={`
                w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all
                ${canRefine
                  ? 'bg-amber-600/10 hover:bg-amber-600/20 text-amber-400 border border-amber-500/30 hover:border-amber-500/50'
                  : 'bg-slate-800/50 text-slate-600 border border-slate-800 cursor-not-allowed'
                }
              `}
            >
              <Sparkles className="w-4 h-4" />
              <span className="flex-1 text-left">{t('refine_idea')}</span>
            </button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        isLoading={isLoading}
        loadingText={getLoadingText()}
      />
    </>
  );
};

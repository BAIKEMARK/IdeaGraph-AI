/**
 * Example usage of EvolutionCommandUI component
 * 
 * This file demonstrates how to integrate the EvolutionCommandUI
 * into your application.
 */

import React, { useState } from 'react';
import { EvolutionCommandUI } from './EvolutionCommandUI';
import { Idea } from '../types';

export const EvolutionCommandUIExample: React.FC = () => {
  const [selectedIdeas, setSelectedIdeas] = useState<string[]>([]);
  const [showRefine, setShowRefine] = useState(false);

  // Mock ideas for demonstration
  const mockIdeas: Idea[] = [
    {
      idea_id: '1',
      created_at: new Date().toISOString(),
      content_raw: 'Test idea 1',
      distilled_data: {
        one_liner: 'First test idea',
        tags: ['test'],
        summary: 'A test idea',
        graph_structure: { nodes: [], edges: [] }
      }
    },
    {
      idea_id: '2',
      created_at: new Date().toISOString(),
      content_raw: 'Test idea 2',
      distilled_data: {
        one_liner: 'Second test idea',
        tags: ['test'],
        summary: 'Another test idea',
        graph_structure: { nodes: [], edges: [] }
      }
    }
  ];

  // Mock handlers
  const handleMerge = async (ideaIds: string[]): Promise<Idea> => {
    console.log('Merging ideas:', ideaIds);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      idea_id: 'merged-' + Date.now(),
      created_at: new Date().toISOString(),
      content_raw: 'Merged content',
      distilled_data: {
        one_liner: 'Merged idea',
        tags: ['merged'],
        summary: 'A merged idea',
        graph_structure: { nodes: [], edges: [] }
      },
      merged_from_ids: ideaIds
    };
  };

  const handleSplit = async (ideaId: string): Promise<Idea[]> => {
    console.log('Splitting idea:', ideaId);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return [
      {
        idea_id: 'split-1-' + Date.now(),
        created_at: new Date().toISOString(),
        content_raw: 'Split content 1',
        distilled_data: {
          one_liner: 'First split idea',
          tags: ['split'],
          summary: 'First part',
          graph_structure: { nodes: [], edges: [] }
        },
        parent_idea_id: ideaId
      },
      {
        idea_id: 'split-2-' + Date.now(),
        created_at: new Date().toISOString(),
        content_raw: 'Split content 2',
        distilled_data: {
          one_liner: 'Second split idea',
          tags: ['split'],
          summary: 'Second part',
          graph_structure: { nodes: [], edges: [] }
        },
        parent_idea_id: ideaId
      }
    ];
  };

  const handleRefine = async (ideaId: string, context: string): Promise<Idea> => {
    console.log('Refining idea:', ideaId, 'with context:', context);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const originalIdea = mockIdeas.find(i => i.idea_id === ideaId);
    return {
      ...originalIdea!,
      distilled_data: {
        ...originalIdea!.distilled_data,
        one_liner: 'Refined: ' + originalIdea!.distilled_data.one_liner
      },
      version: (originalIdea!.version || 0) + 1
    };
  };

  return (
    <div className="p-4 bg-slate-950 min-h-screen">
      <h1 className="text-2xl font-bold text-white mb-4">
        EvolutionCommandUI Example
      </h1>

      {/* Selection Controls */}
      <div className="mb-4 p-4 bg-slate-900 rounded-lg">
        <h2 className="text-lg font-semibold text-white mb-2">
          Selection Controls
        </h2>
        <div className="space-y-2">
          {mockIdeas.map(idea => (
            <label key={idea.idea_id} className="flex items-center space-x-2 text-white">
              <input
                type="checkbox"
                checked={selectedIdeas.includes(idea.idea_id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedIdeas([...selectedIdeas, idea.idea_id]);
                  } else {
                    setSelectedIdeas(selectedIdeas.filter(id => id !== idea.idea_id));
                  }
                }}
              />
              <span>{idea.distilled_data.one_liner}</span>
            </label>
          ))}
        </div>
        <div className="mt-4">
          <label className="flex items-center space-x-2 text-white">
            <input
              type="checkbox"
              checked={showRefine}
              onChange={(e) => setShowRefine(e.target.checked)}
            />
            <span>Show Refine Button</span>
          </label>
        </div>
        <div className="mt-2 text-sm text-slate-400">
          Selected: {selectedIdeas.length} idea(s)
        </div>
      </div>

      {/* Evolution Command UI */}
      <div className="max-w-md">
        <EvolutionCommandUI
          selectedIdeas={selectedIdeas}
          ideas={mockIdeas}
          showRefine={showRefine}
          onMerge={handleMerge}
          onSplit={handleSplit}
          onRefine={handleRefine}
        />
      </div>
    </div>
  );
};

import { DistilledData, Idea } from "@/types/types";

// Configuration for Backend URL
const BACKEND_URL = "http://localhost:5000/api";

/**
 * API Service for IdeaGraph Backend
 * Handles all communication with the Flask backend server
 */

export async function distillIdeaFromText(text: string): Promise<DistilledData> {
  try {
    const response = await fetch(`${BACKEND_URL}/distill`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      let errorMsg = `HTTP Error: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.error) errorMsg = errorData.error;
      } catch (e) {
        // Ignore JSON parse error on error response
      }
      throw new Error(errorMsg);
    }

    const data: DistilledData = await response.json();
    return data;
  } catch (error) {
    console.error("Backend Distillation Error:", error);
    throw error;
  }
}

export async function saveIdeaToVectorDB(
  ideaId: string,
  embeddingVector: number[],
  ideaData: Idea
): Promise<void> {
  try {
    const response = await fetch(`${BACKEND_URL}/save_idea`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idea_id: ideaId,
        embedding_vector: embeddingVector,
        idea_data: ideaData,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to save idea: ${response.status}`);
    }
  } catch (error) {
    console.error("Backend Save Error:", error);
    throw error;
  }
}

export async function searchSimilarIdeas(
  queryEmbedding: number[],
  topK: number = 3,
  excludeId?: string
): Promise<Array<{ idea_id: string; similarity: number; idea_data: Idea }>> {
  try {
    const response = await fetch(`${BACKEND_URL}/search_similar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query_embedding: queryEmbedding,
        top_k: topK,
        exclude_id: excludeId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`);
    }

    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error("Backend Search Error:", error);
    throw error;
  }
}

export interface ChatCitation {
  index: number;
  idea_id: string;
  idea_name: string;
  snippet: string;
}

export interface EvolutionSuggestion {
  type: 'refine' | 'create_new' | 'suggested_in_response';
  message?: string;
  affected_idea_ids: string[];
}

export interface ChatResponse {
  text: string;
  citations: ChatCitation[];
  evolution_suggestion?: EvolutionSuggestion;
}

export async function chatWithIdea(
  history: { role: string; text: string }[],
  currentIdea: Idea,
  selectedIdeaIds?: string[]
): Promise<ChatResponse> {
  try {
    const response = await fetch(`${BACKEND_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        history,
        current_idea: currentIdea,
        selected_idea_ids: selectedIdeaIds || [currentIdea.idea_id]
      }),
    });

    if (!response.ok) {
      let errorMsg = `HTTP Error: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.error) errorMsg = errorData.error;
      } catch (e) {
         // Ignore JSON parse error
      }
      throw new Error(errorMsg);
    }

    const data = await response.json();
    return {
      text: data.text,
      citations: data.citations || [],
      evolution_suggestion: data.evolution_suggestion
    };
  } catch (error) {
    console.error("Backend Chat Error:", error);
    throw error;
  }
}

/**
 * Extract keywords from a query for enhanced retrieval
 * @param query The search or chat query
 * @returns High-level and low-level keywords
 */
export async function extractKeywords(query: string): Promise<{
  high_level_keywords: string[];
  low_level_keywords: string[];
}> {
  try {
    const response = await fetch(`${BACKEND_URL}/extract_keywords`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      let errorMsg = `HTTP Error: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.error) errorMsg = errorData.error;
      } catch (e) {
        // Ignore JSON parse error on error response
      }
      throw new Error(errorMsg);
    }

    const data = await response.json();
    return {
      high_level_keywords: data.high_level_keywords || [],
      low_level_keywords: data.low_level_keywords || []
    };
  } catch (error) {
    console.error("Backend Extract Keywords Error:", error);
    throw error;
  }
}

/**
 * Delete an idea from the vector database
 * @param ideaId The ID of the idea to delete
 */
export async function deleteIdea(ideaId: string): Promise<void> {
  try {
    const response = await fetch(`${BACKEND_URL}/delete_idea`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idea_id: ideaId }),
    });

    if (!response.ok) {
      let errorMsg = `HTTP Error: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.error) errorMsg = errorData.error;
      } catch (e) {
        // Ignore JSON parse error on error response
      }
      throw new Error(errorMsg);
    }
  } catch (error) {
    console.error("Backend Delete Idea Error:", error);
    throw error;
  }
}

/**
 * Delete multiple ideas from the vector database in batch
 * @param ideaIds Array of idea IDs to delete
 * @returns Object with deleted count and IDs
 */
export async function deleteIdeasBatch(ideaIds: string[]): Promise<{
  deleted_count: number;
  deleted_ids: string[];
  not_found_ids: string[];
}> {
  try {
    const response = await fetch(`${BACKEND_URL}/delete_ideas_batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idea_ids: ideaIds }),
    });

    if (!response.ok) {
      let errorMsg = `HTTP Error: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.error) errorMsg = errorData.error;
      } catch (e) {
        // Ignore JSON parse error on error response
      }
      throw new Error(errorMsg);
    }

    const data = await response.json();
    return {
      deleted_count: data.deleted_count,
      deleted_ids: data.deleted_ids,
      not_found_ids: data.not_found_ids
    };
  } catch (error) {
    console.error("Backend Batch Delete Ideas Error:", error);
    throw error;
  }
}

/**
 * Clear chat history for a specific idea
 * @param ideaId The ID of the idea whose chat history to clear
 */
export async function clearChatHistory(ideaId: string): Promise<void> {
  try {
    const response = await fetch(`${BACKEND_URL}/clear_chat_history`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idea_id: ideaId }),
    });

    if (!response.ok) {
      let errorMsg = `HTTP Error: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.error) errorMsg = errorData.error;
      } catch (e) {
        // Ignore JSON parse error on error response
      }
      throw new Error(errorMsg);
    }
  } catch (error) {
    console.error("Backend Clear Chat History Error:", error);
    throw error;
  }
}

export async function getAllIdeas(): Promise<Idea[]> {
  try {
    const response = await fetch(`${BACKEND_URL}/get_all_ideas`, {
      method: "GET",
      // Don't set Content-Type for GET requests to avoid CORS preflight
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to fetch ideas (${response.status}):`, errorText);
      throw new Error(`Failed to fetch ideas: ${response.status}`);
    }

    const data = await response.json();
    return data.ideas;
  } catch (error) {
    console.error("Backend Get All Ideas Error:", error);
    throw error;
  }
}

/**
 * Merge multiple ideas into a synthesized concept
 * @param ideaIds Array of idea IDs to merge (minimum 2)
 * @returns The newly created merged idea
 */
export async function mergeIdeas(ideaIds: string[]): Promise<Idea> {
  try {
    const response = await fetch(`${BACKEND_URL}/merge_ideas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idea_ids: ideaIds }),
    });

    if (!response.ok) {
      let errorMsg = `HTTP Error: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.error) errorMsg = errorData.error;
      } catch (e) {
        // Ignore JSON parse error on error response
      }
      throw new Error(errorMsg);
    }

    const data = await response.json();
    return data.merged_idea;
  } catch (error) {
    console.error("Backend Merge Ideas Error:", error);
    throw error;
  }
}

/**
 * Split an idea into 2-5 focused sub-concepts
 * @param ideaId The ID of the idea to split
 * @returns Array of newly created sub-ideas and updated parent info
 */
export async function splitIdea(ideaId: string): Promise<{
  sub_ideas: Idea[];
  updated_parent: {
    child_idea_ids: string[];
    linked_idea_ids: string[];
  };
}> {
  try {
    const response = await fetch(`${BACKEND_URL}/split_idea`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idea_id: ideaId }),
    });

    if (!response.ok) {
      let errorMsg = `HTTP Error: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.error) errorMsg = errorData.error;
      } catch (e) {
        // Ignore JSON parse error on error response
      }
      throw new Error(errorMsg);
    }

    const data = await response.json();
    return {
      sub_ideas: data.sub_ideas,
      updated_parent: data.updated_parent,
    };
  } catch (error) {
    console.error("Backend Split Idea Error:", error);
    throw error;
  }
}

/**
 * Refine an idea with additional context
 * @param ideaId The ID of the idea to refine
 * @param newContext Additional information to integrate
 * @returns The updated refined idea
 */
export async function refineIdea(
  ideaId: string,
  newContext: string
): Promise<Idea> {
  try {
    const response = await fetch(`${BACKEND_URL}/refine_idea`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idea_id: ideaId,
        new_context: newContext,
      }),
    });

    if (!response.ok) {
      let errorMsg = `HTTP Error: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.error) errorMsg = errorData.error;
      } catch (e) {
        // Ignore JSON parse error on error response
      }
      throw new Error(errorMsg);
    }

    const data = await response.json();
    return data.refined_idea;
  } catch (error) {
    console.error("Backend Refine Idea Error:", error);
    throw error;
  }
}

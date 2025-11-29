import { DistilledData, Idea } from "../types";

// Configuration for Backend URL
const BACKEND_URL = "http://localhost:5000/api";

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

export async function chatWithIdea(
  history: { role: string; text: string }[],
  currentIdea: Idea
): Promise<string> {
  try {
    const response = await fetch(`${BACKEND_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        history,
        current_idea: currentIdea
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
    return data.text;
  } catch (error) {
    console.error("Backend Chat Error:", error);
    throw error;
  }
}

export async function getAllIdeas(): Promise<Idea[]> {
  try {
    console.log(`📡 Fetching ideas from ${BACKEND_URL}/get_all_ideas`);
    const response = await fetch(`${BACKEND_URL}/get_all_ideas`, {
      method: "GET",
      // Don't set Content-Type for GET requests to avoid CORS preflight
    });

    console.log(`📡 Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`📡 Error response:`, errorText);
      throw new Error(`Failed to fetch ideas: ${response.status}`);
    }

    const data = await response.json();
    console.log(`📡 Received data:`, data);
    return data.ideas;
  } catch (error) {
    console.error("❌ Backend Get All Ideas Error:", error);
    throw error;
  }
}

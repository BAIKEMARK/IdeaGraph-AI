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
        currentIdea
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

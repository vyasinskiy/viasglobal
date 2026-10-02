import {
  Word,
  Language,
  Tag,
  CreateWordRequest,
  UpdateWordRequest,
  CheckAnswerRequest,
  CheckAnswerResponse,
  ApiResponse,
  Stats,
  StudyWordResponse,
  ClearAnswersResponse,
  TodayCorrectWord,
} from "@/lib/types";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    ...options,
  });

  const json = (await response.json()) as ApiResponse<T>;

  if (!response.ok || json.success === false) {
    const error = new Error(json.error || `Request failed with status ${response.status}`);
    (error as Error & { response: { data: ApiResponse<T> } }).response = {
      data: json,
    };
    throw error;
  }

  return json.data as T;
}

export interface ApiError<T = unknown> extends Error {
  response?: { data: ApiResponse<T> };
}

export const languagesApi = {
  getAll: async (): Promise<Language[]> => {
    const data = await request<Language[]>("/api/languages");
    return data || [];
  },

  create: async (code: string, name: string): Promise<Language> => {
    return request<Language>("/api/languages", {
      method: "POST",
      body: JSON.stringify({ code, name }),
    });
  },
};

export const tagsApi = {
  getAll: async (languageId?: number): Promise<Tag[]> => {
    const params = new URLSearchParams();
    if (languageId) params.set("languageId", String(languageId));
    const data = await request<Tag[]>(`/api/tags?${params.toString()}`);
    return data || [];
  },

  create: async (languageId: number, name: string): Promise<Tag> => {
    return request<Tag>("/api/tags", {
      method: "POST",
      body: JSON.stringify({ languageId, name }),
    });
  },
};

export const wordsApi = {
  getAll: async (languageId?: number, tagId?: number): Promise<Word[]> => {
    const params = new URLSearchParams();
    if (languageId) params.set("languageId", String(languageId));
    if (tagId) params.set("tagId", String(tagId));
    const data = await request<Word[]>(`/api/words?${params.toString()}`);
    return data || [];
  },

  getById: async (id: number): Promise<Word> => {
    return request<Word>(`/api/words/${id}`);
  },

  getStudyWord: async (
    favoriteOnly: boolean = false,
    excludeId?: number,
    languageId?: number,
    tagId?: number
  ): Promise<StudyWordResponse> => {
    const params = new URLSearchParams();
    params.set("favoriteOnly", String(favoriteOnly));
    if (excludeId) params.set("excludeId", String(excludeId));
    if (languageId) params.set("languageId", String(languageId));
    if (tagId) params.set("tagId", String(tagId));

    try {
      return await request<StudyWordResponse>(`/api/words/study?${params.toString()}`);
    } catch (err: unknown) {
      const error = err as ApiError;
      if (error?.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw err;
    }
  },

  getFavorites: async (languageId?: number, tagId?: number): Promise<Word[]> => {
    const params = new URLSearchParams();
    if (languageId) params.set("languageId", String(languageId));
    if (tagId) params.set("tagId", String(tagId));
    const data = await request<Word[]>(`/api/words/favorites?${params.toString()}`);
    return data || [];
  },

  create: async (wordData: CreateWordRequest): Promise<Word> => {
    return request<Word>("/api/words", {
      method: "POST",
      body: JSON.stringify(wordData),
    });
  },

  update: async (id: number, wordData: UpdateWordRequest): Promise<Word> => {
    return request<Word>(`/api/words/${id}`, {
      method: "PUT",
      body: JSON.stringify(wordData),
    });
  },

  delete: async (id: number): Promise<void> => {
    await request<Record<string, never>>(`/api/words/${id}`, { method: "DELETE" });
  },

  toggleFavorite: async (id: number): Promise<Word> => {
    return request<Word>(`/api/words/${id}/favorite`, { method: "PATCH" });
  },
};

export const answersApi = {
  checkAnswer: async (answerData: CheckAnswerRequest): Promise<CheckAnswerResponse> => {
    return request<CheckAnswerResponse>("/api/answers/check", {
      method: "POST",
      body: JSON.stringify(answerData),
    });
  },

  getStats: async (languageId?: number): Promise<Stats> => {
    const params = new URLSearchParams();
    if (languageId) params.set("languageId", String(languageId));
    return request<Stats>(`/api/answers/stats?${params.toString()}`);
  },

  getTodayCorrectWords: async (languageId?: number): Promise<TodayCorrectWord[]> => {
    const params = new URLSearchParams();
    if (languageId) params.set("languageId", String(languageId));
    const data = await request<TodayCorrectWord[]>(
      `/api/answers/today-correct-words?${params.toString()}`
    );
    return data || [];
  },

  clearAll: async (): Promise<ClearAnswersResponse> => {
    return request<ClearAnswersResponse>("/api/answers", { method: "DELETE" });
  },
}
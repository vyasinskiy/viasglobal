import axios from 'axios';
import { 
  Word, 
  Language,
  CreateWordRequest, 
  UpdateWordRequest, 
  CheckAnswerRequest, 
  CheckAnswerResponse, 
  ApiResponse, 
  Stats, 
  StudyWordResponse,
  ClearAnswersResponse,
  TodayCorrectWord,
} from '../types';

const API_BASE_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Languages API
export const languagesApi = {
  getAll: async (): Promise<Language[]> => {
    const response = await api.get<ApiResponse<Language[]>>('/languages');
    if (!response.data.success) {
      throw new Error(response.data.error);
    }
    return response.data.data || [];
  },

  create: async (code: string, name: string): Promise<Language> => {
    const response = await api.post<ApiResponse<Language>>('/languages', { code, name });
    if (!response.data.success) {
      throw new Error(response.data.error);
    }
    return response.data.data!;
  },
};

// Words API
export const wordsApi = {
  getAll: async (languageId?: number): Promise<Word[]> => {
    const params = new URLSearchParams();
    if (languageId) params.set('languageId', String(languageId));
    const response = await api.get<ApiResponse<Word[]>>(`/words?${params.toString()}`);
    return response.data.data || [];
  },

  getById: async (id: number): Promise<Word> => {
    const response = await api.get<ApiResponse<Word>>(`/words/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.error);
    }
    return response.data.data!;
  },

  getStudyWord: async (favoriteOnly: boolean = false, excludeId?: number, languageId?: number): Promise<StudyWordResponse> => {
    const params = new URLSearchParams();
    params.set('favoriteOnly', String(favoriteOnly));
    if (excludeId) params.set('excludeId', String(excludeId));
    if (languageId) params.set('languageId', String(languageId));

    let response;
    try {
      response = await api.get<ApiResponse<StudyWordResponse>>(`/words/study?${params.toString()}`);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        throw new Error(err.response.data.error);
      }
      throw err;
    }

    if (!response.data.success) {
      throw new Error(response.data.error);
    }
    return response.data.data!;
  },

  getFavorites: async (languageId?: number): Promise<Word[]> => {
    const params = new URLSearchParams();
    if (languageId) params.set('languageId', String(languageId));
    const response = await api.get<ApiResponse<Word[]>>(`/words/favorites?${params.toString()}`);
    return response.data.data || [];
  },

  create: async (wordData: CreateWordRequest): Promise<Word> => {
    const response = await api.post<ApiResponse<Word>>('/words', wordData);
    if (!response.data.success) {
      throw new Error(response.data.error);
    }
    return response.data.data!;
  },

  update: async (id: number, wordData: UpdateWordRequest): Promise<Word> => {
    const response = await api.put<ApiResponse<Word>>(`/words/${id}`, wordData);
    if (!response.data.success) {
      throw new Error(response.data.error);
    }
    return response.data.data!;
  },

  delete: async (id: number): Promise<void> => {
    const response = await api.delete<ApiResponse<{}>>(`/words/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.error);
    }
  },

  toggleFavorite: async (id: number): Promise<Word> => {
    const response = await api.patch<ApiResponse<Word>>(`/words/${id}/favorite`);
    if (!response.data.success) {
      throw new Error(response.data.error);
    }
    return response.data.data!;
  },
};

// Answers API
export const answersApi = {
  checkAnswer: async (answerData: CheckAnswerRequest): Promise<CheckAnswerResponse> => {
    const response = await api.post<ApiResponse<CheckAnswerResponse>>('/answers/check', answerData);
    if (!response.data.success) {
      throw new Error(response.data.error);
    }
    return response.data.data!;
  },

  getStats: async (languageId?: number): Promise<Stats> => {
    const params = new URLSearchParams();
    if (languageId) params.set('languageId', String(languageId));
    const response = await api.get<ApiResponse<Stats>>(`/answers/stats?${params.toString()}`);
    if (!response.data.success) {
      throw new Error(response.data.error);
    }
    return response.data.data!;
  },

  getTodayCorrectWords: async (languageId?: number): Promise<TodayCorrectWord[]> => {
    const params = new URLSearchParams();
    if (languageId) params.set('languageId', String(languageId));
    const response = await api.get<ApiResponse<TodayCorrectWord[]>>(`/answers/today-correct-words?${params.toString()}`);
    if (!response.data.success) {
      throw new Error(response.data.error);
    }
    return response.data.data || [];
  },

  clearAll: async (): Promise<ClearAnswersResponse> => {
    const response = await api.delete<ApiResponse<ClearAnswersResponse>>('/answers');
    if (!response.data.success) {
      throw new Error(response.data.error);
    }
    return response.data.data!;
  },
};

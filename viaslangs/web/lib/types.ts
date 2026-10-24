export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface Language {
  id: number;
  code: string;
  name: string;
}

export interface Tag {
  id: number;
  languageId: number;
  name: string;
  createdAt: string;
  wordCount?: number;
}

export interface Word {
  id: number;
  languageId: number;
  english: string;
  russian: string;
  exampleEn: string;
  exampleRu: string;
  baseWordId?: number | null;
  createdAt: string;
  updatedAt: string;
  isFavorite: boolean;
  tagIds: number[];
}

export interface StudyWordResponse {
  word: Word;
  unlearnedCount: number;
}

export interface Answer {
  id: number;
  wordId: number;
  answer: string;
  isCorrect: boolean;
  isSynonym: boolean;
  createdAt: string;
}

export interface CreateWordRequest {
  languageId?: number;
  english: string;
  russian: string;
  exampleEn: string;
  exampleRu: string;
  baseWordId?: number | null;
  tagIds?: number[];
}

export interface UpdateWordRequest {
  languageId?: number;
  english?: string;
  russian?: string;
  exampleEn?: string;
  exampleRu?: string;
  baseWordId?: number | null;
  isFavorite?: boolean;
  tagIds?: number[];
}

export interface CheckAnswerRequest {
  wordId: number;
  answer: string;
}

export interface CheckAnswerResponse {
  isCorrect: boolean;
  isPartial: boolean;
  hint?: string;
  isSynonym?: boolean;
  correctAnswer: string;
  todayCorrectAnswers: number;
  totalCorrectAnswers: number;
  totalWords: number;
}

export interface ClearAnswersResponse {
  deletedCount: number;
}

export interface TodayCorrectWord {
  english: string;
  russian: string;
  exampleEn: string;
  exampleRu: string;
}

export interface Stats {
  totalAnswers: number;
  correctAnswers: number;
  accuracy: number;
  totalWords: number;
  learnedWords: number;
  favoriteWords: number;
}

export type ActivityType = 'NEXT' | 'ANSWER_CORRECT' | 'ANSWER_ERROR';

export interface RecordActivityRequest {
  languageId?: number;
  wordId?: number;
  activityType: ActivityType;
  userAnswer?: string;
}

export interface TagStat {
  tag: string;
  errors: number;
  correct: number;
  total: number;
  errorRate: number;
}

export interface FormStat {
  person: string;
  label: string;
  errors: number;
  correct: number;
}

export interface WeakWord {
  wordId: number;
  english: string;
  russian: string;
  tense: string | null;
  person: string;
  personLabel: string;
  errorsCount: number;
}

export interface TodaySessionStats {
  sessionId: number;
  date: string;
  languageId: number;
  languageCode: string;
  summary: {
    totalActivities: number;
    nextClicks: number;
    correctAnswers: number;
    errorAnswers: number;
    accuracy: number;
  };
  tagStats: TagStat[];
  formStats: FormStat[];
  weakWords: WeakWord[];
  recommendation: string;
}

export interface DailySessionSummary {
  date: string;
  totalActivities: number;
  nextClicks: number;
  correctAnswers: number;
  errorAnswers: number;
  accuracy: number;
}

export interface SessionsHistory {
  daysCount: number;
  averageDailyActivities: number;
  medianDailyActivities: number;
  todayActivities: number;
  isBelowMedian: boolean;
  shouldRemind: boolean;
  trend: 'STABLE' | 'GROWING' | 'DROPPING' | 'INACTIVE';
  alert: string | null;
  praise: string | null;
  dailySessions: DailySessionSummary[];
}
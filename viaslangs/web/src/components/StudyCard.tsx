'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Skeleton,
  useMediaQuery,
} from '@mui/material';
import {
  Favorite,
  FavoriteBorder,
  CheckCircle,
  Error as ErrorIcon,
  Info,
  Edit,
  Delete,
} from '@mui/icons-material';
import { Word, CheckAnswerResponse, UpdateWordRequest } from '../../lib/types';
import { wordsApi, answersApi, sessionsApi } from '../services/api';
import { useTheme } from '@mui/material/styles';

interface StudyCardProps {
  onWordCompleted: () => void;
  favoriteOnly?: boolean;
  languageId?: number;
  tagId?: number;
}

export const StudyCard: React.FC<StudyCardProps> = ({
  onWordCompleted,
  favoriteOnly = false,
  languageId,
  tagId,
}) => {
  const theme = useTheme();
  const [mounted, setMounted] = useState(false);
  const mediaQueryMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isMobile = mounted && mediaQueryMobile;
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [shouldFocusInput, setShouldFocusInput] = useState(false);
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const currentWordRef = useRef<Word | null>(null);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<CheckAnswerResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExampleRevealed, setIsExampleRevealed] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [todayCorrectAnswers, setTodayCorrectAnswers] = useState(0);
  const [totalCorrectAnswers, setTotalCorrectAnswers] = useState(0);
  const [totalWords, setTotalWords] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState<UpdateWordRequest>({
    english: '',
    russian: '',
    exampleEn: '',
    exampleRu: '',
  });
  const [enteredSynonyms, setEnteredSynonyms] = useState<string[]>([]);
  const autoAdvanceTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    currentWordRef.current = currentWord;
  }, [currentWord]);

  const loadNextWord = useCallback(async (excludeCurrent: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      const studyWordResponse = await wordsApi.getStudyWord(
        favoriteOnly,
        excludeCurrent && currentWordRef.current ? currentWordRef.current.id : undefined,
        languageId,
        tagId
      );
      setCurrentWord(studyWordResponse.word);
      setAnswer('');
      setResult(null);
      setIsExampleRevealed(false);
      setIsAnswerRevealed(false);
      setShouldFocusInput(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      if (message === 'No words available for study') {
        setCurrentWord(null);
        setError(null);
      } else {
        setError('Failed to load word');
      }
    } finally {
      setLoading(false);
    }
  }, [favoriteOnly, languageId, tagId]);

  useEffect(() => {
    if (shouldFocusInput) {
      setShouldFocusInput(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }, [shouldFocusInput, currentWord]);

  useEffect(() => {
    loadNextWord();
  }, [favoriteOnly, languageId, loadNextWord]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWord || !answer.trim()) return;

    try {
      setLoading(true);
      const result = await answersApi.checkAnswer({
        wordId: currentWord.id,
        answer: answer.trim(),
      });
      setResult(result);
      setTodayCorrectAnswers(result.todayCorrectAnswers);
      setTotalCorrectAnswers(result.totalCorrectAnswers);
      setTotalWords(result.totalWords);
      if (result.isCorrect || result.isSynonym) {
        setSnackbarOpen(true);
      }
      if (result.isSynonym) {
        setEnteredSynonyms((prev) => [...prev, answer]);
        setAnswer('');
        setShouldFocusInput(true);
      }
      if (result.isCorrect) {
        setEnteredSynonyms([]);
        if (autoAdvanceTimeoutRef.current) {
          window.clearTimeout(autoAdvanceTimeoutRef.current);
          autoAdvanceTimeoutRef.current = null;
        }
          autoAdvanceTimeoutRef.current = window.setTimeout(() => {
          onWordCompleted();
          loadNextWord();
          autoAdvanceTimeoutRef.current = null;
        }, 2000);
      }
    } catch (err: unknown) {
      setError('Failed to check answer');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!currentWord) return;

    try {
      const updatedWord = await wordsApi.toggleFavorite(currentWord.id);
      setCurrentWord(updatedWord);
    } catch (err: unknown) {
      setError('Failed to toggle favorite');
    }
  };

  const handleEditOpen = () => {
    if (!currentWord) return;
    setFormData({
      english: currentWord.english,
      russian: currentWord.russian,
      exampleEn: currentWord.exampleEn,
      exampleRu: currentWord.exampleRu,
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!currentWord) return;

    try {
      await wordsApi.update(currentWord.id, formData);
      setEditDialogOpen(false);
      if (autoAdvanceTimeoutRef.current) {
        window.clearTimeout(autoAdvanceTimeoutRef.current);
        autoAdvanceTimeoutRef.current = null;
      }
      loadNextWord(true);
    } catch (err: unknown) {
      setError('Failed to save word');
    }
  };

  // Обработчик удаления текущего слова
  const handleDeleteWord = async () => {
    if (!currentWord) return;
    // Запрашиваем подтверждение у пользователя перед безвозвратным удалением слова
    if (!window.confirm(`Are you sure you want to delete "${currentWord.english}"?`)) return;

    try {
      setLoading(true);
      // Вызываем API для удаления слова из базы данных
      await wordsApi.delete(currentWord.id);
      // Закрываем модальное окно редактирования, если оно было открыто
      setEditDialogOpen(false);
      // Сбрасываем таймер автоперехода, если он был активен
      if (autoAdvanceTimeoutRef.current) {
        window.clearTimeout(autoAdvanceTimeoutRef.current);
        autoAdvanceTimeoutRef.current = null;
      }
      // Оповещаем родительский компонент об изменении прогресса
      onWordCompleted();
      // Загружаем следующее доступное слово для изучения
      loadNextWord(true);
    } catch (err: unknown) {
      setError('Failed to delete word');
    } finally {
      setLoading(false);
    }
  };

  const handleRevealExample = () => {
    if (!isExampleRevealed) {
      setIsExampleRevealed(true);
    }
  };

  if (loading && !currentWord) {
    return (
      <Card sx={{ width: '100%', maxWidth: 800, textAlign: 'center', p: { xs: 2, sm: 4 } }}>
        <Skeleton variant="text" width="55%" sx={{ fontSize: '1.5rem', mb: 2 }} />
        <Skeleton variant="text" width="40%" sx={{ mb: 3 }} />
        <Skeleton variant="text" width="100%" sx={{ mb: 1 }} />
        <Skeleton variant="text" width="100%" sx={{ mb: 3 }} />
        <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 1, mb: 2 }} />
        <Box display="flex" justifyContent="center" gap={1}>
          <Skeleton variant="rectangular" width={140} height={40} sx={{ borderRadius: '20px' }} />
          <Skeleton variant="rectangular" width={160} height={40} sx={{ borderRadius: '20px' }} />
        </Box>
      </Card>
    );
  }

  if (error && !currentWord) {
    return (
      <Card sx={{ width: '100%', maxWidth: 800, textAlign: 'center', p: { xs: 2, sm: 4 } }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => loadNextWord()}>
          Try Again
        </Button>
      </Card>
    );
  }

  if (!currentWord) {
    return (
      <Card sx={{ width: '100%', maxWidth: 800, textAlign: 'center', p: { xs: 2, sm: 4 } }}>
        <Typography variant="h6" gutterBottom>
          No words available for study
        </Typography>
        <Typography color="text.secondary">
          {favoriteOnly
            ? 'Add some words to favorites to study them'
            : 'Add some words to start studying'
          }
        </Typography>
      </Card>
    );
  }

  return (
    <>
      <Card sx={{ width: '100%', maxWidth: 800, mx: 'auto' }}>
        {/* Адаптивные отступы карточки слова */}
        <CardContent sx={{ p: { xs: 2, sm: 3 }, '&:last-child': { pb: { xs: 2, sm: 3 } } }}>
          {/* Заголовок карточки: перевод на русский и кнопки избранного/редактирования/удаления */}
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2} gap={1}>
            <Typography
              variant="h5"
              component="div"
              sx={{
                fontSize: { xs: '1.25rem', sm: '1.5rem' },
                fontWeight: 700,
                wordBreak: 'break-word',
                flex: 1,
                lineHeight: 1.25,
              }}
            >
              {currentWord.russian?.[0].toUpperCase() + currentWord.russian.slice(1)}
            </Typography>
            <Box display="flex" alignItems="center" sx={{ flexShrink: 0 }}>
              <Tooltip title={currentWord.isFavorite ? 'Remove from favorites' : 'Add to favorites'}>
                <IconButton onClick={handleToggleFavorite} color="primary" size={isMobile ? 'small' : 'medium'}>
                  {currentWord.isFavorite ? <Favorite fontSize={isMobile ? 'small' : 'medium'} /> : <FavoriteBorder fontSize={isMobile ? 'small' : 'medium'} />}
                </IconButton>
              </Tooltip>
              <Tooltip title="Edit word">
                <IconButton onClick={handleEditOpen} color="primary" size={isMobile ? 'small' : 'medium'}>
                  <Edit fontSize={isMobile ? 'small' : 'medium'} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete word">
                <IconButton onClick={handleDeleteWord} color="error" size={isMobile ? 'small' : 'medium'}>
                  <Delete fontSize={isMobile ? 'small' : 'medium'} />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Пример предложения на русском */}
          <Box mb={2}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
              Example in Russian:
            </Typography>
            <Typography variant="body1" sx={{ fontStyle: 'italic', fontSize: { xs: '0.9rem', sm: '1rem' } }}>
              {currentWord.exampleRu}
            </Typography>
          </Box>

          {/* Пример предложения на изучаемом языке с блюром до клика */}
          <Box mb={2.5}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                Example in target language:
              </Typography>
              {!isExampleRevealed && (
                <Chip
                  size="small"
                  label="Tap to reveal"
                  color="primary"
                  onClick={handleRevealExample}
                  sx={{ height: 22, fontSize: '0.72rem', cursor: 'pointer' }}
                />
              )}
            </Box>
            <Box
              onClick={handleRevealExample}
              sx={{
                position: 'relative',
                cursor: isExampleRevealed ? 'default' : 'pointer',
                userSelect: isExampleRevealed ? 'text' : 'none',
                p: 1.25,
                borderRadius: 1,
                bgcolor: 'rgba(30, 41, 59, 0.4)',
                border: '1px solid rgba(148, 163, 184, 0.1)',
              }}
            >
              <Typography
                variant="body1"
                sx={{
                  fontStyle: 'italic',
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                  filter: isExampleRevealed ? 'none' : 'blur(6px)',
                  transition: 'filter 0.2s ease',
                }}
              >
                {currentWord.exampleEn}
              </Typography>
            </Box>
          </Box>

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Enter word in the selected language"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              disabled={loading || result?.isCorrect || isAnswerRevealed}
              inputRef={inputRef}
              sx={{ mb: 2 }}
              autoComplete="off"
            />

            {isAnswerRevealed && (
              <Box mb={1.5}>
                <Alert icon={<CheckCircle />} severity="info">
                  Correct answer: <strong>{currentWord.english}</strong>
                </Alert>
              </Box>
            )}

            {isExampleRevealed && (
              <Box mb={1.5}>
                <Alert icon={<Info />} severity="info">
                  Example revealed.
                </Alert>
              </Box>
            )}

            {result && (
              <Box mb={2}>
                {result.isCorrect ? (
                  <Alert icon={<CheckCircle />} severity="success">
                    Correct! Well done!
                  </Alert>
                ) : result.isSynonym ? (
                  <Alert icon={<Info />} severity="info">
                    This is synonym, try another word. Entered synonyms:<br></br>
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      {enteredSynonyms.map((syn, idx) => (
                        <li key={idx}><strong>{syn}</strong></li>
                      ))}
                    </ul>
                  </Alert>
                ) : result.isPartial ? (
                  <Alert icon={<Info />} severity="info">
                    {result.hint}
                  </Alert>
                ) : (
                  <Alert icon={<ErrorIcon />} severity="error">
                    Incorrect. The correct answer is: <strong>{result.correctAnswer}</strong>
                  </Alert>
                )}
              </Box>
            )}

            {/* Блок кнопок управления: главная кнопка проверки + вспомогательные действия */}
            <Box
              sx={{
                mt: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 1.25,
              }}
            >
              {/* Главная кнопка проверки ответа */}
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={
                  loading ||
                  !answer.trim() ||
                  result?.isCorrect ||
                  isAnswerRevealed ||
                  Boolean(result && !result.isCorrect && !result.isPartial && !result.isSynonym)
                }
                sx={{
                  minHeight: 46,
                  fontSize: { xs: '0.95rem', sm: '1rem' },
                  fontWeight: 700,
                  borderRadius: '12px',
                  '&.Mui-disabled': {
                    color: 'rgba(244, 246, 248, 0.85)',
                    backgroundColor: 'rgba(148, 163, 184, 0.2)',
                  },
                }}
              >
                {loading ? 'Checking...' : 'Check Answer'}
              </Button>

              {/* Вспомогательные действия: Показать ответ и Далее */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  type="button"
                  variant="outlined"
                  fullWidth
                  onClick={() => setIsAnswerRevealed(true)}
                  disabled={
                    isAnswerRevealed || Boolean(
                      result && !result.isCorrect && !result.isPartial && !result.isSynonym
                    )
                  }
                  sx={{
                    minHeight: 40,
                    borderRadius: '10px',
                    fontSize: { xs: '0.85rem', sm: '0.9rem' },
                    '&.Mui-disabled': {
                      color: 'rgba(244, 246, 248, 0.5)',
                      borderColor: 'rgba(148, 163, 184, 0.2)',
                    },
                  }}
                >
                  Show Answer
                </Button>

                <Button
                  type="button"
                  variant="outlined"
                  fullWidth
                  disabled={loading}
                  onClick={() => {
                    // Фиксируем клик на кнопку Next в текущем сессионном дне
                    if (currentWord) {
                      sessionsApi.recordActivity({
                        languageId: languageId || currentWord.languageId,
                        wordId: currentWord.id,
                        activityType: 'NEXT',
                      }).catch((err) => console.warn('Не удалось зафиксировать клик Next:', err));
                    }

                    setEnteredSynonyms([]);
                    if (autoAdvanceTimeoutRef.current) {
                      window.clearTimeout(autoAdvanceTimeoutRef.current);
                      autoAdvanceTimeoutRef.current = null;
                    }
                    if (result?.isCorrect) {
                      onWordCompleted();
                    }
                    loadNextWord(true);
                  }}
                  sx={{
                    minHeight: 40,
                    borderRadius: '10px',
                    fontSize: { xs: '0.85rem', sm: '0.9rem' },
                    '&.Mui-disabled': {
                      color: 'rgba(244, 246, 248, 0.85)',
                    },
                  }}
                >
                  Next
                </Button>
              </Box>
            </Box>
          </form>
        </CardContent>
      </Card>
      {/* Снекбар прогресса (центрирован на мобильных экранах) */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: isMobile ? 'center' : 'right' }}
        sx={{
          bottom: { xs: 16, sm: 24 },
          left: isMobile ? 16 : 'auto',
          right: isMobile ? 16 : 24,
        }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity="info" sx={{ width: '100%' }}>
          <Box sx={{ width: '100%' }}>
            <Typography variant="body2">
              Correct answers today: {todayCorrectAnswers}
            </Typography>
          </Box>
          <br></br>
          <Box sx={{ width: '100%' }}>
            <Typography variant="body2">
              Total progress:
              <LinearProgress
                variant="determinate"
                value={totalCorrectAnswers && totalWords ? (totalCorrectAnswers / totalWords) * 100 : 0}
                sx={{ mt: 1 }}
              />
            </Typography>
          </Box>
        </Alert>
      </Snackbar>

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Word</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Word"
            value={formData.english}
            onChange={(e) => setFormData({ ...formData, english: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Translation (Russian)"
            value={formData.russian}
            onChange={(e) => setFormData({ ...formData, russian: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Example"
            value={formData.exampleEn}
            onChange={(e) => setFormData({ ...formData, exampleEn: e.target.value })}
            margin="normal"
            multiline
            rows={2}
          />
          <TextField
            fullWidth
            label="Example (Russian)"
            value={formData.exampleRu}
            onChange={(e) => setFormData({ ...formData, exampleRu: e.target.value })}
            margin="normal"
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
          <Button
            onClick={handleDeleteWord}
            color="error"
            startIcon={<Delete />}
          >
            Delete
          </Button>
          <Box>
            <Button onClick={() => setEditDialogOpen(false)} sx={{ mr: 1 }}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} variant="contained">
              Save
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </>
  );
};

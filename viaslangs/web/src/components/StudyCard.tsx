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
} from '@mui/icons-material';
import { Word, CheckAnswerResponse, UpdateWordRequest } from '../../lib/types';
import { wordsApi, answersApi } from '../services/api';
import { useTheme } from '@mui/material/styles';

interface StudyCardProps {
  onWordCompleted: () => void;
  favoriteOnly?: boolean;
  languageId?: number;
}

export const StudyCard: React.FC<StudyCardProps> = ({
  onWordCompleted,
  favoriteOnly = false,
  languageId
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
        languageId
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
  }, [favoriteOnly, languageId]);

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

  const handleRevealExample = () => {
    if (!isExampleRevealed) {
      setIsExampleRevealed(true);
    }
  };

  if (loading && !currentWord) {
    return (
      <Card sx={{ width: { xs: '100%', sm: 800 }, textAlign: 'center', p: 4 }}>
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
      <Card sx={{ width: { xs: '100%', sm: 800 }, textAlign: 'center', p: 4 }}>
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
      <Card sx={{ width: { xs: '100%', sm: 800 }, textAlign: 'center', p: 4 }}>
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
      <Card sx={{ width: { xs: '100%', sm: 800 } }}>
        <CardContent sx={{ paddingTop: isMobile ? 0 : 1, paddingBottom: isMobile ? '14px !important' : 1 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h5" component="div">
              {currentWord.russian?.[0].toUpperCase() + currentWord.russian.slice(1)}
            </Typography>
            <Box display="flex" alignItems="center">
              <Tooltip title={currentWord.isFavorite ? 'Remove from favorites' : 'Add to favorites'}>
                <IconButton onClick={handleToggleFavorite} color="primary">
                  {currentWord.isFavorite ? <Favorite /> : <FavoriteBorder />}
                </IconButton>
              </Tooltip>
              <Tooltip title="Edit word">
                <IconButton onClick={handleEditOpen} color="primary">
                  <Edit />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          <Box mb={3}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Example in Russian:
            </Typography>
            <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
              {currentWord.exampleRu}
            </Typography>
          </Box>

          <Box mb={3}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Example in target language:
            </Typography>
            <Box
              onClick={handleRevealExample}
              sx={{
                position: 'relative',
                cursor: isExampleRevealed ? 'default' : 'pointer',
                userSelect: isExampleRevealed ? 'text' : 'none',
              }}
            >
              <Typography
                variant="body1"
                sx={{
                  fontStyle: 'italic',
                  filter: isExampleRevealed ? 'none' : 'blur(6px)',
                  transition: 'filter 0.2s ease',
                }}
              >
                {currentWord.exampleEn}
              </Typography>
              {!isExampleRevealed && (
                <Chip
                  size="small"
                  label="Click to reveal"
                  color="primary"
                  sx={{ position: 'absolute', top: -8, right: 0 }}
                />
              )}
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
              <Box mb={1}>
                <Alert icon={<CheckCircle />} severity="info">
                  Correct answer: <strong>{currentWord.english}</strong>
                </Alert>
              </Box>
            )}

            {isExampleRevealed && (
              <Box mb={2}>
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

            <Box
              sx={{
                mt: isMobile ? 0 : 2,
                display: 'flex',
                flexDirection: isMobile ? 'row' : 'column',
                gap: 1,
              }}
            >
              <Button
                type="button"
                variant="text"
                fullWidth={!isMobile}
                onClick={() => setIsAnswerRevealed(true)}
                disabled={
                  isAnswerRevealed || Boolean(
                    result && !result.isCorrect && !result.isPartial && !result.isSynonym
                  )
                }
                sx={{
                  ...(isMobile ? { flex: 1 } : undefined),
                  '&.Mui-disabled': {
                    color: 'rgba(244, 246, 248, 0.85)',
                    backgroundColor: 'rgba(148, 163, 184, 0.2)',
                  },
                }}
              >
                Show Answer
              </Button>

              <Button
                type="submit"
                variant="contained"
                fullWidth={!isMobile}
                disabled={
                  loading ||
                  !answer.trim() ||
                  result?.isCorrect ||
                  isAnswerRevealed ||
                  Boolean(result && !result.isCorrect && !result.isPartial && !result.isSynonym)
                }
                sx={{
                  ...(isMobile ? { flex: 1 } : undefined),
                  '&.Mui-disabled': {
                    color: 'rgba(244, 246, 248, 0.85)',
                    backgroundColor: 'rgba(148, 163, 184, 0.2)',
                  },
                }}
              >
                {loading ? 'Checking...' : 'Check Answer'}
              </Button>

              <Button
                type="button"
                variant="text"
                fullWidth={!isMobile}
                disabled={loading}
                onClick={() => {
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
                  ...(isMobile ? { flex: 1 } : undefined),
                  '&.Mui-disabled': {
                    color: 'rgba(244, 246, 248, 0.85)',
                  },
                }}
              >
                Next
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
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
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Alert,
  Typography,
  Skeleton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  Chip,
} from '@mui/material';
import {
  Edit,
  Delete,
  Favorite,
  FavoriteBorder,
  Add,
} from '@mui/icons-material';
import { Word, Tag, CreateWordRequest } from '../../lib/types';
import { wordsApi } from '../services/api';

interface WordListProps {
  onWordUpdated: () => void;
  languageId?: number;
  tagId?: number;
  tags?: Tag[];
}

export const WordList: React.FC<WordListProps> = ({ onWordUpdated, languageId, tagId, tags = [] }) => {
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<Word | null>(null);
  const [formData, setFormData] = useState<CreateWordRequest>({
    english: '',
    russian: '',
    exampleEn: '',
    exampleRu: '',
  });
  const [formTagId, setFormTagId] = useState<number | undefined>(undefined);

  const loadWords = useCallback(async () => {
    try {
      setLoading(true);
      const wordsData = await wordsApi.getAll(languageId, tagId);
      setWords(wordsData);
    } catch (err: unknown) {
      setError('Failed to load words');
    } finally {
      setLoading(false);
    }
  }, [languageId, tagId]);

  useEffect(() => {
    loadWords();
  }, [loadWords]);

  const handleEdit = (word: Word) => {
    setEditingWord(word);
    setFormData({
      english: word.english,
      russian: word.russian,
      exampleEn: word.exampleEn,
      exampleRu: word.exampleRu,
    });
    setFormTagId(word.tagIds?.[0]);
    setEditDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingWord(null);
    setFormData({
      english: '',
      russian: '',
      exampleEn: '',
      exampleRu: '',
    });
    setFormTagId(undefined);
    setAddDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const tagIds = formTagId ? [formTagId] : [];
      if (editingWord) {
        await wordsApi.update(editingWord.id, { ...formData, tagIds });
      } else {
        await wordsApi.create({ ...formData, languageId, tagIds });
      }
      
      setEditDialogOpen(false);
      setAddDialogOpen(false);
      loadWords();
      onWordUpdated();
    } catch (err: unknown) {
      setError('Failed to save word');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this word?')) return;
    
    try {
      await wordsApi.delete(id);
      loadWords();
      onWordUpdated();
    } catch (err: unknown) {
      setError('Failed to delete word');
    }
  };

  const handleToggleFavorite = async (id: number) => {
    try {
      await wordsApi.toggleFavorite(id);
      loadWords();
      onWordUpdated();
    } catch (err: unknown) {
      setError('Failed to toggle favorite');
    }
  };

  if (loading) {
    return (
      <Paper>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Skeleton variant="text" width={200} sx={{ fontSize: '1.25rem' }} />
          <Skeleton variant="rectangular" width={120} height={40} sx={{ borderRadius: '20px' }} />
        </Box>
        <Skeleton variant="rectangular" height={48} sx={{ mb: 1, borderRadius: 1 }} />
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} variant="rectangular" height={56} sx={{ mb: 1, borderRadius: 1 }} />
        ))}
      </Paper>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Шапка списка слов с кнопкой добавления */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
        gap={1}
      >
        <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' }, fontWeight: 700 }}>
          Words List ({words.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAdd}
          size="small"
          sx={{ borderRadius: '10px', px: { xs: 1.5, sm: 2 } }}
        >
          Add Word
        </Button>
      </Box>

      {/* Мобильный вид (карточки слов) для экранов xs и sm */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
        {words.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">No words found</Typography>
          </Paper>
        ) : (
          words.map((word) => (
            <Card
              key={word.id}
              sx={{
                p: 2,
                borderRadius: '12px',
                border: '1px solid rgba(148, 163, 184, 0.15)',
                bgcolor: 'rgba(30, 41, 59, 0.6)',
              }}
            >
              {/* Строка с изучаемым словом, переводом и кнопками действий */}
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1} gap={1}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ color: 'primary.light', lineHeight: 1.25 }}>
                    {word.english}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                    {word.russian}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" sx={{ flexShrink: 0 }}>
                  <Tooltip title={word.isFavorite ? 'Remove from favorites' : 'Add to favorites'}>
                    <IconButton size="small" onClick={() => handleToggleFavorite(word.id)}>
                      {word.isFavorite ? <Favorite color="primary" fontSize="small" /> : <FavoriteBorder fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => handleEdit(word)}>
                      <Edit fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" onClick={() => handleDelete(word.id)} color="error">
                      <Delete fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              {/* Теги слова (паки) */}
              {word.tagIds && word.tagIds.length > 0 && (
                <Box display="flex" flexWrap="wrap" gap={0.5} mb={1}>
                  {word.tagIds.map((id) => {
                    const tag = tags.find((t) => t.id === id);
                    return tag ? (
                      <Chip
                        key={id}
                        label={tag.name}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem', height: 22, borderColor: 'rgba(148, 163, 184, 0.3)' }}
                      />
                    ) : null;
                  })}
                </Box>
              )}

              {/* Примеры предложений (если есть) */}
              {(word.exampleEn || word.exampleRu) && (
                <Box sx={{ pt: 1, borderTop: '1px solid rgba(148, 163, 184, 0.1)' }}>
                  {word.exampleEn && (
                    <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.primary', mb: 0.25, fontSize: '0.85rem' }}>
                      {word.exampleEn}
                    </Typography>
                  )}
                  {word.exampleRu && (
                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', display: 'block', fontSize: '0.78rem' }}>
                      {word.exampleRu}
                    </Typography>
                  )}
                </Box>
              )}
            </Card>
          ))
        )}
      </Box>

      {/* Десктопный вид (таблица) для экранов md и выше */}
      <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' }, overflowX: 'auto' }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell>Word</TableCell>
              <TableCell>Translation</TableCell>
              <TableCell>Example</TableCell>
              <TableCell>Example (RU)</TableCell>
              <TableCell>Favorite</TableCell>
              <TableCell>Tag</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {words.map((word) => (
              <TableRow key={word.id}>
                <TableCell sx={{ fontWeight: 600 }}>{word.english}</TableCell>
                <TableCell>{word.russian}</TableCell>
                <TableCell sx={{ maxWidth: 200 }}>
                  <Typography variant="body2" noWrap>
                    {word.exampleEn}
                  </Typography>
                </TableCell>
                <TableCell sx={{ maxWidth: 200 }}>
                  <Typography variant="body2" noWrap>
                    {word.exampleRu}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Tooltip title={word.isFavorite ? 'Remove from favorites' : 'Add to favorites'}>
                    <IconButton onClick={() => handleToggleFavorite(word.id)}>
                      {word.isFavorite ? <Favorite color="primary" /> : <FavoriteBorder />}
                    </IconButton>
                  </Tooltip>
                </TableCell>
                <TableCell sx={{ maxWidth: 180 }}>
                  <Typography variant="body2" noWrap>
                    {word.tagIds?.map((id) => tags.find((t) => t.id === id)?.name).filter(Boolean).join(', ') || '—'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Tooltip title="Edit">
                    <IconButton onClick={() => handleEdit(word)}>
                      <Edit />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton onClick={() => handleDelete(word.id)} color="error">
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit Dialog */}
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
          <FormControl fullWidth margin="normal">
            <InputLabel id="word-tag-select">Tag (optional)</InputLabel>
            <Select
              labelId="word-tag-select"
              id="word-tag-select"
              value={formTagId ? String(formTagId) : ''}
              onChange={(e) =>
                setFormTagId(e.target.value ? Number(e.target.value) : undefined)
              }
              label="Tag (optional)"
            >
              <MenuItem value="">
                No tag
              </MenuItem>
              {tags.map((tag) => (
                <MenuItem key={tag.id} value={String(tag.id)}>
                  {tag.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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
          {/* Кнопка удаления слова прямо из модального окна редактирования */}
          <Button
            onClick={() => {
              if (editingWord) {
                setEditDialogOpen(false);
                handleDelete(editingWord.id);
              }
            }}
            color="error"
            startIcon={<Delete />}
          >
            Delete
          </Button>
          <Box>
            <Button onClick={() => setEditDialogOpen(false)} sx={{ mr: 1 }}>
              Cancel
            </Button>
            <Button onClick={handleSave} variant="contained">
              Save
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Word</DialogTitle>
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
          <FormControl fullWidth margin="normal">
            <InputLabel id="word-tag-select">Tag (optional)</InputLabel>
            <Select
              labelId="word-tag-select"
              id="word-tag-select"
              value={formTagId ? String(formTagId) : ''}
              onChange={(e) =>
                setFormTagId(e.target.value ? Number(e.target.value) : undefined)
              }
              label="Tag (optional)"
            >
              <MenuItem value="">
                No tag
              </MenuItem>
              {tags.map((tag) => (
                <MenuItem key={tag.id} value={String(tag.id)}>
                  {tag.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">Add</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

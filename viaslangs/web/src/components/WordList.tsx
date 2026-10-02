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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Words List</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAdd}
        >
          Add Word
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
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
                <TableCell>{word.english}</TableCell>
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
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">Save</Button>
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

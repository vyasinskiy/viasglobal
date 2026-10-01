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
  CircularProgress,
} from '@mui/material';
import {
  Edit,
  Delete,
  Favorite,
  FavoriteBorder,
  Add,
} from '@mui/icons-material';
import { Word, CreateWordRequest } from '../../lib/types';
import { wordsApi } from '../services/api';

interface WordListProps {
  onWordUpdated: () => void;
  languageId?: number;
}

export const WordList: React.FC<WordListProps> = ({ onWordUpdated, languageId }) => {
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

  const loadWords = useCallback(async () => {
    try {
      setLoading(true);
      const wordsData = await wordsApi.getAll(languageId);
      setWords(wordsData);
    } catch (err: unknown) {
      setError('Failed to load words');
    } finally {
      setLoading(false);
    }
  }, [languageId]);

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
    setAddDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingWord) {
        await wordsApi.update(editingWord.id, formData);
      } else {
        await wordsApi.create({ ...formData, languageId });
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
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" p={4}>
        <CircularProgress />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Loading words...
        </Typography>
      </Box>
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

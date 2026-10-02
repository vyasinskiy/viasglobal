'use client';

import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  Card,
  CardContent,
  Skeleton,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  School,
  List,
  Favorite,
  BarChart,
  Translate,
  ExitToApp,
} from '@mui/icons-material';
import { StudyCard } from './components/StudyCard';
import { WordList } from './components/WordList';
import { StatsComponent } from './components/Stats';
import { Language, Tag } from '../lib/types';
import { languagesApi, tagsApi } from './services/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  if (value !== index) {
    return null;
  }

  return (
    <div
      role="tabpanel"
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0 }}
      {...other}
    >
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0 }}>
        {children}
      </Box>
    </div>
  );
}

const LANGUAGE_STORAGE_KEY = 'vias-langs-selected-language';

function App() {
  const [tabValue, setTabValue] = useState(0);
  const [wordsUpdated, setWordsUpdated] = useState(0);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedLanguageId, setSelectedLanguageId] = useState<number | undefined>(undefined);
  const [languageError, setLanguageError] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTagId, setSelectedTagId] = useState<number | undefined>(undefined);
  const [tagsLoading, setTagsLoading] = useState(false);

  useEffect(() => {
    const savedLanguageId = sessionStorage.getItem(LANGUAGE_STORAGE_KEY);

    languagesApi.getAll()
      .then((langs) => {
        setLanguages(langs);

        const savedId = savedLanguageId ? Number(savedLanguageId) : undefined;
        const restored = langs.find((lang) => lang.id === savedId);

        if (restored) {
          setSelectedLanguageId(restored.id);
        } else {
          const fallback = langs[0]?.id;
          setSelectedLanguageId(fallback);
          if (fallback !== undefined) {
            sessionStorage.setItem(LANGUAGE_STORAGE_KEY, String(fallback));
          }
        }
      })
      .catch(() => setLanguageError(true));
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleLanguageChange = (event: SelectChangeEvent<string>) => {
    const newLanguageId = Number(event.target.value) || undefined;
    setSelectedLanguageId(newLanguageId);
    if (newLanguageId !== undefined) {
      sessionStorage.setItem(LANGUAGE_STORAGE_KEY, String(newLanguageId));
    }
    setWordsUpdated(prev => prev + 1);
  };

  const handleTagChange = (event: SelectChangeEvent<string>) => {
    const newTagId = event.target.value ? Number(event.target.value) : undefined;
    setSelectedTagId(newTagId);
    setWordsUpdated(prev => prev + 1);
  };

  useEffect(() => {
    if (selectedLanguageId === undefined) return;
    setTagsLoading(true);
    setSelectedTagId(undefined);
    tagsApi
      .getAll(selectedLanguageId)
      .then((loadedTags) => setTags(loadedTags || []))
      .catch(() => setTags([]))
      .finally(() => setTagsLoading(false));
  }, [selectedLanguageId]);

  const handleWordCompleted = () => {
    setWordsUpdated(prev => prev + 1);
  };

  const handleWordUpdated = () => {
    setWordsUpdated(prev => prev + 1);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err: unknown) {
      // ignore network errors — still redirect
    }
    window.location.href = '/login';
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', flexGrow: 1 }}>
      <AppBar
        position="sticky"
        color="inherit"
        sx={{
          borderBottom: '1px solid rgba(148,163,184,0.2)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
          bgcolor: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <Toolbar>
          <Translate sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 800, color: 'text.primary' }}>
            VIAS - Langs learning application
          </Typography>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel id="language-select-label">Language</InputLabel>
            <Select
              labelId="language-select-label"
              id="language-select"
              value={selectedLanguageId ? String(selectedLanguageId) : ''}
              onChange={handleLanguageChange}
              label="Language"
              disabled={languageError || languages.length === 0}
              sx={{
                borderRadius: '20px',
                minHeight: 40,
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#475569' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' },
              }}
            >
              {languages.map((lang) => (
                <MenuItem key={lang.id} value={String(lang.id)}>
                  {lang.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 220, ml: 1 }}>
            <InputLabel id="tag-select-label">Tag (pack)</InputLabel>
            {tagsLoading ? (
              <Skeleton variant="rectangular" width={220} height={40} sx={{ borderRadius: '20px' }} />
            ) : (
              <Select
                labelId="tag-select-label"
                id="tag-select"
                value={selectedTagId ? String(selectedTagId) : ''}
                onChange={handleTagChange}
                label="Tag (pack)"
                disabled={selectedLanguageId === undefined || tags.length === 0}
                sx={{
                  borderRadius: '20px',
                  minHeight: 40,
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#475569' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' },
                }}
              >
                <MenuItem value="">
                  All words
                </MenuItem>
                {tags.map((tag) => (
                  <MenuItem key={tag.id} value={String(tag.id)}>
                    {tag.name}
                    {tag.wordCount ? ` (${tag.wordCount})` : ''}
                  </MenuItem>
                ))}
              </Select>
            )}
          </FormControl>
          <Tooltip title="Log out">
            <IconButton onClick={handleLogout} color="inherit" sx={{ ml: 1 }}>
              <ExitToApp />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

        <Container sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0 }}>
          {selectedLanguageId === undefined && !languageError ? (
            <Box
              display="flex"
              flexDirection="column"
              justifyContent="center"
              alignItems="center"
              flexGrow={1}
              minHeight={0}
              p={3}
            >
              <Card sx={{ width: { xs: '100%', sm: 800 }, textAlign: 'center' }}>
                <CardContent>
                  <Skeleton variant="text" width="55%" sx={{ fontSize: '1.5rem', mb: 2 }} />
                  <Skeleton variant="text" width="40%" sx={{ mb: 3 }} />
                  <Skeleton variant="text" width="100%" sx={{ mb: 1 }} />
                  <Skeleton variant="text" width="100%" sx={{ mb: 3 }} />
                  <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 1, mb: 2 }} />
                  <Box display="flex" justifyContent="center" gap={1}>
                    <Skeleton variant="rectangular" width={140} height={40} sx={{ borderRadius: '20px' }} />
                    <Skeleton variant="rectangular" width={160} height={40} sx={{ borderRadius: '20px' }} />
                  </Box>
                </CardContent>
              </Card>
            </Box>
          ) : (
            <>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs 
                  value={tabValue} 
                  onChange={handleTabChange} 
                  aria-label="app tabs"
                  variant="scrollable"
                  scrollButtons="auto"
                >
                  <Tab 
                    icon={<School />} 
                    label="Study" 
                    iconPosition="start"
                  />
                  <Tab 
                    icon={<Favorite />} 
                    label="Favorites" 
                    iconPosition="start"
                  />
                  <Tab 
                    icon={<List />} 
                    label="Words List" 
                    iconPosition="start"
                  />
                  <Tab 
                    icon={<BarChart />} 
                    label="Statistics" 
                    iconPosition="start"
                  />
                </Tabs>
              </Box>

              <TabPanel value={tabValue} index={0}>
                <Box
                  display="flex"
                  flexDirection="column"
                  justifyContent="center"
                  alignItems="center"
                  flexGrow={1}
                  minHeight={0}
                >
                  <StudyCard 
                    key={`study-${selectedLanguageId}-${selectedTagId}-${wordsUpdated}`}
                    onWordCompleted={handleWordCompleted}
                    favoriteOnly={false}
                    languageId={selectedLanguageId}
                    tagId={selectedTagId}
                  />
                </Box>
              </TabPanel>

              <TabPanel value={tabValue} index={1}>
                <Box
                  display="flex"
                  flexDirection="column"
                  justifyContent="center"
                  alignItems="center"
                  flexGrow={1}
                  minHeight={0}
                >
                  <StudyCard 
                    key={`favorites-${selectedLanguageId}-${selectedTagId}-${wordsUpdated}`}
                    onWordCompleted={handleWordCompleted}
                    favoriteOnly={true}
                    languageId={selectedLanguageId}
                    tagId={selectedTagId}
                  />
                </Box>
              </TabPanel>

              <TabPanel value={tabValue} index={2}>
                <WordList 
                  key={`list-${selectedLanguageId}-${selectedTagId}`}
                  onWordUpdated={handleWordUpdated} 
                  languageId={selectedLanguageId}
                  tagId={selectedTagId}
                  tags={tags}
                />
              </TabPanel>

              <TabPanel value={tabValue} index={3}>
                <StatsComponent 
                  key={`stats-${selectedLanguageId}`}
                  languageId={selectedLanguageId}
                />
              </TabPanel>
            </>
          )}
        </Container>
      </Box>
  );
}

export default App;

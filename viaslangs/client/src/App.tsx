import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Tabs,
  Tab,
  CssBaseline,
  ThemeProvider,
  createTheme,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
} from '@mui/material';
import {
  School,
  List,
  Favorite,
  BarChart,
  Translate,
} from '@mui/icons-material';
import { StudyCard } from './components/StudyCard';
import { WordList } from './components/WordList';
import { StatsComponent } from './components/Stats';
import { Language } from './types';
import { languagesApi } from './services/api';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const LANGUAGE_STORAGE_KEY = 'vy-langs-selected-language';

function App() {
  const [tabValue, setTabValue] = useState(0);
  const [wordsUpdated, setWordsUpdated] = useState(0);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedLanguageId, setSelectedLanguageId] = useState<number | undefined>(undefined);
  const [languageError, setLanguageError] = useState(false);

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

  const handleWordCompleted = () => {
    setWordsUpdated(prev => prev + 1);
  };

  const handleWordUpdated = () => {
    setWordsUpdated(prev => prev + 1);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <Translate sx={{ mr: 1 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              VY - Langs learning application
            </Typography>
            <FormControl size="small" sx={{ minWidth: 160, color: 'inherit' }}>
              <InputLabel id="language-select-label" sx={{ color: 'inherit' }}>
                Language
              </InputLabel>
              <Select
                labelId="language-select-label"
                id="language-select"
                value={selectedLanguageId ? String(selectedLanguageId) : ''}
                onChange={handleLanguageChange}
                label="Language"
                disabled={languageError || languages.length === 0}
                sx={{
                  color: 'inherit',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'inherit' },
                  '& .MuiSvgIcon-root': { color: 'inherit' },
                }}
              >
                {languages.map((lang) => (
                  <MenuItem key={lang.id} value={String(lang.id)}>
                    {lang.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Toolbar>
        </AppBar>

        <Container>
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
            <Box display="flex" justifyContent="center" marginTop="-16px">
              <StudyCard 
                key={`study-${selectedLanguageId}-${wordsUpdated}`}
                onWordCompleted={handleWordCompleted}
                favoriteOnly={false}
                languageId={selectedLanguageId}
              />
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box display="flex" justifyContent="center">
              <StudyCard 
                key={`favorites-${selectedLanguageId}-${wordsUpdated}`}
                onWordCompleted={handleWordCompleted}
                favoriteOnly={true}
                languageId={selectedLanguageId}
              />
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <WordList 
              key={`list-${selectedLanguageId}`}
              onWordUpdated={handleWordUpdated} 
              languageId={selectedLanguageId}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <StatsComponent 
              key={`stats-${selectedLanguageId}`}
              languageId={selectedLanguageId}
            />
          </TabPanel>
        </Container>
      </Box>

    </ThemeProvider>
  );
}

export default App;

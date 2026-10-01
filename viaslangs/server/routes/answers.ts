import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { 
  CheckAnswerRequest, 
  CheckAnswerResponse, 
  ApiResponse, 
  Answer,
  ClearAnswersResponse,
  TodayCorrectWord,
} from '../types';

const router = Router();
const prisma = new PrismaClient();

router.post('/check', async (req: Request<{}, {}, CheckAnswerRequest>, res: Response<ApiResponse<CheckAnswerResponse>>) => {
  try {
    const { wordId, answer } = req.body;
    
    if (!wordId || !answer) {
      return res.status(400).json({ 
        success: false, 
        error: 'Word ID and answer are required' 
      });
    }
    
    // Получить слово
    const word = await prisma.word.findUnique({
      where: { id: wordId }
    });
    
    if (!word) {
      return res.status(404).json({ 
        success: false, 
        error: 'Word not found' 
      });
    }
    
    const userAnswer = answer.toLowerCase().trim();
    const correctAnswer = word.english.toLowerCase().trim();
    
    const isCorrect = userAnswer === correctAnswer;
    
    let isSynonym = false;
    let synonymWord: { id: number } | null = null;
    if (!isCorrect) {
      synonymWord = await prisma.word.findFirst({
        where: {
          russian: word.russian,
          english: userAnswer,
          languageId: word.languageId,
        }
      });
      isSynonym = Boolean(synonymWord);
    }
    
    let isPartial = false;
    let hint = '';
    
    if (!isCorrect && !isSynonym && userAnswer.length > 0) {
      if (correctAnswer.startsWith(userAnswer)) {
        isPartial = true;
        hint = `Correct! Continue... (${correctAnswer.length - userAnswer.length} letters left)`;
      }
      
      else if (correctAnswer.includes(userAnswer)) {
        isPartial = true;
        hint = 'Partially correct! Try again!';
      }

      else if (levenshteinDistance(userAnswer, correctAnswer) <= 2) {
        isPartial = true;
        hint = 'Very close! Check your answer';
      }
    }
    
    await prisma.answer.create({
      data: {
        wordId,
        answer: userAnswer,
        isCorrect,
        isSynonym
      }
    });

    if (isSynonym && synonymWord) {
      const existingCorrect = await prisma.answer.findFirst({
        where: { wordId: synonymWord.id, isCorrect: true }
      });
      if (!existingCorrect) {
        await prisma.answer.create({
          data: {
            wordId: synonymWord.id,
            answer: userAnswer,
            isCorrect: true
          }
        });
      }
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todayCorrectAnswers = await prisma.answer.count({
      where: {
        isCorrect: true,
        word: { languageId: word.languageId },
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    const totalCorrectAnswers = await prisma.answer.count({
      where: {
        isCorrect: true,
        word: { languageId: word.languageId },
      }
    });

    const totalWords = await prisma.word.count({
      where: { languageId: word.languageId }
    });

    const response: CheckAnswerResponse = {
      isCorrect,
      isPartial,
      hint: isSynonym ? 'This is synonym. Try another word.' : (isPartial ? hint : undefined),
      isSynonym: isSynonym || undefined,
      correctAnswer: word.english,
      todayCorrectAnswers,
      totalCorrectAnswers,
      totalWords
    };
    
    return res.json({ success: true, data: response });
  } catch (error) {
    console.error('Error checking answer:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to check answer' 
    });
  }
});

router.get('/word/:wordId', async (req: Request, res: Response<ApiResponse<Answer[]>>) => {
  try {
    const { wordId } = req.params;
    
    const answers = await prisma.answer.findMany({
      where: { wordId: parseInt(wordId) },
      orderBy: { createdAt: 'desc' }
    });
    
    return res.json({ success: true, data: answers });
  } catch (error) {
    console.error('Error fetching answers:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch answers' 
    });
  }
});

router.get('/stats', async (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const { languageId } = req.query as { languageId?: string };

    const languageWhere = languageId ? { languageId: parseInt(languageId) } : {};

    const totalAnswers = await prisma.answer.count({
      where: languageId ? { word: languageWhere } : undefined
    });
    const correctAnswers = await prisma.answer.count({
      where: languageId ? { isCorrect: true, word: languageWhere } : { isCorrect: true }
    });
    
    const totalWords = await prisma.word.count({
      where: languageWhere
    });
    const learnedWords = await prisma.word.count({
      where: {
        ...languageWhere,
        answers: {
          some: {
            isCorrect: true
          }
        }
      }
    });
    
    const favoriteWords = await prisma.word.count({
      where: { ...languageWhere, isFavorite: true }
    });
    
    const stats = {
      totalAnswers,
      correctAnswers,
      accuracy: totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0,
      totalWords,
      learnedWords,
      favoriteWords
    };
    
    return res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch stats' 
    });
  }
});

router.get('/today-correct-words', async (req: Request, res: Response<ApiResponse<TodayCorrectWord[]>>) => {
  try {
    const { languageId } = req.query as { languageId?: string };

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const answers = await prisma.answer.findMany({
      where: {
        isCorrect: true,
        ...(languageId ? { word: { languageId: parseInt(languageId) } } : {}),
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        word: true,
      },
    });

    const uniqueWords = new Map<number, TodayCorrectWord>();

    answers.forEach((answer) => {
      if (answer.word) {
        uniqueWords.set(answer.word.id, {
          english: answer.word.english,
          russian: answer.word.russian,
          exampleEn: answer.word.exampleEn,
          exampleRu: answer.word.exampleRu,
        });
      }
    });

    return res.json({ success: true, data: Array.from(uniqueWords.values()) });
  } catch (error) {
    console.error('Error fetching today correct words:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch today correct words',
    });
  }
});

router.delete('/', async (req: Request, res: Response<ApiResponse<ClearAnswersResponse>>) => {
  try {
    const result = await prisma.answer.deleteMany();
    return res.json({ success: true, data: { deletedCount: result.count } });
  } catch (error) {
    console.error('Error clearing answers:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to clear answers'
    });
  }
});

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i;
  }
  
  for (let j = 0; j <= str2.length; j++) {
    matrix[j][0] = j;
  }
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}

export { router as answerRoutes };

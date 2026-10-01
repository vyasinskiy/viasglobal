import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiResponse, Language } from '../types';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req: Request, res: Response<ApiResponse<Language[]>>) => {
  try {
    const languages = await prisma.language.findMany({
      orderBy: { id: 'asc' }
    });

    return res.json({ success: true, data: languages });
  } catch (error) {
    console.error('Error fetching languages:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch languages'
    });
  }
});

router.post('/', async (req: Request<{}, {}, { code?: string; name?: string }>, res: Response<ApiResponse<Language>>) => {
  try {
    const { code, name } = req.body;

    if (!code || !name) {
      return res.status(400).json({
        success: false,
        error: 'Code and name are required'
      });
    }

    const language = await prisma.language.create({
      data: {
        code: code.trim().toLowerCase(),
        name: name.trim()
      }
    });

    return res.status(201).json({ success: true, data: language });
  } catch (error) {
    console.error('Error creating language:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create language'
    });
  }
});

export { router as languageRoutes };
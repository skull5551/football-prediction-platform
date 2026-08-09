import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { points: 'desc' },
      select: { id: true, username: true, points: true },
    });

    res.json({ leaderboard: users });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.post('/', async (req: Request, res: Response) => {
  try {
    const { matchId, predictedHomeScore, predictedAwayScore } = req.body;
    const userId = req.user!.id;

    if (!matchId || predictedHomeScore === undefined || predictedAwayScore === undefined) {
      res.status(400).json({ error: 'matchId, predictedHomeScore and predictedAwayScore are required' });
      return;
    }

    const match = await prisma.match.findUnique({ where: { id: Number(matchId) } });
    if (!match) {
      res.status(404).json({ error: 'Match not found' });
      return;
    }

    if (match.status !== 'SCHEDULED') {
      res.status(400).json({ error: 'Match is no longer open for predictions' });
      return;
    }

    const prediction = await prisma.prediction.upsert({
      where: {
        userId_matchId: { userId, matchId: Number(matchId) },
      },
      update: {
        predictedHomeScore: Number(predictedHomeScore),
        predictedAwayScore: Number(predictedAwayScore),
      },
      create: {
        userId,
        matchId: Number(matchId),
        predictedHomeScore: Number(predictedHomeScore),
        predictedAwayScore: Number(predictedAwayScore),
      },
    });

    res.status(201).json({ prediction });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/mine', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const predictions = await prisma.prediction.findMany({
      where: { userId },
      include: {
        match: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ predictions });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/match/:matchId', async (req: Request, res: Response) => {
  try {
    const matchId = Number(req.params.matchId);
    const sort = req.query.sort as string | undefined;

    const orderBy = sort === 'points' ? { points: 'desc' as const } : { createdAt: 'desc' as const };

    const predictions = await prisma.prediction.findMany({
      where: { matchId },
      include: {
        user: {
          select: { id: true, username: true },
        },
      },
      orderBy,
    });

    res.json({ predictions });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

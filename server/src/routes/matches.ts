import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { calculatePoints } from '../services/scoring';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, competition } = req.query;

    const where: Record<string, unknown> = {};
    if (status) where.status = status as string;
    if (competition) where.competition = competition as string;

    const matches = await prisma.match.findMany({
      where,
      orderBy: { matchDate: 'asc' },
      include: {
        _count: {
          select: { predictions: true, comments: true },
        },
      },
    });

    res.json({ matches });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        predictions: {
          include: {
            user: {
              select: { id: true, username: true },
            },
          },
        },
        _count: {
          select: { comments: true },
        },
      },
    });

    if (!match) {
      res.status(404).json({ error: 'Match not found' });
      return;
    }

    res.json({ match });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { homeTeam, awayTeam, matchDate, competition, groupName } = req.body;

    if (!homeTeam || !awayTeam || !matchDate) {
      res.status(400).json({ error: 'homeTeam, awayTeam and matchDate are required' });
      return;
    }

    const match = await prisma.match.create({
      data: {
        homeTeam,
        awayTeam,
        matchDate: new Date(matchDate),
        competition: competition || 'WORLD_CUP',
        groupName: groupName || null,
        status: 'SCHEDULED',
      },
    });

    res.status(201).json({ match });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { homeScore, awayScore, status } = req.body;

    const existing = await prisma.match.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Match not found' });
      return;
    }

    const wasFinished = existing.status === 'FINISHED';
    const willBeFinished = status === 'FINISHED';

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.match.update({
        where: { id },
        data: {
          ...(homeScore !== undefined ? { homeScore } : {}),
          ...(awayScore !== undefined ? { awayScore } : {}),
          ...(status ? { status } : {}),
        },
      });

      if (!wasFinished && willBeFinished && updated.homeScore !== null && updated.awayScore !== null) {
        const predictions = await tx.prediction.findMany({
          where: { matchId: id },
        });

        for (const pred of predictions) {
          const points = calculatePoints(
            updated.homeScore!,
            updated.awayScore!,
            pred.predictedHomeScore,
            pred.predictedAwayScore
          );
          await tx.prediction.update({
            where: { id: pred.id },
            data: { points },
          });

          const user = await tx.user.findUnique({ where: { id: pred.userId } });
          if (user) {
            const oldPoints = user.points;
            await tx.user.update({
              where: { id: pred.userId },
              data: { points: oldPoints - pred.points + points },
            });
          }
        }
      }

      return updated;
    });

    res.json({ match: result });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

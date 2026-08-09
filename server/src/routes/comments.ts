import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/match/:matchId', async (req: Request, res: Response) => {
  try {
    const matchId = Number(req.params.matchId);

    const comments = await prisma.comment.findMany({
      where: { matchId },
      include: {
        user: {
          select: { id: true, username: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ comments });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { matchId, content, parentId } = req.body;
    const userId = req.user!.id;

    if (!matchId || !content) {
      res.status(400).json({ error: 'matchId and content are required' });
      return;
    }

    const match = await prisma.match.findUnique({ where: { id: Number(matchId) } });
    if (!match) {
      res.status(404).json({ error: 'Match not found' });
      return;
    }

    if (parentId) {
      const parent = await prisma.comment.findUnique({ where: { id: Number(parentId) } });
      if (!parent) {
        res.status(404).json({ error: 'Parent comment not found' });
        return;
      }
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        userId,
        matchId: Number(matchId),
        parentId: parentId ? Number(parentId) : null,
      },
      include: {
        user: {
          select: { id: true, username: true },
        },
      },
    });

    res.status(201).json({ comment });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const userId = req.user!.id;

    const comment = await prisma.comment.findUnique({ where: { id } });
    if (!comment) {
      res.status(404).json({ error: 'Comment not found' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const isAdmin = user?.username === 'admin';

    if (comment.userId !== userId && !isAdmin) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    await prisma.comment.delete({ where: { id } });

    res.json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

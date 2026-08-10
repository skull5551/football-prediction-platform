import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';

interface Prediction {
  id: number;
  predictedHomeScore: number;
  predictedAwayScore: number;
  points: number;
  userId: number;
  user: { id: number; username: string };
  createdAt: string;
}

interface MatchDetail {
  id: number;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  competition: string;
  groupName: string | null;
  predictions: Prediction[];
}

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  userId: number;
  matchId: number;
  parentId: number | null;
  user: { id: number; username: string };
}

interface CommentNode extends Comment {
  replies: CommentNode[];
}

interface CommentItemProps {
  comment: CommentNode;
  depth: number;
  currentUserId: number | null;
  replyTo: number | null;
  replyText: string;
  setReplyText: (text: string) => void;
  submittingReply: boolean;
  onReply: (id: number) => void;
  onCancelReply: () => void;
  onSubmitReply: (parentId: number) => void;
  onDelete: (id: number) => void;
}

function statusLabel(status: string): string {
  switch (status) {
    case 'SCHEDULED':
      return '未开始';
    case 'IN_PROGRESS':
      return '进行中';
    case 'FINISHED':
      return '已结束';
    default:
      return status;
  }
}

function buildCommentTree(comments: Comment[]): CommentNode[] {
  const map = new Map<number, CommentNode>();
  const roots: CommentNode[] = [];

  for (const c of comments) {
    map.set(c.id, { ...c, replies: [] });
  }

  for (const c of comments) {
    const node = map.get(c.id);
    if (!node) continue;
    if (c.parentId !== null) {
      const parent = map.get(c.parentId);
      if (parent) {
        parent.replies.push(node);
      } else {
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  }

  return roots;
}

function CommentItem({
  comment,
  depth,
  currentUserId,
  replyTo,
  replyText,
  setReplyText,
  submittingReply,
  onReply,
  onCancelReply,
  onSubmitReply,
  onDelete,
}: CommentItemProps) {
  const isOwn = currentUserId === comment.userId;
  const isReplying = replyTo === comment.id;

  return (
    <div className="mb-3" style={{ marginLeft: `${depth * 24}px` }}>
      <div className="bg-gray-50 rounded p-3">
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold text-sm">{comment.user.username}</span>
          <span className="text-xs text-gray-400">
            {new Date(comment.createdAt).toLocaleString()}
          </span>
        </div>
        <p className="text-gray-700 mb-2">{comment.content}</p>
        <div className="flex gap-3">
          {currentUserId !== null && (
            <button
              onClick={() => onReply(comment.id)}
              className="text-xs text-blue-500 hover:underline"
            >
              回复
            </button>
          )}
          {isOwn && (
            <button
              onClick={() => onDelete(comment.id)}
              className="text-xs text-red-500 hover:underline"
            >
              删除
            </button>
          )}
        </div>
      </div>
      {isReplying && currentUserId !== null && (
        <div className="mt-2 flex gap-2 items-center">
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="回复..."
            className="flex-1 border rounded px-3 py-1 text-sm"
          />
          <button
            onClick={() => onSubmitReply(comment.id)}
            disabled={submittingReply || !replyText.trim()}
            className="bg-blue-500 text-white px-4 py-1 rounded text-sm hover:bg-blue-600 disabled:opacity-50"
          >
            {submittingReply ? '...' : '回复'}
          </button>
          <button
            onClick={onCancelReply}
            className="text-gray-500 px-2 py-1 text-sm hover:underline"
          >
            取消
          </button>
        </div>
      )}
      {comment.replies.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          depth={depth + 1}
          currentUserId={currentUserId}
          replyTo={replyTo}
          replyText={replyText}
          setReplyText={setReplyText}
          submittingReply={submittingReply}
          onReply={onReply}
          onCancelReply={onCancelReply}
          onSubmitReply={onSubmitReply}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

function MatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [predictedHome, setPredictedHome] = useState('');
  const [predictedAway, setPredictedAway] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);
  const [commentError, setCommentError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    api
      .get(`/matches/${id}`)
      .then((res) => {
        const matchData: MatchDetail = res.data.match;
        setMatch(matchData);
        if (user) {
          const existing = matchData.predictions.find((p) => p.userId === user.id);
          if (existing) {
            setPredictedHome(String(existing.predictedHomeScore));
            setPredictedAway(String(existing.predictedAwayScore));
          }
        }
      })
      .catch(() => {
        setMatch(null);
      })
      .finally(() => {
        setLoading(false);
      });

    api
      .get(`/predictions/match/${id}?sort=points`)
      .then((res) => {
        setPredictions(res.data.predictions);
      })
      .catch(() => {
        setPredictions([]);
      });

    api
      .get(`/comments/match/${id}`)
      .then((res) => {
        setComments(res.data.comments);
      })
      .catch(() => {
        setComments([]);
      });
  }, [id, user?.id]);

  const refreshComments = () => {
    if (!id) return;
    api
      .get(`/comments/match/${id}`)
      .then((res) => {
        setComments(res.data.comments);
      })
      .catch(() => {
        setComments([]);
      });
  };

  const refreshPredictions = () => {
    if (!id) return;
    api
      .get(`/predictions/match/${id}?sort=points`)
      .then((res) => {
        setPredictions(res.data.predictions);
      })
      .catch(() => {
        setPredictions([]);
      });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setError('');
    setSubmitting(true);
    try {
      await api.post('/predictions', {
        matchId: Number(id),
        predictedHomeScore: Number(predictedHome),
        predictedAwayScore: Number(predictedAway),
      });
      const res = await api.get(`/matches/${id}`);
      setMatch(res.data.match);
      refreshPredictions();
    } catch {
      setError('提交预测失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!id || !commentText.trim()) return;
    setCommentError('');
    setSubmittingComment(true);
    try {
      await api.post('/comments', {
        matchId: Number(id),
        content: commentText.trim(),
      });
      setCommentText('');
      refreshComments();
    } catch {
      setCommentError('发表评论失败');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleSubmitReply = async (parentId: number) => {
    if (!id || !replyText.trim()) return;
    setCommentError('');
    setSubmittingReply(true);
    try {
      await api.post('/comments', {
        matchId: Number(id),
        content: replyText.trim(),
        parentId,
      });
      setReplyText('');
      setReplyTo(null);
      refreshComments();
    } catch {
      setCommentError('回复失败');
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    setCommentError('');
    try {
      await api.delete(`/comments/${commentId}`);
      refreshComments();
    } catch {
      setCommentError('删除评论失败');
    }
  };

  if (loading) {
    return <div className="p-8 text-gray-500">加载中...</div>;
  }

  if (!match) {
    return <div className="p-8 text-gray-500">比赛未找到</div>;
  }

  const isScheduled = match.status === 'SCHEDULED';
  const commentTree = buildCommentTree(comments);

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Match Info */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="text-sm text-gray-500 mb-2">{match.competition}</div>
        <div className="flex items-center justify-between">
          <div className="text-center flex-1">
            <p className="text-xl font-bold">{match.homeTeam}</p>
          </div>
          <div className="px-8">
            {match.homeScore !== null && match.awayScore !== null ? (
              <p className="text-4xl font-bold">
                {match.homeScore} - {match.awayScore}
              </p>
            ) : (
              <p className="text-2xl text-gray-400">VS</p>
            )}
          </div>
          <div className="text-center flex-1">
            <p className="text-xl font-bold">{match.awayTeam}</p>
          </div>
        </div>
        <div className="mt-4 text-center">
          <span className="text-sm text-gray-500">
            {new Date(match.matchDate).toLocaleString()}
          </span>
          <span className="ml-2 text-sm px-2 py-1 rounded bg-gray-100">
            {statusLabel(match.status)}
          </span>
        </div>
      </div>

      {/* Prediction Form */}
      {isScheduled && user && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">提交预测</h2>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <form onSubmit={handleSubmit} className="flex items-end gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                {match.homeTeam}
              </label>
              <input
                type="number"
                min="0"
                value={predictedHome}
                onChange={(e) => setPredictedHome(e.target.value)}
                className="w-20 border rounded px-3 py-2 text-center"
                required
              />
            </div>
            <span className="text-gray-400 pb-2">-</span>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                {match.awayTeam}
              </label>
              <input
                type="number"
                min="0"
                value={predictedAway}
                onChange={(e) => setPredictedAway(e.target.value)}
                className="w-20 border rounded px-3 py-2 text-center"
                required
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {submitting ? '提交中...' : '提交'}
            </button>
          </form>
        </div>
      )}

      {/* Predictions Leaderboard */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-bold mb-4">预测排行</h2>
        {predictions.length === 0 ? (
          <p className="text-gray-500">暂无预测</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b text-sm text-gray-600">
                <th className="text-left py-2">排名</th>
                <th className="text-left py-2">用户</th>
                <th className="text-center py-2">预测比分</th>
                <th className="text-right py-2">积分</th>
              </tr>
            </thead>
            <tbody>
              {predictions.map((p, index) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="py-2 text-sm">{index + 1}</td>
                  <td className="py-2 text-sm">{p.user.username}</td>
                  <td className="py-2 text-sm text-center">
                    {p.predictedHomeScore} - {p.predictedAwayScore}
                  </td>
                  <td className="py-2 text-sm text-right font-semibold">
                    {p.points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Discussion */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold mb-4">讨论区</h2>
        {commentError && (
          <p className="text-red-500 mb-4">{commentError}</p>
        )}

        {user ? (
          <div className="flex gap-2 mb-6">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="发表评论..."
              className="flex-1 border rounded px-3 py-2"
            />
            <button
              onClick={handleSubmitComment}
              disabled={submittingComment || !commentText.trim()}
              className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {submittingComment ? '发表中...' : '发表'}
            </button>
          </div>
        ) : (
          <p className="text-gray-500 mb-4">登录后可参与讨论</p>
        )}

        {commentTree.length === 0 ? (
          <p className="text-gray-500">暂无评论</p>
        ) : (
          <div>
            {commentTree.map((node) => (
              <CommentItem
                key={node.id}
                comment={node}
                depth={0}
                currentUserId={user?.id ?? null}
                replyTo={replyTo}
                replyText={replyText}
                setReplyText={setReplyText}
                submittingReply={submittingReply}
                onReply={(cid) => {
                  setReplyTo(cid);
                  setReplyText('');
                }}
                onCancelReply={() => {
                  setReplyTo(null);
                  setReplyText('');
                }}
                onSubmitReply={handleSubmitReply}
                onDelete={handleDeleteComment}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MatchDetailPage;

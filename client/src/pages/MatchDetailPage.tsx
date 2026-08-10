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

function MatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [predictedHome, setPredictedHome] = useState('');
  const [predictedAway, setPredictedAway] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

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
  }, [id, user?.id]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!id || !user) return;
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
    } catch {
      setError('提交预测失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-gray-500">加载中...</div>;
  }

  if (!match) {
    return <div className="p-8 text-gray-500">比赛未找到</div>;
  }

  const isScheduled = match.status === 'SCHEDULED';

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

      {/* Placeholder for prediction list */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold mb-4">预测排行</h2>
        <p className="text-gray-500">即将上线...</p>
      </div>

      {/* Placeholder for discussion */}
      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <h2 className="text-lg font-bold mb-4">讨论区</h2>
        <p className="text-gray-500">即将上线...</p>
      </div>
    </div>
  );
}

export default MatchDetailPage;

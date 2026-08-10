import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

interface Match {
  id: number;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  competition: string;
  groupName: string | null;
}

const COMPETITIONS = [
  { label: '全部', value: '' },
  { label: '世界杯', value: 'WORLD_CUP' },
  { label: '苏超', value: 'SCOTTISH_PREM' },
];

const STATUSES = [
  { label: '全部', value: '' },
  { label: '未开始', value: 'SCHEDULED' },
  { label: '进行中', value: 'IN_PROGRESS' },
  { label: '已结束', value: 'FINISHED' },
];

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

function statusColor(status: string): string {
  switch (status) {
    case 'SCHEDULED':
      return 'bg-yellow-100 text-yellow-800';
    case 'IN_PROGRESS':
      return 'bg-green-100 text-green-800';
    case 'FINISHED':
      return 'bg-gray-200 text-gray-800';
    default:
      return 'bg-gray-200 text-gray-800';
  }
}

function HomePage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [competition, setCompetition] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (competition) params.competition = competition;
    if (status) params.status = status;

    api
      .get('/matches', { params })
      .then((res) => {
        setMatches(res.data.matches);
      })
      .catch(() => {
        setMatches([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [competition, status]);

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">比赛列表</h1>

      <div className="flex gap-4 mb-6">
        <div>
          <label className="block text-sm text-gray-600 mb-1">竞赛</label>
          <select
            value={competition}
            onChange={(e) => setCompetition(e.target.value)}
            className="border rounded px-3 py-2"
          >
            {COMPETITIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">状态</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border rounded px-3 py-2"
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && <p className="text-gray-500">加载中...</p>}

      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {matches.map((match) => (
            <Link
              key={match.id}
              to={`/matches/${match.id}`}
              className="bg-white rounded-lg shadow p-4 hover:shadow-md transition"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs text-gray-500">{match.competition}</span>
                <span
                  className={`text-xs px-2 py-1 rounded ${statusColor(match.status)}`}
                >
                  {statusLabel(match.status)}
                </span>
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className="text-center flex-1">
                  <p className="font-semibold">{match.homeTeam}</p>
                </div>
                <div className="px-4">
                  {match.homeScore !== null && match.awayScore !== null ? (
                    <p className="text-2xl font-bold">
                      {match.homeScore} - {match.awayScore}
                    </p>
                  ) : (
                    <p className="text-gray-400">VS</p>
                  )}
                </div>
                <div className="text-center flex-1">
                  <p className="font-semibold">{match.awayTeam}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-4 text-center">
                {new Date(match.matchDate).toLocaleString()}
              </p>
            </Link>
          ))}
        </div>
      )}

      {!loading && matches.length === 0 && (
        <p className="text-gray-500 text-center py-8">暂无比赛</p>
      )}
    </div>
  );
}

export default HomePage;

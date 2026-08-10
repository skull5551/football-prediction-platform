import { useState, useEffect } from 'react';
import api from '../api/client';

interface LeaderboardEntry {
  id: number;
  username: string;
  points: number;
}

function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/leaderboard')
      .then((res) => {
        setEntries(res.data.leaderboard);
      })
      .catch(() => {
        setEntries([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">排行榜</h1>
        {entries.length === 0 ? (
          <p className="text-gray-500">暂无数据</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b text-sm text-gray-600">
                <th className="text-left py-2">排名</th>
                <th className="text-left py-2">用户名</th>
                <th className="text-right py-2">积分</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, index) => (
                <tr key={entry.id} className="border-b last:border-0">
                  <td className="py-3 text-sm">
                    <span
                      className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                        index === 0
                          ? 'bg-yellow-100 text-yellow-800'
                          : index === 1
                            ? 'bg-gray-200 text-gray-700'
                            : index === 2
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-gray-50 text-gray-500'
                      }`}
                    >
                      {index + 1}
                    </span>
                  </td>
                  <td className="py-3 text-sm font-medium">{entry.username}</td>
                  <td className="py-3 text-sm text-right font-semibold">
                    {entry.points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default LeaderboardPage;

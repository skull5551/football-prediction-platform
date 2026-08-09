import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

function HomePage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">首页</h1>
      <p className="mb-4">欢迎来到足球预测平台</p>
      <nav className="flex gap-4">
        <Link to="/login" className="text-blue-500 hover:underline">登录</Link>
        <Link to="/register" className="text-blue-500 hover:underline">注册</Link>
        <Link to="/leaderboard" className="text-blue-500 hover:underline">排行榜</Link>
      </nav>
    </div>
  );
}

function LoginPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">登录</h1>
      <p className="mb-4">登录页面占位</p>
      <Link to="/" className="text-blue-500 hover:underline">返回首页</Link>
    </div>
  );
}

function RegisterPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">注册</h1>
      <p className="mb-4">注册页面占位</p>
      <Link to="/" className="text-blue-500 hover:underline">返回首页</Link>
    </div>
  );
}

function MatchDetailPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">比赛详情</h1>
      <p className="mb-4">比赛详情页面占位</p>
      <Link to="/" className="text-blue-500 hover:underline">返回首页</Link>
    </div>
  );
}

function LeaderboardPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">排行榜</h1>
      <p className="mb-4">排行榜页面占位</p>
      <Link to="/" className="text-blue-500 hover:underline">返回首页</Link>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/matches/:id" element={<MatchDetailPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

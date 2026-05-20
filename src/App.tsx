import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { TabBar } from './components/TabBar';
import { Header } from './components/Header';
import { LoadingScreen } from './components/LoadingScreen';
import { ErrorScreen } from './components/ErrorScreen';
import TodayScreen from './screens/TodayScreen';
import InboxScreen from './screens/InboxScreen';
import HabitsScreen from './screens/HabitsScreen';
import ProgressScreen from './screens/ProgressScreen';
import MoreScreen from './screens/MoreScreen';
import ProjectsScreen from './screens/ProjectsScreen';
import AreasScreen from './screens/AreasScreen';
import RitualsScreen from './screens/RitualsScreen';
import HealthScreen from './screens/HealthScreen';
import MoneyScreen from './screens/MoneyScreen';
import ReviewsScreen from './screens/ReviewsScreen';
import DailyPlansScreen from './screens/DailyPlansScreen';
import CapturesScreen from './screens/CapturesScreen';
import ActivityScreen from './screens/ActivityScreen';
import { useEffect } from 'react';
import { tg } from './lib/telegram';

export default function App() {
  const auth = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Telegram back button
  useEffect(() => {
    const w = tg.webApp();
    if (!w?.BackButton) return;
    const onBack = () => navigate(-1);
    const isDetail = !['/today', '/inbox', '/habits', '/progress', '/more', '/'].includes(location.pathname);
    if (isDetail) {
      w.BackButton.show();
      w.BackButton.onClick(onBack);
    } else {
      w.BackButton.hide();
    }
    return () => { w.BackButton?.offClick(onBack); };
  }, [location.pathname, navigate]);

  if (auth.status === 'loading') return <LoadingScreen />;
  if (auth.status === 'error') return <ErrorScreen message={auth.message} diagnostic={auth.diagnostic} />;

  const showTabs = ['/today', '/inbox', '/habits', '/progress', '/more'].includes(location.pathname);

  return (
    <div className="flex flex-col h-full bg-bg text-text">
      <Header profile={auth.profile} />
      <main className="flex-1 overflow-y-auto pb-24" style={{ WebkitOverflowScrolling: 'touch' }}>
        <Routes>
          <Route path="/" element={<Navigate to="/today" replace />} />
          <Route path="/today" element={<TodayScreen profile={auth.profile} />} />
          <Route path="/inbox" element={<InboxScreen />} />
          <Route path="/habits" element={<HabitsScreen />} />
          <Route path="/progress" element={<ProgressScreen />} />
          <Route path="/more" element={<MoreScreen profile={auth.profile} />} />
          <Route path="/more/projects" element={<ProjectsScreen />} />
          <Route path="/more/areas" element={<AreasScreen />} />
          <Route path="/more/rituals" element={<RitualsScreen />} />
          <Route path="/more/health" element={<HealthScreen />} />
          <Route path="/more/money" element={<MoneyScreen />} />
          <Route path="/more/reviews" element={<ReviewsScreen />} />
          <Route path="/more/daily-plans" element={<DailyPlansScreen />} />
          <Route path="/more/captures" element={<CapturesScreen />} />
          <Route path="/more/activity" element={<ActivityScreen />} />
        </Routes>
      </main>
      {showTabs && <TabBar />}
    </div>
  );
}


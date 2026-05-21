import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from './hooks/useAuth';
import { TabBar } from './components/TabBar';
import { LoadingScreen } from './components/LoadingScreen';
import { ErrorScreen } from './components/ErrorScreen';
import { getSettings } from './api/settings';
import OnboardingScreen from './screens/OnboardingScreen';
import TodayScreen from './screens/TodayScreen';
import InboxScreen from './screens/InboxScreen';
import HabitsScreen from './screens/HabitsScreen';
import HabitDetailScreen from './screens/HabitDetailScreen';
import ArchivedHabitsScreen from './screens/ArchivedHabitsScreen';
import ProgressScreen from './screens/ProgressScreen';
import MoreScreen from './screens/MoreScreen';
import ProjectsScreen from './screens/ProjectsScreen';
import ProjectDetailScreen from './screens/ProjectDetailScreen';
import AreasScreen from './screens/AreasScreen';
import RitualsScreen from './screens/RitualsScreen';
import HealthScreen from './screens/HealthScreen';
import MoneyScreen from './screens/MoneyScreen';
import DailyPlansScreen from './screens/DailyPlansScreen';
import CapturesScreen from './screens/CapturesScreen';
import ActivityScreen from './screens/ActivityScreen';
import SettingsScreen from './screens/SettingsScreen';
import { TrialBanner } from './components/TrialBanner';
import { PaywallSheet } from './components/PaywallSheet';
import { tg } from './lib/telegram';

export default function App() {
  const auth = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const settingsQ = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
    enabled: auth.status === 'ready',
    staleTime: 60_000,
  });

  // Telegram native back button
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

  // First-time user: show onboarding instead of the main app shell
  if (settingsQ.isLoading) return <LoadingScreen />;
  if (settingsQ.data && !settingsQ.data.onboarded_at) {
    return <OnboardingScreen profile={auth.profile} />;
  }

  const showTabs = ['/today', '/inbox', '/habits', '/progress', '/more'].includes(location.pathname);

  return (
    <div className="flex flex-col h-full bg-bg text-text">
      <TrialBanner />
      <main className="flex-1 overflow-y-auto pb-24" style={{ WebkitOverflowScrolling: 'touch' }}>
        <Routes>
          <Route path="/" element={<Navigate to="/today" replace />} />
          <Route path="/today" element={<TodayScreen profile={auth.profile} />} />
          <Route path="/inbox" element={<InboxScreen />} />
          <Route path="/habits" element={<HabitsScreen />} />
          <Route path="/habits/archived" element={<ArchivedHabitsScreen />} />
          <Route path="/habits/:id" element={<HabitDetailScreen />} />
          <Route path="/progress" element={<ProgressScreen />} />
          <Route path="/more" element={<MoreScreen profile={auth.profile} />} />
          <Route path="/more/projects" element={<ProjectsScreen />} />
          <Route path="/more/projects/:id" element={<ProjectDetailScreen />} />
          <Route path="/more/areas" element={<AreasScreen />} />
          <Route path="/more/rituals" element={<RitualsScreen />} />
          <Route path="/more/health" element={<HealthScreen />} />
          <Route path="/more/money" element={<MoneyScreen />} />
          <Route path="/more/daily-plans" element={<DailyPlansScreen />} />
          <Route path="/more/captures" element={<CapturesScreen />} />
          <Route path="/more/activity" element={<ActivityScreen />} />
          <Route path="/more/settings" element={<SettingsScreen profile={auth.profile} />} />
        </Routes>
      </main>
      {showTabs && <TabBar />}
      <PaywallSheet />
    </div>
  );
}

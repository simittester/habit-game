import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from './hooks/useAuth';
import { TabBar } from './components/TabBar';
import { LoadingScreen } from './components/LoadingScreen';
import { ErrorScreen } from './components/ErrorScreen';
import { getSettings } from './api/settings';
import { TrialBanner } from './components/TrialBanner';
import { PaywallSheet } from './components/PaywallSheet';
import { tg } from './lib/telegram';

const OnboardingScreen = lazy(() => import('./screens/OnboardingScreen'));
const TodayScreen = lazy(() => import('./screens/TodayScreen'));
const InboxScreen = lazy(() => import('./screens/InboxScreen'));
const HabitsScreen = lazy(() => import('./screens/HabitsScreen'));
const HabitDetailScreen = lazy(() => import('./screens/HabitDetailScreen'));
const ArchivedHabitsScreen = lazy(() => import('./screens/ArchivedHabitsScreen'));
const ProgressScreen = lazy(() => import('./screens/ProgressScreen'));
const MoreScreen = lazy(() => import('./screens/MoreScreen'));
const ProjectsScreen = lazy(() => import('./screens/ProjectsScreen'));
const ProjectDetailScreen = lazy(() => import('./screens/ProjectDetailScreen'));
const AreasScreen = lazy(() => import('./screens/AreasScreen'));
const RitualsScreen = lazy(() => import('./screens/RitualsScreen'));
const HealthScreen = lazy(() => import('./screens/HealthScreen'));
const MoneyScreen = lazy(() => import('./screens/MoneyScreen'));
const DailyPlansScreen = lazy(() => import('./screens/DailyPlansScreen'));
const CapturesScreen = lazy(() => import('./screens/CapturesScreen'));
const ActivityScreen = lazy(() => import('./screens/ActivityScreen'));
const SettingsScreen = lazy(() => import('./screens/SettingsScreen'));
const AdminScreen = lazy(() => import('./screens/AdminScreen'));

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
    return (
      <Suspense fallback={<LoadingScreen />}>
        <OnboardingScreen profile={auth.profile} />
      </Suspense>
    );
  }

  const showTabs = ['/today', '/inbox', '/habits', '/progress', '/more'].includes(location.pathname);

  return (
    <div className="flex flex-col h-full bg-bg text-text">
      <TrialBanner />
      <main className="flex-1 overflow-y-auto pb-24" style={{ WebkitOverflowScrolling: 'touch' }}>
        <Suspense fallback={<LoadingScreen />}>
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
            <Route path="/more/admin" element={<AdminScreen profile={auth.profile} />} />
          </Routes>
        </Suspense>
      </main>
      {showTabs && <TabBar />}
      <PaywallSheet />
    </div>
  );
}

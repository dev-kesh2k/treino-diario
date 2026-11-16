import { Navigate, Route, Routes } from 'react-router-dom';
import { Dumbbell } from 'lucide-react';
import { useAuth } from './auth';
import { TabLayout } from './ui';
import Login from './pages/Login';
import Home from './pages/Home';
import Programs from './pages/Programs';
import ProgramDetail from './pages/ProgramDetail';
import Workouts from './pages/Workouts';
import WorkoutDetail from './pages/WorkoutDetail';
import WorkoutRun from './pages/WorkoutRun';
import WorkoutEdit from './pages/WorkoutEdit';
import Exercises from './pages/Exercises';
import ProgressPage from './pages/Progress';
import Nutrition from './pages/Nutrition';
import Achievements from './pages/Achievements';
import Account from './pages/Account';
import Profile from './pages/Profile';
import Body from './pages/Body';
import Goals from './pages/Goals';
import Reminders from './pages/Reminders';
import History from './pages/History';
import Help from './pages/Help';
import { ArticleList, ArticleView } from './pages/Articles';
import AdminUsers from './pages/AdminUsers';

export default function App() {
  const { user, ready } = useAuth();

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-brand text-white">
        <Dumbbell size={48} className="animate-pulse" />
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-dvh w-full max-w-md md:max-w-2xl xl:max-w-3xl bg-[#faf9fd]">
      <Routes>
        {!user ? (
          <Route path="*" element={<Login />} />
        ) : (
          <>
            <Route element={<TabLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/programas" element={<Programs />} />
              <Route path="/programas/:id" element={<ProgramDetail />} />
              <Route path="/treinos" element={<Workouts />} />
              <Route path="/treinos/:id" element={<WorkoutDetail />} />
              <Route path="/exercicios" element={<Exercises />} />
              <Route path="/progresso" element={<ProgressPage />} />
              <Route path="/nutricao" element={<Nutrition />} />
              <Route path="/conquistas" element={<Achievements />} />
              <Route path="/conta" element={<Account />} />
              <Route path="/conta/perfil" element={<Profile />} />
              <Route path="/conta/corpo" element={<Body />} />
              <Route path="/conta/metas" element={<Goals />} />
              <Route path="/conta/lembretes" element={<Reminders />} />
              <Route path="/conta/historico" element={<History />} />
              <Route path="/conta/ajuda" element={<Help />} />
              <Route path="/conta/usuarios" element={<AdminUsers />} />
              <Route path="/artigos" element={<ArticleList />} />
              <Route path="/artigos/:slug" element={<ArticleView />} />
            </Route>
            <Route path="/treinos/novo" element={<WorkoutEdit />} />
            <Route path="/treinos/:id/editar" element={<WorkoutEdit />} />
            <Route path="/treinos/:id/executar" element={<WorkoutRun />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
      </Routes>
    </div>
  );
}

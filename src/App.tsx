import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import ProtectedRoute from "./components/common/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";
import LoginPage from "./pages/auth/LoginPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import CapturePage from "./pages/captures/CapturePage";
import CapturesListPage from "./pages/captures/CapturesListPage";
import ExpensesPage from "./pages/expenses/ExpensesPage";
import AcademicPage from "./pages/academic/AcademicPage";
import AssistantPage from "./pages/assistant/AssistantPage";
import TasksPage from "./pages/tasks/TasksPage";
import CalendarPage from "./pages/calendar/CalendarPage";
import EventsPage from "./pages/events/EventsPage";
import ExamsPage from "./pages/exams/ExamsPage";
import SettingsPage from "./pages/settings/SettingsPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route
              path="/"
              element={<Navigate to="/dashboard" replace />}
            />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/capture" element={<CapturePage />} />
            <Route path="/captures" element={<CapturesListPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/academic" element={<AcademicPage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/exams" element={<ExamsPage />} />
            <Route path="/assistant" element={<AssistantPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        <Route
          path="*"
          element={<div className="p-8">Page not found</div>}
        />
      </Routes>
    </BrowserRouter>
  );
}
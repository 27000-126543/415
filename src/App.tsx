import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import TaskList from "@/pages/TaskList";
import TaskCreate from "@/pages/TaskCreate";
import TaskDetail from "@/pages/TaskDetail";
import Monitor from "@/pages/Monitor";
import Reports from "@/pages/Reports";
import ReportDetail from "@/pages/ReportDetail";
import Approvals from "@/pages/Approvals";
import Alerts from "@/pages/Alerts";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="tasks" element={<TaskList />} />
          <Route path="tasks/create" element={<TaskCreate />} />
          <Route path="tasks/:id" element={<TaskDetail />} />
          <Route path="monitor" element={<Monitor />} />
          <Route path="reports" element={<Reports />} />
          <Route path="reports/:id" element={<ReportDetail />} />
          <Route path="approvals" element={<Approvals />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="settings" element={<div className="flex h-full items-center justify-center"><p className="text-deep-space-300">系统设置 - 即将推出</p></div>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

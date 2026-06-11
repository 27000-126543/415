import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Flame,
  LayoutDashboard,
  ListTodo,
  Activity,
  FileBarChart,
  ClipboardCheck,
  AlertTriangle,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { path: '/dashboard', label: '综合看板', icon: <LayoutDashboard className="w-5 h-5" /> },
  { path: '/tasks', label: '模拟任务', icon: <ListTodo className="w-5 h-5" /> },
  { path: '/monitor', label: '实时监控', icon: <Activity className="w-5 h-5" /> },
  { path: '/reports', label: '报告中心', icon: <FileBarChart className="w-5 h-5" /> },
  { path: '/approvals', label: '审批中心', icon: <ClipboardCheck className="w-5 h-5" /> },
  { path: '/alerts', label: '异常告警', icon: <AlertTriangle className="w-5 h-5" /> },
  { path: '/settings', label: '系统设置', icon: <Settings className="w-5 h-5" /> },
];

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <aside
      className={cn(
        'relative flex flex-col h-screen bg-deep-space-900/95 backdrop-blur-xl border-r border-deep-space-700/50 transition-all duration-300 ease-in-out',
        collapsed ? 'w-20' : 'w-64',
        className
      )}
    >
      <div className="absolute inset-0 bg-radial-glow pointer-events-none opacity-50" />

      <div className="relative z-10 flex flex-col h-full">
        <div
          className={cn(
            'flex items-center gap-3 px-5 py-5 border-b border-deep-space-700/50',
            collapsed && 'justify-center px-0'
          )}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-lava-500/30 rounded-xl blur-md animate-pulse-slow" />
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-lava-500 to-lava-600 flex items-center justify-center border border-lava-400/50 shadow-glow-orange">
              <Flame className="w-6 h-6 text-white" />
            </div>
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-display text-lg font-bold text-deep-space-50 tracking-wide">
                火山模拟
              </span>
              <span className="text-xs text-data-400 font-data">VOLCANO SIM</span>
            </div>
          )}
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={cn(
                      'relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group',
                      collapsed && 'justify-center px-0',
                      active
                        ? 'bg-data-500/15 text-data-400 shadow-glow-cyan border border-data-500/30'
                        : 'text-deep-space-200 hover:bg-deep-space-800/50 hover:text-deep-space-50 border border-transparent'
                    )}
                  >
                    {active && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-data-400 shadow-glow-cyan" />
                    )}
                    <span className={cn('flex-shrink-0', active && 'text-glow-cyan')}>
                      {item.icon}
                    </span>
                    {!collapsed && (
                      <span className="font-medium text-sm tracking-wide">{item.label}</span>
                    )}
                    {active && !collapsed && (
                      <div className="ml-auto w-2 h-2 rounded-full bg-data-400 animate-pulse" />
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-3 border-t border-deep-space-700/50">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              'w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-deep-space-300 hover:bg-deep-space-800/50 hover:text-deep-space-50 transition-all duration-200 border border-deep-space-700/30',
              collapsed && 'px-0'
            )}
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm">收起菜单</span>
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}

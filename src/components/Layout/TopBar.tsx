import { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  ChevronDown,
  User,
  LogOut,
  Settings,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { User as UserType } from '../../../shared/types';

interface TopBarProps {
  title?: string;
  unreadAlerts?: number;
  user?: UserType;
  className?: string;
}

const defaultUser: UserType = {
  id: '1',
  name: '张火山',
  email: 'volcanologist@example.com',
  role: 'volcanologist',
  createdAt: '2024-01-01T00:00:00Z',
};

const roleLabels: Record<string, string> = {
  admin: '系统管理员',
  volcanologist: '火山学家',
  mitigation_expert: '减灾专家',
  chief_scientist: '首席科学家',
  aviation: '航空管制员',
};

export default function TopBar({ title, unreadAlerts = 3, user = defaultUser, className }: TopBarProps) {
  const [searchFocused, setSearchFocused] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [alertMenuOpen, setAlertMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const alertMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (alertMenuRef.current && !alertMenuRef.current.contains(event.target as Node)) {
        setAlertMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header
      className={cn(
        'relative flex items-center justify-between gap-4 h-16 px-6 bg-deep-space-900/80 backdrop-blur-xl border-b border-deep-space-700/50',
        className
      )}
    >
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-30 pointer-events-none" />

      <div className="relative z-10 flex items-center gap-2">
        <h1 className="font-display text-xl font-semibold text-deep-space-50">
          {title || '综合看板'}
        </h1>
      </div>

      <div className="relative z-10 flex items-center gap-4">
        <div
          className={cn(
            'relative flex items-center transition-all duration-300',
            searchFocused ? 'w-80' : 'w-64'
          )}
        >
          <Search
            className={cn(
              'absolute left-3 w-4 h-4 transition-colors duration-200',
              searchFocused ? 'text-data-400' : 'text-deep-space-400'
            )}
          />
          <input
            type="text"
            placeholder="搜索任务、报告、告警..."
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className={cn(
              'w-full pl-10 pr-4 py-2 bg-deep-space-800/50 border rounded-lg text-sm text-deep-space-50 placeholder-deep-space-400 transition-all duration-200',
              searchFocused
                ? 'border-data-500/50 ring-1 ring-data-500/30 shadow-glow-cyan'
                : 'border-deep-space-600/50 hover:border-deep-space-500/50'
            )}
          />
        </div>

        <div className="relative" ref={alertMenuRef}>
          <button
            onClick={() => setAlertMenuOpen(!alertMenuOpen)}
            className="relative p-2.5 rounded-xl text-deep-space-300 hover:text-deep-space-50 hover:bg-deep-space-800/50 transition-all duration-200 border border-transparent hover:border-deep-space-600/50"
          >
            <Bell className="w-5 h-5" />
            {unreadAlerts > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-danger-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-deep-space-900 animate-pulse">
                {unreadAlerts > 99 ? '99+' : unreadAlerts}
              </span>
            )}
          </button>

          {alertMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 glass-card border border-deep-space-600/50 overflow-hidden z-50 animate-slide-up">
              <div className="px-4 py-3 border-b border-deep-space-700/50">
                <h3 className="font-display font-semibold text-deep-space-50">预警通知</h3>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="px-4 py-3 border-b border-deep-space-700/30 hover:bg-deep-space-800/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 mt-2 rounded-full bg-lava-500 animate-pulse" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-deep-space-100 font-medium">
                          喷发柱高度超过阈值
                        </p>
                        <p className="text-xs text-deep-space-400 mt-1">
                          任务 #{1000 + i} · {i}分钟前
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-3 border-t border-deep-space-700/50">
                <button className="w-full text-sm text-data-400 hover:text-data-300 transition-colors font-medium">
                  查看全部告警
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-3 px-3 py-1.5 rounded-xl hover:bg-deep-space-800/50 transition-all duration-200 border border-transparent hover:border-deep-space-600/50"
          >
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-data-500 to-data-600 flex items-center justify-center border border-data-400/50">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-data-400 border-2 border-deep-space-900" />
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-deep-space-50 leading-tight">
                {user.name}
              </p>
              <p className="text-xs text-deep-space-400">{roleLabels[user.role] || user.role}</p>
            </div>
            <ChevronDown
              className={cn(
                'w-4 h-4 text-deep-space-400 transition-transform duration-200',
                userMenuOpen && 'rotate-180'
              )}
            />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 glass-card border border-deep-space-600/50 overflow-hidden z-50 animate-slide-up">
              <div className="px-4 py-3 border-b border-deep-space-700/50">
                <p className="text-sm font-medium text-deep-space-50">{user.name}</p>
                <p className="text-xs text-deep-space-400 mt-0.5">{user.email}</p>
              </div>
              <div className="py-1">
                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-deep-space-200 hover:bg-deep-space-800/50 hover:text-deep-space-50 transition-colors">
                  <User className="w-4 h-4" />
                  个人资料
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-deep-space-200 hover:bg-deep-space-800/50 hover:text-deep-space-50 transition-colors">
                  <Settings className="w-4 h-4" />
                  账户设置
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-deep-space-200 hover:bg-deep-space-800/50 hover:text-deep-space-50 transition-colors">
                  <HelpCircle className="w-4 h-4" />
                  帮助中心
                </button>
              </div>
              <div className="border-t border-deep-space-700/50 py-1">
                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-danger-400 hover:bg-danger-500/10 transition-colors">
                  <LogOut className="w-4 h-4" />
                  退出登录
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

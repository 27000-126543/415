import { Outlet, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

interface LayoutProps {
  className?: string;
}

const pageTitles: Record<string, string> = {
  '/dashboard': '综合看板',
  '/tasks': '模拟任务',
  '/monitor': '实时监控',
  '/reports': '报告中心',
  '/approvals': '审批中心',
  '/alerts': '异常告警',
  '/settings': '系统设置',
};

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];
  for (const path of Object.keys(pageTitles)) {
    if (pathname.startsWith(path + '/')) {
      return pageTitles[path];
    }
  }
  return '火山喷发模拟平台';
}

export default function Layout({ className }: LayoutProps) {
  const location = useLocation();
  const pageTitle = getPageTitle(location.pathname);

  return (
    <div className={cn('flex h-screen overflow-hidden bg-deep-space-900', className)}>
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar title={pageTitle} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="min-h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

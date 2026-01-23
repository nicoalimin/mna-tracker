"use client";

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarInset,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from '@/components/ui/sidebar';
import {
  Briefcase,
  LayoutDashboard,
  GitBranch,
  Database,
  Bot,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatbotWidget } from '@/components/chat/ChatbotWidget';

interface DashboardLayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'AI Discovery', href: '/ai-discovery', icon: Bot },
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Pipeline', href: '/pipeline', icon: GitBranch },
  { name: 'Master Data', href: '/master-data', icon: Database },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar className="border-r border-sidebar-border">
          <SidebarHeader className="border-b border-sidebar-border p-4">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary">
                <Briefcase className="h-5 w-5 text-sidebar-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-sidebar-foreground">M&A Tracker</span>
                <span className="text-xs text-sidebar-foreground/60">Deal Pipeline</span>
              </div>
            </Link>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="text-sidebar-foreground/50">Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigation.map((item) => {
                    // Simple active check for Next.js
                    const isActive = pathname === item.href ||
                      (item.href !== '/dashboard' && pathname?.startsWith(item.href));
                    const isAIDiscovery = item.href === '/ai-discovery';
                    return (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          className={cn(
                            'transition-colors',
                            isAIDiscovery && 'text-purple-400 hover:text-purple-300 hover:bg-purple-500/10',
                            isActive && !isAIDiscovery && 'bg-sidebar-accent text-sidebar-accent-foreground',
                            isActive && isAIDiscovery && 'bg-purple-500/20 text-purple-300'
                          )}
                        >
                          <Link href={item.href}>
                            <item.icon className={cn("h-4 w-4", isAIDiscovery && "text-purple-400")} />
                            <span>{item.name}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <SidebarInset className="flex flex-1 flex-col">
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </SidebarInset>

        {/* Chatbot Widget - shown on all pages except AI Discovery */}
        {pathname !== '/ai-discovery' && <ChatbotWidget />}
      </div>
    </SidebarProvider>
  );
}

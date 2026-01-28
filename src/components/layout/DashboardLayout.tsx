'use client';

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
  SidebarFooter,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  Briefcase,
  LayoutDashboard,
  GitBranch,
  Database,
  Bot,
  LogOut,
  PanelLeftOpen,
  Inbox,
  Send,
  Search,
  FileSliders,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatbotWidget } from '@/components/chat/ChatbotWidget';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';

interface DashboardLayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'AI Discovery', href: '/ai-discovery', icon: Bot },
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Pipeline', href: '/pipeline', icon: GitBranch },
  { name: 'Master Data', href: '/master-data', icon: Database },
  { name: 'Inbound Deal Sourcing', href: '#', icon: Inbox, disabled: true },
  { name: 'Outbound Deal Sourcing', href: '#', icon: Send, disabled: true },
  { name: 'Company Deep Dive', href: '#', icon: Search, disabled: true },
  { name: 'Slide Generator', href: '#', icon: FileSliders, disabled: true },
  { name: 'Banker Relations', href: '#', icon: Users, disabled: true },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <Sidebar collapsible="icon" className="border-r border-sidebar-border">
            <SidebarHeader className="border-b border-sidebar-border p-2 group-data-[state=expanded]:p-4">
              <div className="flex items-center justify-between group-data-[state=collapsed]:flex-col group-data-[state=collapsed]:gap-2">
                <Link href="/dashboard" className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary shrink-0">
                    <Briefcase className="h-4 w-4 text-sidebar-primary-foreground" />
                  </div>
                  <div className="flex flex-col group-data-[state=collapsed]:hidden">
                    <span className="text-sm font-semibold text-sidebar-foreground">M&A Tracker</span>
                    <span className="text-xs text-sidebar-foreground/60">Deal Pipeline</span>
                  </div>
                </Link>
                <SidebarTrigger className="h-8 w-8 shrink-0" />
              </div>
            </SidebarHeader>

            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel className="text-sidebar-foreground/50">Navigation</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {navigation.map((item) => {
                      const isActive = pathname === item.href ||
                        (item.href !== '/dashboard' && item.href !== '#' && pathname.startsWith(item.href));
                      const isAIDiscovery = item.href === '/ai-discovery';
                      const isDisabled = 'disabled' in item && item.disabled;

                      return (
                        <SidebarMenuItem key={item.name}>
                          <SidebarMenuButton
                            asChild={!isDisabled}
                            isActive={isActive}
                            className={cn(
                              'transition-colors',
                              isDisabled && 'opacity-50 cursor-not-allowed',
                              isAIDiscovery && !isDisabled && 'text-purple-400 hover:text-purple-300 hover:bg-purple-500/10',
                              isActive && !isAIDiscovery && 'bg-sidebar-accent text-sidebar-accent-foreground',
                              isActive && isAIDiscovery && 'bg-purple-500/20 text-purple-300'
                            )}
                          >
                            {isDisabled ? (
                              <div className="flex items-center gap-2">
                                <item.icon className="h-4 w-4" />
                                <span>{item.name}</span>
                              </div>
                            ) : (
                              <Link href={item.href}>
                                <item.icon className={cn("h-4 w-4", isAIDiscovery && "text-purple-400")} />
                                <span>{item.name}</span>
                              </Link>
                            )}
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>



            <SidebarFooter className="border-t border-sidebar-border p-2 group-data-[state=expanded]:p-4">
              <div className="flex flex-col gap-4">
                {/* User info - hidden when collapsed */}
                <div className="flex items-center justify-between group-data-[state=collapsed]:hidden">
                  {user && (
                    <div className="flex flex-col min-w-0">
                      <p className="truncate text-sm font-medium text-sidebar-foreground">
                        {user.name}
                      </p>
                      <p className="truncate text-xs text-sidebar-foreground/60">
                        {user.email}
                      </p>
                    </div>
                  )}
                  <ThemeToggle />
                </div>
                {/* Sign out button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:p-2"
                >
                  <LogOut className="h-4 w-4 group-data-[state=expanded]:mr-2" />
                  <span className="group-data-[state=collapsed]:hidden">Sign Out</span>
                </Button>
              </div>
            </SidebarFooter>
          </Sidebar>

          <SidebarInset className="flex flex-1 flex-col min-w-0">
            <main className="flex-1 overflow-auto min-w-0 w-full">
              {children}
            </main>
          </SidebarInset>

          {/* Chatbot Widget - shown on all pages except AI Discovery */}
          {pathname !== '/ai-discovery' && <ChatbotWidget />}
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
}

import React from 'react';
import { Grid2x2PlusIcon, MenuIcon, LogOut } from 'lucide-react';
import { Sheet, SheetContent, SheetFooter } from '@/components/ui/sheet';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { clearSession } from '@/lib/api';

export interface FloatingHeaderLink {
  label: string;
  tab?: string;
  href?: string;
}

interface FloatingHeaderProps {
  links?: FloatingHeaderLink[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  pendingCount?: number;
}

export function FloatingHeader({ links, activeTab, onTabChange, pendingCount }: FloatingHeaderProps) {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();

  const defaultLinks: FloatingHeaderLink[] = [
    { label: 'Dashboard', tab: 'overview' },
    { label: 'Pending Agreements', tab: 'agreements' },
    { label: 'My Verification', tab: 'verification' },
    { label: 'Profile', tab: 'profile' },
  ];

  const navLinks = links ?? defaultLinks;

  const handleClick = (link: FloatingHeaderLink) => {
    if (link.tab && onTabChange) {
      onTabChange(link.tab);
    } else if (link.href) {
      navigate(link.href);
    }
    setOpen(false);
  };

  const handleLogout = () => {
    clearSession();
    navigate('/');
  };

  return (
    <header
      className={cn(
        'sticky top-4 z-50 mx-auto w-full max-w-4xl',
        'rounded-xl border border-border shadow-lg',
        'bg-background/90 supports-[backdrop-filter]:bg-background/75 backdrop-blur-lg',
      )}
    >
      <nav className="mx-auto flex items-center justify-between px-4 py-2">
        {/* Logo */}
        <button
          onClick={() => navigate('/user/dashboard')}
          className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 transition-colors"
        >
          <span style={{ fontFamily: "'Samarkan', serif", fontSize: "1.35rem", letterSpacing: "0.05em", color: "hsl(var(--primary))" }}>Suraksh</span>
        </button>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <button
              key={link.tab ?? link.href}
              onClick={() => handleClick(link)}
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'sm' }),
                'text-xs relative',
                activeTab === link.tab && 'bg-accent text-accent-foreground'
              )}
            >
              {link.label}
              {link.tab === 'agreements' && (pendingCount ?? 0) > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleLogout} className="hidden lg:flex gap-1.5 text-xs">
            <LogOut className="w-3.5 h-3.5" /> Logout
          </Button>
          <Sheet open={open} onOpenChange={setOpen}>
            <Button size="icon" variant="outline" onClick={() => setOpen(!open)} className="lg:hidden h-8 w-8">
              <MenuIcon className="w-4 h-4" />
            </Button>
            <SheetContent side="left" className="bg-background/95 backdrop-blur-lg">
              <div className="grid gap-y-2 overflow-y-auto px-4 pt-12 pb-5">
                {navLinks.map((link) => (
                  <button
                    key={link.tab ?? link.href}
                    onClick={() => handleClick(link)}
                    className={cn(
                      buttonVariants({ variant: 'ghost', className: 'justify-start' }),
                      activeTab === link.tab && 'bg-accent text-accent-foreground'
                    )}
                  >
                    {link.label}
                    {link.tab === 'agreements' && (pendingCount ?? 0) > 0 && (
                      <span className="ml-2 px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                        {pendingCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <SheetFooter>
                <Button variant="outline" onClick={handleLogout} className="gap-1.5">
                  <LogOut className="w-4 h-4" /> Logout
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}

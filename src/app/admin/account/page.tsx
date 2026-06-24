'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Save, Loader2, Sun, Moon, Monitor } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { useAdmin } from '@/hooks/useAdmin';
import { useTheme, type Theme } from '@/components/providers/ThemeProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const THEME_OPTIONS: { value: Theme; icon: typeof Sun; label: string }[] = [
  { value: 'light', icon: Sun, label: 'Light' },
  { value: 'dark', icon: Moon, label: 'Dark' },
  { value: 'system', icon: Monitor, label: 'System' },
];

export default function AdminAccountPage() {
  const t = useTranslations('admin');
  const { admin } = useAdmin();
  const { theme, setTheme } = useTheme();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 8 characters' });
      return;
    }

    setIsChangingPassword(true);
    try {
      await adminApi.patch('/admin/auth/password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPasswordMessage({ type: 'success', text: 'Password changed successfully' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to change password' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-foreground">{t('account')}</h1>

      {/* Profile info */}
      <Card className="bg-card border-border">
        <CardHeader className="border-b border-border pb-3">
          <CardTitle className="text-sm text-foreground">Profile</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground">Name</Label>
            <Input value={admin?.name ?? ''} disabled className="bg-muted border-border text-foreground disabled:opacity-70" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground">Email</Label>
            <Input value={admin?.email ?? ''} disabled className="bg-muted border-border text-foreground disabled:opacity-70" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground">Role</Label>
            <Input value={admin?.role ?? ''} disabled className="bg-muted border-border text-foreground disabled:opacity-70 capitalize" />
          </div>
        </CardContent>
      </Card>

      {/* Theme */}
      <Card className="bg-card border-border">
        <CardHeader className="border-b border-border pb-3">
          <CardTitle className="text-sm text-foreground">Appearance</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <Label className="text-sm text-muted-foreground mb-3 block">Theme</Label>
          <div className="flex gap-2">
            {THEME_OPTIONS.map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={cn(
                  'flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors',
                  theme === value
                    ? 'border-[#DC2626] bg-[#DC2626]/10 text-[#DC2626]'
                    : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <Icon className="size-4" />
                {label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Change password */}
      <Card className="bg-card border-border">
        <CardHeader className="border-b border-border pb-3">
          <CardTitle className="text-sm text-foreground">Change Password</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Current Password</Label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="bg-muted border-border text-foreground"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="bg-muted border-border text-foreground"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Confirm New Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="bg-muted border-border text-foreground"
              />
            </div>

            {passwordMessage && (
              <p className={cn(
                'rounded-lg border px-3 py-2 text-sm',
                passwordMessage.type === 'success'
                  ? 'bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400'
                  : 'bg-[#DC2626]/10 border-[#DC2626]/30 text-[#DC2626]'
              )}>
                {passwordMessage.text}
              </p>
            )}

            <Button
              type="submit"
              disabled={isChangingPassword}
              className="bg-[#DC2626] text-white hover:bg-[#ef4444] disabled:opacity-50 gap-1.5"
            >
              {isChangingPassword ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {isChangingPassword ? 'Saving...' : 'Change Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

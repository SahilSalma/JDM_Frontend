'use client';

import { useState, type FormEvent } from 'react';
import { Send, Loader2, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

function validateEmail(email: string): string | null {
  if (!email) return 'Email is required';
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) return 'Please enter a valid email address';
  return null;
}

function validatePhone(phone: string): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) return 'Phone number must be 7-15 digits';
  return null;
}

export function ContactForm() {
  const t = useTranslations('contact');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const validate = (): boolean => {
    const newErrors: Record<string, string | null> = {
      email: validateEmail(form.email),
      phone: validatePhone(form.phone),
    };
    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setStatus('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send');
      }
      setStatus('success');
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
      setErrors({});
    } catch {
      setStatus('error');
    }
  };

  const handleChange = (field: string, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
    if (errors[field]) {
      const validator = field === 'email' ? validateEmail : field === 'phone' ? validatePhone : null;
      if (validator) setErrors((p) => ({ ...p, [field]: validator(value) }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label className="text-muted-foreground">{t('form.name')}</Label>
        <Input
          required
          value={form.name}
          onChange={(e) => handleChange('name', e.target.value)}
          className="border-border bg-input text-foreground placeholder:text-muted-foreground/40 focus:border-[#DC2626]"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-muted-foreground">{t('form.email')}</Label>
        <Input
          required
          type="email"
          value={form.email}
          onChange={(e) => handleChange('email', e.target.value)}
          className={`border-border bg-input text-foreground placeholder:text-muted-foreground/40 focus:border-[#DC2626] ${errors.email ? 'border-red-500/50 focus:border-red-500' : ''}`}
        />
        {errors.email && (
          <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
            <AlertCircle className="size-3" />
            {errors.email}
          </p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label className="text-muted-foreground">{t('form.phone')}</Label>
        <Input
          type="tel"
          value={form.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          className={`border-border bg-input text-foreground placeholder:text-muted-foreground/40 focus:border-[#DC2626] ${errors.phone ? 'border-red-500/50 focus:border-red-500' : ''}`}
        />
        {errors.phone && (
          <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
            <AlertCircle className="size-3" />
            {errors.phone}
          </p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label className="text-muted-foreground">{t('form.subject')}</Label>
        <Input
          required
          value={form.subject}
          onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
          className="border-border bg-input text-foreground placeholder:text-muted-foreground/40 focus:border-[#DC2626]"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-muted-foreground">{t('form.message')}</Label>
        <Textarea
          required
          rows={5}
          value={form.message}
          onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
          className="border-border bg-input text-foreground placeholder:text-muted-foreground/40 focus:border-[#DC2626]"
        />
      </div>

      {status === 'success' && (
        <p className="rounded border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-600 dark:text-green-400">
          Message sent! We will get back to you shortly.
        </p>
      )}
      {status === 'error' && (
        <p className="rounded border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          Failed to send. Please try again or call us directly.
        </p>
      )}

      <Button
        type="submit"
        disabled={status === 'sending'}
        className="w-full bg-[#DC2626] text-white hover:bg-[#ef4444]"
        size="lg"
      >
        {status === 'sending' ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Send className="mr-2 size-4" />
            {t('form.send')}
          </>
        )}
      </Button>
    </form>
  );
}

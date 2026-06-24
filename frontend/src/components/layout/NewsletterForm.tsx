'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

interface NewsletterFormProps {
  placeholder: string;
  buttonLabel: string;
  successMessage: string;
  errorMessage: string;
}

export default function NewsletterForm({
  placeholder,
  buttonLabel,
  successMessage,
  errorMessage,
}: NewsletterFormProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('loading');
    try {
      await api.post('/newsletter/subscribe', { email });
      setStatus('success');
      setEmail('');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <p className="text-sm font-medium text-[#DC2626]">{successMessage}</p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-md gap-2"
      noValidate
    >
      <Input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={placeholder}
        required
        disabled={status === 'loading'}
        className="flex-1 border-border bg-input text-foreground placeholder:text-muted-foreground/40 focus-visible:border-[#DC2626] focus-visible:ring-[#DC2626]/20"
      />
      <Button
        type="submit"
        disabled={status === 'loading'}
        className="shrink-0 bg-[#DC2626] text-white hover:bg-[#ef4444] disabled:opacity-60"
      >
        {status === 'loading' ? '...' : buttonLabel}
      </Button>
      {status === 'error' && (
        <p className="absolute mt-1 text-xs text-red-400">{errorMessage}</p>
      )}
    </form>
  );
}

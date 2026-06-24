'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

export interface SendEmailPayload {
  to: string;
  subject: string;
  body: string;
  templateId?: string;
  attachments?: string[];
}

interface UseEmailSendReturn {
  sendEmail: (payload: SendEmailPayload) => Promise<void>;
  templates: EmailTemplate[];
  isLoading: boolean;
  error: string | null;
  success: boolean;
  reset: () => void;
}

export function useEmailSend(): UseEmailSendReturn {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api
      .get<EmailTemplate[]>('/admin/email/templates')
      .then((data) => setTemplates(data))
      .catch(() => setTemplates([]));
  }, []);

  const sendEmail = useCallback(async (payload: SendEmailPayload) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await api.post('/admin/email/send', payload);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send email');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setSuccess(false);
  }, []);

  return { sendEmail, templates, isLoading, error, success, reset };
}

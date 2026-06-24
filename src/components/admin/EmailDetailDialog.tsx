'use client';

import { useState } from 'react';
import { X, RefreshCw, Mail, Clock, User, Tag, AlertCircle, Paperclip } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { adminApi } from '@/lib/api';

interface EmailLogEntry {
  id: string;
  recipient_email: string;
  subject: string;
  template_used: string | null;
  body_content: string | null;
  has_attachment?: boolean;
  sent_at: string;
  status: 'sent' | 'failed' | 'bounced';
  order_id: string | null;
}

interface EmailDetailDialogProps {
  email: EmailLogEntry | null;
  open: boolean;
  onClose: () => void;
  onRetry?: () => void;
}

export default function EmailDetailDialog({ email, open, onClose, onRetry }: EmailDetailDialogProps) {
  const [retrying, setRetrying] = useState(false);

  if (!email) return null;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await adminApi.post(`/admin/email/retry/${email.id}`);
      toast.success('Email resent successfully');
      onRetry?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to resend email';
      toast.error(msg);
    } finally {
      setRetrying(false);
    }
  };

  const isFailed = email.status === 'failed';
  const canRetry = isFailed && email.body_content;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Mail className="size-4 text-[#DC2626]" />
            Email Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status header */}
          <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
            isFailed
              ? 'border-red-500/20 bg-red-500/5'
              : 'border-green-500/20 bg-green-500/5'
          }`}>
            {isFailed ? (
              <AlertCircle className="size-4 text-red-400 shrink-0" />
            ) : (
              <Mail className="size-4 text-green-400 shrink-0" />
            )}
            <span className={`text-sm font-semibold ${
              isFailed ? 'text-red-400' : 'text-green-400'
            }`}>
              {email.status.charAt(0).toUpperCase() + email.status.slice(1)}
            </span>
            {canRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                disabled={retrying}
                className="ml-auto border-border text-xs gap-1.5"
              >
                <RefreshCw className={`size-3.5 ${retrying ? 'animate-spin' : ''}`} />
                {retrying ? 'Resending...' : 'Retry'}
              </Button>
            )}
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <User className="size-3" />
                Recipient
              </div>
              <p className="text-foreground font-medium truncate" title={email.recipient_email}>
                {email.recipient_email}
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <Clock className="size-3" />
                Sent at
              </div>
              <p className="text-foreground">{formatDate(email.sent_at)}</p>
            </div>
            <div className="space-y-1 col-span-2">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <Tag className="size-3" />
                Subject
              </div>
              <p className="text-foreground font-medium">{email.subject}</p>
            </div>
            {email.template_used && (
              <div className="space-y-1 col-span-2">
                <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                  <Tag className="size-3" />
                  Template
                </div>
                <p className="text-foreground text-xs font-mono">{email.template_used}</p>
              </div>
            )}
            {email.has_attachment && (
              <div className="space-y-1 col-span-2">
                <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                  <Paperclip className="size-3" />
                  Attachment
                </div>
                <p className="rounded-md border border-border bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground flex items-center gap-2">
                  <Paperclip className="size-3.5 text-[#DC2626]" />
                  We sent an attachment with this email.
                </p>
              </div>
            )}
            {email.order_id && (
              <div className="space-y-1 col-span-2">
                <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                  <Tag className="size-3" />
                  Order ID
                </div>
                <p className="text-foreground text-xs font-mono truncate">{email.order_id}</p>
              </div>
            )}
          </div>

          {/* Email body preview */}
          {email.body_content ? (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <Mail className="size-3" />
                Preview
              </div>
              <div className="rounded-lg border border-border overflow-hidden">
                <iframe
                  srcDoc={email.body_content}
                  className="w-full"
                  style={{ minHeight: '300px' }}
                  title="Email preview"
                />
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-muted p-4 text-center text-sm text-muted-foreground">
              No body content available for this email.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

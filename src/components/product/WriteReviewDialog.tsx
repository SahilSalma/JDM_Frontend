'use client';

import { useState, useRef } from 'react';
import { StarRating } from './StarRating';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Star, Upload, X, ShoppingBag, CheckCircle2 } from 'lucide-react';
import { useReviewEligibility, useSubmitReview } from '@/hooks/useReviews';
import type { EligibleProduct } from '@/hooks/useReviews';
import Image from 'next/image';

interface WriteReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId?: string;
  productTitle?: string;
  onSuccess?: () => void;
}

type Step = 'email' | 'select-product' | 'write-review' | 'success';

export function WriteReviewDialog({
  open,
  onOpenChange,
  productId,
  productTitle,
  onSuccess,
}: WriteReviewDialogProps) {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [selectedItem, setSelectedItem] = useState<EligibleProduct | null>(null);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [emailError, setEmailError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { eligible, isChecking, checkEligibility } = useReviewEligibility();
  const { isSubmitting, submitReview } = useSubmitReview();

  const resetForm = () => {
    setStep('email');
    setEmail('');
    setSelectedItem(null);
    setRating(0);
    setTitle('');
    setContent('');
    setImageFiles([]);
    setImagePreviews([]);
    setEmailError('');
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(resetForm, 300);
  };

  const handleEmailSubmit = async () => {
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    setEmailError('');
    try {
      const items = await checkEligibility(email, productId);
      if (items.length === 0) {
        toast.error('No eligible products found for this email. Please check your email or try a different one.');
        return;
      }

      if (productId && items.some((i) => i.product_id === productId)) {
        const match = items.find((i) => i.product_id === productId)!;
        setSelectedItem(match);
        setStep('write-review');
      } else if (items.length === 1) {
        setSelectedItem(items[0]);
        setStep('write-review');
      } else {
        setStep('select-product');
      }
    } catch {
      toast.error('Failed to verify eligibility. Please try again.');
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 5 - imageFiles.length;
    const toAdd = files.slice(0, remaining);

    setImageFiles((prev) => [...prev, ...toAdd]);
    toAdd.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result;
        if (result) {
          setImagePreviews((prev) => [...prev, result as string]);
        }
      };
      reader.readAsDataURL(f);
    });
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    if (!content.trim()) {
      toast.error('Please write your review');
      return;
    }
    if (!selectedItem) return;

    try {
      const formData = new FormData();
      const data = {
        product_id: selectedItem.product_id,
        order_id: selectedItem.order_id,
        customer_email: email,
        rating,
        title: title.trim() || undefined,
        content: content.trim(),
      };
      formData.append('data', JSON.stringify(data));

      for (const file of imageFiles) {
        formData.append('images', file);
      }

      const res = await fetch('/api/reviews', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Failed to submit review');

      setStep('success');
      onSuccess?.();
      setTimeout(handleClose, 3000);
    } catch {
      toast.error('Failed to submit review. Please try again.');
    }
  };

  const canReviewHere = productId && eligible.some((i) => i.product_id === productId);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            {step === 'email' && <>Write a Review</>}
            {step === 'select-product' && <>Select a Product</>}
            {step === 'write-review' && <>Write Your Review</>}
            {step === 'success' && <>Review Submitted!</>}
          </DialogTitle>
          <DialogDescription>
            {step === 'email' && 'Enter your email to verify your purchase'}
            {step === 'select-product' && 'Choose a product you purchased to review'}
            {step === 'write-review' && selectedItem && `Review: ${selectedItem.product_title}`}
            {step === 'success' && 'Thank you for your feedback!'}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Email */}
        {step === 'email' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="review-email">Email Address</Label>
              <Input
                id="review-email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleEmailSubmit()}
                className="bg-muted border-border"
              />
              {emailError && <p className="text-xs text-[#DC2626]">{emailError}</p>}
            </div>
            <p className="text-xs text-muted-foreground">
              We&apos;ll look up your orders to find products you can review.
            </p>
            <Button
              onClick={handleEmailSubmit}
              disabled={isChecking || !email.trim()}
              className="w-full bg-[#DC2626] text-white hover:bg-[#ef4444]"
            >
              {isChecking ? (
                <><Loader2 className="mr-2 size-4 animate-spin" /> Verifying...</>
              ) : (
                'Continue'
              )}
            </Button>
          </div>
        )}

        {/* Step 2: Select Product */}
        {step === 'select-product' && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {productId && !canReviewHere
                ? 'You haven\'t purchased this product. Here are your eligible products:'
                : 'Select a product to review:'}
            </p>
            <div className="max-h-[300px] space-y-2 overflow-y-auto">
              {eligible.map((item) => (
                <button
                  key={`${item.product_id}-${item.order_id}`}
                  type="button"
                  onClick={() => {
                    setSelectedItem(item);
                    setStep('write-review');
                  }}
                  className="flex w-full items-center gap-3 rounded-lg border border-border bg-muted/30 p-3 text-left transition-colors hover:border-[#DC2626]/40 hover:bg-[#DC2626]/5"
                >
                  <ShoppingBag className="size-5 shrink-0 text-[#DC2626]" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{item.product_title}</p>
                    <p className="text-xs text-muted-foreground">
                      Order #{item.order_number} &middot; {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </button>
              ))}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setStep('email')} className="text-muted-foreground">
              Back
            </Button>
          </div>
        )}

        {/* Step 3: Write Review */}
        {step === 'write-review' && (
          <div className="space-y-4">
            {selectedItem && (
              <div className="rounded-lg bg-muted/30 p-3 text-sm">
                <p className="font-medium text-foreground">{selectedItem.product_title}</p>
                <p className="text-xs text-muted-foreground">Order #{selectedItem.order_number}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="transition-transform hover:scale-110 active:scale-95"
                  >
                    <Star
                      className={`size-8 ${
                        star <= rating
                          ? 'fill-[#DC2626] text-[#DC2626]'
                          : 'fill-none text-muted-foreground/30'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="review-title">Title (optional)</Label>
              <Input
                id="review-title"
                placeholder="Great product!"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                className="bg-muted border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="review-content">Review</Label>
              <Textarea
                id="review-content"
                placeholder="Share your experience with this product..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={5000}
                rows={4}
                className="bg-muted border-border resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">{content.length}/5000</p>
            </div>

            <div className="space-y-2">
              <Label>Photos (optional, max 5)</Label>
              <div className="flex flex-wrap gap-2">
                {imagePreviews.map((preview, i) => (
                  <div key={i} className="group relative h-16 w-16 overflow-hidden rounded-lg border border-border">
                    <Image
                      src={preview}
                      alt={`Upload ${i + 1}`}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
                {imageFiles.length < 5 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 text-muted-foreground hover:border-[#DC2626]/40 hover:text-[#DC2626] transition-colors"
                  >
                    <Upload className="size-5" />
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={handleImageSelect}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setStep('select-product')} className="text-muted-foreground">
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || rating === 0 || !content.trim()}
                className="flex-1 bg-[#DC2626] text-white hover:bg-[#ef4444]"
              >
                {isSubmitting ? (
                  <><Loader2 className="mr-2 size-4 animate-spin" /> Submitting...</>
                ) : (
                  'Submit Review'
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 'success' && (
          <div className="flex flex-col items-center gap-3 py-6">
            <CheckCircle2 className="size-12 text-green-500" />
            <p className="text-center text-sm text-muted-foreground">
              Your review has been submitted and will appear shortly.
            </p>
            <Button
              onClick={handleClose}
              className="bg-[#DC2626] text-white hover:bg-[#ef4444]"
            >
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

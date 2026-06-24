'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { 
  Send, 
  Eye, 
  Paperclip, 
  X, 
  Mail, 
  FileCode, 
  Users, 
  Plus, 
  Trash2, 
  Save, 
  Edit, 
  Check, 
  AlertCircle, 
  ArrowRight,
  Sliders
} from 'lucide-react';
import Handlebars from 'handlebars';
import { useEmailSend } from '@/hooks/useEmailSend';
import { adminApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import RichTextEditor from '@/components/admin/RichTextEditor';
import EmailDetailDialog from '@/components/admin/EmailDetailDialog';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { toast } from 'sonner';

interface SentEmail {
  id: string;
  recipient_email: string;
  subject: string;
  body_content: string | null;
  has_attachment?: boolean;
  sent_at: string;
  template_used: string | null;
  status: string;
  order_id: string | null;
}

interface SentEmailsResponse {
  success: boolean;
  data: SentEmail[];
}

interface EmailTemplate {
  id: string;
  template_name: string;
  subject_template: string;
  html_template: string;
  description: string;
  is_active: boolean;
}

interface Recipient {
  id: string;
  email: string;
  name: string;
  is_active: boolean;
}

const PARTIAL_HEADER = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
       style="background-color:{{colors.containerBg}}; margin:0; padding:0;">
  <tr>
    <td align="center" style="padding:0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
             style="width:100%; margin:0 auto;">
        <tr>
          <td style="height:4px; background-color:#DC2626; font-size:0; line-height:0;">&nbsp;</td>
        </tr>
        <tr>
          <td align="center" style="padding:28px 32px 24px 32px; background-color:{{colors.containerBg}};">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td align="center">
                  <a href="{{frontendUrl}}" target="_blank" style="text-decoration:none; display:inline-block;">
                    <img src="{{logoUrl}}" 
                         alt="{{#if logoAlt}}{{logoAlt}}{{else}}JDM Tokyo Motorsports{{/if}}" 
                         width="{{#if logoWidth}}{{logoWidth}}{{else}}220{{/if}}" 
                         style="display:block; border:0; width:{{#if logoWidth}}{{logoWidth}}{{else}}220{{/if}}px; max-width:100%; height:auto; outline:none; text-decoration:none;" />
                  </a>
                  <div style="margin:10px auto 0 auto; width:56px; height:3px;
                              background-color:#DC2626; font-size:0; line-height:0;">&nbsp;</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="height:1px; background-color:{{colors.cardBorder}}; font-size:0; line-height:0;">&nbsp;</td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;

const PARTIAL_FOOTER = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
       style="background-color:{{colors.containerBg}}; margin:0; padding:0;">
  <tr>
    <td align="center" style="padding:0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
             style="width:100%; margin:0 auto;">
        <tr>
          <td style="height:1px; background-color:{{colors.cardBorder}}; font-size:0; line-height:0;">&nbsp;</td>
        </tr>
        <tr>
          <td style="padding:24px 32px 20px 32px; background-color:{{colors.containerBg}};">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center" style="padding-bottom:12px;">
                  <span style="font-family:Arial,Helvetica,sans-serif; font-size:13px; font-weight:700;
                               letter-spacing:3px; color:{{colors.textColor}}; text-transform:uppercase;">
                    {{shopName}}
                  </span>
                </td>
              </tr>
            </table>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center" style="font-family:Arial,Helvetica,sans-serif; font-size:11px;
                            color:{{colors.textMuted}}; line-height:1.6;">
                  &copy; {{year}} {{shopName}}. All rights reserved.<br/>
                  {{shopAddress}} &nbsp;|&nbsp; {{shopPhone}}<br/>
                  &#9993;&nbsp;{{shopEmail}}
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="height:4px; background-color:#DC2626; font-size:0; line-height:0;">&nbsp;</td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;

const PARTIAL_REFUND_DISCLAIMER = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
       style="margin:0; padding:0;">
  <tr>
    <td style="padding:0 32px 24px 32px; background-color:{{colors.containerBg}};">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
             style="background-color:{{colors.rowEvenBg}}; border-left:3px solid #DC2626;
                    border-radius:2px;">
        <tr>
          <td style="padding:14px 18px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="vertical-align:middle; padding-right:8px;">
                  <span style="display:inline-block; width:18px; height:18px;
                               background-color:#DC2626; border-radius:50%;
                               font-family:Arial,Helvetica,sans-serif; font-size:11px;
                               font-weight:700; color:#FFFFFF; text-align:center;
                               line-height:18px;">i</span>
                </td>
                <td style="vertical-align:middle;">
                  <span style="font-family:Arial,Helvetica,sans-serif; font-size:13px;
                               font-weight:700; color:{{colors.textColor}}; text-transform:uppercase;
                               letter-spacing:0.5px;">
                    Returns &amp; Refunds
                  </span>
                </td>
              </tr>
            </table>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding-top:8px;">
                  <p style="font-family:Arial,Helvetica,sans-serif; font-size:12px;
                             color:{{colors.textMuted}}; line-height:1.6; margin:0;">
                    {{{returnsRefundsPolicy}}}
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;

const TEMPLATE_TAGS: Record<string, 'customer' | 'internal'> = {
  'order-confirmation': 'customer',
  'shipping-confirmation': 'customer',
  'contact-confirmation': 'customer',
  'order-notification': 'internal',
  'contact-notification': 'internal',
};

const FIELD_LABELS: Record<string, string> = {
  hero_title: 'Hero Heading Title',
  hero_subtitle: 'Hero Subtitle Text',
  step1_title: 'Step 1: Heading',
  step1_text: 'Step 1: Explanation',
  step2_title: 'Step 2: Heading',
  step2_text: 'Step 2: Explanation',
  step3_title: 'Step 3: Heading',
  step3_text: 'Step 3: Explanation',
  no_tracking_text: 'No-Tracking Instructions Text',
  policy_text: 'Returns & Refunds Disclaimer Text'
};

const isLongField = (key: string): boolean => {
  return key.endsWith('_text') || key.endsWith('_subtitle') || key.endsWith('_desc') || key === 'policy_text';
};

function policyHtmlToText(html: string): string {
  if (!html) return '';
  // Replace mailto links with just the email address
  let text = html.replace(/<a\s+href="mailto:([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, '$1');
  // Replace other links with anchor text
  text = text.replace(/<a\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, '$2 ($1)');
  // Strip strong/bold/span
  text = text.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '$1');
  text = text.replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '$1');
  text = text.replace(/<span[^>]*>([\s\S]*?)<\/span>/gi, '$1');
  // Convert breaks to newlines
  text = text.replace(/<br\s*\/?>/gi, '\n');
  // Clean standard HTML entities
  text = text.replace(/&amp;/g, '&')
             .replace(/&lt;/g, '<')
             .replace(/&gt;/g, '>')
             .replace(/&quot;/g, '"')
             .replace(/&#39;/g, "'")
             .replace(/&ndash;/g, '–')
             .replace(/&mdash;/g, '—');
  return text.trim();
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
  });
}

function policyTextToHtml(text: string): string {
  if (!text) return '';
  let formatted = text;
  // Convert newlines to HTML break tags
  formatted = formatted.replace(/\n/g, '<br/>');
  // Wrap email addresses in styled links
  formatted = formatted.replace(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi, 
    '<a href="mailto:$1" style="color:#DC2626; text-decoration:none;">$1</a>'
  );
  // Wrap phone numbers in strong tags
  formatted = formatted.replace(/(\+?\d{1,3}[-.\s]?\(?\d{1,3}\)?[-.\s]?\d{3,4}[-.\s]?\d{4})/g, 
    '<strong>$1</strong>'
  );
  return formatted;
}

function ensureEditableComments(templateName: string, html: string): string {
  if (!html) return '';
  if (html.includes('<!-- editable:')) {
    return html;
  }

  let updated = html;

  if (templateName === 'order-confirmation') {
    updated = updated.replace(
      /Your\s*Order\s*Is\s*Confirmed!/gi,
      '<!-- editable:hero_title -->Your Order Is Confirmed!<!-- /editable:hero_title -->'
    );
    updated = updated.replace(
      /Hi\s*\{\{\s*customerFirstName\s*\}\},\s*thanks\s*for\s*shopping\s*with\s*JDM\s*Tokyo\s*Motorsports\./gi,
      '<!-- editable:hero_subtitle -->Hi {{customerFirstName}}, thanks for shopping with JDM Tokyo Motorsports.<!-- /editable:hero_subtitle -->'
    );
    updated = updated.replace(
      /Invoice\s*on\s*its\s*way/gi,
      '<!-- editable:step1_title -->Invoice on its way<!-- /editable:step1_title -->'
    );
    updated = updated.replace(
      /You'll\s*receive\s*a\s*full\s*invoice\s*by\s*email\s*shortly\./gi,
      "<!-- editable:step1_text -->You'll receive a full invoice by email shortly.<!-- /editable:step1_text -->"
    );
    updated = updated.replace(
      /Order\s*preparation/gi,
      '<!-- editable:step2_title -->Order preparation<!-- /editable:step2_title -->'
    );
    updated = updated.replace(
      /We'll\s*carefully\s*pick,\s*pack,\s*and\s*prepare\s*your\s*order\s*for\s*shipment\./gi,
      "<!-- editable:step2_text -->We'll carefully pick, pack, and prepare your order for shipment.<!-- /editable:step2_text -->"
    );
    updated = updated.replace(
      /Tracking\s*info\s*sent/gi,
      '<!-- editable:step3_title -->Tracking info sent<!-- /editable:step3_title -->'
    );
    updated = updated.replace(
      /Once\s*your\s*order\s*ships\s*you'll\s*receive\s*a\s*tracking\s*number\s*by\s*email\s*so\s*you\s*[\s\S]*?follow\s*it\s*every\s*step\s*of\s*the\s*way\./gi,
      "<!-- editable:step3_text -->Once your order ships you'll receive a tracking number by email so you can follow it every step of the way.<!-- /editable:step3_text -->"
    );
  } else if (templateName === 'order-notification') {
    updated = updated.replace(
      /New\s*Order\s*Received!/gi,
      '<!-- editable:hero_title -->New Order Received!<!-- /editable:hero_title -->'
    );
    updated = updated.replace(
      /A\s*new\s*order\s*has\s*been\s*placed\s*and\s*requires\s*your\s*attention\./gi,
      '<!-- editable:hero_subtitle -->A new order has been placed and requires your attention.<!-- /editable:hero_subtitle -->'
    );
  } else if (templateName === 'shipping-confirmation') {
    updated = updated.replace(
      /Your\s*Order\s*Is\s*On\s*Its\s*Way!/gi,
      '<!-- editable:hero_title -->Your Order Is On Its Way!<!-- /editable:hero_title -->'
    );
    updated = updated.replace(
      /Hi\s*\{\{\s*customerFirstName\s*\}\},\s*great\s*news\s*—\s*your\s*order\s*has\s*shipped!/gi,
      '<!-- editable:hero_subtitle -->Hi {{customerFirstName}}, great news — your order has shipped!<!-- /editable:hero_subtitle -->'
    );
    updated = updated.replace(
      /Visit\s*your\s*carrier's\s*website\s*and\s*enter\s*the\s*tracking\s*number\s*above\s*to[\s\S]*?check\s*the\s*status\s*of\s*your\s*shipment\./gi,
      "<!-- editable:no_tracking_text -->Visit your carrier's website and enter the tracking number above to check the status of your shipment.<!-- /editable:no_tracking_text -->"
    );
  } else if (templateName === 'contact-confirmation') {
    updated = updated.replace(
      /Thank\s*You,\s*\{\{\s*name\s*\}\}!/gi,
      '<!-- editable:hero_title -->Thank You, {{name}}!<!-- /editable:hero_title -->'
    );
    updated = updated.replace(
      /We\s*have\s*received\s*your\s*message\s*and\s*will\s*get\s*back\s*to\s*you\s*within\s*24\s*hours\./gi,
      '<!-- editable:hero_subtitle -->We have received your message and will get back to you within 24 hours.<!-- /editable:hero_subtitle -->'
    );
    updated = updated.replace(
      /We\s*review\s*your\s*inquiry/gi,
      '<!-- editable:step1_title -->We review your inquiry<!-- /editable:step1_title -->'
    );
    updated = updated.replace(
      /Our\s*team\s*will\s*review\s*your\s*question\s*and\s*check\s*our\s*inventory\./gi,
      '<!-- editable:step1_text -->Our team will review your question and check our inventory.<!-- /editable:step1_text -->'
    );
    updated = updated.replace(
      /We\s*respond\s*via\s*email/gi,
      '<!-- editable:step2_title -->We respond via email<!-- /editable:step2_title -->'
    );
    updated = updated.replace(
      /You&#39;ll\s*receive\s*a\s*detailed\s*response\s*at\s*\{\{email\}\}\./gi,
      "<!-- editable:step2_text -->You'll receive a detailed response at {{email}}.<!-- /editable:step2_text -->"
    );
    updated = updated.replace(
      /Need\s*it\s*sooner\?/gi,
      '<!-- editable:step3_title -->Need it sooner?<!-- /editable:step3_title -->'
    );
    updated = updated.replace(
      /Call\s*us\s*directly\s*at\s*<strong>\{\{shopPhone\}\}<\/strong>\s*for\s*immediate\s*assistance\./gi,
      '<!-- editable:step3_text -->Call us directly at <strong>{{shopPhone}}</strong> for immediate assistance.<!-- /editable:step3_text -->'
    );
  } else if (templateName === 'contact-notification') {
    updated = updated.replace(
      /New\s*Contact\s*Form\s*Inquiry/gi,
      '<!-- editable:hero_title -->New Contact Form Inquiry<!-- /editable:hero_title -->'
    );
    updated = updated.replace(
      /\{\{\s*name\s*\}\}\s*sent\s*a\s*message\s*via\s*the\s*contact\s*form\./gi,
      '<!-- editable:hero_subtitle -->{{name}} sent a message via the contact form.<!-- /editable:hero_subtitle -->'
    );
  } else if (templateName === 'returns_refunds_policy') {
    const pTagRegex = /(<p\s+style="font-family:Arial,Helvetica,sans-serif;\s*font-size:12px;\s*color:#4b5563;\s*line-height:1\.6;\s*margin:0;">)([\s\S]*?)(<\/p>)/i;
    if (pTagRegex.test(updated)) {
      updated = updated.replace(pTagRegex, '$1<!-- editable:policy_text -->$2<!-- /editable:policy_text -->$3');
    } else {
      updated = `<!-- editable:policy_text -->${updated}<!-- /editable:policy_text -->`;
    }
  }

  return updated;
}

function parseEditableFields(html: string): Record<string, string> {
  const fields: Record<string, string> = {};
  if (!html) return fields;
  
  const regex = /<!--\s*editable:(\w+)\s*-->([\s\S]*?)<!--\s*\/editable:\1\s*-->/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    fields[match[1]] = match[2].trim();
  }
  return fields;
}

function updateHtmlField(html: string, fieldName: string, newValue: string): string {
  if (!html) return '';
  const regex = new RegExp(`(<!--\\s*editable:${fieldName}\\s*-->)([\\s\\S]*?)(<!--\\s*/editable:${fieldName}\\s*-->)`, 'g');
  return html.replace(regex, `$1${newValue}$3`);
}

function buildPreviewContext(
  bodyContent: string,
  policyTextHtml: string,
  theme: 'light' | 'dark',
  footerSettings: {
    shopName: string;
    shopEmail: string;
    shopPhone: string;
    shopAddress: string;
    copyrightYear: string;
  },
  headerSettings: {
    logoAlt: string;
    logoWidth: string;
    logoUrlLight: string;
    logoUrlDark: string;
  },
): Record<string, unknown> {
  const isDark = theme === 'dark';
  const colors = {
    bodyBg: isDark ? '#121212' : '#f3f4f6',
    containerBg: isDark ? '#1e1e1e' : '#FFFFFF',
    cardBg: isDark ? '#262626' : '#FFFFFF',
    cardBorder: isDark ? '#374151' : '#e5e7eb',
    textColor: isDark ? '#f3f4f6' : '#111827',
    textMuted: isDark ? '#9ca3af' : '#6b7280',
    titleBorder: isDark ? '#DC2626' : '#000000',
    rowEvenBg: isDark ? '#2d2a29' : '#f9fafb',
    rowOddBg: isDark ? '#1e1e1e' : '#FFFFFF',
    rowBorder: isDark ? '#374151' : '#e5e7eb',
    accentColor: isDark ? '#ef4444' : '#DC2626',
    dividerColor: isDark ? '#ef4444' : '#000000',
    notesBg: isDark ? '#451a03' : '#fffbeb',
    notesText: isDark ? '#fcd34d' : '#92400e',
    notesBorder: isDark ? '#b45309' : '#f59e0b',
  };

  const defaultLogo = isDark
    ? '/logo/finallogo-whitelettering-transparent.png'
    : '/logo/finallogo-blacklettering-transparent.png';
  const logoUrl = (isDark ? headerSettings.logoUrlDark : headerSettings.logoUrlLight) || defaultLogo;

  return {
    subject: 'Custom Message Subject',
    body: bodyContent,
    useTemplate: true,
    returnsRefundsPolicy: policyTextHtml || '',
    orderNumber: 'JDM-98765',
    customerFirstName: 'John',
    customerLastName: 'Doe',
    customerName: 'John Doe',
    customerEmail: 'john.doe@example.com',
    customerPhone: '+1 (555) 123-4567',
    carrier: 'R&L Carriers',
    trackingNumber: 'RL123456789US',
    estimatedDelivery: 'June 15, 2026',
    year: footerSettings.copyrightYear || '2026',
    frontendUrl: 'http://localhost:3000',
    adminUrl: 'http://localhost:3000',
    shippingMethod: 'Flat Rate Freight',
    subtotal: 440000,
    shippingCost: 15000,
    total: 455000,
    discount: null,
    discountCode: null,
    customerNotes: null,
    trackingUrl: null,
    colors,
    shippingAddress: {
      name: 'John Doe',
      line1: '123 Motorsports Blvd',
      line2: null,
      city: 'Los Angeles',
      state: 'CA',
      zip: '90001',
      country: 'United States',
      type: 'Commercial',
    },
    items: [
      { title: 'Toyota 1JZ-GTE VVTi Engine', sku: '1JZ-VVTI-MT', quantity: 1, unitPrice: 345000, lineTotal: 345000 },
      { title: 'W58 5-Speed Manual Transmission', sku: 'W58-5SPD', quantity: 1, unitPrice: 95000, lineTotal: 95000 },
    ],
    logoUrl,
    logoAlt: headerSettings.logoAlt || 'JDM Tokyo Motorsports',
    logoWidth: headerSettings.logoWidth || '220',
    shopName: footerSettings.shopName,
    shopPhone: footerSettings.shopPhone,
    shopEmail: footerSettings.shopEmail,
    shopAddress: footerSettings.shopAddress,
  };
}

function renderMockHtml(
  html: string,
  templateName: string,
  policyText: string,
  theme: 'light' | 'dark' = 'light',
  footerSettings = {
    shopName: 'JDM Tokyo Motorsports',
    shopEmail: 'support@jdmtokyomotors.com',
    shopPhone: '(555) 123-4567',
    shopAddress: '123 Motorsports Blvd, Los Angeles, CA 90001',
    copyrightYear: '2026'
  },
  headerSettings = {
    logoAlt: 'JDM Tokyo Motorsports',
    logoWidth: '220',
    logoUrlLight: '',
    logoUrlDark: ''
  }
): string {
  if (!html) return '';
  const cleanHtml = html.replace(/<!--\s*editable:\w+\s*-->/g, '').replace(/<!--\s*\/editable:\w+\s*-->/g, '');

  // Register partials
  try { Handlebars.unregisterPartial('header'); } catch {}
  try { Handlebars.unregisterPartial('footer'); } catch {}
  try { Handlebars.unregisterPartial('refund-disclaimer'); } catch {}
  Handlebars.registerPartial('header', PARTIAL_HEADER);
  Handlebars.registerPartial('footer', PARTIAL_FOOTER);
  Handlebars.registerPartial('refund-disclaimer', PARTIAL_REFUND_DISCLAIMER);

  Handlebars.registerHelper('formatPrice', (cents: any) => {
    if (cents === undefined || cents === null) return '$0.00';
    const n = typeof cents === 'string' ? parseFloat(cents) : cents;
    if (isNaN(n)) return '$0.00';
    return `$${(n / 100).toFixed(2)}`;
  });

  const context = buildPreviewContext(
    '<p>Hello, this is a custom email message sent from JDM Tokyo Motorsports. We wanted to inform you that your forklift delivery coordinates have been updated.</p>',
    policyTextToHtml(policyText),
    theme,
    footerSettings,
    headerSettings,
  );

  try {
    const template = Handlebars.compile(cleanHtml);
    let result = template(context);
    result = result.replace(/\{\{[\s\S]*?\}\}/g, '');
    return result;
  } catch {
    return '<p style="color:red; padding:20px;">Template rendering error. Check the HTML syntax.</p>';
  }
}

export default function AdminEmailsPage() {
  const t = useTranslations('admin.emailsPage');
  const tComposer = useTranslations('admin.emailComposer');
  const searchParams = useSearchParams();

  const { error: sendError, reset } = useEmailSend();

  // Send Email State
  const [to, setTo] = useState(searchParams.get('to') ?? '');
  const orderNumberParam = searchParams.get('orderNumber');
  const [subject, setSubject] = useState(orderNumberParam ? `Regarding Order ${orderNumberParam}` : '');
  const [body, setBody] = useState('');
  const [orderRef, setOrderRef] = useState(searchParams.get('order') ?? '');
  const [useTemplate, setUseTemplate] = useState(true);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [localSending, setLocalSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Email Detail Dialog
  const [selectedEmail, setSelectedEmail] = useState<SentEmail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Email Log State
  const [sentEmails, setSentEmails] = useState<SentEmail[]>([]);
  const [loadingLog, setLoadingLog] = useState(true);

  // Templates State
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [editTemplateForm, setEditTemplateForm] = useState({
    subject: '',
    html: '',
    description: '',
    isActive: true,
  });
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [showRawHtml, setShowRawHtml] = useState(false);
  const [previewTheme, setPreviewTheme] = useState<'light' | 'dark'>('light');

  // Policy disclaimer state
  const [policyTemplate, setPolicyTemplate] = useState<EmailTemplate | null>(null);
  const [policyText, setPolicyText] = useState('');

  // Footer settings state
  const [footerSettings, setFooterSettings] = useState({
    shopName: 'JDM Tokyo Motorsports',
    shopEmail: 'support@jdmtokyomotors.com',
    shopPhone: '(555) 123-4567',
    shopAddress: '123 Motorsports Blvd, Los Angeles, CA 90001',
    copyrightYear: '2026'
  });

  // Header settings state
  const [headerSettings, setHeaderSettings] = useState({
    logoAlt: 'JDM Tokyo Motorsports',
    logoWidth: '220',
    logoUrlLight: '',
    logoUrlDark: ''
  });

  const [savingGenerics, setSavingGenerics] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState('500px');

  const handleIframeLoad = useCallback(() => {
    const iframe = iframeRef.current;
    if (iframe && iframe.contentDocument) {
      setTimeout(() => {
        if (iframe && iframe.contentDocument) {
          const body = iframe.contentDocument.body;
          const html = iframe.contentDocument.documentElement;
          if (body && html) {
            const height = Math.max(
              body.scrollHeight,
              body.offsetHeight,
              html.clientHeight,
              html.scrollHeight,
              html.offsetHeight
            );
            setIframeHeight(`${height + 30}px`);
          }
        }
      }, 100);
    }
  }, []);

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    handleIframeLoad();
  }, [editTemplateForm.html, previewTheme, policyText, footerSettings, headerSettings, handleIframeLoad]);

  const formatDeliveryTime = (utcString: string): string => {
    if (!isMounted) {
      return 'Loading time...';
    }
    try {
      if (!utcString) return '';
      let normalized = utcString.trim();
      
      // If it looks like a date/time string but lacks timezone indicator, force UTC parsing
      if (normalized.includes(':') && !normalized.endsWith('Z') && !normalized.includes('+') && !/[-+]\d{2}:\d{2}$/.test(normalized)) {
        normalized = normalized.replace(' ', 'T');
        if (!normalized.endsWith('Z')) {
          normalized += 'Z';
        }
      }
      
      const date = new Date(normalized);
      if (isNaN(date.getTime())) {
        return utcString;
      }
      return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return utcString;
    }
  };

  // Recipients State
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(true);
  const [newRecipient, setNewRecipient] = useState({ name: '', email: '' });
  const [addingRecipient, setAddingRecipient] = useState(false);

  // Fetch email logs
  const fetchLogs = useCallback(() => {
    setLoadingLog(true);
    adminApi
      .get<SentEmailsResponse>('/admin/email/log')
      .then((res) => setSentEmails(res.data ?? []))
      .catch(() => setSentEmails([]))
      .finally(() => setLoadingLog(false));
  }, []);

  // Fetch templates
  const fetchTemplates = useCallback(() => {
    setLoadingTemplates(true);
    adminApi
      .get<{ success: boolean; data: EmailTemplate[] }>('/admin/email-templates')
      .then((res) => {
        const allTemplates = res.data ?? [];
        const policyTpl = allTemplates.find(t => t.template_name === 'returns_refunds_policy') || null;
        setPolicyTemplate(policyTpl);
        if (policyTpl) {
          const processedHtml = ensureEditableComments('returns_refunds_policy', policyTpl.html_template);
          const fields = parseEditableFields(processedHtml);
          setPolicyText(policyHtmlToText(fields.policy_text || ''));
        }
        
        const filteredTemplates = allTemplates.filter(t => t.template_name !== 'returns_refunds_policy');
        setTemplates(filteredTemplates);
      })
      .catch(() => {
        setTemplates([]);
        setPolicyTemplate(null);
      })
      .finally(() => setLoadingTemplates(false));
  }, []);

  // Fetch recipients
  const fetchRecipients = useCallback(() => {
    setLoadingRecipients(true);
    adminApi
      .get<{ success: boolean; data: Recipient[] }>('/admin/order-notification-recipients')
      .then((res) => setRecipients(res.data ?? []))
      .catch(() => setRecipients([]))
      .finally(() => setLoadingRecipients(false));
  }, []);

  // Fetch header/footer generics settings from sale_conditions
  const fetchGenericsSettings = useCallback(() => {
    adminApi.get<{ success: boolean; data: any[] }>('/admin/settings')
      .then((res) => {
        const data = res.data ?? [];
        const shopNameSetting = data.find(s => s.rule_key === 'email_shop_name');
        const emailSetting = data.find(s => s.rule_key === 'contact_email');
        const phoneSetting = data.find(s => s.rule_key === 'contact_phone');
        const addressSetting = data.find(s => s.rule_key === 'contact_address');
        const yearSetting = data.find(s => s.rule_key === 'email_copyright_year');

        const logoAltSetting = data.find(s => s.rule_key === 'email_logo_alt');
        const logoWidthSetting = data.find(s => s.rule_key === 'email_logo_width');
        const logoUrlLightSetting = data.find(s => s.rule_key === 'email_logo_url_light');
        const logoUrlDarkSetting = data.find(s => s.rule_key === 'email_logo_url_dark');

        setFooterSettings({
          shopName: shopNameSetting?.rule_value || 'JDM Tokyo Motorsports',
          shopEmail: emailSetting?.rule_value || 'support@jdmtokyomotors.com',
          shopPhone: phoneSetting?.rule_value || '(555) 123-4567',
          shopAddress: addressSetting?.rule_value || '123 Motorsports Blvd, Los Angeles, CA 90001',
          copyrightYear: yearSetting?.rule_value || '2026'
        });

        setHeaderSettings({
          logoAlt: logoAltSetting?.rule_value || 'JDM Tokyo Motorsports',
          logoWidth: logoWidthSetting?.rule_value || '220',
          logoUrlLight: logoUrlLightSetting?.rule_value || '',
          logoUrlDark: logoUrlDarkSetting?.rule_value || ''
        });
      })
      .catch((err) => {
        console.error("Failed to load settings:", err);
      });
  }, []);

  useEffect(() => {
    fetchLogs();
    fetchTemplates();
    fetchRecipients();
    fetchGenericsSettings();
  }, [fetchLogs, fetchTemplates, fetchRecipients, fetchGenericsSettings]);

  useEffect(() => {
    if (sendSuccess) {
      fetchLogs();
    }
  }, [sendSuccess, fetchLogs]);

  const handleAttach = useCallback((files: FileList | null) => {
    if (!files) return;
    setAttachments((prev) => [...prev, ...Array.from(files)]);
  }, []);

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!to || !subject || !body) return;
    reset();
    setLocalSending(true);
    setSendSuccess(false);
    try {
      const attachmentPayload = await Promise.all(
        attachments.map(async (file) => ({
          filename: file.name,
          content: await fileToBase64(file),
        }))
      );

      await adminApi.post('/admin/email/send', {
        to,
        subject,
        body,
        template_enabled: useTemplate,
        order_id: orderRef || undefined,
        attachments: attachmentPayload.length > 0 ? attachmentPayload : undefined,
      });
      setSendSuccess(true);
      setTo('');
      setSubject('');
      setBody('');
      setAttachments([]);
      setOrderRef('');
      toast.success("Email sent successfully!");
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send email';
      toast.error(message);
    } finally {
      setLocalSending(false);
    }
  };

  // Select a template to edit
  const handleSelectTemplate = (template: EmailTemplate) => {
    const htmlWithComments = ensureEditableComments(template.template_name, template.html_template);
    setSelectedTemplate(template);
    setEditTemplateForm({
      subject: template.subject_template || '',
      html: htmlWithComments,
      description: template.description || '',
      isActive: template.is_active,
    });
  };

  // Save template edits
  const handleSaveTemplate = async () => {
    if (!selectedTemplate) return;
    setSavingTemplate(true);
    try {
      // Save the main template
      await adminApi.patch(`/admin/email-templates/${selectedTemplate.id}`, {
        subject_template: editTemplateForm.subject,
        html_template: editTemplateForm.html,
        description: editTemplateForm.description,
        is_active: editTemplateForm.isActive,
      });

      toast.success("Template updated successfully!");
      fetchTemplates();
      setSelectedTemplate(null);
    } catch (err) {
      toast.error("Failed to update email template");
    } finally {
      setSavingTemplate(false);
    }
  };

  // Save shared header, footer, and global disclaimer policy
  const handleSaveGenerics = async () => {
    setSavingGenerics(true);
    try {
      // 1. Save returns policy disclaimer to template table
      if (policyTemplate) {
        const processedHtml = ensureEditableComments('returns_refunds_policy', policyTemplate.html_template);
        const updatedHtml = updateHtmlField(processedHtml, 'policy_text', policyTextToHtml(policyText));
        await adminApi.patch(`/admin/email-templates/${policyTemplate.id}`, {
          subject_template: policyTemplate.subject_template || '',
          html_template: updatedHtml,
          description: policyTemplate.description || '',
          is_active: policyTemplate.is_active,
        });
      }

      // 2. Save header/footer settings to sale_conditions (settings table)
      await adminApi.put('/admin/settings/bulk', {
        settings: [
          { key: 'email_shop_name', value: footerSettings.shopName },
          { key: 'contact_email', value: footerSettings.shopEmail },
          { key: 'contact_phone', value: footerSettings.shopPhone },
          { key: 'contact_address', value: footerSettings.shopAddress },
          { key: 'email_copyright_year', value: footerSettings.copyrightYear },
          { key: 'email_logo_alt', value: headerSettings.logoAlt },
          { key: 'email_logo_width', value: headerSettings.logoWidth },
          { key: 'email_logo_url_light', value: headerSettings.logoUrlLight },
          { key: 'email_logo_url_dark', value: headerSettings.logoUrlDark }
        ]
      });

      toast.success("Shared layout settings saved successfully!");
      fetchTemplates();
      fetchGenericsSettings();
    } catch (err) {
      toast.error("Failed to save shared layout settings");
    } finally {
      setSavingGenerics(false);
    }
  };

  // Field change handler for form editor
  const handleFieldChange = (fieldName: string, value: string) => {
    setEditTemplateForm(prev => {
      const updatedHtml = updateHtmlField(prev.html, fieldName, value);
      return { ...prev, html: updatedHtml };
    });
  };

  // Toggle recipient status
  const handleToggleRecipient = async (recipient: Recipient) => {
    try {
      await adminApi.patch(`/admin/order-notification-recipients/${recipient.id}`, {
        is_active: !recipient.is_active,
      });
      toast.success("Recipient updated successfully!");
      fetchRecipients();
    } catch {
      toast.error("Failed to update recipient status");
    }
  };

  // Add notification recipient
  const handleAddRecipient = async () => {
    if (!newRecipient.email) return;
    setAddingRecipient(true);
    try {
      await adminApi.post('/admin/order-notification-recipients', {
        name: newRecipient.name,
        email: newRecipient.email,
        is_active: true,
      });
      toast.success("Notification recipient added!");
      setNewRecipient({ name: '', email: '' });
      fetchRecipients();
    } catch {
      toast.error("Failed to add recipient");
    } finally {
      setAddingRecipient(false);
    }
  };

  // Delete notification recipient
  const handleDeleteRecipient = async (id: string) => {
    try {
      await adminApi.delete(`/admin/order-notification-recipients/${id}`);
      toast.success("Recipient removed");
      fetchRecipients();
    } catch {
      toast.error("Failed to remove recipient");
    }
  };

  const inputClass = 'bg-muted border-border text-foreground placeholder:text-muted-foreground/60 h-9 text-sm';
  const labelClass = 'text-xs text-muted-foreground font-semibold';

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="font-heading text-3xl font-extrabold text-foreground tracking-tight">
        Email & Notifications Center
      </h1>

      <Tabs defaultValue="composer" className="w-full">
        <TabsList className="bg-muted border border-border p-1 mb-6 rounded-lg w-full max-w-xl grid grid-cols-4 group-data-horizontal/tabs:h-10">
          <TabsTrigger value="composer" className="gap-2">
            <Mail className="size-4" />
            Composer
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <FileCode className="size-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="recipients" className="gap-2">
            <Users className="size-4" />
            Recipients
          </TabsTrigger>
          <TabsTrigger value="generics" className="gap-2">
            <Sliders className="size-4" />
            Generics
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Composer & Logs */}
        <TabsContent value="composer" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Compose Form */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-card border-border shadow-md">
                <CardHeader className="border-b border-border/40 pb-4">
                  <CardTitle className="text-base font-bold text-foreground">Compose Custom Email</CardTitle>
                  <CardDescription className="text-xs">Send personalized updates or notifications directly to users.</CardDescription>
                </CardHeader>
                <CardContent className="pt-5 space-y-4">
                  {orderRef && (
                    <div className="flex items-center gap-2 rounded-lg bg-muted border border-border px-3 py-2">
                      <span className="text-xs text-muted-foreground">{t('selectOrder')}:</span>
                      <span className="text-xs font-mono text-foreground font-bold">{orderNumberParam || orderRef}</span>
                      <button
                        onClick={() => { setOrderRef(''); if (orderNumberParam) setSubject(''); }}
                        className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  )}

                  <div className="space-y-1">
                    <Label className={labelClass}>{tComposer('to')}</Label>
                    <Input
                      type="email"
                      value={to}
                      onChange={(e) => setTo(e.target.value)}
                      placeholder="customer@example.com"
                      className={inputClass}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className={labelClass}>{tComposer('subject')}</Label>
                    <Input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Enter email subject"
                      className={inputClass}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className={labelClass}>{tComposer('body')}</Label>
                    <RichTextEditor
                      value={body}
                      onChange={setBody}
                      placeholder="Type your message content here..."
                      minHeight="180px"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={(e) => handleAttach(e.target.files)}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="border-border text-muted-foreground hover:text-foreground hover:bg-muted gap-1.5"
                      >
                        <Paperclip className="size-3.5" />
                        Attach Files
                      </Button>
                      {attachments.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {attachments.length} file(s) attached
                        </span>
                      )}
                    </div>
                    {attachments.length > 0 && (
                      <div className="space-y-1">
                        {attachments.map((file, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 rounded-lg bg-muted border border-border px-3 py-1.5 text-xs"
                          >
                            <Paperclip className="size-3 shrink-0 text-muted-foreground" />
                            <span className="text-foreground truncate flex-1">{file.name}</span>
                            <span className="text-muted-foreground shrink-0">
                              {(file.size / 1024).toFixed(1)} KB
                            </span>
                            <button
                              onClick={() => removeAttachment(idx)}
                              className="text-muted-foreground hover:text-[#DC2626] transition-colors shrink-0"
                            >
                              <X className="size-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 py-1.5">
                    <Switch checked={useTemplate} onCheckedChange={setUseTemplate} />
                    <Label className="text-sm font-medium text-foreground cursor-pointer" onClick={() => setUseTemplate(!useTemplate)}>
                      {t('useTemplate')}
                    </Label>
                  </div>

                  {sendError && (
                    <p className="rounded-lg bg-[#DC2626]/10 border border-[#DC2626]/30 px-3 py-2 text-sm text-[#DC2626] flex items-center gap-2">
                      <AlertCircle className="size-4 shrink-0" />
                      {sendError}
                    </p>
                  )}

                  <div className="flex items-center gap-3 pt-2">
                    <Button
                      onClick={handleSend}
                      disabled={localSending || !to || !subject || !body}
                      className="bg-[#DC2626] text-white hover:bg-[#ef4444] disabled:opacity-50 gap-2 px-5"
                    >
                      <Send className="size-4" />
                      {localSending ? tComposer('sending') : tComposer('send')}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setPreviewOpen(true)}
                      disabled={!body}
                      className="border-border text-muted-foreground hover:text-foreground hover:bg-muted gap-2"
                    >
                      <Eye className="size-4" />
                      {tComposer('preview')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Email Logs Summary */}
            <div className="lg:col-span-1">
              <Card className="bg-card border-border shadow-md h-full">
                <CardHeader className="border-b border-border/40 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-bold text-foreground">Recent Deliveries</CardTitle>
                      <CardDescription className="text-xs">History of emails sent from the platform.</CardDescription>
                    </div>
                    <Link
                      href="/admin/emails/history"
                      className="flex items-center gap-1 text-xs text-[#DC2626] hover:underline shrink-0"
                    >
                      View all
                      <ArrowRight className="size-3" />
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="p-0 max-h-[500px] overflow-y-auto">
                  {loadingLog ? (
                    <div className="flex h-32 items-center justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#DC2626] border-t-transparent" />
                    </div>
                  ) : sentEmails.length === 0 ? (
                    <p className="p-6 text-sm text-muted-foreground text-center">No emails sent yet.</p>
                  ) : (
                    <div className="divide-y divide-border">
                      {sentEmails.slice(0, 10).map((email) => (
                        <div
                          key={email.id}
                          className="p-4 hover:bg-muted/10 transition-colors space-y-1 cursor-pointer"
                          onClick={() => {
                            setSelectedEmail(email);
                            setDetailOpen(true);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-mono text-muted-foreground">
                              {formatDeliveryTime(email.sent_at)}
                            </span>
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                email.status === 'sent'
                                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
                              }`}
                            >
                              {email.status}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-foreground truncate">{email.recipient_email}</p>
                          <p className="text-xs text-muted-foreground truncate">{email.subject}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <EmailDetailDialog
            email={selectedEmail ? {
              id: selectedEmail.id,
              recipient_email: selectedEmail.recipient_email,
              subject: selectedEmail.subject,
              template_used: selectedEmail.template_used ?? null,
              body_content: selectedEmail.body_content ?? null,
              has_attachment: selectedEmail.has_attachment,
              sent_at: selectedEmail.sent_at,
              status: selectedEmail.status as 'sent' | 'failed' | 'bounced',
              order_id: selectedEmail.order_id ?? null,
            } : null}
            open={detailOpen}
            onClose={() => setDetailOpen(false)}
            onRetry={() => fetchLogs()}
          />
        </TabsContent>

        {/* Tab 2: Email Templates Management */}
        <TabsContent value="templates" className="space-y-6">
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-4">
            {/* Templates List */}
            <div className="lg:col-span-1 space-y-4">
              <h2 className="text-lg font-bold text-foreground">Templates</h2>
              {loadingTemplates ? (
                <div className="flex h-32 items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#DC2626] border-t-transparent" />
                </div>
              ) : templates.length === 0 ? (
                <p className="text-sm text-muted-foreground">No templates configured in database.</p>
              ) : (
                <div className="space-y-2">
                    {templates.map((tpl) => {
                    const isSelected = selectedTemplate?.id === tpl.id;
                    const friendlyName = tpl.template_name
                      .split('_').join(' ')
                      .split('-').join(' ')
                      .replace(/\b\w/g, c => c.toUpperCase());

                    const tag = TEMPLATE_TAGS[tpl.template_name] || null;

                    return (
                      <button
                        key={tpl.id}
                        onClick={() => handleSelectTemplate(tpl)}
                        className={`w-full text-left p-3.5 rounded-lg border transition-all text-sm flex flex-col gap-1.5 ${
                          isSelected
                            ? 'bg-[#DC2626]/10 border-[#DC2626] text-foreground'
                            : 'bg-card border-border hover:bg-muted/30 text-muted-foreground'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${isSelected ? 'text-[#DC2626]' : 'text-foreground'}`}>
                            {friendlyName}
                          </span>
                          {tag && (
                            <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                              tag === 'customer'
                                ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                                : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                            }`}>
                              {tag === 'customer' ? 'Customer' : 'Internal'}
                            </span>
                          )}
                        </div>
                        <span className="text-xs line-clamp-2 text-muted-foreground/80">
                          {tpl.description || 'No description provided.'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Template Editor Form & Preview (Vertical Stack) */}
            <div className="lg:col-span-3 space-y-6">
              {selectedTemplate ? (
                <Card className="bg-card border-border shadow-md">
                  <CardHeader className="border-b border-border/40 pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <CardTitle className="text-base font-bold text-foreground">
                          Edit: {selectedTemplate.template_name.split('_').join(' ').split('-').join(' ').replace(/\b\w/g, c => c.toUpperCase())}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Customize this template using the visual form or the advanced HTML developer editor.
                        </CardDescription>
                      </div>
                      
                      {/* Controls */}
                      <div className="flex flex-wrap items-center gap-4">
                        {/* Editor Mode Switch */}
                        <div className="flex items-center gap-2">
                          <Switch 
                            id="html-mode"
                            checked={showRawHtml} 
                            onCheckedChange={setShowRawHtml} 
                          />
                          <Label htmlFor="html-mode" className="text-xs font-semibold cursor-pointer text-foreground">
                            Developer HTML Mode
                          </Label>
                        </div>

                        {/* Theme Toggle */}
                        <Button
                          variant="outline"
                          onClick={() => setPreviewTheme(previewTheme === 'light' ? 'dark' : 'light')}
                          className="h-7 px-2.5 text-xs border-border hover:bg-muted text-foreground gap-1.5"
                        >
                          <span>Preview:</span>
                          <span className="font-bold">{previewTheme === 'light' ? '☀️ Light' : '🌙 Dark'}</span>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-5 space-y-6">
                    {/* Top: Input Editor */}
                    <div className="space-y-4">
                      {/* Subject */}
                      <div className="space-y-1">
                        <Label className={labelClass}>Subject Line Template</Label>
                        <Input
                          value={editTemplateForm.subject}
                          onChange={(e) => setEditTemplateForm(prev => ({ ...prev, subject: e.target.value }))}
                          placeholder="e.g. Order Confirmed - {{orderNumber}}"
                          className={inputClass}
                        />
                        <p className="text-[10px] text-muted-foreground/80 mt-1">
                          ℹ️ <strong>Placeholders available:</strong> You can include placeholders like <code>&#123;&#123;orderNumber&#125;&#125;</code> (Order Number) or <code>&#123;&#123;customerFirstName&#125;&#125;</code> (Customer First Name) to dynamically fill subject details.
                        </p>
                      </div>

                      {showRawHtml ? (
                        /* Raw HTML Mode */
                        <div className="space-y-1">
                          <div className="flex items-center justify-between pb-1">
                            <Label className={labelClass}>Raw HTML Body</Label>
                            <span className="text-[10px] font-mono text-muted-foreground/60">Handlebars layout editing</span>
                          </div>
                          <Textarea
                            value={editTemplateForm.html}
                            onChange={(e) => setEditTemplateForm(prev => ({ ...prev, html: e.target.value }))}
                            placeholder="Write HTML template content..."
                            className="bg-muted border-border text-foreground font-mono text-xs resize-y min-h-[380px] focus:border-[#DC2626]"
                          />
                        </div>
                      ) : (
                        /* Easy Visual Form Mode */
                        <div className="space-y-4">
                          <div className="pb-1 border-b border-border/40">
                            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Email Text Sections</h3>
                            <p className="text-[10px] text-muted-foreground">Adjust text blocks below to automatically update the email layout.</p>
                          </div>
                          
                          {Object.keys(parseEditableFields(editTemplateForm.html)).length === 0 ? (
                            <div className="rounded-lg border border-dashed border-border p-6 text-center text-muted-foreground bg-muted/5">
                              <AlertCircle className="size-8 mx-auto mb-2 text-muted-foreground/60" />
                              <p className="text-sm font-semibold">Standard Layout Template</p>
                              <p className="text-xs max-w-xs mx-auto mt-1">
                                This is a static layout shell and does not contain simple text fields. Toggle "Developer HTML Mode" at the top right to edit.
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                              {Object.entries(parseEditableFields(editTemplateForm.html)).map(([key, val]) => {
                                const label = FIELD_LABELS[key] || key.split('_').join(' ').replace(/\b\w/g, c => c.toUpperCase());
                                return (
                                  <div key={key} className="space-y-1">
                                    <Label className={labelClass}>{label}</Label>
                                    {isLongField(key) ? (
                                      <Textarea
                                        value={val}
                                        onChange={(e) => handleFieldChange(key, e.target.value)}
                                        placeholder={`Enter ${label.toLowerCase()}...`}
                                        className="bg-muted border-border text-foreground text-xs resize-y min-h-[80px] focus:border-[#DC2626]"
                                      />
                                    ) : (
                                      <Input
                                        value={val}
                                        onChange={(e) => handleFieldChange(key, e.target.value)}
                                        placeholder={`Enter ${label.toLowerCase()}...`}
                                        className={inputClass}
                                      />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}


                      {/* Description */}
                      <div className="space-y-1">
                        <Label className={labelClass}>Description / Internal Notes</Label>
                        <Input
                          value={editTemplateForm.description}
                          onChange={(e) => setEditTemplateForm(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Brief template description"
                          className={inputClass}
                        />
                      </div>

                      {/* Active Toggle */}
                      <div className="flex items-center gap-3 py-1">
                        <Switch 
                          id="template-active"
                          checked={editTemplateForm.isActive} 
                          onCheckedChange={(val) => setEditTemplateForm(prev => ({ ...prev, isActive: val }))} 
                        />
                        <Label htmlFor="template-active" className="text-sm font-medium text-foreground cursor-pointer">
                          Template Active
                        </Label>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={handleSaveTemplate}
                          disabled={savingTemplate || !editTemplateForm.html}
                          className="bg-[#DC2626] text-white hover:bg-[#ef4444] disabled:opacity-50 gap-2 px-5"
                        >
                          <Save className="size-4" />
                          {savingTemplate ? 'Saving...' : 'Save Template'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setSelectedTemplate(null)}
                          className="border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>

                    {/* Divider separating form from preview */}
                    <div className="border-t border-border/40 pt-6">
                      {/* Bottom: Live Visual Preview */}
                      <div className="space-y-2 flex flex-col h-full">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pb-1">
                          <Label className={labelClass}>Visual Live Preview</Label>
                          <span className="text-[10px] text-muted-foreground bg-muted border border-border px-2 py-0.5 rounded">
                            ℹ️ Displaying realistic dummy data (e.g. John Doe, $10.00 discount) instead of placeholder brackets.
                          </span>
                        </div>
                        <div className="border border-border rounded-lg overflow-hidden bg-[#1e1e1e]/5 dark:bg-[#000000]/30 relative">
                          <iframe
                            ref={iframeRef}
                            onLoad={handleIframeLoad}
                            title="Visual Email Preview"
                            srcDoc={renderMockHtml(editTemplateForm.html, selectedTemplate.template_name, policyText, previewTheme, footerSettings)}
                            className="w-full bg-transparent border-0"
                            style={{ height: iframeHeight }}
                            scrolling="no"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="h-64 rounded-xl border border-dashed border-border flex items-center justify-center text-muted-foreground bg-muted/10 text-sm">
                  Click a template on the left side to begin editing.
                </div>
              )}
            </div>
          </div>

        </TabsContent>

        {/* Tab 3: Order Notification Recipients */}
        <TabsContent value="recipients" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Add Recipient Form */}
            <div className="md:col-span-1">
              <Card className="bg-card border-border shadow-md">
                <CardHeader className="border-b border-border/40 pb-4">
                  <CardTitle className="text-base font-bold text-foreground">Add Order Recipient</CardTitle>
                  <CardDescription className="text-xs">
                    Specify an email address that will receive merchant order notifications.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-5 space-y-4">
                  <div className="space-y-1">
                    <Label className={labelClass}>Recipient Name (optional)</Label>
                    <Input
                      value={newRecipient.name}
                      onChange={(e) => setNewRecipient(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. Store Owner"
                      className={inputClass}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className={labelClass}>Email Address</Label>
                    <Input
                      type="email"
                      value={newRecipient.email}
                      onChange={(e) => setNewRecipient(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="owner@jdmtokyomotors.com"
                      className={inputClass}
                    />
                  </div>

                  <Button
                    onClick={handleAddRecipient}
                    disabled={addingRecipient || !newRecipient.email}
                    className="w-full bg-[#DC2626] text-white hover:bg-[#ef4444] disabled:opacity-50 gap-2"
                  >
                    <Plus className="size-4" />
                    {addingRecipient ? 'Adding...' : 'Add Recipient'}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Recipients List Table */}
            <div className="md:col-span-2">
              <Card className="bg-card border-border shadow-md">
                <CardHeader className="border-b border-border/40 pb-4">
                  <CardTitle className="text-base font-bold text-foreground">Notification Recipients</CardTitle>
                  <CardDescription className="text-xs">
                    Managing who gets copied when new orders are captured.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {loadingRecipients ? (
                    <div className="flex h-32 items-center justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#DC2626] border-t-transparent" />
                    </div>
                  ) : recipients.length === 0 ? (
                    <p className="p-6 text-sm text-muted-foreground text-center">No order notification recipients added.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border">
                          <TableHead className="text-muted-foreground">Name</TableHead>
                          <TableHead className="text-muted-foreground">Email</TableHead>
                          <TableHead className="text-muted-foreground text-center">Receive Emails</TableHead>
                          <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recipients.map((rec) => (
                          <TableRow key={rec.id} className="border-border">
                            <TableCell className="text-foreground font-semibold text-xs py-3">{rec.name || '—'}</TableCell>
                            <TableCell className="text-muted-foreground text-xs py-3 font-mono">{rec.email}</TableCell>
                            <TableCell className="text-center py-3">
                              <Switch
                                checked={rec.is_active}
                                onCheckedChange={() => handleToggleRecipient(rec)}
                              />
                            </TableCell>
                            <TableCell className="text-right py-3">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteRecipient(rec.id)}
                                className="h-8 w-8 text-muted-foreground hover:text-[#DC2626] hover:bg-muted"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Tab 4: Generics Settings */}
        <TabsContent value="generics" className="space-y-6">
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
            {/* Left/Middle: Editor Form */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-card border-border shadow-md">
                <CardHeader className="border-b border-border/40 pb-4 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold text-foreground">Generics & Global Layout Settings</CardTitle>
                    <CardDescription className="text-xs">
                      Manage consistent sections (Header, Footer, and Returns policy) applied to all email templates.
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setPreviewTheme(previewTheme === 'light' ? 'dark' : 'light')}
                    className="h-7 px-2.5 text-xs border-border hover:bg-muted text-foreground gap-1.5"
                  >
                    <span>Preview:</span>
                    <span className="font-bold">{previewTheme === 'light' ? '☀️ Light' : '🌙 Dark'}</span>
                  </Button>
                </CardHeader>
                <CardContent className="pt-5 space-y-6">
                  {/* Header Settings */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-[#DC2626] uppercase tracking-wider">Email Header Brand Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className={labelClass}>Logo Alt / Brand Text</Label>
                        <Input
                          value={headerSettings.logoAlt}
                          onChange={(e) => setHeaderSettings(prev => ({ ...prev, logoAlt: e.target.value }))}
                          placeholder="e.g. JDM Tokyo Motorsports"
                          className={inputClass}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className={labelClass}>Logo Width (px)</Label>
                        <Input
                          value={headerSettings.logoWidth}
                          onChange={(e) => setHeaderSettings(prev => ({ ...prev, logoWidth: e.target.value }))}
                          placeholder="e.g. 220"
                          className={inputClass}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className={labelClass}>Light Theme Logo URL (Optional)</Label>
                        <Input
                          value={headerSettings.logoUrlLight}
                          onChange={(e) => setHeaderSettings(prev => ({ ...prev, logoUrlLight: e.target.value }))}
                          placeholder="Defaults to JDM white letters logo"
                          className={inputClass}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className={labelClass}>Dark Theme Logo URL (Optional)</Label>
                        <Input
                          value={headerSettings.logoUrlDark}
                          onChange={(e) => setHeaderSettings(prev => ({ ...prev, logoUrlDark: e.target.value }))}
                          placeholder="Defaults to JDM black letters logo"
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer Settings */}
                  <div className="space-y-4 pt-4 border-t border-border/40">
                    <h3 className="text-xs font-bold text-[#DC2626] uppercase tracking-wider">Email Footer Contact Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className={labelClass}>Shop/Brand Name</Label>
                        <Input
                          value={footerSettings.shopName}
                          onChange={(e) => setFooterSettings(prev => ({ ...prev, shopName: e.target.value }))}
                          placeholder="e.g. JDM Tokyo Motorsports"
                          className={inputClass}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className={labelClass}>Copyright Year</Label>
                        <Input
                          value={footerSettings.copyrightYear}
                          onChange={(e) => setFooterSettings(prev => ({ ...prev, copyrightYear: e.target.value }))}
                          placeholder="e.g. 2026"
                          className={inputClass}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className={labelClass}>Contact Email</Label>
                        <Input
                          value={footerSettings.shopEmail}
                          onChange={(e) => setFooterSettings(prev => ({ ...prev, shopEmail: e.target.value }))}
                          placeholder="e.g. support@jdmtokyomotors.com"
                          className={inputClass}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className={labelClass}>Contact Phone</Label>
                        <Input
                          value={footerSettings.shopPhone}
                          onChange={(e) => setFooterSettings(prev => ({ ...prev, shopPhone: e.target.value }))}
                          placeholder="e.g. (555) 123-4567"
                          className={inputClass}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className={labelClass}>Physical Address</Label>
                      <Input
                        value={footerSettings.shopAddress}
                        onChange={(e) => setFooterSettings(prev => ({ ...prev, shopAddress: e.target.value }))}
                        placeholder="e.g. 123 Motorsports Blvd, Los Angeles, CA 90001"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  {/* Returns Policy Settings */}
                  <div className="space-y-4 pt-4 border-t border-border/40">
                    <h3 className="text-xs font-bold text-[#DC2626] uppercase tracking-wider">Global Returns & Refunds Policy Disclaimer</h3>
                    <div className="space-y-1">
                      <Label className={labelClass}>Policy Disclaimer Text</Label>
                      <Textarea
                        value={policyText}
                        onChange={(e) => setPolicyText(e.target.value)}
                        placeholder="Enter return and refund policy disclaimer text..."
                        className="bg-muted border-border text-foreground text-xs resize-y min-h-[90px] focus:border-[#DC2626]"
                      />
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        ℹ️ This policy disclaimer is automatically appended to the bottom of all transactional customer templates.
                      </p>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 pt-2 border-t border-border/40">
                    <Button
                      onClick={handleSaveGenerics}
                      disabled={savingGenerics}
                      className="bg-[#DC2626] text-white hover:bg-[#ef4444] disabled:opacity-50 gap-2 px-5"
                    >
                      <Save className="size-4" />
                      {savingGenerics ? 'Saving...' : 'Save Shared Layout Settings'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right side: Preview */}
            <div className="lg:col-span-1 space-y-4">
              <Card className="bg-card border-border shadow-md">
                <CardHeader className="border-b border-border/40 pb-4">
                  <CardTitle className="text-base font-bold text-foreground font-heading">Global Layout Preview</CardTitle>
                  <CardDescription className="text-xs">
                    Visual simulation of the generic header, footer, and refund policy disclaimer layout.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="border border-border rounded-lg overflow-hidden bg-[#1e1e1e]/5 dark:bg-[#000000]/30">
                    <iframe
                      title="Shared Generics Preview"
                      srcDoc={renderMockHtml(
                        '{{> header}}<div style="padding: 40px 32px; font-family:Arial,sans-serif; font-size:13px; line-height:1.6; color:{{colors.textColor}}; background-color:{{colors.cardBg}};"><h2 style="margin:0 0 16px 0; color:{{colors.textColor}}; font-size:16px;">Hello customer,</h2><p style="margin:0;">This is a preview of how your email templates look. This section represents the dynamic body of specific emails, while the header, footer, and the returns disclaimer below remain consistent across all transactional templates.</p></div>{{> refund-disclaimer}}{{> footer}}',
                        'generics-preview',
                        policyText,
                        previewTheme,
                        footerSettings,
                        headerSettings
                      )}
                      className="w-full bg-transparent border-0 min-h-[580px]"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={(open) => setPreviewOpen(open)}>
        <DialogContent className="bg-card border-border sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">{t('previewTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">
              {tComposer('to')}: <span className="text-foreground font-bold">{to}</span>
            </p>
            <p className="text-muted-foreground">
              {tComposer('subject')}: <span className="text-foreground font-bold">{subject}</span>
            </p>
            {useTemplate ? (
              <div className="rounded-lg border border-border bg-muted p-4">
                <div className="mb-3 border-b border-border pb-3 flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded bg-[#DC2626] text-white font-bold text-xs">JDM</div>
                  <span className="font-heading text-sm font-bold text-foreground">JDM Tokyo Motorsports</span>
                </div>
                <div className="text-foreground text-sm [&_a]:text-[#DC2626] [&_a]:underline" dangerouslySetInnerHTML={{ __html: body }} />
                <div className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
                  © JDM Tokyo Motorsports | sales@jdmtokyomotors.com
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-muted p-4 text-foreground text-sm [&_a]:text-[#DC2626] [&_a]:underline" dangerouslySetInnerHTML={{ __html: body }} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

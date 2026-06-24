import type { Metadata } from 'next';
import ContactPageClient from './ContactPageClient';

export const metadata: Metadata = {
  title: 'Contact Us | JDM Tokyo Motorsports',
  description:
    'Get in touch with JDM Tokyo Motorsports. Call, email, or send us a message for fitment questions, order support, or general inquiries.',
};

export default function ContactPage() {
  return <ContactPageClient />;
}

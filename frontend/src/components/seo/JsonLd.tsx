// Server component — no 'use client' directive

interface JsonLdProps {
  data: Record<string, unknown>;
}

export default function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// ─── Organization Schema ──────────────────────────────────────────────────────

export function getOrganizationSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'AutomotiveBusiness',
    name: 'JDM Tokyo Motorsports',
    url: 'https://jdmtokyomotorsports.com',
    logo: 'https://jdmtokyomotorsports.com/images/logo.png',
    image: 'https://jdmtokyomotorsports.com/images/storefront.jpg',
    description:
      'JDM Tokyo Motorsports is your trusted source for genuine JDM engines and transmissions. ' +
      'We specialize in imported Japanese domestic market powertrains with a focus on quality, ' +
      'fitment accuracy, and customer satisfaction.',
    telephone: '+1-800-JDM-TOKYO',
    email: 'orders@jdmtokyomotorsports.com',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'US',
    },
    sameAs: [
      'https://www.facebook.com/jdmtokyomotorsports',
      'https://www.instagram.com/jdmtokyomotorsports',
      'https://www.youtube.com/@jdmtokyomotorsports',
    ],
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '18:00',
      },
    ],
    priceRange: '$$',
    currenciesAccepted: 'USD',
    paymentAccepted: 'Credit Card, Debit Card',
    areaServed: {
      '@type': 'Country',
      name: 'United States',
    },
  };
}

// ─── Product Schema ───────────────────────────────────────────────────────────

interface ProductSchemaInput {
  title: string;
  description?: string | null;
  sku: string;
  slug: string;
  price_cents: number;
  compare_at_price_cents?: number | null;
  make?: string | null;
  model?: string | null;
  year_start?: number | null;
  year_end?: number | null;
  engine_code?: string | null;
  displacement?: string | null;
  primary_image_path?: string | null;
  status?: string;
}

export function getProductSchema(
  product: ProductSchemaInput,
): Record<string, unknown> {
  const price = (product.price_cents / 100).toFixed(2);
  const availability =
    product.status === 'active'
      ? 'https://schema.org/InStock'
      : 'https://schema.org/OutOfStock';

  const additionalProperty: Record<string, unknown>[] = [];

  if (product.engine_code) {
    additionalProperty.push({
      '@type': 'PropertyValue',
      name: 'Engine Code',
      value: product.engine_code,
    });
  }

  if (product.displacement) {
    additionalProperty.push({
      '@type': 'PropertyValue',
      name: 'Displacement',
      value: product.displacement,
    });
  }

  if (product.make && product.model) {
    const fitment = [product.make, product.model]
      .concat(
        product.year_start && product.year_end
          ? [`${product.year_start}–${product.year_end}`]
          : product.year_start
            ? [String(product.year_start)]
            : [],
      )
      .join(' ');

    additionalProperty.push({
      '@type': 'PropertyValue',
      name: 'Fitment',
      value: fitment,
    });
  }

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description ?? product.title,
    sku: product.sku,
    mpn: product.sku,
    url: `https://jdmtokyomotorsports.com/products/${product.slug}`,
    brand: {
      '@type': 'Brand',
      name: product.make ?? 'JDM',
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'USD',
      price,
      availability,
      seller: {
        '@type': 'Organization',
        name: 'JDM Tokyo Motorsports',
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          currency: 'USD',
        },
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'US',
        },
      },
    },
  };

  if (product.primary_image_path) {
    schema.image = `https://jdmtokyomotorsports.com${product.primary_image_path}`;
  }

  if (product.compare_at_price_cents && product.compare_at_price_cents > product.price_cents) {
    (schema.offers as Record<string, unknown>).priceValidUntil = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000,
    )
      .toISOString()
      .split('T')[0];
  }

  if (additionalProperty.length > 0) {
    schema.additionalProperty = additionalProperty;
  }

  return schema;
}

// ─── FAQ Schema ───────────────────────────────────────────────────────────────

interface FaqItem {
  question: string;
  answer: string;
}

export function getFaqSchema(faqs: FaqItem[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

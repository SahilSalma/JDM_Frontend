import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import ProductGallery from '@/components/product/ProductGallery';
import ProductDetails from '@/components/product/ProductDetails';
import FitmentTable from '@/components/product/FitmentTable';
import RelatedProducts from '@/components/product/RelatedProducts';
import { ProductReviewsClient } from '@/components/product/ProductReviewsClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://jdmtokyomotors.com';

interface ProductData {
  id: string;
  slug: string;
  title: string;
  sku: string;
  price_cents: number;
  compare_at_price_cents?: number;
  description: string;
  category: string;
  make: string;
  model: string;
  year_start: number;
  year_end: number;
  engine_code?: string;
  displacement?: string;
  cylinders?: number;
  fuel_type?: string;
  transmission_type?: string;
  mileage?: number;
  condition: string;
  warranty?: string;
  status: string;
  featured: boolean;
  stock: number;
  quantity?: number;
  images: Array<{
    id: string;
    image_path: string;
    medium_path?: string;
    large_path?: string;
    thumb_path?: string;
  }>;
  part_number?: string;
  compatibility?: {
    make: string;
    model: string;
    year_start: number;
    year_end: number;
    notes?: string;
  }[];
  primary_image_path?: string;
  max_per_order?: number;
  mileage_km?: number | null;
  condition_notes?: string | null;
  included_items?: string | null;
  specs_json?: string | null;
  related_product_ids?: string | null;
  warranty_summary?: string | null;
  created_at: string;
  updated_at: string;
}

async function getProduct(slug: string): Promise<ProductData | null> {
  try {
    const res = await fetch(`${API_URL}/products/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const raw = json.data ?? null;
    if (!raw) return null;
    // Map DB `quantity` to frontend `stock`
    return { ...raw, stock: raw.stock ?? raw.quantity ?? 0 };
  } catch {
    return null;
  }
}

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return { title: 'Product Not Found | JDM Tokyo Motorsports' };
  }

  return {
    title: `${product.title} | JDM Tokyo Motorsports`,
    description: product.description?.slice(0, 160) ?? `Shop ${product.title} at JDM Tokyo Motorsports`,
    openGraph: {
      title: product.title,
      description: product.description?.slice(0, 160),
      images: product.images?.[0]
        ? [{ url: `${SITE_URL}/api${product.images[0].large_path || product.images[0].image_path}` }]
        : [],
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) notFound();

  const t = await getTranslations('product');

  const primaryImage = product.primary_image_path
    ? `/api${product.primary_image_path}`
    : product.images?.[0]
      ? `/api${product.images[0].large_path || product.images[0].image_path}`
      : '';

  const galleryImages = product.images?.length
    ? product.images.map((img, i) => ({ image_path: `/api${img.large_path || img.image_path}`, alt_text: `${product.title} image ${i + 1}` }))
    : primaryImage
      ? [{ image_path: primaryImage, alt_text: product.title }]
      : [];

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: product.category === 'engine' ? 'Engines' : product.category === 'transmission' ? 'Transmissions' : 'Parts', href: `/${product.category}s` },
    { label: product.title },
  ];

  const specRows: { label: string; value: string | number | undefined }[] = [
    { label: t('engineCode'), value: product.engine_code },
    { label: t('displacement'), value: product.displacement },
    { label: t('cylinders'), value: product.cylinders },
    {
      label: t('fuelType'),
      value: product.fuel_type
        ? product.fuel_type
            .split(',')
            .map((f) => {
              const trimmed = f.trim().toLowerCase();
              try {
                const trans = t(trimmed);
                return trans && !trans.includes('translation missing') ? trans : trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
              } catch {
                return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
              }
            })
            .join(', ')
        : undefined
    },
    { label: t('transmissionType'), value: product.transmission_type },
    {
      label: t('mileage'), value: product.mileage_km
        ? `${product.mileage_km.toLocaleString()} miles`
        : product.mileage
          ? `${product.mileage.toLocaleString()} miles`
          : undefined
    },
    { label: t('condition'), value: product.condition },
    { label: t('warranty'), value: product.warranty },
    { label: t('partNumber'), value: product.part_number },
    { label: t('partCode'), value: product.sku },
  ].filter((row) => row.value !== undefined && row.value !== null && row.value !== '');

  // Merge admin-provided specs_json into spec table.
  let extraSpecs: Array<{ label: string; value: string }> = [];
  if (product.specs_json) {
    try {
      const parsed = JSON.parse(product.specs_json);
      if (Array.isArray(parsed)) {
        extraSpecs = parsed.filter((s) => s && s.label && s.value);
      }
    } catch {
      // ignore malformed JSON
    }
  }
  // Dedupe by label
  for (const extra of extraSpecs) {
    if (!specRows.some((r) => String(r.label).toLowerCase() === extra.label.toLowerCase())) {
      specRows.push({ label: extra.label, value: extra.value });
    }
  }

  const includedItems = (product.included_items ?? '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    sku: product.sku,
    description: product.description,
    image: product.images?.map(img => `${SITE_URL}/api${img.large_path || img.image_path}`) ?? [],
    brand: { '@type': 'Brand', name: product.make },
    ...(product.part_number || product.engine_code
      ? { mpn: product.part_number || product.engine_code }
      : {}),
    offers: {
      '@type': 'Offer',
      priceCurrency: 'USD',
      price: (product.price_cents / 100).toFixed(2),
      availability:
        product.stock > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-none px-4 py-8 sm:px-6 lg:px-8 xl:px-24 2xl:px-48">
        <Breadcrumbs items={breadcrumbs} className="mb-6" />

        {/* Two-column layout */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          <ProductGallery images={galleryImages} primaryImage={primaryImage} />

          <ProductDetails
            product={{
              id: product.id,
              slug: product.slug,
              title: product.title,
              sku: product.sku,
              price_cents: product.price_cents,
              compare_at_price_cents: product.compare_at_price_cents,
              description: product.description,
              category: product.category,
              make: product.make,
              model: product.model,
              year_start: product.year_start,
              year_end: product.year_end,
              engine_code: product.engine_code,
              stock: product.stock,
              warranty: product.warranty,
              condition: product.condition,
              primary_image_path: primaryImage,
              max_per_order: product.max_per_order,
              mileage_km: product.mileage_km,
              condition_notes: product.condition_notes,
              included_items: product.included_items,
              specs_json: product.specs_json,
              warranty_summary: product.warranty_summary,
            }}
          />
        </div>

        <Separator className="my-10 bg-border" />

        {/* Tabs: Description / Specifications / Fitment */}
        <Tabs defaultValue="description" className="w-full">
          <TabsList variant="line" className="mb-8 flex gap-1 border-b border-border bg-transparent w-full">
            <TabsTrigger
              value="description"
              className="px-6 py-3.5 text-sm md:text-base font-bold uppercase text-[#DC2626]/80 transition-all duration-200 hover:text-[#DC2626] hover:bg-[#DC2626]/10 data-active:bg-[#DC2626]/15 data-active:text-[#DC2626] after:bg-[#DC2626]"
            >
              {t('description')}
            </TabsTrigger>
            <TabsTrigger
              value="specifications"
              className="px-6 py-3.5 text-sm md:text-base font-bold uppercase text-[#DC2626]/80 transition-all duration-200 hover:text-[#DC2626] hover:bg-[#DC2626]/10 data-active:bg-[#DC2626]/15 data-active:text-[#DC2626] after:bg-[#DC2626]"
            >
              {t('specifications')}
            </TabsTrigger>
            <TabsTrigger
              value="fitment"
              className="px-6 py-3.5 text-sm md:text-base font-bold uppercase text-[#DC2626]/80 transition-all duration-200 hover:text-[#DC2626] hover:bg-[#DC2626]/10 data-active:bg-[#DC2626]/15 data-active:text-[#DC2626] after:bg-[#DC2626]"
            >
              {t('fitment')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="description" className="mt-0">
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Main description column */}
              <div className="space-y-6 lg:col-span-3">
                {product.description ? (
                  <div className="prose dark:prose-invert max-w-none text-foreground/80">
                    <p className="leading-relaxed whitespace-pre-line">{product.description}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No description available.</p>
                )}

                {includedItems.length > 0 && (
                  <div className="rounded-lg border border-border bg-card p-5">
                    <h3 className="mb-3 font-heading text-sm font-bold uppercase tracking-widest text-foreground">
                      What&rsquo;s Included
                    </h3>
                    <ul className="space-y-1.5 text-sm text-muted-foreground">
                      {includedItems.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#DC2626]" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {product.condition_notes && (
                  <div className="rounded-lg border border-border bg-card p-5">
                    <h3 className="mb-2 font-heading text-sm font-bold uppercase tracking-widest text-foreground">
                      Additional Information
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                      {product.condition_notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Sidebar: warranty + key specs */}
              {/* <aside className="space-y-4">
                {product.warranty_summary && (
                  <div className="rounded-lg border border-[#DC2626]/40 bg-[#DC2626]/5 p-5">
                    <h3 className="mb-2 font-heading text-sm font-bold uppercase tracking-widest text-[#DC2626]">
                      Warranty
                    </h3>
                    <p className="text-sm text-foreground/80">{product.warranty_summary}</p>
                  </div>
                )}

                {product.mileage_km && (
                  <div className="rounded-lg border border-border bg-card p-5">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Mileage
                    </p>
                    <p className="mt-1 font-heading text-2xl font-bold text-foreground">
                      {product.mileage_km.toLocaleString()} <span className="text-base text-muted-foreground">miles</span>
                    </p>
                  </div>
                )}
              </aside> */}
            </div>
          </TabsContent>

          <TabsContent value="specifications" className="mt-0">
            {specRows.length > 0 ? (
              <div className="overflow-hidden rounded-lg border border-border">
                <table className="w-full text-sm">
                  <tbody>
                    {specRows.map((row, i) => (
                      <tr
                        key={i}
                        className={
                          i % 2 === 0
                            ? 'border-b border-border bg-card'
                            : 'border-b border-border bg-background'
                        }
                      >
                        <td className="px-4 py-3 font-medium text-muted-foreground w-40">{row.label}</td>
                        <td className={`px-4 py-3 text-foreground/80 ${
                          String(row.value).includes('\n') || row.label.toLowerCase() === 'parts included'
                            ? 'whitespace-pre-line'
                            : 'capitalize'
                        }`}>
                          {String(row.value)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted-foreground">No specifications available.</p>
            )}
          </TabsContent>

          <TabsContent value="fitment" className="mt-0">
            <FitmentTable
              compatibility={product.compatibility ?? []}
              primaryFitment={
                product.make
                  ? {
                    make: product.make,
                    model: product.model,
                    year_start: product.year_start,
                    year_end: product.year_end,
                  }
                  : undefined
              }
            />
          </TabsContent>
        </Tabs>

        {/* Customer Reviews */}
        <div className="mt-10">
          <ProductReviewsClient productId={product.id} productTitle={product.title} />
        </div>

        <Separator className="my-10 bg-border" />

        {/* Related products */}
        <RelatedProducts
          currentProductId={product.id}
          make={product.make}
          category={product.category}
          relatedProductIds={product.related_product_ids}
        />
      </div>
    </>
  );
}

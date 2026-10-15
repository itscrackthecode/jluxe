import { redirect } from 'next/navigation';
import { randomUUID } from 'node:crypto';
import AdminShell from '@/components/admin/admin-shell';
import PropertyForm from '@/components/admin/property-form';
import { getAdminSession } from '@/lib/admin-session';
import { findPropertyById, listPropertyConfigurations, listPropertyInventory, listPropertyMedia } from '@/lib/db/queries/properties';

export const metadata = {
  title: { absolute: 'Add Property | JLUXE Admin' },
  robots: { index: false, follow: false },
};

export default async function NewAdminPropertyPage({ searchParams }: { searchParams: Promise<{ duplicate?: string }> }) {
  const admin = await getAdminSession();
  if (!admin) redirect('/admin/login');

  const { duplicate: duplicateId } = await searchParams;
  const source = duplicateId ? await findPropertyById(duplicateId) : null;
  const [configurations, inventory, media] = source
    ? await Promise.all([listPropertyConfigurations(source.id), listPropertyInventory(source.id), listPropertyMedia(source.id)])
    : [[], [], []];
  const duplicateConfigurationIds = new Map(configurations.map((configuration) => [configuration.id, randomUUID()]));
  const property = source ? {
    ...source,
    id: source.id,
    title: `${source.title} (copy)`.slice(0, 200),
    slug: `${source.slug}-copy`.slice(0, 180),
    publicationStatus: 'DRAFT' as const,
    configurations: configurations.map((configuration) => ({ ...configuration, id: duplicateConfigurationIds.get(configuration.id)! })),
    inventory: inventory.map((unit) => ({ ...unit, id: undefined, configurationId: unit.configurationId ? duplicateConfigurationIds.get(unit.configurationId) ?? null : null })),
  } : undefined;

  return (
    <AdminShell admin={admin} active="Properties">
      <PropertyForm property={property} initialMedia={source ? media : []} duplicate={Boolean(source)} />
    </AdminShell>
  );
}

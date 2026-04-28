import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Cloud, Sparkles, Star, Telescope, Zap } from 'lucide-react';
import { searchCatalog, type CatalogObject } from '../../services/catalog';
import { SearchableSelect, type SelectGroup } from './SearchableSelect';

const TYPE_ICON: Record<CatalogObject['type'], React.ReactNode> = {
  galaxy: <Sparkles size={14} className="text-primary" />,
  nebula: <Cloud size={14} className="text-accent" />,
  cluster: <Star size={14} className="text-warning" />,
  planetary: <Zap size={14} className="text-success" />,
  supernova: <Zap size={14} className="text-error" />,
  other: <Telescope size={14} className="text-text-secondary" />,
};

const TYPE_ORDER: CatalogObject['type'][] = [
  'galaxy',
  'nebula',
  'cluster',
  'planetary',
  'supernova',
  'other',
];

const TYPE_LABEL: Record<CatalogObject['type'], string> = {
  galaxy: 'Galaxies',
  nebula: 'Nebulae',
  cluster: 'Clusters',
  planetary: 'Planetary nebulae',
  supernova: 'Supernova remnants',
  other: 'Other',
};

interface CatalogObjectPickerProps {
  value: string | null;
  onChange: (catalogId: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Dropdown for picking a catalog object grouped by type, backed by the
 * bundled catalog. Loads the full list once and filters client-side.
 */
export function CatalogObjectPicker({
  value,
  onChange,
  placeholder = 'Search a catalog object…',
  disabled,
  className,
}: CatalogObjectPickerProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['catalog/objects', 'all'],
    queryFn: () => searchCatalog('', 500),
    staleTime: 5 * 60_000,
  });

  const groups = useMemo<SelectGroup<string>[]>(() => {
    if (!data) return [];
    const buckets = new Map<CatalogObject['type'], CatalogObject[]>();
    for (const obj of data.items) {
      const list = buckets.get(obj.type) ?? [];
      list.push(obj);
      buckets.set(obj.type, list);
    }
    return TYPE_ORDER.filter((t) => buckets.has(t)).map((t) => ({
      label: TYPE_LABEL[t],
      options: (buckets.get(t) ?? [])
        .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))
        .map((obj) => ({
          value: obj.id,
          label: obj.id,
          description: `${obj.name} · ${obj.constellation}${
            obj.magnitude !== null ? ` · mag ${obj.magnitude.toFixed(1)}` : ''
          }`,
          icon: TYPE_ICON[obj.type],
          searchHaystack: `${obj.id} ${obj.name} ${obj.constellation}`,
        })),
    }));
  }, [data]);

  return (
    <SearchableSelect<string>
      value={value}
      onChange={onChange}
      options={groups}
      placeholder={isLoading ? 'Loading catalog…' : placeholder}
      searchable
      searchPlaceholder="Search by id, name, constellation…"
      disabled={disabled || isLoading}
      className={className}
      emptyMessage="No catalog object matches this search."
    />
  );
}

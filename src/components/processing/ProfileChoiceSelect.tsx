import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Layers, SlidersHorizontal, Star, Zap } from 'lucide-react';
import { listProfiles } from '../../services/profiles';
import { SearchableSelect, type SelectGroup } from '../ui/SearchableSelect';
import type { ProfilePreset } from '../../types';

/**
 * Discriminated value passed to {@link ProfileChoiceSelect.onChange}.
 *
 *  - ``{ kind: 'preset', preset }`` — one of the built-in pipelines.
 *  - ``{ kind: 'profile', profileId }`` — a saved (custom or shared) profile;
 *    callers should send ``preset='advanced'`` and ``profile_id=profileId``
 *    to the backend.
 */
export type ProfileChoice =
  | { kind: 'preset'; preset: Exclude<ProfilePreset, 'advanced'> }
  | { kind: 'profile'; profileId: string };

interface ProfileChoiceSelectProps {
  value: ProfileChoice;
  onChange: (choice: ProfileChoice) => void;
  disabled?: boolean;
  ariaLabel?: string;
}

const PRESET_META: Array<{
  value: Exclude<ProfilePreset, 'advanced'>;
  label: string;
  description: string;
  Icon: React.ElementType;
  features: string[];
}> = [
  {
    value: 'quick',
    label: 'Quick',
    description: 'Fast pipeline — no plate solving, gradient or color calibration',
    Icon: Zap,
    features: ['Denoise'],
  },
  {
    value: 'standard',
    label: 'Standard',
    description: 'Balanced quality — plate solving, gradient removal, color calibration',
    Icon: Layers,
    features: ['Plate solving', 'Gradient', 'Colors', 'Denoise', 'Sharpen'],
  },
  {
    value: 'quality',
    label: 'Quality',
    description: 'Maximum quality — Drizzle ×2, super-resolution, star separation',
    Icon: Star,
    features: ['Drizzle ×2', 'Plate solving', 'Gradient', 'Colors', 'Denoise', 'Sharpen', 'Super-res', 'Star sep.'],
  },
];

/**
 * Single dropdown that lets the user pick either one of the built-in
 * presets or one of their saved custom profiles.  Used by both the session
 * detail panel and the new-session modal so the two surfaces stay in sync.
 *
 * Profiles are fetched via the shared ``['profiles']`` query, so the list
 * automatically refreshes whenever a profile is created, edited, deleted or
 * cloned from the community browser.
 */
export function ProfileChoiceSelect({
  value,
  onChange,
  disabled = false,
  ariaLabel = 'Processing profile',
}: ProfileChoiceSelectProps) {
  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles'],
    queryFn: listProfiles,
  });

  // Encode the choice as ``preset:<name>`` / ``profile:<uuid>`` so the
  // SearchableSelect can drive both branches with a single string value.
  const options = useMemo<SelectGroup<string>[]>(() => {
    const presetOpts = PRESET_META.map((p) => ({
      value: `preset:${p.value}`,
      label: p.label,
      description: p.description,
      icon: <p.Icon size={13} />,
      searchHaystack: `${p.label} ${p.description} ${p.features.join(' ')}`,
    }));
    const profileOpts = profiles.map((p) => ({
      value: `profile:${p.id}`,
      label: p.name,
      description: p.description ?? 'Custom profile',
      icon: <SlidersHorizontal size={13} />,
      searchHaystack: `${p.name} ${p.description ?? ''}`,
    }));
    const groups: SelectGroup<string>[] = [
      { label: 'Presets', options: presetOpts },
    ];
    if (profileOpts.length > 0) {
      groups.push({ label: 'My profiles', options: profileOpts });
    }
    return groups;
  }, [profiles]);

  const encoded =
    value.kind === 'profile'
      ? `profile:${value.profileId}`
      : `preset:${value.preset}`;

  const handleChange = (raw: string) => {
    if (raw.startsWith('profile:')) {
      onChange({ kind: 'profile', profileId: raw.slice('profile:'.length) });
    } else if (raw.startsWith('preset:')) {
      onChange({
        kind: 'preset',
        preset: raw.slice('preset:'.length) as Exclude<ProfilePreset, 'advanced'>,
      });
    }
  };

  return (
    <SearchableSelect<string>
      value={encoded}
      onChange={handleChange}
      options={options}
      disabled={disabled}
      placeholder="Choose a profile…"
      searchable
      searchPlaceholder="Search presets and saved profiles…"
      maxHeight={280}
      ariaLabel={ariaLabel}
    />
  );
}

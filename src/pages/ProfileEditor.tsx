import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Save, X } from 'lucide-react';
import { listProfiles, createProfile, updateProfile } from '../services/profiles';
import { ProfileList } from '../components/profiles/ProfileList';
import { ProfileForm } from '../components/profiles/ProfileForm';
import { useUiStore } from '../store/uiStore';
import type { ProcessingProfileConfig, ProfileRead } from '../types';

const BLANK_CONFIG: ProcessingProfileConfig = {
  preprocessing: { enable: true, hot_pixel_threshold: 3, cosmic_ray_rejection: true },
  raw_conversion: { enable: true, debayer: true, white_balance: 'auto' },
  star_separation: { enable: true, sensitivity: 5, stars_threshold: 30 },
  gradient_removal: { enable: true, algorithm: 'automatic', degree: 1 },
  denoise: { enable: true, method: 'ai', strength: 50 },
  plate_solving: { enable: true, solver: 'astap', timeout: 120 },
  stretch_color: { enable: true, algorithm: 'arcsinh', factor: 5 },
  super_resolution: { enable: false, scale: 2 },
  sharpen: { enable: false, method: 'Richardson-Lucy', iterations: 10 },
  export: { enable: true, format: 'fits', quality: 95 },
};

export function ProfileEditor() {
  const queryClient = useQueryClient();
  const addToast = useUiStore((s) => s.addToast);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formConfig, setFormConfig] = useState<ProcessingProfileConfig>(BLANK_CONFIG);

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['profiles'],
    queryFn: listProfiles,
  });

  const selectedProfile = profiles.find((p) => p.id === selectedId) ?? null;

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (isCreating || !selectedId) {
        return createProfile({ name: formName, description: formDescription, config: formConfig });
      } else {
        return updateProfile(selectedId, { name: formName, description: formDescription, config: formConfig });
      }
    },
    onSuccess: (profile) => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      setSelectedId(profile.id);
      setIsCreating(false);
      addToast({ variant: 'success', title: isCreating ? 'Profile created' : 'Profile saved' });
    },
    onError: () => {
      addToast({ variant: 'error', title: 'Failed to save profile' });
    },
  });

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setIsCreating(false);
    const profile = profiles.find((p) => p.id === id);
    if (profile) {
      setFormName(profile.name);
      setFormDescription(profile.description ?? '');
      setFormConfig(profile.config);
    }
  };

  const handleNew = () => {
    setSelectedId(null);
    setIsCreating(true);
    setFormName('');
    setFormDescription('');
    setFormConfig(BLANK_CONFIG);
  };

  const handleDuplicate = (profile: ProfileRead) => {
    setSelectedId(null);
    setIsCreating(true);
    setFormName(`${profile.name} (copy)`);
    setFormDescription(profile.description ?? '');
    setFormConfig(profile.config);
  };

  const handleCancel = () => {
    setIsCreating(false);
    setSelectedId(null);
  };

  const hasChanges =
    isCreating ||
    (selectedProfile &&
      (selectedProfile.name !== formName ||
        (selectedProfile.description ?? '') !== formDescription));

  const showForm = isCreating || selectedId !== null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary tracking-tight">Profiles</h1>
          <p className="text-sm text-text-muted mt-0.5">
            Custom processing pipelines for advanced mode
          </p>
        </div>

        <button
          type="button"
          onClick={handleNew}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded transition-all duration-150 shadow-sm"
        >
          <Plus size={15} />
          New profile
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-space-surface border border-space-border rounded-lg p-4">
            <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
              {profiles.length} Profile{profiles.length !== 1 ? 's' : ''}
            </h2>
            <ProfileList
              profiles={profiles}
              loading={isLoading}
              selectedId={selectedId}
              onSelect={handleSelect}
              onDuplicate={handleDuplicate}
            />
          </div>
        </div>

        <div className="lg:col-span-3">
          {showForm ? (
            <div className="bg-space-surface border border-space-border rounded-lg p-5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-semibold text-text-primary">
                  {isCreating ? 'New profile' : `Edit: ${selectedProfile?.name ?? ''}`}
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-text-muted border border-space-border hover:bg-space-elevated rounded transition-all"
                  >
                    <X size={12} />
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => saveMutation.mutate()}
                    disabled={saveMutation.isPending || !formName.trim()}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary hover:bg-primary-hover text-white font-medium rounded transition-all disabled:opacity-50"
                  >
                    {saveMutation.isPending ? (
                      <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Save size={12} />
                    )}
                    Save
                  </button>
                </div>
              </div>

              {hasChanges && !isCreating && (
                <div className="mb-4 px-3 py-2 bg-warning-muted border border-warning/20 rounded text-xs text-warning">
                  You have unsaved changes
                </div>
              )}

              <div className="overflow-y-auto max-h-[calc(100vh-16rem)]">
                <ProfileForm
                  key={selectedId ?? 'new'}
                  initialConfig={isCreating ? BLANK_CONFIG : selectedProfile?.config}
                  name={formName}
                  description={formDescription}
                  onNameChange={setFormName}
                  onDescriptionChange={setFormDescription}
                  onConfigChange={setFormConfig}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 bg-space-surface border border-dashed border-space-border rounded-lg text-center">
              <p className="text-sm text-text-muted">Select a profile to edit</p>
              <p className="text-xs text-text-muted mt-1">
                or{' '}
                <button
                  type="button"
                  onClick={handleNew}
                  className="text-primary hover:text-primary-hover underline"
                >
                  create a new one
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../ui/Modal';
import { ObservationSiteForm } from './ObservationSiteForm';
import { createObservationSite, updateObservationSite } from '../../services/observationSites';
import { useUiStore } from '../../store/uiStore';
import type { ObservationSite, ObservationSiteCreate } from '../../types';

interface ObservationSiteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  site?: ObservationSite;
}

export function ObservationSiteModal({
  open,
  onOpenChange,
  mode,
  site,
}: ObservationSiteModalProps) {
  const queryClient = useQueryClient();
  const { addToast } = useUiStore();

  const mutation = useMutation({
    mutationFn: (data: ObservationSiteCreate) =>
      mode === 'edit' && site
        ? updateObservationSite(site.id, data)
        : createObservationSite(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['observation_sites'] });
      addToast({
        variant: 'success',
        title: mode === 'edit' ? 'Site updated' : 'Site created',
      });
      onOpenChange(false);
    },
    onError: (err: Error) => {
      addToast({
        variant: 'error',
        title: mode === 'edit' ? 'Could not update site' : 'Could not create site',
        message: err.message,
      });
    },
  });

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={mode === 'edit' ? 'Edit observation site' : 'Add an observation site'}
      size="md"
    >
      <ObservationSiteForm
        initial={mode === 'edit' ? site : undefined}
        submitting={mutation.isPending}
        onCancel={() => onOpenChange(false)}
        onSubmit={(data) => mutation.mutate(data)}
      />
    </Modal>
  );
}

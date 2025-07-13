import { Automation } from '../types/automation';

export interface AutomationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (automationData: any) => void;
  automation: Automation | null;
  isCreating: boolean;
}

declare function AutomationModal(props: AutomationModalProps): JSX.Element;

export default AutomationModal;

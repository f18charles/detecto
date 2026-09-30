import { MODES } from '../stores/NavigationStore';

export const MODE_NAMES = {
  [MODES.NAV]: 'NAV',
  [MODES.LIST]: 'LIST',
  [MODES.RESULT]: 'RESULT',
};

export const HELP_TEXT = {
  [MODES.NAV]: { title: 'NAV MODE', help: '↑/↓ Switch pages · ENTER Open menu' },
  [MODES.LIST]: { title: 'LIST MODE', help: '↑/↓ Select · F/D/T Filters · C Clear history · ENTER Open · ESC Back' },
  [MODES.RESULT]: { title: 'RESULT MODE', help: 'ESC Back to list · cancels preprocess' },
};

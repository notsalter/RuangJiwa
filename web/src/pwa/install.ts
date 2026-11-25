export function isIOS(device: Pick<Navigator, 'userAgent' | 'platform' | 'maxTouchPoints'>): boolean {
  return /iPad|iPhone|iPod/.test(device.userAgent) || (device.platform === 'MacIntel' && device.maxTouchPoints > 1);
}

export function isInstalled(displayMode: boolean, navigatorStandalone: boolean | undefined): boolean {
  return displayMode || navigatorStandalone === true;
}

export type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

'use client';

export const LS_RESUME_ID = 'resumealign:lastResumeId';
export const LS_JOB_ID = 'resumealign:lastJobId';

const SAVED_IDS_UPDATED_EVENT = 'resumealign:saved-ids-updated';

export function getStoredId(key: string) {
  try {
    return window.localStorage.getItem(key) ?? '';
  } catch {
    return '';
  }
}

export function setStoredId(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
    window.dispatchEvent(
      new CustomEvent(SAVED_IDS_UPDATED_EVENT, { detail: { key, value } }),
    );
  } catch {
    // ignore
  }
}

export function subscribeToStoredIdsUpdated(listener: () => void) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const onSavedIdsUpdated = () => listener();
  const onStorage = (event: StorageEvent) => {
    if (event.key === LS_RESUME_ID || event.key === LS_JOB_ID) {
      listener();
    }
  };

  window.addEventListener(
    SAVED_IDS_UPDATED_EVENT,
    onSavedIdsUpdated as EventListener,
  );
  window.addEventListener('storage', onStorage);

  return () => {
    window.removeEventListener(
      SAVED_IDS_UPDATED_EVENT,
      onSavedIdsUpdated as EventListener,
    );
    window.removeEventListener('storage', onStorage);
  };
}

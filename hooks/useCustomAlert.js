import { useCallback, useState } from 'react';

const INITIAL_ALERT = Object.freeze({
  visible: false,
  title: '',
  message: '',
  type: 'info',
  buttons: [],
});

export function useCustomAlert() {
  const [alertState, setAlertState] = useState(INITIAL_ALERT);

  const showAlert = useCallback((title, message, type = 'info', buttons = []) => {
    setAlertState({
      visible: true,
      title,
      message,
      type,
      buttons,
    });
  }, []);

  const hideAlert = useCallback(() => {
    setAlertState((prev) => ({ ...prev, visible: false }));
  }, []);

  const resetAlert = useCallback(() => {
    setAlertState(INITIAL_ALERT);
  }, []);

  return {
    customAlert: alertState,
    showAlert,
    hideAlert,
    resetAlert,
  };
}
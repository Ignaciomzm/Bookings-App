import { useCallback, useState } from 'react';

export function usePasswordVisibility(initial = false) {
  const [visible, setVisible] = useState(initial);

  const toggle = useCallback(() => {
    setVisible((prev) => !prev);
  }, []);

  return {
    visible,
    toggle,
    secure: !visible,
  };
}
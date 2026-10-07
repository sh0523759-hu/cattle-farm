import { useState, useEffect } from 'react';
import { getStorageData, setStorageData } from '../utils/storage';

export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    return getStorageData(key, initialValue);
  });

  useEffect(() => {
    setStorageData(key, storedValue);
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}

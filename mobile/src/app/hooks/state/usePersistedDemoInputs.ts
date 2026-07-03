import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';

const inputStorageKey = 'integrity-demo-mobile-inputs';

export function usePersistedDemoInputs() {
  const [username, setUsername] = useState('demo');
  const [password, setPassword] = useState('password123');
  const [notes, setNotes] = useState('hello from integrity demo');
  const hasLoadedSavedInputs = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function loadSavedInputs() {
      try {
        const raw = await AsyncStorage.getItem(inputStorageKey);
        if (!raw || cancelled) {
          return;
        }

        const saved = JSON.parse(raw) as Partial<{
          username: string;
          password: string;
          notes: string;
        }>;

        if (typeof saved.username === 'string') {
          setUsername(saved.username);
        }
        if (typeof saved.password === 'string') {
          setPassword(saved.password);
        }
        if (typeof saved.notes === 'string') {
          setNotes(saved.notes);
        }
      } catch (error) {
        console.warn('Failed to load saved mobile inputs', error);
      } finally {
        if (!cancelled) {
          hasLoadedSavedInputs.current = true;
        }
      }
    }

    loadSavedInputs();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedSavedInputs.current) {
      return;
    }

    AsyncStorage.setItem(
      inputStorageKey,
      JSON.stringify({
        username,
        password,
        notes,
      })
    ).catch((error) => {
      console.warn('Failed to save mobile inputs', error);
    });
  }, [notes, password, username]);

  return {
    notes,
    password,
    setNotes,
    setPassword,
    setUsername,
    username,
  };
}

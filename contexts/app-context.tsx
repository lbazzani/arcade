import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeServer, getServerUrl, setServerUrl } from '@/services/api';

const PLAYER_NAME_KEY = '@bazzani_arcade_player_name';

interface AppContextType {
  playerName: string | null;
  setPlayerName: (name: string) => Promise<void>;
  clearPlayerName: () => Promise<void>;
  serverUrl: string | null;
  isServerReady: boolean;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [playerName, setPlayerNameState] = useState<string | null>(null);
  const [serverUrl, setServerUrlState] = useState<string | null>(null);
  const [isServerReady, setIsServerReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        // Load player name from storage
        const storedName = await AsyncStorage.getItem(PLAYER_NAME_KEY);
        if (storedName) {
          setPlayerNameState(storedName);
        }

        // Initialize server connection
        const url = await initializeServer();
        setServerUrlState(url);
        setIsServerReady(url !== null);
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  // Set player name and persist
  const setPlayerName = async (name: string) => {
    const trimmedName = name.trim().toUpperCase().slice(0, 10);
    if (trimmedName.length > 0) {
      await AsyncStorage.setItem(PLAYER_NAME_KEY, trimmedName);
      setPlayerNameState(trimmedName);
    }
  };

  // Clear player name
  const clearPlayerName = async () => {
    await AsyncStorage.removeItem(PLAYER_NAME_KEY);
    setPlayerNameState(null);
  };

  return (
    <AppContext.Provider
      value={{
        playerName,
        setPlayerName,
        clearPlayerName,
        serverUrl,
        isServerReady,
        isLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

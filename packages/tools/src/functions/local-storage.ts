export const persistLocalStorage = <T>(key: string, value: T) => {
  localStorage.setItem(key, JSON.stringify({ ...value }));
};

export const clearLocalStorage = (key: string) => {
  localStorage.removeItem(key);
};

export const getLocalStorage = <T>(key: string): T | null => {
  const storedItem = localStorage.getItem(key);
  if (storedItem) {
      try {
          const parsedItem = JSON.parse(storedItem);
          return parsedItem as T;
      } catch (error) {
          console.error('Error parsing local storage item:', error);
          return null;
      }
  } else {
      return null;
  }
};

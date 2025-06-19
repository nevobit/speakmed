export const calculateReadingTime = (text: string, wordsPerMinute = 150) => {
  const words = text.split(/\s+/);
  const wordCount = words.length;
  const readingTimeMinutes = Math.ceil(wordCount / wordsPerMinute);

  return readingTimeMinutes;
}
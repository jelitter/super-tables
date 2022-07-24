export const toTitleCase = (words: string) =>
  words
    .toLowerCase()
    .split(/[\s_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

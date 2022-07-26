export const toTitleCase = (words: string) =>
  words
    .toLowerCase()
    .split(/[\s_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

export const isValidUrl = (url: string) =>
  /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/.test(
    url
  );

export const isValidJson = (json: string) =>
  /^[\],:{}\s]*$/.test(json) &&
  /^[\[\],:{}\s]*$/.test(
    json
      .replace(/\\["\\\/bfnrtu]/g, '@')
      .replace(
        /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,
        ']'
      )
  );

// 1. Trim string
// 2. Remove empty carriage returns
// 3. Remove trailing new lines
export const clean = (text: string) => {
  return text.trim().replace(/\r\n/g, '\n').replace(/\n+$/, '');
};

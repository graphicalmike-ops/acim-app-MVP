const LOWERCASE_ES = new Set([
  'de', 'del', 'la', 'las', 'el', 'los', 'un', 'una', 'unos', 'unas',
  'y', 'o', 'e', 'u', 'a', 'en', 'es', 'con', 'por', 'para', 'ni', 'que', 'si', 'al',
]);

const HAS_ALPHA = /[a-záéíóúüñA-ZÁÉÍÓÚÜÑ]/;

export function toTitleCase(str: string): string {
  let firstAlphaFound = false;
  return str.replace(/\S+/g, (word) => {
    const isAlpha = HAS_ALPHA.test(word);
    if (isAlpha && !firstAlphaFound) {
      firstAlphaFound = true;
      return word.charAt(0).toUpperCase() + word.slice(1);
    }
    if (LOWERCASE_ES.has(word.toLowerCase())) return word.toLowerCase();
    return word.charAt(0).toUpperCase() + word.slice(1);
  });
}

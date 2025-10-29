export function lightenColor(hex, amount = 0.5) {
  if (!hex || typeof hex !== 'string') return hex;
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return hex;
  const num = parseInt(clean, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  const blend = (channel) => Math.round(channel + (255 - channel) * amount);
  const nr = Math.min(255, blend(r));
  const ng = Math.min(255, blend(g));
  const nb = Math.min(255, blend(b));
  const toHex = (val) => val.toString(16).padStart(2, '0');
  return `#${toHex(nr)}${toHex(ng)}${toHex(nb)}`;
}

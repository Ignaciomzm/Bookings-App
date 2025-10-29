export const APP_SCHEME = 'triosalon';

export const makeLink = (path = '/') => `${APP_SCHEME}://${String(path).replace(/^\//, '')}`;

export const POLAND_PREFIX = '+48 ';

export const currency = (value) => `PLN ${Number(value || 0).toFixed(2)}`;

export const timeLabel = (date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const dateLabel = (date) => date.toLocaleDateString();

export const withPolandPrefix = (input) => {
  const raw = input || '';
  if (raw.startsWith('+48')) return raw;
  const stripped = raw.replace(/^[+\d\s]*/, '');
  return POLAND_PREFIX + stripped;
};

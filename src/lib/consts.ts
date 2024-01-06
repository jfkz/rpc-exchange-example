export const EXCHANGE_NAME = 'exchange_worker';
export const GRAPE_URI = process.env.GRAPE_URI || 'http://127.0.0.1:30001';
export const enum ANNOUNCE_COMMANDS {
  'started' = 'started',
}
export enum COIN {
  'BTC' = 'BTC',
  'ETH' = 'ETH',
  'LTC' = 'LTC',
  'XRP' = 'XRP',
  'BCH' = 'BCH',
  'EOS' = 'EOS',
  'BNB' = 'BNB',
  'XTZ' = 'XTZ',
  'LINK' = 'LINK',
  'XLM' = 'XLM',
}

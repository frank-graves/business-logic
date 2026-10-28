import { createReceipt } from './receipt.js';

export const emitDocument = (clientType, items, buyerInfo = {}) => {
  const type = clientType === 'empresa' ? 'factura' : 'boleta';
  return createReceipt(type, items, buyerInfo);
};
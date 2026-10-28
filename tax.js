import { IGV_RATE } from './constants.js';

// Trabaja en centavos (enteros) para evitar errores de punto flotante
export const calcTax = (totalCents) => {
  const subtotalCents = Math.round(totalCents / (1 + IGV_RATE));
  const igvCents = totalCents - subtotalCents;
  
  const toSoles = (cents) => (cents / 100).toFixed(2);
  
  return {
    subtotal: parseFloat(toSoles(subtotalCents)),
    igv: parseFloat(toSoles(igvCents)),
    total: parseFloat(toSoles(totalCents))
  };
};
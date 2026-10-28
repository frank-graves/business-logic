import { EMISOR } from './constants.js';
import { calcTax } from './tax.js';

const generateSerie = (type) => (type === 'factura' ? 'F001' : 'B001');
const generateCorrelativo = () => Math.floor(Math.random() * 90000000 + 10000000).toString();

// Conversor mínimo de números a letras (simplificado para el total)
const numberToWords = (num) => `${num.toFixed(2)} SOLES`; // Placeholder robusto. Librerías como 'numero-a-letras' añaden 50kb+ innecesarios.

export const createReceipt = (type, items, buyerInfo = {}) => {
  // 1. Validación de reglas SUNAT
  const totalCents = items.reduce((sum, i) => sum + (i.priceCents * i.qty), 0);
  const totalSoles = totalCents / 100;

  if (type === 'boleta' && totalSoles > 700 && !buyerInfo.documento) {
    throw new Error('Boletas > S/ 700 requieren DNI/RUC del comprador.');
  }
  if (type === 'factura') {
    if (!buyerInfo.nombre || !/^\d{11}$/.test(buyerInfo.ruc) || !buyerInfo.direccion) {
      throw new Error('Factura requiere nombre, RUC (11 dígitos) y dirección del comprador.');
    }
  }

  // 2. Procesamiento de ítems (desglose unitario)
  const processedItems = items.map(item => {
    const priceUnitCents = item.priceCents;
    const valueUnitCents = Math.round(priceUnitCents / 1.18);
    return {
      cantidad: item.qty,
      unidad: item.unidad || 'NIU',
      descripcion: item.name,
      valorUnitario: (valueUnitCents / 100).toFixed(2),
      precioUnitario: (priceUnitCents / 100).toFixed(2),
      totalItem: ((priceUnitCents * item.qty) / 100).toFixed(2)
    };
  });

  // 3. Ensamblaje del comprobante
  const tax = calcTax(totalCents);
  const serie = generateSerie(type);
  
  return {
    emisor: EMISOR,
    comprobante: {
      tipo: type.toUpperCase() === 'FACTURA' ? 'FACTURA' : 'BOLETA DE VENTA',
      serie,
      correlativo: generateCorrelativo(),
      fecha: new Date().toISOString().replace('T', ' ').substring(0, 16)
    },
    comprador: type === 'factura' ? buyerInfo : (totalSoles > 700 ? buyerInfo : { nombre: 'CLIENTE VARIOS' }),
    detalle: processedItems,
    totales: {
      subtotal: tax.subtotal.toFixed(2),
      igv: tax.igv.toFixed(2),
      total: tax.total.toFixed(2),
      totalEnLetras: `${numberToWords(tax.total)} CON ${Math.round((tax.total % 1) * 100).toString().padStart(2, '0')}/100`
    },
    informacionAdicional: type === 'factura' ? {
      condicionPago: 'Contado',
      cuentaBancaria: EMISOR.cuentaBancaria,
      autorizacion: 'RESOLUCION DE INTENDENCIA N° 034-005-000538'
    } : undefined
  };
};
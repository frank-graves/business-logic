import { emitDocument } from './store.js';
import { printReceipt } from './formatter.js';

// 1. Boleta normal (< S/ 700, sin datos de cliente)
const boletaSimple = emitDocument('natural', [
  { name: 'Cable HDMI 2m', priceCents: 2500, qty: 1, unidad: 'NIU' }, // S/ 25.00
  { name: 'Mouse Ergonómico', priceCents: 8500, qty: 1, unidad: 'NIU' } // S/ 85.00
]);
printReceipt(boletaSimple);

// 2. Boleta > S/ 700 (Obligatorio DNI)
const boletaMayor = emitDocument('natural', [
  { name: 'Monitor 24"', priceCents: 45000, qty: 1, unidad: 'NIU' } // S/ 450.00
], { nombre: 'Juan Pérez', documento: '70123456' });
printReceipt(boletaMayor);

// 3. Factura (Obligatorio RUC, Nombre, Dirección)
const factura = emitDocument('empresa', [
  { name: 'Teclado Mecánico', priceCents: 35000, qty: 2, unidad: 'NIU' }, // S/ 350.00 x 2
  { name: 'Disco SSD 500GB', priceCents: 22000, qty: 1, unidad: 'NIU' }   // S/ 220.00
], { 
  nombre: 'Innovación Digital EIRL', 
  ruc: '20609876543', 
  direccion: 'Calle Falsa 123, Miraflores' 
});
printReceipt(factura);
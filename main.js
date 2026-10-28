// main.js
const EMISOR = {
  razonSocial: 'Tech Solutions SAC',
  ruc: '20601234567',
  direccionFiscal: 'Av. La Tecnología 123, Lima',
  cuentaBancaria: 'BCP 191-12345678-0-99'
};

const IGV = 0.18;
let correlativo = 10000000;
const soles = cents => (cents / 100).toFixed(2);
const linea = '-'.repeat(65);

const emitir = (tipoCliente, items, comprador = {}) => {
  const esFactura = tipoCliente === 'empresa';
  const total = items.reduce((sum, i) => sum + i.priceCents * i.qty, 0);

  if (!esFactura && total > 70000 && !comprador.documento) {
    throw new Error('Boleta > S/ 700: DNI/RUC.');
  }

  if (esFactura && (!comprador.nombre || !comprador.direccion || !/^\d{11}$/.test(comprador.ruc || ''))) {
    throw new Error('Factura: nombre, RUC de 11 dígitos y dirección.');
  }

  return {
    tipo: esFactura ? 'FACTURA' : 'BOLETA DE VENTA',
    serie: esFactura ? 'F001' : 'B001',
    correlativo: String(correlativo++),
    fecha: new Date().toISOString().slice(0, 16).replace('T', ' '),
    comprador,
    items,
    subtotal: Math.round(total / (1 + IGV)),
    total
  };
};

const imprimir = d => {
  console.log(`\n${linea}`);
  console.log(`${d.tipo} ${d.serie}-${d.correlativo}`);
  console.log(linea);
  console.log(`EMISOR: ${EMISOR.razonSocial}`);
  console.log(`RUC: ${EMISOR.ruc}`);
  console.log(`CLIENTE: ${d.comprador.nombre || 'CLIENTE VARIOS'}`);
  if (d.comprador.ruc || d.comprador.documento) {
    console.log(`RUC/DNI: ${d.comprador.ruc || d.comprador.documento}`);
  }
  if (d.comprador.direccion) console.log(`DIR: ${d.comprador.direccion}`);
  console.log(`FECHA: ${d.fecha}`);
  console.log(linea);

  d.items.forEach(i => {
    const totalItem = i.priceCents * i.qty;
    console.log(
      `${String(i.qty).padEnd(3)} ${i.name.padEnd(28)} ` +
      `${soles(i.priceCents).padStart(9)} ${soles(totalItem).padStart(10)}`
    );
  });

  console.log(linea);
  console.log(`SUBTOTAL: S/ ${soles(d.subtotal).padStart(10)}`);
  if (d.tipo === 'FACTURA') {
    console.log(`IGV (18%): S/ ${soles(d.total - d.subtotal).padStart(10)}`);
  }
  console.log(`TOTAL: S/ ${soles(d.total).padStart(10)}`);
  console.log(linea);
};

// Tests
imprimir(emitir('natural', [
  { name: 'Cable HDMI 2m', priceCents: 2500, qty: 1 },
  { name: 'Mouse Ergonómico', priceCents: 8500, qty: 1 }
]));

imprimir(emitir('natural', [
  { name: 'Monitor 24"', priceCents: 90000, qty: 1 }
], { nombre: 'Juan Pérez', documento: '70123456' }));

imprimir(emitir('empresa', [
  { name: 'Teclado Mecánico', priceCents: 35000, qty: 2 },
  { name: 'Disco SSD 500GB', priceCents: 22000, qty: 1 }
], {
  nombre: 'Innovación Digital EIRL',
  ruc: '20609876543',
  direccion: 'Calle Falsa 123, Miraflores'
}));
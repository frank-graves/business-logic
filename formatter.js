export const printReceipt = (doc) => {
  const line = '─'.repeat(65);
  console.log(`\n${line}`);
  console.log(`${doc.comprobante.tipo}`.padEnd(30) + `${doc.comprobante.serie}-${doc.comprobante.correlativo}`);
  console.log(line);
  console.log(`EMISOR: ${doc.emisor.razonSocial}`);
  console.log(`RUC:    ${doc.emisor.ruc}`);
  console.log(`DIR:    ${doc.emisor.direccionFiscal}`);
  console.log(line);
  console.log(`CLIENTE: ${doc.comprador.nombre}`);
  if (doc.comprador.ruc) console.log(`RUC/DNI: ${doc.comprador.ruc}`);
  if (doc.comprador.direccion) console.log(`DIR:     ${doc.comprador.direccion}`);
  console.log(`FECHA:   ${doc.comprobante.fecha}`);
  console.log(line);
  console.log('CANT  DESCRIPCIÓN          VALOR UNIT  PRECIO UNIT  TOTAL');
  doc.detalle.forEach(i => {
    console.log(`${i.cantidad.toString().padEnd(4)}  ${i.descripcion.substring(0, 19).padEnd(19)}  ${i.valorUnitario.padStart(10)}  ${i.precioUnitario.padStart(11)}  ${i.totalItem.padStart(10)}`);
  });
  console.log(line);
  console.log(`SUBTOTAL:                       S/ ${doc.totales.subtotal.padStart(10)}`);
  if (doc.comprobante.tipo === 'FACTURA') {
    console.log(`IGV (18%):                      S/ ${doc.totales.igv.padStart(10)}`);
  }
  console.log(`TOTAL:                          S/ ${doc.totales.total.padStart(10)}`);
  console.log(`SON: ${doc.totales.totalEnLetras}`);
  if (doc.informacionAdicional) {
    console.log(line);
    console.log(`PAGO: ${doc.informacionAdicional.condicionPago} | CT: ${doc.informacionAdicional.cuentaBancaria}`);
  }
  console.log(`${line}\n`);
};
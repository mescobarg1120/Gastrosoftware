export function validateRut(rut: string): boolean {
  const cleaned = rut.replace(/[.\s]/g, '');
  const match = cleaned.match(/^(\d+)([0-9Kk])$/);
  if (!match) return false;

  const body = match[1];
  const dvIngresado = match[2].toUpperCase();

  let sum = 0;
  let multiplier = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = 11 - (sum % 11);
  let dvEsperado: string;
  if (remainder === 11) dvEsperado = '0';
  else if (remainder === 10) dvEsperado = 'K';
  else dvEsperado = remainder.toString();

  return dvEsperado === dvIngresado;
}

export function formatRut(value: string): string {
  const cleaned = value.replace(/[.\s-]/g, '');
  const match = cleaned.match(/^(\d+)([0-9Kk])?$/);
  if (!match) return value;

  const body = match[1];
  const dv = match[2] ? match[2].toUpperCase() : '';

  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return dv ? `${formattedBody}-${dv}` : formattedBody;
}

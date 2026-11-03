// Reconoce el tipo real de un archivo por sus primeros bytes. La extensión y el Content-Type
// que manda el navegador no sirven: cualquiera puede renombrar un .exe a .png.
const SIGNATURES = [
  { mime: 'image/jpeg', matches: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: 'image/png', matches: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { mime: 'image/webp', matches: (b) => b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP' },
  { mime: 'application/pdf', matches: (b) => b.subarray(0, 5).toString('latin1') === '%PDF-' },
];

export const detectMime = (buffer) => SIGNATURES.find((type) => type.matches(buffer))?.mime ?? null;

const ADJ = [
  "Sakit",
  "Kəşfiyyatçı",
  "Sədaqətli",
  "Enerjili",
  "Düşünən",
  "Yaradıcı",
  "Maraqli",
  "Sərbəst",
];

export function anonNicknameFromSeed(seed) {
  const s = String(seed || "x");
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  const adj = ADJ[Math.abs(h) % ADJ.length];
  const n = (Math.abs(h) % 900) + 100;
  return `Anonim ${adj} #${n}`;
}

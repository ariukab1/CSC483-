function parseDuration(str) {
  // Should be something good
  let valid = typeof str === 'string' && /^(([0-9]{1,2}:)?)*[0-9]{1,2}$/.test(str);
  if (!valid) return NaN;

  let pieces = str.split(':').map(s => parseInt(s));
  
  // Eh...
  if (!pieces.every(p => p >= 0 && p < 60))
    return NaN;

  let sum = 0;

  // XXX Seems poor...
  for (let i = 0; i < pieces.length; i++) {
    sum = sum * 60 + pieces[i];
  }

  return sum;
}
/*
let test = [
  '0', '1', '59',
  '1:00', '0:00', '1:30',
  '1:00:00', '0:10:00', '0:99:0'
]

for (let d of test) {
  console.log(d, parseDuration(d));
}*/
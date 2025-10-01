// utils/dateFormat.ts
export const toJet2 = (iso: string): string => {
  // iso = "2025-05-25"
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');      // "25"
  const mmm = ['JAN','FEB','MAR','APR','MAY','JUN',
               'JUL','AUG','SEP','OCT','NOV','DEC'][d.getMonth()];
  const yy  = String(d.getFullYear()).slice(-2);        // "25"
  return `${dd}${mmm}${yy}`;                            // "25MAY25"
};

export const fromJet2 = (j: string): string => {
  // reverse to ISO so <input type="date"> can show it
  const dd   = j.slice(0,2);          // "25"
  const mmm  = j.slice(2,5);          // "MAY"
  const yy   = j.slice(5);            // "25"  (=2025)
  const months = {JAN:'01',FEB:'02',MAR:'03',APR:'04',MAY:'05',JUN:'06',
                  JUL:'07',AUG:'08',SEP:'09',OCT:'10',NOV:'11',DEC:'12'};
  return `20${yy}-${months[mmm]}-${dd}`;                // "2025-05-25"
};
const prompts: string[] = [
  'Apa tiga hal kecil yang membuatmu tersenyum hari ini? Jelaskan mengapa itu berarti.',
  'Tuliskan satu tantangan yang kamu hadapi minggu ini dan bagaimana kamu mengatasinya.',
  'Siapa orang yang membuatmu merasa dihargai akhir-akhir ini? Apa yang mereka lakukan?',
  'Apa perasaan dominan yang kamu rasakan hari ini? Jelaskan asalnya.',
  'Tuliskan pesan penyemangat untuk dirimu di masa depan ketika hari terasa berat.',
  'Apa kebiasaan sehat yang ingin kamu pertahankan bulan ini? Mengapa itu penting?',
  'Ceritakan momen ketika kamu merasa bangga terhadap dirimu sendiri.',
];

export function getRandomPrompt(): string {
  const index = Math.floor(Math.random() * prompts.length);
  return prompts[index];
}

export function getAllPrompts(): string[] {
  return prompts;
}

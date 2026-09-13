export const SINONIM_TIPE_3: Record<string, readonly string[]> = {
  'CEPAT SAJI': ['fast food', 'ayam goreng tepung', 'fried chicken', 'burger', 'gerai cepat saji'],
  'NASI GORENG': ['nasi goreng', 'nasgor', 'gerobak nasi goreng', 'nasi goreng gerobak'],
  SEAFOOD: ['seafood', 'ikan bakar', 'kepiting', 'udang', 'cumi', 'pecak ikan'],
  'MIE DAN BAKSO': ['bakso', 'mie ayam', 'mi ayam', 'pangsit', 'mie yamin', 'bakmi'],
  'RESTORAN PADANG': ['rumah makan padang', 'rm padang', 'masakan minang', 'nasi kapau', 'nasi padang'],
  'RESTORAN KOREA': ['korean bbq', 'masakan korea', 'korean food', 'bibimbap', 'tteokbokki'],
  'RESTORAN MELAYU': ['masakan melayu', 'nasi lemak', 'masakan sumatera', 'rumah makan melayu'],
  'RESTORAN JEPANG': ['masakan jepang', 'japanese food', 'donburi', 'katsu', 'teppanyaki'],
  'KAFE DAN RESTO': ['kafe', 'cafe', 'coffee shop', 'kedai kopi', 'warung kopi', 'ngopi', 'kopi susu'],
  'RESTORAN THAILAND': ['masakan thailand', 'thai food', 'tom yum', 'pad thai'],
  'WARUNG TEGAL': ['warteg', 'warung tegal', 'warung nasi', 'warung makan', 'nasi rames'],
  'RESTORAN TIMUR TENGAH': ['kebab', 'nasi kebuli', 'masakan arab', 'shawarma', 'timur tengah'],
  SUSHI: ['sushi', 'sashimi', 'sushi roll'],
  'RESTORAN EROPA': ['masakan eropa', 'western food', 'pasta', 'italian', 'bistro'],
  'STEAK DAN BBQ': ['steak', 'steakhouse', 'bbq', 'barbeque', 'grill'],
  'RESTORAN VIETNAM': ['masakan vietnam', 'pho', 'banh mi', 'vietnamese'],
  RAMEN: ['ramen', 'kedai ramen', 'mie jepang'],
  'RESTORAN CINA': ['chinese food', 'masakan cina', 'masakan tionghoa', 'dimsum', 'kwetiau'],
  'RESTORAN MEKSIKO': ['masakan meksiko', 'mexican food', 'taco', 'burrito'],
  'RESTORAN AYAM': ['ayam geprek', 'ayam penyet', 'ayam bakar', 'ayam kremes', 'warung ayam'],
  PIZZA: ['pizza', 'kedai pizza', 'pizzeria'],
  JAJANAN: ['jajanan', 'gorengan', 'cemilan', 'snack', 'martabak', 'kaki lima jajanan'],
  'RESTORAN NUSANTARA': ['masakan nusantara', 'masakan indonesia', 'masakan daerah'],
  'RESTORAN AFRIKA': ['masakan afrika', 'african food'],
}

export const HARGA_PERKIRAAN: Record<string, number> = {
  JAJANAN: 14_000,
  'MIE DAN BAKSO': 14_000,
  'NASI GORENG': 14_000,

  'CEPAT SAJI': 17_000,
  'RESTORAN AYAM': 17_000,
  PIZZA: 17_000,

  'WARUNG TEGAL': 20_000,
  'RESTORAN PADANG': 20_000,
  'RESTORAN MELAYU': 20_000,
  'RESTORAN NUSANTARA': 20_000,

  'KAFE DAN RESTO': 22_000,

  SEAFOOD: 30_000,
  'RESTORAN KOREA': 30_000,
  'RESTORAN JEPANG': 30_000,
  'RESTORAN THAILAND': 30_000,
  'RESTORAN TIMUR TENGAH': 30_000,
  'RESTORAN VIETNAM': 30_000,
  'RESTORAN CINA': 30_000,
  'RESTORAN MEKSIKO': 30_000,
  'RESTORAN EROPA': 30_000,
  'STEAK DAN BBQ': 30_000,
  'RESTORAN AFRIKA': 30_000,
  SUSHI: 30_000,
  RAMEN: 30_000,
}

export const HARGA_DEFAULT = 20_000

export function daftarUntukPrompt(tipe3Values: string[]): string {
  return tipe3Values
    .map((t) => {
      const sinonim = SINONIM_TIPE_3[t]
      const harga = HARGA_PERKIRAAN[t] ?? HARGA_DEFAULT
      const contoh = sinonim?.length ? ` (mis. ${sinonim.join(', ')})` : ''
      return `- "${t}"${contoh} — perkiraan harga ${harga}`
    })
    .join('\n')
}

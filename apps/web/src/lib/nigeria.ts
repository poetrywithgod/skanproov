/**
 * The 36 states and the Federal Capital Territory, each with a few of its main cities.
 * The cities are suggestions for the City field, not a complete list: a company in a town that is
 * not listed can still type it in.
 */
export const NIGERIA: Readonly<Record<string, readonly string[]>> = {
  Abia: ["Aba", "Umuahia", "Arochukwu"],
  Adamawa: ["Yola", "Mubi", "Jimeta"],
  "Akwa Ibom": ["Uyo", "Eket", "Ikot Ekpene"],
  Anambra: ["Awka", "Onitsha", "Nnewi"],
  Bauchi: ["Bauchi", "Azare", "Misau"],
  Bayelsa: ["Yenagoa", "Ogbia", "Brass"],
  Benue: ["Makurdi", "Gboko", "Otukpo"],
  Borno: ["Maiduguri", "Bama", "Biu"],
  "Cross River": ["Calabar", "Ogoja", "Ikom"],
  Delta: ["Asaba", "Warri", "Sapele", "Ughelli"],
  Ebonyi: ["Abakaliki", "Afikpo"],
  Edo: ["Benin City", "Auchi", "Ekpoma"],
  Ekiti: ["Ado-Ekiti", "Ikere-Ekiti", "Ijero"],
  Enugu: ["Enugu", "Nsukka", "Agbani"],
  "Federal Capital Territory": ["Abuja", "Gwagwalada", "Kuje"],
  Gombe: ["Gombe", "Kumo", "Billiri"],
  Imo: ["Owerri", "Orlu", "Okigwe"],
  Jigawa: ["Dutse", "Hadejia", "Gumel"],
  Kaduna: ["Kaduna", "Zaria", "Kafanchan"],
  Kano: ["Kano", "Wudil", "Gwarzo"],
  Katsina: ["Katsina", "Daura", "Funtua"],
  Kebbi: ["Birnin Kebbi", "Argungu", "Zuru"],
  Kogi: ["Lokoja", "Okene", "Kabba"],
  Kwara: ["Ilorin", "Offa", "Omu-Aran"],
  Lagos: ["Ikeja", "Lagos Island", "Victoria Island", "Lekki", "Ikorodu", "Apapa", "Surulere", "Badagry"],
  Nasarawa: ["Lafia", "Keffi", "Karu"],
  Niger: ["Minna", "Suleja", "Bida"],
  Ogun: ["Abeokuta", "Ijebu-Ode", "Sagamu", "Ota"],
  Ondo: ["Akure", "Ondo", "Owo"],
  Osun: ["Osogbo", "Ile-Ife", "Ilesa"],
  Oyo: ["Ibadan", "Ogbomosho", "Oyo"],
  Plateau: ["Jos", "Bukuru", "Pankshin"],
  Rivers: ["Port Harcourt", "Obio-Akpor", "Bonny", "Eleme"],
  Sokoto: ["Sokoto", "Wurno", "Gwadabawa"],
  Taraba: ["Jalingo", "Wukari", "Bali"],
  Yobe: ["Damaturu", "Potiskum", "Gashua"],
  Zamfara: ["Gusau", "Kaura Namoda", "Talata Mafara"],
};

export const NIGERIAN_STATES = Object.keys(NIGERIA);

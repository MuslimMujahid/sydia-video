/** Sari's customers, their orders and today's order note. */
export type Customer = { readonly name: string; readonly initials: string; readonly color: string; readonly bg: string };

export const CUSTOMERS = {
  rina: { name: "Bu Rina", initials: "BR", color: "#a3173f", bg: "#f9d3df" },
  dedi: { name: "Pak Dedi", initials: "PD", color: "#1d4ed8", bg: "#dbe6ff" },
  lia: { name: "Lia", initials: "L", color: "#7c3aed", bg: "#ece3ff" },
  yusuf: { name: "Yusuf", initials: "Y", color: "#047857", bg: "#d5f5e6" },
  tini: { name: "Bu Tini", initials: "BT", color: "#b45309", bg: "#fdebd2" },
} satisfies Record<string, Customer>;

export type CustomerKey = keyof typeof CUSTOMERS;

/** Each customer's WhatsApp order, pre-wrapped to the phone bubble width. */
export const ORDER_MSG: Record<CustomerKey, readonly string[]> = {
  rina: ["Kak, Rina mau pesan keripik", "pisang 3 bungkus sama sambal", "roa 2 botol ya. Kirim ke", "Jl. Melati 12, bayar transfer."],
  dedi: ["Mbak, Dedi order sambal roa 4", "botol. Ambil sendiri sore, bayar", "di tempat."],
  lia: ["Kak, aku Lia. Nastar 2 toples,", "ke Jl. Kenanga 5 ya. Transfer."],
  yusuf: ["Halo Kak, Yusuf. Keripik pisang", "5 bks ke Griya Asri B3, QRIS."],
  tini: ["Kak, Tini pesan sambal roa 1", "sama nastar 1 toples. Jl. Mawar", "8, transfer ya."],
};

/** One-line previews used by notifications and the chat list. */
export const PREVIEW: Record<CustomerKey, string> = {
  rina: "Kak, Rina mau pesan keripik pisang 3…",
  dedi: "Mbak, Dedi order sambal roa 4 botol…",
  lia: "Kak, aku Lia. Nastar 2 toples…",
  yusuf: "Halo Kak, Yusuf. Keripik pisang 5 bks…",
  tini: "Kak, Tini pesan sambal roa 1 sama…",
};

/** The four follow-up forwards: who, what Sari types, and Sydia's receipt. */
export const ROUNDS: readonly { readonly who: CustomerKey; readonly say: string; readonly reply: readonly string[]; readonly time: string }[] = [
  { who: "dedi", say: "tambah ini", reply: ["Sudah masuk: Pak Dedi — sambal", "roa 4 · ambil sendiri.", "Total ==2 pesanan== hari ini."], time: "06.41" },
  { who: "lia", say: "ini juga", reply: ["Sip! Lia — nastar 2 toples.", "Total ==3 pesanan==."], time: "07.26" },
  { who: "yusuf", say: "ini juga ya", reply: ["Masuk! Yusuf — keripik pisang 5.", "Total ==4 pesanan==."], time: "08.12" },
  { who: "tini", say: "tambah ini juga 👍", reply: ["Beres, Bu Tini sudah dicatat.", "Total ==5 pesanan== hari ini."], time: "09.05" },
];

export type OrderRow = { readonly who: string; readonly item: string; readonly qty: number; readonly to: string; readonly pay: string; readonly time: string };

export const TODAY_ROWS: readonly OrderRow[] = [
  { time: "05.59", who: "Bu Rina", item: "Keripik pisang", qty: 3, to: "Jl. Melati 12", pay: "Transfer" },
  { time: "05.59", who: "Bu Rina", item: "Sambal roa", qty: 2, to: "Jl. Melati 12", pay: "Transfer" },
  { time: "06.38", who: "Pak Dedi", item: "Sambal roa", qty: 4, to: "Ambil sendiri", pay: "Bayar di tempat" },
  { time: "07.21", who: "Lia", item: "Nastar", qty: 2, to: "Jl. Kenanga 5", pay: "Transfer" },
  { time: "08.09", who: "Yusuf", item: "Keripik pisang", qty: 5, to: "Griya Asri B3", pay: "QRIS" },
  { time: "09.02", who: "Bu Tini", item: "Sambal roa", qty: 1, to: "Jl. Mawar 8", pay: "Transfer" },
  { time: "09.02", who: "Bu Tini", item: "Nastar", qty: 1, to: "Jl. Mawar 8", pay: "Transfer" },
];

export const YESTERDAY_ROWS: readonly OrderRow[] = [
  { time: "06.12", who: "Bu Anis", item: "Nastar", qty: 3, to: "Jl. Cempaka 2", pay: "Transfer" },
  { time: "07.05", who: "Pak Joko", item: "Keripik pisang", qty: 6, to: "Ambil sendiri", pay: "Tunai" },
  { time: "08.40", who: "Rara", item: "Sambal roa", qty: 2, to: "Kos Melati 4", pay: "QRIS" },
  { time: "10.15", who: "Bu Rina", item: "Keripik pisang", qty: 2, to: "Jl. Melati 12", pay: "Transfer" },
  { time: "13.30", who: "Dimas", item: "Sambal roa", qty: 3, to: "Jl. Anggrek 9", pay: "Transfer" },
];

export const NOTE_TODAY = "Pesanan 9 Nov 2026";
export const NOTE_FOLDER = "Catatan Pemesanan";
export const PAST_NOTES = ["Pesanan 8 Nov 2026", "Pesanan 7 Nov 2026", "Pesanan 6 Nov 2026", "Pesanan 5 Nov 2026", "Pesanan 4 Nov 2026", "Pesanan 3 Nov 2026"];

/** The weekly report Sydia writes from the seven daily order notes (9 Nov 2026 is a Monday). */
export const REPORT_NOTE = "Laporan Pesanan 3–9 Nov";
export type WeekDay = { readonly day: string; readonly orders: number; readonly items: number };
export const WEEK: readonly WeekDay[] = [
  { day: "Sel, 3 Nov", orders: 4, items: 12 },
  { day: "Rab, 4 Nov", orders: 6, items: 17 },
  { day: "Kam, 5 Nov", orders: 5, items: 15 },
  { day: "Jum, 6 Nov", orders: 7, items: 21 },
  { day: "Sab, 7 Nov", orders: 9, items: 27 },
  { day: "Min, 8 Nov", orders: 5, items: 16 },
  { day: "Sen, 9 Nov", orders: 5, items: 18 },
];
export const BUSIEST = 4; // Sab, 7 Nov
/** Items sold this week, per product (sums to the WEEK total of 126). */
export const BEST_SELLERS = [
  { item: "Keripik pisang", qty: 54, unit: "bungkus" },
  { item: "Sambal roa", qty: 44, unit: "botol" },
  { item: "Nastar", qty: 28, unit: "toples" },
] as const;

export const SARI = { name: "Sari", initials: "SA", plan: "Trial gratis" };

/** Həftəlik rol oyunu ssenariləri + buzqıran suallar */
export const WEEKLY_SCENARIOS = [
  {
    id: "erasmus",
    title: "Bu həftə sən Erasmus tələbəsisən",
    blurb: "Yeni şəhərdə ilk dostunu tap — fərqli mədəniyyətlərə açıq ol.",
    icebreakers: [
      "Öz şəhərindən ən çox nəyi özləyirsən?",
      "Burada indiyə qədək ən qəribə dadlandırdığın yemək hansıdır?",
      "Öz universitetində olmayan bir klub/aktivlik axtarırsan?",
    ],
  },
  {
    id: "exam",
    title: "İmtahan həftəsi: stress idarəetmə modu",
    blurb: "Hamı bir az gərgin — kömək və empati ilə yaxınlaş.",
    icebreakers: [
      "Bu həftə özünə verdiyin kiçik mükafat nədir?",
      "Sənin ən yaxşı konsentrasiya ritualın nədir?",
      "Birlikdə 25 dəqiqəlik fokus sessiyası etmək istəyən var?",
    ],
  },
  {
    id: "club",
    title: "Klub/komanda lideri rolunda",
    blurb: "Yeni üzvləri salamlamaq və layihəyə cəlb etmək səndədir.",
    icebreakers: [
      "Komandaya qoşulmaq üçün ən maraqlı bacarığın nədir?",
      "Bu semestr hansı layihədə iştirak etmək istərdin?",
      "İlk görüşdə səndə ən çox nə təəccübləndirir?",
    ],
  },
  {
    id: "mentor",
    title: "Birinci kursa mentor",
    blurb: "Kampusda itmiş tələbəyə yol göstər.",
    icebreakers: [
      "Sənin birinci kursda ən çox ehtiyac duyduğun məsləhət nə idi?",
      "Kampusda ən sevdiyin sakit künc haradadır?",
      "Hansı fənnə görə qrup tapmaq istəyirsən?",
    ],
  },
];

export function scenarioForWeek() {
  const now = new Date();
  const oneJan = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(
    ((now - oneJan) / 86400000 + oneJan.getDay() + 1) / 7,
  );
  return WEEKLY_SCENARIOS[week % WEEKLY_SCENARIOS.length];
}

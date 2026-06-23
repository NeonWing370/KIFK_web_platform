export const courseCatalog = [
  {
    slug: "electronics",
    title: "Комп'ютерна електроніка",
    shortTitle: "Електроніка",
    description: "Діоди, резистори, мікросхеми, сигнали та базові електронні схеми.",
    accent: "#ff6b35",
    accentSecondary: "#27c4ff"
  },
  {
    slug: "logic",
    title: "Комп'ютерна логіка",
    shortTitle: "Логіка",
    description: "Двійкова система, булева алгебра та логічні елементи.",
    accent: "#00e5ff",
    accentSecondary: "#e85dff"
  },
  {
    slug: "technologies",
    title: "Комп'ютерні технології",
    shortTitle: "Технології",
    description: "Сучасні цифрові інструменти, мережі та робочі процеси в ІТ.",
    accent: "#65d46e",
    accentSecondary: "#2dd4bf"
  },
  {
    slug: "system-programming",
    title: "Системне програмування",
    shortTitle: "Системне програмування",
    description: "Процеси, пам'ять, файлові системи та взаємодія програм з ОС.",
    accent: "#f6c945",
    accentSecondary: "#ff8a4c"
  },
  {
    slug: "electro-radio-measurements",
    title: "Електрорадіо вимірювання",
    shortTitle: "Електрорадіо вимірювання",
    description: "Прилади, точність вимірювань, сигнали та аналіз електричних параметрів.",
    accent: "#ba8cff",
    accentSecondary: "#ff6f91"
  }
];

export const courseBySlug = Object.fromEntries(
  courseCatalog.map((course) => [course.slug, course])
);

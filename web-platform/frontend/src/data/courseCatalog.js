export const courseCatalog = [
  {
    slug: "electronics",
    title: "Комп'ютерна електроніка",
    shortTitle: "Електроніка",
    description: "Діоди, резистори, мікросхеми, сигнали та базові електронні схеми.",
    accent: "#ff6b35", accentSecondary: "#27c4ff"
  },
  {
    slug: "logic",
    title: "Комп'ютерна логіка",
    shortTitle: "Логіка",
    description: "Двійкова система, булева алгебра та логічні елементи.",
    accent: "#00e5ff", accentSecondary: "#e85dff"
  },
  {
    slug: "technologies",
    title: "Комп'ютерні технології",
    shortTitle: "Технології",
    description: "Сучасні цифрові інструменти, мережі та робочі процеси в IT.",
    accent: "#65d46e", accentSecondary: "#2dd4bf"
  },
  {
    slug: "system-programming",
    title: "Системне програмування",
    shortTitle: "Системне програмування",
    description: "Процеси, пам'ять, файлові системи та взаємодія програм з ОС.",
    accent: "#f6c945", accentSecondary: "#ff8a4c"
  },
  {
    slug: "electro-radio-measurements",
    title: "Електрорадіо вимірювання",
    shortTitle: "Електрорадіовимірювання",
    description: "Прилади, точність вимірювань, сигнали та аналіз електричних параметрів.",
    accent: "#ba8cff", accentSecondary: "#ff6f91"
  },
  { slug: "peripheral-devices", title: "Периферійні пристрої", shortTitle: "Периферія", description: "Пристрої введення, виведення, інтерфейси та підключення комп'ютерного обладнання.", accent: "#4cc9f0", accentSecondary: "#4895ef" },
  { slug: "computer-architecture", title: "Комп'ютерна архітектура", shortTitle: "Архітектура", description: "Будова процесора, пам'ять, шини даних та принципи роботи комп'ютерних систем.", accent: "#f9c74f", accentSecondary: "#f9844a" },
  { slug: "javascript-programming", title: "Програмування на JavaScript", shortTitle: "JavaScript", description: "Мова JavaScript, веб-інтерфейси, події та сучасна розробка застосунків.", accent: "#f7df1e", accentSecondary: "#61dafb" },
  { slug: "electric-magnetic-circuits", title: "Теорія електричних і магнітних кіл", shortTitle: "Електричні кола", description: "Закони електричних кіл, магнітні поля, струм, напруга та аналіз схем.", accent: "#ff5d8f", accentSecondary: "#ffb703" },
  { slug: "computer-circuitry", title: "Комп'ютерна схемотехніка", shortTitle: "Схемотехніка", description: "Цифрові вузли, логічні схеми, тригери та проєктування електронних пристроїв.", accent: "#00f5d4", accentSecondary: "#9b5de5" },
  { slug: "microprocessor-systems", title: "Мікропроцесорні системи", shortTitle: "Мікропроцесори", description: "Архітектура мікропроцесорів, контролери, порти та вбудовані системи.", accent: "#fb8500", accentSecondary: "#219ebc" },
  { slug: "computer-engineering-graphics", title: "Комп'ютерна та інженерна графіка", shortTitle: "Графіка", description: "Креслення, проєкції, моделювання та інструменти комп'ютерної графіки.", accent: "#ff70a6", accentSecondary: "#70d6ff" },
  { slug: "c-programming", title: "Програмування мовою C", shortTitle: "Мова C", description: "Синтаксис C, алгоритми, робота з пам'яттю та основи системного коду.", accent: "#5dade2", accentSecondary: "#af7ac5" },
  { slug: "operating-systems", title: "Операційні системи", shortTitle: "ОС", description: "Процеси, планування, пам'ять, файли та керування ресурсами операційної системи.", accent: "#90be6d", accentSecondary: "#43aa8b" }
];

export const courseBySlug = Object.fromEntries(
  courseCatalog.map((course) => [course.slug, course])
);

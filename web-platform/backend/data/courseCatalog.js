const courseCatalog = {
  electronics: { title: "Computer Electronics", aliases: ["electronics", "computer-electronics", "computer electronics", "comp electronics"] },
  logic: { title: "Computer Logic", aliases: ["logic", "computer-logic", "computer logic", "comp logic"] },
  technologies: { title: "Computer Technologies", aliases: ["technologies", "computer-technologies", "computer technologies"] },
  "system-programming": { title: "System Programming", aliases: ["system-programming", "system programming", "systems-programming"] },
  "electro-radio-measurements": { title: "Electro-Radio Measurements", aliases: ["electro-radio-measurements", "electro radio measurements", "radio measurements"] },
  "peripheral-devices": { title: "Peripheral Devices", aliases: ["peripheral-devices", "peripheral devices"] },
  "computer-architecture": { title: "Computer Architecture", aliases: ["computer-architecture", "computer architecture"] },
  "javascript-programming": { title: "JavaScript Programming", aliases: ["javascript-programming", "javascript programming", "js programming"] },
  "electric-magnetic-circuits": { title: "Electric and Magnetic Circuits", aliases: ["electric-magnetic-circuits", "electric magnetic circuits"] },
  "computer-circuitry": { title: "Computer Circuitry", aliases: ["computer-circuitry", "computer circuitry"] },
  "microprocessor-systems": { title: "Microprocessor Systems", aliases: ["microprocessor-systems", "microprocessor systems"] },
  "computer-engineering-graphics": { title: "Computer and Engineering Graphics", aliases: ["computer-engineering-graphics", "computer engineering graphics"] },
  "c-programming": { title: "C Programming", aliases: ["c-programming", "c programming"] },
  "operating-systems": { title: "Operating Systems", aliases: ["operating-systems", "operating systems"] }
};

function getCourseDefinition(courseId) {
  const normalized = String(courseId || "").toLowerCase().trim();
  return Object.entries(courseCatalog).find(([slug, course]) => {
    return slug === normalized || course.aliases.includes(normalized);
  });
}

module.exports = { courseCatalog, getCourseDefinition };

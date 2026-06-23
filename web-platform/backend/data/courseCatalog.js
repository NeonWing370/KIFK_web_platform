const courseCatalog = {
    electronics: {
        title: "Computer Electronics",
        aliases: ["electronics", "computer-electronics", "computer electronics", "comp electronics"]
    },
    logic: {
        title: "Computer Logic",
        aliases: ["logic", "computer-logic", "computer logic", "comp logic"]
    },
    technologies: {
        title: "Computer Technologies",
        aliases: ["technologies", "computer-technologies", "computer technologies"]
    },
    "system-programming": {
        title: "System Programming",
        aliases: ["system-programming", "system programming", "systems-programming"]
    },
    "electro-radio-measurements": {
        title: "Electro-Radio Measurements",
        aliases: ["electro-radio-measurements", "electro radio measurements", "radio measurements"]
    }
};

function getCourseDefinition(courseId) {
    const normalized = String(courseId || "").toLowerCase().trim();

    return Object.entries(courseCatalog).find(([slug, course]) => {
        return slug === normalized || course.aliases.includes(normalized);
    });
}

module.exports = {
    courseCatalog,
    getCourseDefinition
};

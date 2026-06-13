(function () {
  const STORAGE_KEY = "codestudy-platform";
  const LEGACY_KEY = "codestudyJsonData";
  const DATA_FILE = "data/codestudy-platform.json";

  const presetUsers = [
    {
      id: 1,
      name: "Platform Admin",
      email: "admin@codestudy.local",
      password: "admin123",
      role: "admin",
      joinedCourses: ["electronics", "logic"],
      bio: "",
      notifications: [{ type: "system", course: "System", text: "Admin account is ready." }]
    },
    {
      id: 2,
      name: "Course Teacher",
      email: "teacher@codestudy.local",
      password: "teacher123",
      role: "teacher",
      joinedCourses: ["electronics", "logic"],
      bio: "",
      progress: { electronics: 35, logic: 35 },
      scores: {},
      notifications: [{ type: "system", course: "System", text: "Teacher access to Computer Electronics and Computer Logic is active." }]
    }
  ];

  const fallbackData = {
    users: presetUsers.slice(),
    currentUserId: null,
    testResults: [],
    groups: [],
    courses: [
      {
        id: "electronics",
        title: "Computer Electronics",
        page: "course-electronics.html",
        description: "Electronic components, circuits, signals, sensors, and basic hardware principles.",
        category: "Hardware",
        difficulty: "Beginner",
        teacher: "Course Teacher",
        rating: "4.8",
        image: "Electric circuit lab",
        materials: [],
        teacherTests: [],
        lessons: [
          "P-N junction",
          "Voltage-Ampere Characteristic",
          "Electronic components overview",
          "Basic circuit schemes",
          "Signals and voltage notes"
        ],
        lessonLinks: [
          "material-pn.html",
          "material-vac.html",
          "",
          "",
          ""
        ],
        quiz: [
          {
            question: "In a P-N junction, the depletion zone is formed mainly by:",
            options: ["Carrier recombination near the junction", "A resistor heating up", "A capacitor charging"],
            answer: 0
          },
          {
            question: "The Voltage-Ampere Characteristic shows the relation between:",
            options: ["Current and voltage", "Mass and speed", "Frequency and time only"],
            answer: 0
          }
        ]
      },
      {
        id: "logic",
        title: "Computer Logic",
        page: "course-logic.html",
        description: "Boolean algebra, truth tables, logic gates, and binary decision systems.",
        category: "Digital systems",
        difficulty: "Intermediate",
        teacher: "Course Teacher",
        rating: "4.9",
        image: "Logic gate network",
        materials: [],
        teacherTests: [],
        lessons: ["Boolean algebra introduction", "Truth tables and conditions", "Logic gates reference"],
        lessonLinks: ["", "", ""],
        quiz: [
          {
            question: "The AND gate returns 1 when:",
            options: ["All inputs are 1", "Any input is 1", "All inputs are 0"],
            answer: 0
          },
          {
            question: "Boolean values are represented as:",
            options: ["0 and 1", "10 and 20", "Only letters"],
            answer: 0
          }
        ]
      }
    ]
  };

  function getCourse(data, courseId) {
    return (data.courses || []).find(function (course) {
      return course.id === courseId;
    });
  }

  function ensureCourseCollections(data, courseId) {
    const course = getCourse(data, courseId);
    if (!course) return null;
    course.materials = course.materials || [];
    course.teacherTests = course.teacherTests || [];
    course.lessons = course.lessons || [];
    course.lessonLinks = course.lessonLinks || [];
    course.quiz = course.quiz || [];
    return course;
  }

  function migrateData(saved) {
    const merged = JSON.parse(JSON.stringify(saved || fallbackData));

    merged.users = merged.users || [];
    merged.currentUserId = merged.currentUserId || null;
    merged.testResults = merged.testResults || [];
    merged.groups = merged.groups || [];
    merged.courses = merged.courses || [];

    if (!merged.courses.length) {
      merged.courses = JSON.parse(JSON.stringify(fallbackData.courses));
    }

    fallbackData.courses.forEach(function (presetCourse) {
      const existing = merged.courses.find(function (course) {
        return course.id === presetCourse.id;
      });
      if (!existing) {
        merged.courses.push(JSON.parse(JSON.stringify(presetCourse)));
      } else {
        Object.keys(presetCourse).forEach(function (key) {
          if (Array.isArray(presetCourse[key])) {
            if (!Array.isArray(existing[key]) || !existing[key].length) {
              existing[key] = JSON.parse(JSON.stringify(presetCourse[key]));
            }
            return;
          }
          if (existing[key] === undefined || existing[key] === null || existing[key] === "") {
            existing[key] = presetCourse[key];
          }
        });
      }
    });

    const electronics = ensureCourseCollections(merged, "electronics");
    if (electronics) {
      if (Array.isArray(saved.materials) && saved.materials.length) {
        electronics.materials = saved.materials;
      }
      if (Array.isArray(saved.courseTests) && saved.courseTests.length) {
        electronics.teacherTests = saved.courseTests;
      }
      electronics.materials = electronics.materials || [];
      electronics.teacherTests = electronics.teacherTests || [];
    }

    presetUsers.forEach(function (presetUser) {
      const exists = merged.users.some(function (user) {
        return user.email.toLowerCase() === presetUser.email.toLowerCase();
      });
      if (!exists) merged.users.push(JSON.parse(JSON.stringify(presetUser)));
    });

    merged.users.forEach(function (user) {
      user.joinedCourses = user.joinedCourses || [];
      user.notifications = user.notifications || [];
      user.notifications.forEach(function (notification, index) {
        notification.id = notification.id || Number(String(user.id) + String(index + 1) + String(Date.now()).slice(-4));
        notification.isRead = !!notification.isRead;
        notification.createdAt = notification.createdAt || Date.now();
      });
      user.progress = user.progress || {};
      user.scores = user.scores || {};
      user.bio = user.bio || "";
      user.group = user.group || null;
      if ((user.role === "admin" || user.role === "teacher") && !user.joinedCourses.includes("electronics")) {
        user.joinedCourses.push("electronics");
      }
      if ((user.role === "admin" || user.role === "teacher") && !user.joinedCourses.includes("logic")) {
        user.joinedCourses.push("logic");
      }
    });

    delete merged.materials;
    delete merged.courseTests;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged, null, 2));
    return merged;
  }

  function readSaved() {
    const current = localStorage.getItem(STORAGE_KEY);
    if (current) {
      return migrateData(JSON.parse(current));
    }

    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      localStorage.removeItem(LEGACY_KEY);
      return migrateData(JSON.parse(legacy));
    }

    return null;
  }

  async function init() {
    const saved = readSaved();
    if (saved) return saved;

    try {
      const response = await fetch(DATA_FILE);
      if (!response.ok) throw new Error("Missing platform JSON");
      const json = await response.json();
      return migrateData(json);
    } catch (error) {
      return migrateData(fallbackData);
    }
  }

  function save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data, null, 2));
  }

  function reload() {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? migrateData(JSON.parse(saved)) : null;
  }

  function downloadJson(data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "codestudy-platform.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  window.CodeStudyStorage = {
    STORAGE_KEY: STORAGE_KEY,
    DATA_FILE: DATA_FILE,
    init: init,
    save: save,
    reload: reload,
    migrateData: migrateData,
    getCourse: getCourse,
    ensureCourseCollections: ensureCourseCollections,
    getMaterials: function (data, courseId) {
      const course = ensureCourseCollections(data, courseId);
      return course ? course.materials : [];
    },
    getTeacherTests: function (data, courseId) {
      const course = ensureCourseCollections(data, courseId);
      return course ? course.teacherTests : [];
    },
    downloadJson: downloadJson
  };
})();

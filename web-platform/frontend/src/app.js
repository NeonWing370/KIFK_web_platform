(function () {
  const page = document.body.dataset.page;
  const courseKey = document.body.dataset.course;

  const ELECTRONICS_ID = "electronics";
  let data = null;
  const API_BASE = "http://localhost:5000/api";
  const TOKEN_KEY = "KIFK-token";

  function apiToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function setApiSession(token, user) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    if (user && data) {
      const normalized = normalizeApiUser(user);
      const existingIndex = data.users.findIndex(function (item) {
        return String(item.id) === String(normalized.id) || item.email === normalized.email;
      });
      if (existingIndex >= 0) data.users[existingIndex] = Object.assign(data.users[existingIndex], normalized);
      else data.users.push(normalized);
      data.currentUserId = normalized.id;
      writeData();
    }
  }

  function apiRequest(path, options) {
    const requestOptions = options || {};
    requestOptions.headers = Object.assign({
      "Content-Type": "application/json"
    }, requestOptions.headers || {});

    if (apiToken()) {
      requestOptions.headers.Authorization = "Bearer " + apiToken();
    }

    return fetch(API_BASE + path, requestOptions).then(function (response) {
      return response.json().then(function (body) {
        if (!response.ok) {
          throw new Error(body.message || "API request failed");
        }
        return body;
      });
    });
  }

  function normalizeApiUser(user) {
    const joinedCourses = (user.joinedCourses || []).map(function (course) {
      return course.slug || inferCourseId(course.title) || course._id || course;
    });

    if ((user.role === "teacher" || user.role === "admin") && !joinedCourses.includes("electronics")) {
      joinedCourses.push("electronics");
    }
    if ((user.role === "teacher" || user.role === "admin") && !joinedCourses.includes("logic")) {
      joinedCourses.push("logic");
    }

    return {
      id: user.id || user._id,
      name: user.name,
      email: user.email,
      password: "",
      role: user.role || "student",
      bio: user.bio || "",
      group: user.group || null,
      joinedCourses: joinedCourses,
      progress: user.progress || {},
      scores: user.scores || {},
      notifications: user.notifications || []
    };
  }

  const sidebarNavByRole = {
    admin: [
      { label: "Панель керування", href: "dashboard.html" },
      { label: "Матеріали", href: "teacher-materials.html" },
      { label: "Тести", href: "teacher-tests.html" },
      { label: "Комп'ютерна електроніка", href: "course-electronics.html" },
      { label: "Комп'ютерна логіка", href: "course-logic.html" },
      { label: "Сповіщення", href: "notifications.html" },
      { label: "Профіль", href: "profile.html" }
    ],
    teacher: [
      { label: "Панель керування", href: "dashboard.html" },
      { label: "Матеріали", href: "teacher-materials.html" },
      { label: "Тести", href: "teacher-tests.html" },
      { label: "Комп'ютерна електроніка", href: "course-electronics.html" },
      { label: "Комп'ютерна логіка", href: "course-logic.html" },
      { label: "Сповіщення", href: "notifications.html" },
      { label: "Профіль", href: "profile.html" }
    ],
    student: [
      { label: "Панель керування", href: "dashboard.html" },
      { label: "Мої курси", href: "index.html" },
      { label: "Комп'ютерна електроніка", href: "course-electronics.html" },
      { label: "Комп'ютерна логіка", href: "course-logic.html" },
      { label: "Сповіщення", href: "notifications.html" },
      { label: "Профіль", href: "profile.html" }
    ]
  };

  document.addEventListener("DOMContentLoaded", function () {
    KIFKStorage.init().then(function (platformData) {
      data = platformData;
      syncCurrentUserFromApi().then(function () {
        bootApp();
      });
    });
  });

  function refreshData() {
    const latest = KIFKStorage.reload();
    if (latest) data = latest;
    return data;
  }

  function writeData() {
    KIFKStorage.save(data);
  }

  function bootApp() {
    setupAuthVisibility();
    setupDrawer();
    setupPasswordToggles();
    setupRoleSelector();

    if (page === "login") setupLogin();
    if (page === "register") setupRegister();
    if (page === "home") {
      renderDashboard();
      renderAdminPanel();
    }
    if (page === "dashboard") setupDashboardPage();
    if (page === "profile") setupProfilePage();
    if (page === "platform-data") setupPlatformDataPage();
    if (page === "teacher-materials") setupTeacherMaterialsPage();
    if (page === "teacher-tests") setupTeacherTestsPage();
    if (page === "notifications") renderNotifications();
    if (page === "course") setupCoursePage();
    setupMaterialPages();
  }

  function syncCurrentUserFromApi() {
    if (!apiToken()) return Promise.resolve();

    return apiRequest("/users/me").then(function (user) {
      setApiSession(null, user);
      setupAuthVisibility();
      return user;
    }).catch(function () {
      return null;
    });
  }

  function courseMaterials(courseId) {
    return KIFKStorage.getMaterials(data, courseId || ELECTRONICS_ID);
  }

  function inferCourseId(title) {
    const value = String(title || "").toLowerCase();
    if (value.indexOf("logic") > -1) return "logic";
    if (value.indexOf("electronics") > -1 || value.indexOf("електрон") > -1) return "electronics";
    return "";
  }

  function syncCoursesFromApi() {
    if (!apiToken()) return Promise.resolve();

    return apiRequest("/courses").then(function (courses) {
      courses.forEach(function (course) {
        const courseId = course.slug || inferCourseId(course.title);
        if (!courseId) return;

        (course.students || []).forEach(function (student) {
          const normalized = {
            id: student._id || student.id,
            name: student.name,
            email: student.email,
            role: student.role || "student",
            joinedCourses: [courseId],
            notifications: [],
            progress: {},
            scores: {},
            bio: "",
            group: student.group || null
          };
          const existing = data.users.find(function (item) {
            return String(item.id) === String(normalized.id) || item.email === normalized.email;
          });
          if (existing) {
            Object.assign(existing, normalized, {
              joinedCourses: Array.from(new Set((existing.joinedCourses || []).concat(courseId)))
            });
          } else {
            data.users.push(normalized);
          }
        });
      });
      writeData();
    }).catch(function () {});
  }

  function courseTeacherTests(courseId) {
    return KIFKStorage.getTeacherTests(data, courseId || ELECTRONICS_ID);
  }

  function courseOptions() {
    return (data.courses || []).map(function (course) {
      return "<option value=\"" + escapeHtml(course.id) + "\">" + escapeHtml(course.title) + "</option>";
    }).join("");
  }

  function courseTitle(courseId) {
    const course = getCourse(courseId);
    return course ? course.title : courseId;
  }

  function normalizeApiMaterial(item, courseId) {
    return {
      id: item.localId || item._id,
      mongoId: item._id,
      courseId: courseId,
      teacherId: item.author && (item.author._id || item.author.id || item.author),
      type: item.type || "text",
      title: item.title,
      content: item.content || "",
      eventDate: item.eventDate || "",
      fileName: item.fileName || "",
      fileType: item.fileType || "",
      fileData: item.fileUrl || "",
      hidden: !!item.hidden,
      pinned: !!item.pinned,
      createdAt: item.createdAt ? new Date(item.createdAt).getTime() : Date.now()
    };
  }

  function normalizeApiTest(item, courseId) {
    return {
      id: item.localId || item._id,
      mongoId: item._id,
      courseId: courseId,
      teacherId: item.author && (item.author._id || item.author.id || item.author),
      title: item.title,
      passScore: Number(item.passScore || 60),
      questions: item.questions || [],
      hidden: !!item.hidden,
      pinned: !!item.pinned,
      createdAt: item.createdAt ? new Date(item.createdAt).getTime() : Date.now(),
      updatedAt: item.updatedAt ? new Date(item.updatedAt).getTime() : undefined
    };
  }

  function upsertById(items, item) {
    const index = items.findIndex(function (existing) {
      return String(existing.mongoId || existing.id) === String(item.mongoId || item.id);
    });
    if (index >= 0) items[index] = Object.assign(items[index], item);
    else items.push(item);
  }

  function syncCourseContent(courseId) {
    if (!apiToken()) return Promise.resolve();

    return Promise.all([
      apiRequest("/materials/course/" + courseId),
      apiRequest("/tests/course/" + courseId)
    ]).then(function (responses) {
      const course = KIFKStorage.ensureCourseCollections(data, courseId);
      if (!course) return;

      const previousMaterials = course.materials || [];
      const previousTests = course.teacherTests || [];
      course.materials = previousMaterials.filter(function (item) {
        return !item.mongoId;
      });
      course.teacherTests = previousTests.filter(function (item) {
        return !item.mongoId;
      });
      responses[0].forEach(function (item) {
        upsertById(course.materials, Object.assign(normalizeApiMaterial(item, courseId), {
          hidden: !!item.hidden,
          pinned: !!item.pinned
        }));
      });
      responses[1].forEach(function (item) {
        upsertById(course.teacherTests, Object.assign(normalizeApiTest(item, courseId), {
          hidden: !!item.hidden,
          pinned: !!item.pinned
        }));
      });
      writeData();
    }).catch(function (error) {
      console.warn("Course sync skipped:", error.message);
    });
  }

  function electronicsCourse() {
    return KIFKStorage.ensureCourseCollections(data, ELECTRONICS_ID);
  }

  function currentUser() {
    return data.users.find(function (user) {
      return user.id === data.currentUserId;
    });
  }

  function setupAuthVisibility() {
    const user = currentUser();
    document.querySelectorAll(".auth-only").forEach(function (element) {
      element.classList.toggle("hidden", !user);
    });
    document.querySelectorAll(".guest-only").forEach(function (element) {
      element.classList.toggle("hidden", !!user);
    });

    const userChip = document.querySelector("#userChip");
    if (userChip && user) {
      userChip.textContent = user.name + " | " + translateRole(user.role);
    }

    if (user) {
      renderSidebar(user);
    }

    document.querySelectorAll("a[href^='course-']").forEach(function (link) {
      link.addEventListener("click", function (event) {
        const activeUser = currentUser();
        if (!activeUser) return;

        const target = link.getAttribute("href");
        showCourseLoader(target.indexOf("logic") > -1 ? "logic" : "electronics", target, event);
      });
    });
  }

  function requireAuth() {
    const user = currentUser();
    if (!user) {
      window.location.href = "login.html";
      return null;
    }
    return user;
  }

  function renderSidebar(user) {
    const sidebarUser = document.querySelector("#sidebarUser");
    const sidebarNav = document.querySelector("#sidebarNav");
    const drawerNav = document.querySelector("#drawerNav");
    const navItems = sidebarNavByRole[user.role] || sidebarNavByRole.student;
    const currentPath = window.location.pathname.split("/").pop() || "index.html";

    if (sidebarUser) {
      sidebarUser.innerHTML = [
        "<strong>" + user.name + "</strong>",
        "<span class=\"sidebar-role " + user.role + "\">" + translateRole(user.role) + "</span>"
      ].join("");
    }

    const navMarkup = navItems.map(function (item) {
      const active = currentPath === item.href ? " active" : "";
      const unread = item.href === "notifications.html"
        ? (user.notifications || []).filter(function (notification) { return !notification.isRead; }).length
        : 0;
      const badge = unread ? "<span class=\"sidebar-badge\">" + unread + "</span>" : "";
      return "<a class=\"sidebar-link" + active + "\" href=\"" + item.href + "\">" + item.label + badge + "</a>";
    }).join("");

    if (sidebarNav) sidebarNav.innerHTML = navMarkup;
    if (drawerNav) drawerNav.innerHTML = navMarkup;
  }

  function setupPasswordToggles() {
    document.querySelectorAll(".password-toggle").forEach(function (button) {
      button.addEventListener("click", function () {
        const input = document.querySelector("#" + button.dataset.target);
        if (!input) return;
        const visible = input.type === "text";
        input.type = visible ? "password" : "text";
        button.textContent = visible ? "Показати" : "Сховати";
      });
    });
  }

  function setupRoleSelector() {
    const selector = document.querySelector("#roleSelector");
    const roleInput = document.querySelector("#role");
    if (!selector || !roleInput) return;

    selector.querySelectorAll("button[data-role]").forEach(function (button) {
      button.addEventListener("click", function () {
        selector.querySelectorAll("button[data-role]").forEach(function (item) {
          item.classList.remove("active");
        });
        button.classList.add("active");
        roleInput.value = button.dataset.role;
      });
    });
  }

  function showMessage(element, text, isError) {
    if (!element) return;
    element.textContent = text;
    element.classList.toggle("error", !!isError);
  }

  function setupDrawer() {
    const menuButton = document.querySelector("#menuButton");
    const drawer = document.querySelector("#drawer") || document.querySelector("#dashboardSidebar");
    const overlay = document.querySelector("#drawerOverlay");
    const courseToggle = document.querySelector("#courseToggle");
    const courseMenu = document.querySelector("#courseMenu");
    const logoutButtons = document.querySelectorAll("#logoutButton");

    function closeDrawer() {
      if (drawer) drawer.classList.remove("open");
      if (overlay) overlay.classList.remove("visible");
    }

    function toggleDrawer() {
      if (!drawer) return;
      drawer.classList.toggle("open");
      if (overlay) overlay.classList.toggle("visible", drawer.classList.contains("open"));
    }

    if (menuButton && drawer) {
      menuButton.addEventListener("click", toggleDrawer);
    }

    if (overlay) {
      overlay.addEventListener("click", closeDrawer);
    }

    if (courseToggle && courseMenu) {
      courseToggle.addEventListener("click", function () {
        courseMenu.classList.toggle("open");
      });
    }

    logoutButtons.forEach(function (logoutButton) {
      logoutButton.addEventListener("click", function () {
        localStorage.removeItem(TOKEN_KEY);
        data.currentUserId = null;
        writeData();
        window.location.href = "index.html";
      });
    });
  }

  function setupLogin() {
    if (currentUser()) {
      window.location.href = "dashboard.html";
      return;
    }

    const form = document.querySelector("#loginForm");
    const message = document.querySelector("#message");
    const emailInput = document.querySelector("#email");
    const passwordInput = document.querySelector("#password");

    emailInput.value = "";
    passwordInput.value = "";
    setTimeout(function () {
      emailInput.value = "";
      passwordInput.value = "";
    }, 50);

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const email = emailInput.value.trim().toLowerCase();
      const password = passwordInput.value;
      apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: email,
          password: password
        })
      }).then(function (result) {
        setApiSession(result.token, result.user);
        window.location.href = "dashboard.html";
      }).catch(function (error) {
        showMessage(message, error.message, true);
      });
      return;
      const user = data.users.find(function (item) {
        return item.email.toLowerCase() === email && item.password === password;
      });

      if (!user) {
        showMessage(message, "Невірний email або пароль.", true);
        return;
      }

      data.currentUserId = user.id;
      writeData();
      window.location.href = "dashboard.html";
    });
  }

  function setupRegister() {
    if (currentUser()) {
      window.location.href = "dashboard.html";
      return;
    }

    const form = document.querySelector("#registerForm");
    const message = document.querySelector("#message");

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const name = document.querySelector("#name").value.trim();
      const email = document.querySelector("#email").value.trim().toLowerCase();
      const password = document.querySelector("#password").value;
      const confirmPassword = document.querySelector("#confirmPassword").value;
      const role = document.querySelector("#role").value;

      if (password !== confirmPassword) {
        showMessage(message, "Passwords do not match.", true);
        return;
      }

      if (password.length < 6) {
        showMessage(message, "Password must contain at least 6 characters.", true);
        return;
      }

      apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: name,
          email: email,
          password: password,
          role: role
        })
      }).then(function (result) {
        setApiSession(result.token, result.user);
        window.location.href = "dashboard.html";
      }).catch(function (error) {
        showMessage(message, error.message, true);
      });
      return;
      const exists = data.users.some(function (user) {
        return user.email.toLowerCase() === email;
      });

      if (password !== confirmPassword) {
        showMessage(message, "Паролі не збігаються.", true);
        return;
      }

      if (password.length < 6) {
        showMessage(message, "Пароль має містити щонайменше 6 символів.", true);
        return;
      }

      if (exists) {
        showMessage(message, "Цей email вже зареєстровано.", true);
        return;
      }

      const user = {
        id: Date.now(),
        name: name,
        email: email,
        password: password,
        role: role,
        bio: "",
        joinedCourses: [],
        progress: {},
        scores: {},
        notifications: [
          {
            type: "system",
            course: "Система",
            text: "Обліковий запис успішно створено."
          }
        ]
      };

      if (role === "teacher" || role === "admin") {
        user.joinedCourses = ["electronics"];
        user.notifications.push({
          type: "system",
          course: "Система",
          text: "Доступ " + translateRole(role).toLowerCase() + "а до курсу «Комп'ютерна електроніка» активовано."
        });
      }

      data.users.push(user);
      data.currentUserId = user.id;
      writeData();
      window.location.href = "dashboard.html";
    });
  }

  function setupDashboardPage() {
    const user = requireAuth();
    if (!user) return;

    renderSidebar(user);
    renderDashboardPage(user);
    renderAdminPanel();
  }

  function setupProfilePage() {
    const user = requireAuth();
    if (!user) return;

    renderSidebar(user);
    renderProfilePage(user);
  }

  function setupPlatformDataPage() {
    const user = requireAuth();
    if (!user) return;
    if (user.role !== "admin") {
      window.location.href = "dashboard.html";
      return;
    }

    renderSidebar(user);
    const stats = document.querySelector("#dataStats");
    const preview = document.querySelector("#platformJsonPreview");
    const downloadButton = document.querySelector("#downloadJsonButton");
    const materialCount = data.courses.reduce(function (total, course) {
      return total + (course.materials || []).length;
    }, 0);
    const testCount = data.courses.reduce(function (total, course) {
      return total + (course.teacherTests || []).length;
    }, 0);
    const notificationCount = data.users.reduce(function (total, item) {
      return total + (item.notifications || []).length;
    }, 0);

    if (stats) {
      stats.innerHTML = [
        statCard(String(data.users.length), "Користувачі"),
        statCard(String(data.courses.length), "Курси"),
        statCard(String(materialCount), "Матеріали"),
        statCard(String(testCount), "Тести"),
        statCard(String(data.testResults.length), "Результати"),
        statCard(String(notificationCount), "Сповіщення")
      ].join("");
    }

    if (preview) preview.textContent = JSON.stringify(data, null, 2);
    if (downloadButton) {
      downloadButton.addEventListener("click", function () {
        KIFKStorage.downloadJson(data);
      });
    }
  }

  function renderDashboardPage(user) {
    const intro = document.querySelector("#dashboardIntro");
    const stats = document.querySelector("#dashboardStats");
    const content = document.querySelector("#dashboardContent");
    if (!intro || !stats || !content) return;

    const firstName = user.name.split(" ")[0];
    intro.innerHTML = [
      "<h2>З поверненням, " + firstName + "</h2>",
      "<p class=\"auth-subtitle\">Ось огляд вашого навчального прогресу.</p>"
    ].join("");

    if (user.role === "student") {
      const avgScore = averageScore(user);
      stats.innerHTML = [
        statCard(String((user.joinedCourses || []).length), "Записані курси"),
        statCard(String(Object.keys(user.scores || {}).length), "Пройдені тести"),
        statCard(avgScore + "%", "Середній бал"),
        statCard(String((user.notifications || []).length), "Сповіщення")
      ].join("");
      content.innerHTML = [
        "<div class=\"dashboard-grid\">",
        dashboardPanel("Мої курси", joinedCourseNames(user).join("<br>")),
        dashboardPanel("Прогрес", progressMarkup(user)),
        dashboardPanel("Профіль", "<a href=\"profile.html\">Відкрити профіль</a>"),
        "</div>"
      ].join("");
      return;
    }

    if (user.role === "teacher") {
      stats.innerHTML = [
        statCard(String(data.courses.reduce(function (total, course) {
          return total + courseMaterials(course.id).length;
        }, 0)), "Опубліковані матеріали"),
        statCard(String(data.courses.reduce(function (total, course) {
          return total + courseTeacherTests(course.id).length;
        }, 0)), "Створені тести"),
        statCard(String(countStudentsForTeacher()), "Записані студенти"),
        statCard(String((user.notifications || []).length), "Сповіщення")
      ].join("");
      content.innerHTML = [
        "<div class=\"dashboard-grid\">",
        dashboardPanel("Матеріали", "<a href=\"teacher-materials.html\">Створюйте текст, події та завантаження файлів</a>"),
        dashboardPanel("Тести", "<a href=\"teacher-tests.html\">Створюйте тести та переглядайте аналітику</a>"),
        dashboardPanel("Призначений курс", joinedCourseNames(user).join("<br>")),
        dashboardPanel("Профіль", "<a href=\"profile.html\">Відкрити профіль</a>"),
        "</div>"
      ].join("");
      return;
    }

    stats.innerHTML = [
      statCard(String(data.users.length), "Усього користувачів"),
      statCard(String(countRole("student")), "Студенти"),
      statCard(String(countRole("teacher")), "Викладачі"),
      statCard(String(enrolledStudentsCount()), "Записи на курси")
    ].join("");
    content.innerHTML = [
      "<div class=\"dashboard-grid\">",
      dashboardPanel("Керування користувачами", String(data.users.length) + " зареєстрованих облікових записів"),
      dashboardPanel("Керування курсами", String(data.courses.length) + " активних курсів"),
      dashboardPanel("Перегляд статистики", enrolledStudentsCount() + " записів на курси"),
      dashboardPanel("Профіль", "<a href=\"profile.html\">Відкрити профіль</a>"),
      "</div>"
    ].join("");
  }

  function renderProfilePage(user) {
    const container = document.querySelector("#profileContent");
    if (!container) return;

    const initials = user.name.split(" ").map(function (part) {
      return part.charAt(0);
    }).join("").slice(0, 2).toUpperCase();
    const joinedCourses = (user.joinedCourses || []).map(getCourse).filter(Boolean);
    const datedTasks = joinedCourses.reduce(function (items, course) {
      return items.concat(courseMaterials(course.id).filter(function (material) {
        return material.eventDate || material.deadline;
      }).map(function (material) {
        return Object.assign({}, material, { courseTitle: course.title });
      }));
    }, []).sort(function (a, b) {
      return new Date(a.deadline || a.eventDate).getTime() - new Date(b.deadline || b.eventDate).getTime();
    });
    const groups = studentGroupNames(user);
    const notifications = (user.notifications || []).slice().sort(function (a, b) {
      return (b.createdAt || 0) - (a.createdAt || 0);
    });

    container.innerHTML = [
      "<section class=\"content-panel profile-platform-panel\">",
      "<p class=\"eyebrow\">KIFK</p>",
      "<h2>Навчальна платформа</h2>",
      "</section>",
      "<article class=\"profile-card\">",
      "<div class=\"profile-header\">",
      "<div class=\"profile-avatar\">" + initials + "</div>",
      "<div>",
      "<h2>" + escapeHtml(user.name) + "</h2>",
      "<p class=\"auth-subtitle\">" + escapeHtml(user.email) + "</p>",
      "<span class=\"sidebar-role " + user.role + "\">" + translateRole(user.role) + "</span>",
      groups.length ? "<p class=\"auth-subtitle\">Група: " + groups.map(escapeHtml).join(", ") + "</p>" : "",
      "</div>",
      "</div>",
      "<form class=\"form\" id=\"profileForm\">",
      "<label>Біографія",
      "<textarea class=\"profile-bio\" id=\"bio\" placeholder=\"Розкажіть про себе...\">" + escapeHtml(user.bio || "") + "</textarea>",
      "</label>",
      "<button class=\"button primary\" type=\"submit\" id=\"saveBioButton\">Зберегти профіль</button>",
      "</form>",
      "</article>",
      "<section class=\"content-panel\">",
      "<h3>Вітаємо на сайті</h3>",
      "<p class=\"auth-subtitle\">Тут зібрані ваш профіль, курси, завдання з датами, групи та сповіщення.</p>",
      "</section>",
      joinedCourses.length ? "<section class=\"content-panel\"><h3>Мої курси</h3><div class=\"dashboard-grid\">" + joinedCourses.map(function (course) {
        return dashboardPanel(course.title, "<a class=\"button primary\" href=\"" + course.page + "\">Відкрити курс</a>");
      }).join("") + "</div></section>" : "",
      "<section class=\"content-panel\"><h3>Завдання з датами</h3>" + (datedTasks.length ? "<div class=\"materials-list\">" + datedTasks.map(function (task) {
        return "<article class=\"material-card\"><span class=\"eyebrow\">" + escapeHtml(task.courseTitle) + "</span><h4>" + escapeHtml(task.title) + "</h4><p>" + escapeHtml(task.content || "") + "</p><p class=\"auth-subtitle\">Дата: " + formatDateTime(task.deadline || task.eventDate) + "</p></article>";
      }).join("") + "</div>" : "<p class=\"empty-note\">Немає завдань із датами.</p>") + "</section>",
      "<section class=\"content-panel\"><h3>Сповіщення</h3>" + (notifications.length ? "<div class=\"materials-list\">" + notifications.map(function (notification) {
        return "<article class=\"material-card\"><span class=\"eyebrow\">" + escapeHtml(notification.course || translateNotificationType(notification.type || "system")) + "</span><p>" + escapeHtml(notification.text || notification.title || "") + "</p><p class=\"auth-subtitle\">" + formatDateTime(notification.createdAt) + "</p></article>";
      }).join("") + "</div>" : "<p class=\"empty-note\">Сповіщень поки немає.</p>") + "</section>",
      "<div class=\"danger-zone\">",
      "<h3>Видалити обліковий запис</h3>",
      "<p class=\"auth-subtitle\">Назавжди видалити обліковий запис, результати тестів та збережені дані профілю з цього браузера.</p>",
      "<button class=\"button ghost danger-btn\" type=\"button\" id=\"deleteAccountButton\">Видалити мій обліковий запис</button>",
      "</div>"
    ].join("");

    const form = document.querySelector("#profileForm");
    const bioInput = document.querySelector("#bio");
    const saveBioButton = document.querySelector("#saveBioButton");
    if (bioInput && saveBioButton) {
      saveBioButton.classList.add("hidden");
      bioInput.addEventListener("input", function () {
        saveBioButton.classList.remove("hidden");
      });
    }
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      user.bio = document.querySelector("#bio").value.trim();
      if (apiToken()) {
        apiRequest("/users/profile", {
          method: "PUT",
          body: JSON.stringify({
            name: user.name,
            bio: user.bio
          })
        }).catch(function (error) {
          alert(error.message);
        })
      }
      writeData();
      if (saveBioButton) saveBioButton.classList.add("hidden");
    });

    document.querySelector("#deleteAccountButton").addEventListener("click", function () {
      if (!confirm("Видалити обліковий запис назавжди? Цю дію не можна скасувати.")) return;
      deleteAccount(user.id);
    });

  }

  function studentGroupNames(user) {
    return (data.groups || []).filter(function (group) {
      return (group.students || []).some(function (studentId) {
        return String(studentId) === String(user.id);
      });
    }).map(function (group) {
      return group.name;
    });
  }

  function teacherCourses(user) {
    if (user.role === "admin") return data.courses || [];
    return (data.courses || []).filter(function (course) {
      return (user.joinedCourses || []).includes(course.id);
    });
  }

  function courseStudents(courseId) {
    return data.users.filter(function (item) {
      return item.role === "student" && (item.joinedCourses || []).some(function (id) {
        return String(id) === String(courseId);
      });
    });
  }

  function teacherGroupsPanel(user, activeCourse) {
    const courses = activeCourse ? [activeCourse] : teacherCourses(user);
    if (!courses.length) return "";

    return [
      "<div class=\"teacher-groups-block\">",
      "<h3>Студенти та групи</h3>",
      courses.map(function (course) {
        const students = courseStudents(course.id);
        const groups = (data.groups || []).filter(function (group) {
          return group.courseId === course.id && String(group.teacherId) === String(user.id);
        });
        return [
          "<article class=\"material-card teacher-course-roster\">",
          "<h4>" + escapeHtml(course.title) + "</h4>",
          "<p class=\"auth-subtitle\">ALL: " + students.length + " студентів</p>",
          "<form class=\"form mini-form teacher-group-form\" data-group-course=\"" + course.id + "\">",
          "<input type=\"text\" placeholder=\"Назва нової групи\" required>",
          students.length ? "<div class=\"group-student-picker\"><p class=\"auth-subtitle\">Додати з ALL:</p>" + students.map(function (student) {
            return "<label><input type=\"checkbox\" value=\"" + student.id + "\"> " + escapeHtml(student.name) + "</label>";
          }).join("") + "</div>" : "",
          "<button class=\"button primary\" type=\"submit\">Створити групу</button>",
          "</form>",
          students.length ? "<div class=\"table-wrap\"><table><thead><tr><th>Студент</th><th>Email</th><th>Група</th></tr></thead><tbody>" + students.map(function (student) {
            const currentGroup = groups.find(function (group) {
              return (group.students || []).some(function (studentId) {
                return String(studentId) === String(student.id);
              });
            });
            return [
              "<tr>",
              "<td>" + escapeHtml(student.name) + "</td>",
              "<td>" + escapeHtml(student.email) + "</td>",
              "<td><select class=\"student-group-select\" data-course=\"" + course.id + "\" data-student=\"" + student.id + "\">",
              "<option value=\"\">ALL</option>",
              groups.map(function (group) {
                return "<option value=\"" + group.id + "\"" + (currentGroup && String(currentGroup.id) === String(group.id) ? " selected" : "") + ">" + escapeHtml(group.name) + "</option>";
              }).join(""),
              "</select></td>",
              "</tr>"
            ].join("");
          }).join("") + "</tbody></table></div>" : "<p class=\"empty-note\">На курс ще не записані студенти.</p>",
          "</article>"
        ].join("");
      }).join(""),
      "</div>"
    ].join("");
  }

  function setupTeacherGroupControls(user) {
    document.querySelectorAll(".teacher-group-form").forEach(function (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        const input = form.querySelector("input");
        const name = input.value.trim();
        if (!name) return;

        data.groups = data.groups || [];
        const selectedStudents = Array.prototype.map.call(form.querySelectorAll("input[type='checkbox']:checked"), function (checkbox) {
          return checkbox.value;
        });
        data.groups.push({
          id: Date.now(),
          name: name,
          teacherId: user.id,
          courseId: form.dataset.groupCourse,
          students: selectedStudents
        });
        writeData();
        renderProfilePage(user);
      });
    });

    document.querySelectorAll(".student-group-select").forEach(function (select) {
      select.addEventListener("change", function () {
        const studentId = select.dataset.student;
        const courseId = select.dataset.course;
        (data.groups || []).forEach(function (group) {
          if (group.courseId !== courseId || String(group.teacherId) !== String(user.id)) return;
          group.students = (group.students || []).filter(function (id) {
            return String(id) !== String(studentId);
          });
        });

        if (select.value) {
          const group = data.groups.find(function (item) {
            return String(item.id) === String(select.value);
          });
          if (group && !(group.students || []).some(function (id) { return String(id) === String(studentId); })) {
            group.students = group.students || [];
            group.students.push(studentId);
          }
        }

        writeData();
        renderProfilePage(user);
      });
    });
  }

  function statCard(value, label) {
    return "<article class=\"stat-card\"><strong>" + value + "</strong><span>" + label + "</span></article>";
  }

  function averageScore(user) {
    const results = data.testResults.filter(function (item) {
      return String(item.studentId) === String(user.id);
    });
    if (results.length) {
      return Math.round(results.reduce(function (sum, item) {
        return sum + item.percentage;
      }, 0) / results.length);
    }
    const scores = Object.values(user.scores || {});
    if (!scores.length) return 0;
    const total = scores.reduce(function (sum, score) {
      return sum + (Number(score) / 3) * 100;
    }, 0);
    return Math.round(total / scores.length);
  }

  function countStudentsForTeacher() {
    return data.users.filter(function (item) {
      return item.role === "student" && item.joinedCourses.length;
    }).length;
  }

  function renderDashboard() {
    const user = currentUser();
    const title = document.querySelector("#dashboardTitle");
    const content = document.querySelector("#dashboardContent");
    if (!user || !title || !content) return;

    title.textContent = "Вітаємо, " + user.name;

    if (user.role === "student") {
      content.innerHTML = [
        "<div class=\"dashboard-grid\">",
        dashboardPanel("Мої курси", joinedCourseNames(user).join("<br>")),
        dashboardPanel("Прогрес", progressMarkup(user)),
        dashboardPanel("Тести", "<a href=\"course-electronics.html\">Відкрити тести курсу</a>"),
        dashboardPanel("Сповіщення", String(user.notifications.length) + " збережених повідомлень"),
        dashboardPanel("Профіль", user.email + "<br>" + translateRole(user.role)),
        "</div>"
      ].join("");
      return;
    }

    if (user.role === "teacher") {
      content.innerHTML = [
        "<div class=\"dashboard-grid\">",
        dashboardPanel("Матеріали", "<a href=\"teacher-materials.html\">Текст, події та завантаження файлів</a>"),
        dashboardPanel("Тести", "<a href=\"teacher-tests.html\">Створення тестів та аналітика</a>"),
        dashboardPanel("Записані студенти", enrolledStudentsCount() + " записів студентів"),
        dashboardPanel("Призначений курс", joinedCourseNames(user).join("<br>")),
        "</div>"
      ].join("");
      return;
    }

    content.innerHTML = [
      "<div class=\"dashboard-grid\">",
      dashboardPanel("Керування користувачами", String(data.users.length) + " зареєстрованих облікових записів"),
      dashboardPanel("Керування викладачами", countRole("teacher") + " викладачів"),
      dashboardPanel("Керування студентами", countRole("student") + " студентів"),
      dashboardPanel("Керування курсами", String(data.courses.length) + " активних курсів"),
      dashboardPanel("Перегляд статистики", enrolledStudentsCount() + " записів на курси"),
      dashboardPanel("Видалення або редагування контенту", "Використовуйте інструменти викладача на курсі для уроків/тестів."),
      "</div>"
    ].join("");
  }

  function dashboardPanel(title, body) {
    return "<article class=\"dashboard-panel\"><h3>" + title + "</h3><p>" + body + "</p></article>";
  }

  function progressMarkup(user) {
    return data.courses.map(function (course) {
      const value = courseProgress(user, course.id);
      return "<span class=\"progress-label\">" + course.title + " " + value + "%</span><span class=\"progress-line\"><span style=\"width:" + value + "%\"></span></span>";
    }).join("");
  }

  function countRole(role) {
    return data.users.filter(function (user) {
      return user.role === role;
    }).length;
  }

  function enrolledStudentsCount() {
    return data.users.reduce(function (total, user) {
      return total + (user.joinedCourses || []).length;
    }, 0);
  }

  function renderAdminPanel() {
    const adminPanel = document.querySelector("#adminPanel");
    const usersTable = document.querySelector("#usersTable");
    const user = currentUser();

    if (!adminPanel || !usersTable) return;
    adminPanel.classList.toggle("hidden", !user || user.role !== "admin");

    if (!user || user.role !== "admin") return;

    usersTable.innerHTML = data.users.map(function (item) {
      const isSelf = String(item.id) === String(user.id);
      return [
        "<tr data-admin-user=\"" + item.id + "\">",
        "<td><input class=\"admin-user-name\" type=\"text\" value=\"" + escapeHtml(item.name) + "\"></td>",
        "<td>" + item.email + "</td>",
        "<td><select class=\"admin-user-role\">" + ["student", "teacher", "admin"].map(function (role) {
          return "<option value=\"" + role + "\"" + (item.role === role ? " selected" : "") + ">" + translateRole(role) + "</option>";
        }).join("") + "</select></td>",
        "<td>" + joinedCourseNames(item).join(", ") + "</td>",
        "<td><div class=\"hero-actions\"><button class=\"button small\" type=\"button\" data-save-user=\"" + item.id + "\">Зберегти</button><button class=\"button small ghost danger-btn\" type=\"button\" data-delete-user=\"" + item.id + "\"" + (isSelf ? " disabled" : "") + ">Видалити</button></div></td>",
        "</tr>"
      ].join("");
    }).join("");

    usersTable.querySelectorAll("[data-save-user]").forEach(function (button) {
      button.addEventListener("click", function () {
        const row = button.closest("tr");
        const target = data.users.find(function (item) {
          return String(item.id) === String(button.dataset.saveUser);
        });
        if (!target || !row) return;

        target.name = row.querySelector(".admin-user-name").value.trim() || target.name;
        target.role = row.querySelector(".admin-user-role").value;
        if ((target.role === "teacher" || target.role === "admin") && !target.joinedCourses.includes("electronics")) {
          target.joinedCourses.push("electronics");
        }
        if ((target.role === "teacher" || target.role === "admin") && !target.joinedCourses.includes("logic")) {
          target.joinedCourses.push("logic");
        }

        if (String(data.currentUserId) === String(target.id)) {
          setupAuthVisibility();
        }
        writeData();

        if (apiToken() && String(target.id).length > 10) {
          apiRequest("/users/" + target.id, {
            method: "PUT",
            body: JSON.stringify({
              name: target.name,
              role: target.role
            })
          }).catch(function (error) {
            alert(error.message);
          });
        }

        renderDashboardPage(user);
        renderAdminPanel();
      });
    });

    usersTable.querySelectorAll("[data-delete-user]").forEach(function (button) {
      button.addEventListener("click", function () {
        const target = data.users.find(function (item) {
          return String(item.id) === String(button.dataset.deleteUser);
        });
        if (!target || String(target.id) === String(user.id)) return;
        if (!confirm("Видалити користувача " + target.name + "?")) return;

        deleteUserRecord(target.id);
        writeData();

        if (apiToken() && String(target.id).length > 10) {
          apiRequest("/users/" + target.id, {
            method: "DELETE"
          }).catch(function (error) {
            alert(error.message);
          });
        }

        renderDashboardPage(user);
        renderAdminPanel();
      });
    });

  }

  function setupCoursePage() {
    refreshData();
    const user = currentUser();
    const lockedBox = document.querySelector("#lockedBox");
    const lockedText = document.querySelector("#lockedText");
    const content = document.querySelector("#courseContent");
    const joinButton = document.querySelector("#joinCourseButton");
    const course = getCourse(courseKey);

    if (!user) {
      lockedBox.classList.remove("hidden");
      content.classList.remove("visible");
      return;
    }

    if ((user.role === "admin" || user.role === "teacher") && !user.joinedCourses.includes(courseKey)) {
      user.joinedCourses.push(courseKey);
      writeData();
    }

    const joined = user.joinedCourses.includes(courseKey);
    lockedText.textContent = "Ви увійшли, але ще не приєдналися до цього курсу. Натисніть кнопку приєднання, щоб відкрити матеріали та тести.";
    lockedBox.classList.toggle("hidden", joined);
    content.classList.toggle("visible", joined);
    joinButton.classList.toggle("hidden", user.role === "admin" || user.role === "teacher");
    joinButton.textContent = joined ? "Курс приєднано" : "Приєднатися до курсу";

    setupTabs();
    renderCourse(course, user);
    renderCourseMaterials(course);
    setupStudentTests(course, user);
    setupProgress(course, user);
    setupTeacherTools(user, course);
    Promise.all([
      syncCourseContent(course.id),
      syncCoursesFromApi()
    ]).then(function () {
      renderCourse(course, user);
      renderCourseMaterials(course);
      setupStudentTests(course, user);
      setupProgress(course, user);
      setupTeacherTools(user, course);
    });

    joinButton.addEventListener("click", function () {
      if (!user.joinedCourses.includes(courseKey)) {
        user.joinedCourses.push(courseKey);
        if (apiToken()) {
          apiRequest("/courses/" + courseKey + "/enroll", {
            method: "POST"
          }).then(function () {
            return syncCurrentUserFromApi();
          }).catch(function (error) {
            alert(error.message);
          });
        }
        user.notifications.push({
          type: "course",
          course: course.title,
          text: "Ви приєдналися до курсу «" + course.title + "»."
        });
        writeData();
      }

      lockedBox.classList.add("hidden");
      content.classList.add("visible");
      joinButton.textContent = "Курс приєднано";
      renderCourse(course, user);
      renderCourseMaterials(course);
      setupStudentTests(course, user);
      setupProgress(course, user);
    });
  }

  function renderCourse(course, user) {
    const details = document.querySelector("#courseDetails");
    const lessonList = document.querySelector("#lessonList");
    const enrolledStudents = document.querySelector("#enrolledStudents");
    if (details) {
      details.innerHTML = [
        "<li>Категорія: " + course.category + "</li>",
        "<li>Складність: " + course.difficulty + "</li>",
        "<li>Викладач: " + course.teacher + "</li>",
        "<li>Рейтинг: " + course.rating + "</li>",
        "<li>Опубліковані матеріали: " + courseMaterials(course.id).length + "</li>",
        "<li>Опубліковані тести: " + courseTeacherTests(course.id).length + "</li>"
      ].join("");
    }
    if (lessonList) {
      renderAllCourseItems(course, user, lessonList);
    }
    if (enrolledStudents) {
      const students = data.users.filter(function (item) {
        return item.role === "student" && item.joinedCourses.includes(course.id);
      });
      enrolledStudents.innerHTML = students.length
        ? students.map(function (student) { return "<li>" + student.name + " - " + student.email + "</li>"; }).join("")
        : "<li>Ще немає записаних студентів.</li>";
    }
  }

  function renderCourseMaterials(course) {
    const list = document.querySelector("#courseMaterialsList");
    if (!list) return;

    const canManageCourse = currentUser() && (currentUser().role === "teacher" || currentUser().role === "admin");
    const items = courseMaterials(course.id).filter(function (item) {
      return canManageCourse || !item.hidden;
    }).slice().sort(function (a, b) {
      if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
      return b.createdAt - a.createdAt;
    });

    if (!items.length) {
      list.innerHTML = "<p class=\"empty-note\">Ще немає опублікованих матеріалів.</p>";
      return;
    }

    list.innerHTML = items.map(materialCardMarkup).join("");
  }

  function allCourseItems(course, user) {
    const canManageCourse = user && (user.role === "teacher" || user.role === "admin");
    const materials = courseMaterials(course.id).map(function (item) {
      return Object.assign({ itemType: "material" }, item);
    });
    const tests = courseTeacherTests(course.id).map(function (item) {
      return Object.assign({ itemType: "test" }, item);
    });

    return materials.concat(tests).filter(function (item) {
      return canManageCourse || !item.hidden;
    }).sort(function (a, b) {
      if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
      return Number(b.createdAt || 0) - Number(a.createdAt || 0);
    });
  }

  function renderAllCourseItems(course, user, container) {
    const items = allCourseItems(course, user);
    const canManageCourse = user && (user.role === "teacher" || user.role === "admin");

    if (!items.length) {
      container.innerHTML = "<p class=\"empty-note\">Поки що немає матеріалів або тестів.</p>";
      return;
    }

    container.innerHTML = items.map(function (item) {
      const badge = item.itemType === "test" ? "Тест" : "Матеріал";
      const description = item.itemType === "test"
        ? item.questions.length + " питань · Прохідний бал " + item.passScore + "%"
        : item.content || item.fileName || "";
      return [
        "<article class=\"material-card all-course-item " + (item.hidden ? "is-hidden" : "") + "\">",
        "<span class=\"eyebrow\">" + (item.pinned ? "Закріплено · " : "") + badge + (item.hidden ? " · Приховано" : "") + "</span>",
        "<h4>" + escapeHtml(item.title) + "</h4>",
        "<p>" + escapeHtml(description) + "</p>",
        canManageCourse ? "<div class=\"hero-actions\"><button class=\"button small ghost\" type=\"button\" data-toggle-pin=\"" + item.itemType + ":" + item.id + "\">" + (item.pinned ? "Відкріпити" : "Закріпити") + "</button><button class=\"button small ghost\" type=\"button\" data-toggle-hidden=\"" + item.itemType + ":" + item.id + "\">" + (item.hidden ? "Показати" : "Сховати") + "</button></div>" : "",
        "</article>"
      ].join("");
    }).join("");

    container.querySelectorAll("[data-toggle-pin]").forEach(function (button) {
      button.addEventListener("click", function () {
        toggleCourseItemFlag(course, button.dataset.togglePin, "pinned");
        renderCourse(course, user);
        renderCourseMaterials(course);
        setupStudentTests(course, user);
      });
    });

    container.querySelectorAll("[data-toggle-hidden]").forEach(function (button) {
      button.addEventListener("click", function () {
        toggleCourseItemFlag(course, button.dataset.toggleHidden, "hidden");
        renderCourse(course, user);
        renderCourseMaterials(course);
        setupStudentTests(course, user);
      });
    });
  }

  function toggleCourseItemFlag(course, ref, flag) {
    const parts = String(ref).split(":");
    const collection = parts[0] === "test" ? courseTeacherTests(course.id) : courseMaterials(course.id);
    const item = collection.find(function (entry) {
      return String(entry.id) === String(parts[1]);
    });
    if (!item) return;
    item[flag] = !item[flag];
    writeData();

    if (item.mongoId && apiToken()) {
      const path = parts[0] === "test" ? "/tests/" : "/materials/";
      apiRequest(path + item.mongoId, {
        method: "PUT",
        body: JSON.stringify({
          hidden: !!item.hidden,
          pinned: !!item.pinned
        })
      }).catch(function (error) {
        alert(error.message);
      });
    }
  }

  function setupStudentTests(course, user) {
    const container = document.querySelector("#studentTestsList");
    if (!container) return;

    const canManageCourse = user && (user.role === "teacher" || user.role === "admin");
    const tests = courseTeacherTests(course.id).filter(function (test) {
      return canManageCourse || !test.hidden;
    });

    if (!tests.length) {
      container.innerHTML = "<p class=\"empty-note\">Ще немає доступних тестів викладача.</p>";
      return;
    }

    container.innerHTML = tests.map(function (test) {
      const existing = data.testResults.find(function (result) {
        return String(result.testId) === String(test.id) && String(result.studentId) === String(user.id);
      });
      const resultText = existing
        ? "<p class=\"quiz-result\">Останній результат: " + existing.score + "/" + existing.maxScore + " (" + existing.percentage + "%) — " + (existing.passed ? "Складено" : "Не складено") + "</p>"
        : "";

      return [
        "<article class=\"test-card\" data-test-id=\"" + test.id + "\">",
        "<h4>" + escapeHtml(test.title) + "</h4>",
        "<p class=\"auth-subtitle\">" + test.questions.length + " питань · Прохідний бал: " + test.passScore + "%</p>",
        resultText,
        "<button class=\"button primary start-test-button\" type=\"button\" data-start-test=\"" + test.id + "\">Почати тест</button>",
        "<form class=\"quiz-form student-test-form hidden\" data-test-id=\"" + test.id + "\">",
        test.questions.map(function (item, questionIndex) {
          return [
            "<fieldset>",
            "<legend>" + escapeHtml(item.question) + "</legend>",
            item.options.map(function (option, optionIndex) {
              return "<label><input type=\"radio\" name=\"t" + test.id + "q" + questionIndex + "\" value=\"" + optionIndex + "\" required> " + escapeHtml(option) + "</label>";
            }).join(""),
            "</fieldset>"
          ].join("");
        }).join(""),
        "<button class=\"button primary\" type=\"submit\">Надіслати тест</button>",
        "</form>",
        "</article>"
      ].join("");
    }).join("");

    container.querySelectorAll(".student-test-form").forEach(function (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        const testId = form.dataset.testId;
        const test = courseTeacherTests(course.id).find(function (item) {
          return String(item.id) === String(testId);
        });
        if (!test) return;

        let score = 0;
        let maxScore = 0;
        const answers = [];
        test.questions.forEach(function (item, index) {
          const checked = form.querySelector("input[name='t" + testId + "q" + index + "']:checked");
          const answer = checked ? Number(checked.value) : null;
          const points = Number(item.points || 1);
          maxScore += points;
          answers.push(answer);
          if (answer === item.answer) score += points;
        });

        const percentage = maxScore ? Math.round((score / maxScore) * 100) : 0;
        const passed = percentage >= test.passScore;
        const result = {
          id: Date.now(),
          testId: test.id,
          courseId: course.id,
          studentId: user.id,
          score: score,
          maxScore: maxScore,
          percentage: percentage,
          passed: passed,
          completedAt: Date.now()
        };

        data.testResults = data.testResults.filter(function (item) {
          return !(String(item.testId) === String(test.id) && String(item.studentId) === String(user.id));
        });
        data.testResults.push(result);
        user.scores["test-" + test.id] = score;
        user.progress[course.id] = Math.max(courseProgress(user, course.id), percentage);
        addNotification(user, course.title, "Тест «" + test.title + "» завершено: " + score + "/" + maxScore + " (" + percentage + "%).");
        writeData();
        if (test.mongoId && apiToken()) {
          apiRequest("/tests/" + test.mongoId + "/submit", {
            method: "POST",
            body: JSON.stringify({ answers: answers })
          }).catch(function (error) {
            console.warn("Mongo test submit skipped:", error.message);
          });
        }
        setupStudentTests(course, user);
        setupProgress(course, user);
      });
    });

    container.querySelectorAll("[data-start-test]").forEach(function (button) {
      button.addEventListener("click", function () {
        const card = button.closest(".test-card");
        const form = card ? card.querySelector(".student-test-form") : null;
        if (!form) return;
        form.classList.remove("hidden");
        button.classList.add("hidden");
      });
    });
  }

  function setupProgress(course, user) {
    const tracker = document.querySelector("#progressTracker");
    const completeButton = document.querySelector("#completeCourseButton");
    if (!tracker) return;

    const value = courseProgress(user, course.id);
    const tests = courseTeacherTests(course.id);
    const passed = tests.filter(function (test) {
      return data.testResults.some(function (result) {
        return String(result.testId) === String(test.id) && String(result.studentId) === String(user.id) && result.passed;
      });
    }).length;
    tracker.innerHTML = [
      "<span class=\"progress-label\">" + value + "% завершено</span>",
      "<span class=\"progress-line\"><span style=\"width:" + value + "%\"></span></span>",
      "<p class=\"auth-subtitle\">" + passed + "/" + tests.length + " тестів складено.</p>"
    ].join("");

    if (completeButton) completeButton.remove();
  }

  function setupTabs() {
    const tabs = document.querySelectorAll("[data-tab]");
    const panels = document.querySelectorAll("[data-panel]");

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        const key = tab.dataset.tab;
        tabs.forEach(function (item) {
          item.classList.remove("active");
        });
        panels.forEach(function (panel) {
          panel.classList.toggle("active", panel.dataset.panel === key);
        });
        tab.classList.add("active");
      });
    });
  }

  function setupTeacherTools(user, course) {
    const teacherTools = document.querySelectorAll(".teacher-only, [data-panel='teacher']");
    const allowed = user.role === "teacher" || user.role === "admin";
    teacherTools.forEach(function (element) {
      element.classList.toggle("hidden", !allowed);
    });

    if (!allowed) return;

    const teacherPanel = document.querySelector("[data-panel='teacher']");
    if (teacherPanel) {
      const existingGroupsBlock = teacherPanel.querySelector(".teacher-groups-block");
      if (existingGroupsBlock) existingGroupsBlock.remove();
      teacherPanel.insertAdjacentHTML("beforeend", teacherGroupsPanel(user, course));
      setupTeacherGroupControls(user);
    }

    const lessonForm = document.querySelector("#lessonForm");
    if (!lessonForm) return;

    lessonForm.addEventListener("submit", function (event) {
      event.preventDefault();
      const input = document.querySelector("#lessonTitle");
      course.lessons.push(input.value.trim());
      addNotification(user, course.title, "Урок створено: " + input.value.trim());
      input.value = "";
      writeData();
      renderCourse(course, user);
      setupProgress(course, user);
      alert("Урок створено.");
    });
  }

  function requireTeacher() {
    const user = requireAuth();
    if (!user) return null;
    if (user.role !== "teacher" && user.role !== "admin") {
      window.location.href = "dashboard.html";
      return null;
    }
    return user;
  }

  function setupTeacherMaterialsPage() {
    refreshData();
    const user = requireTeacher();
    if (!user) return;

    renderSidebar(user);
    const typeSelect = document.querySelector("#materialType");
    const courseSelect = document.querySelector("#materialCourse");
    const contentField = document.querySelector("#contentField");
    const eventDateField = document.querySelector("#eventDateField");
    const fileField = document.querySelector("#fileField");
    const form = document.querySelector("#materialForm");
    const message = document.querySelector("#materialMessage");
    if (courseSelect) courseSelect.innerHTML = courseOptions();

    function syncMaterialFields() {
      const type = typeSelect.value;
      contentField.classList.toggle("hidden", type === "file");
      eventDateField.classList.toggle("hidden", type !== "event");
      fileField.classList.toggle("hidden", type !== "file");
    }

    typeSelect.addEventListener("change", syncMaterialFields);
    syncMaterialFields();
    renderTeacherMaterialsList();
    Promise.all(data.courses.map(function (course) {
      return syncCourseContent(course.id);
    })).then(renderTeacherMaterialsList);

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const type = typeSelect.value;
      const title = document.querySelector("#materialTitle").value.trim();
      const selectedCourseId = courseSelect ? courseSelect.value : ELECTRONICS_ID;
      const content = document.querySelector("#materialContent").value.trim();
      const eventDate = document.querySelector("#materialEventDate").value;
      const fileInput = document.querySelector("#materialFile");

      if (!title) {
        showMessage(message, "Назва обов'язкова.", true);
        return;
      }

      if (type === "text" && !content) {
        showMessage(message, "Текстовий зміст обов'язковий.", true);
        return;
      }

      if (type === "event" && !eventDate) {
        showMessage(message, "Дата події обов'язкова.", true);
        return;
      }

      function saveMaterial(filePayload) {
        const material = {
          id: Date.now(),
          courseId: selectedCourseId,
          teacherId: user.id,
          type: type,
          title: title,
          content: content,
          eventDate: type === "event" ? eventDate : "",
          fileName: filePayload ? filePayload.fileName : "",
          fileType: filePayload ? filePayload.fileType : "",
          fileData: filePayload ? filePayload.fileData : "",
          hidden: false,
          pinned: false,
          createdAt: Date.now()
        };

        courseMaterials(selectedCourseId).push(material);
        if (apiToken()) {
          apiRequest("/materials", {
            method: "POST",
            body: JSON.stringify({
              title: title,
              content: content,
              type: type,
              courseId: selectedCourseId,
              eventDate: type === "event" ? eventDate : "",
              fileName: material.fileName,
              fileType: material.fileType,
              fileUrl: material.fileData,
              hidden: false,
              pinned: false
            })
          }).then(function (savedMaterial) {
            material.mongoId = savedMaterial._id;
            material.id = savedMaterial._id;
            writeData();
          }).catch(function (error) {
            showMessage(message, error.message, true);
          });
        }

        if (type === "event") {
          notifyEnrolledStudents(selectedCourseId, "Майбутня подія: " + title + " — " + formatDateTime(eventDate) + ".", courseTitle(selectedCourseId));
        } else {
          notifyEnrolledStudents(selectedCourseId, "Опубліковано новий матеріал: " + title + ".", courseTitle(selectedCourseId));
        }

        writeData();
        form.reset();
        if (courseSelect) courseSelect.value = selectedCourseId;
        syncMaterialFields();
        renderTeacherMaterialsList();
        showMessage(message, "Матеріал опубліковано.", false);
      }

      if (type === "file") {
        const file = fileInput.files[0];
        if (!file) {
          showMessage(message, "Будь ласка, оберіть файл для завантаження.", true);
          return;
        }
        const fileType = getAcceptedFileType(file);
        if (!fileType) {
          showMessage(message, "Непідтримуваний тип файлу. Використовуйте Word, PDF, PowerPoint або зображення.", true);
          return;
        }
        readFileAsDataUrl(file).then(function (fileData) {
          saveMaterial({ fileName: file.name, fileType: fileType, fileData: fileData });
        });
        return;
      }

      saveMaterial(null);
    });
  }

  function setupTeacherTestsPage() {
    refreshData();
    const user = requireTeacher();
    if (!user) return;

    renderSidebar(user);
    const testCourseSelect = document.querySelector("#testCourse");
    if (testCourseSelect) testCourseSelect.innerHTML = courseOptions();
    renderQuestionBuilder();
    renderTeacherTestsList();
    Promise.all(data.courses.map(function (course) {
      return syncCourseContent(course.id);
    })).then(renderTeacherTestsList);

    document.querySelector("#addQuestionButton").addEventListener("click", function () {
      addQuestionField();
    });

    document.querySelector("#cancelEditButton").addEventListener("click", function () {
      resetTestForm();
    });

    document.querySelector("#testForm").addEventListener("submit", function (event) {
      event.preventDefault();
      const message = document.querySelector("#testMessage");
      const title = document.querySelector("#testTitle").value.trim();
      const passScore = Number(document.querySelector("#testPassScore").value);
      const selectedCourseId = testCourseSelect ? testCourseSelect.value : ELECTRONICS_ID;
      const editingId = document.querySelector("#editingTestId").value;
      const questions = collectQuestionsFromForm();

      if (!title) {
        showMessage(message, "Назва тесту обов'язкова.", true);
        return;
      }

      if (!questions.length) {
        showMessage(message, "Додайте щонайменше одне повне питання.", true);
        return;
      }

      if (editingId) {
        const test = data.courses.reduce(function (found, course) {
          return found || courseTeacherTests(course.id).find(function (item) {
            return String(item.id) === editingId;
          });
        }, null);
        const previousCourseId = test ? test.courseId : selectedCourseId;
        const selectedTests = courseTeacherTests(selectedCourseId);
        const previousTests = courseTeacherTests(previousCourseId);
        if (previousCourseId !== selectedCourseId && test) {
          const previousIndex = previousTests.findIndex(function (item) {
            return String(item.id) === editingId;
          });
          if (previousIndex >= 0) previousTests.splice(previousIndex, 1);
          selectedTests.push(test);
        }
        if (test) {
          test.courseId = selectedCourseId;
          test.title = title;
          test.passScore = passScore;
          test.questions = questions;
          test.updatedAt = Date.now();
        }
        if (test && test.mongoId && apiToken()) {
          apiRequest("/tests/" + test.mongoId, {
            method: "PUT",
            body: JSON.stringify({
              title: title,
              courseId: selectedCourseId,
            passScore: passScore,
            questions: questions,
            hidden: false,
            pinned: false
            })
          }).catch(function (error) {
            showMessage(message, error.message, true);
          });
        }
        showMessage(message, "Тест оновлено.", false);
      } else {
        const newTest = {
          id: Date.now(),
          courseId: selectedCourseId,
          teacherId: user.id,
          title: title,
          passScore: passScore,
          questions: questions,
          hidden: false,
          pinned: false,
          createdAt: Date.now()
        };
        courseTeacherTests(selectedCourseId).push(newTest);
        if (apiToken()) {
          apiRequest("/tests", {
            method: "POST",
            body: JSON.stringify({
              title: title,
              courseId: selectedCourseId,
              passScore: passScore,
              questions: questions
            })
          }).then(function (savedTest) {
            newTest.mongoId = savedTest._id;
            newTest.id = savedTest._id;
            writeData();
          }).catch(function (error) {
            showMessage(message, error.message, true);
          });
        }
        notifyEnrolledStudents(selectedCourseId, "Опубліковано новий тест: " + title + ".", courseTitle(selectedCourseId));
        showMessage(message, "Тест створено.", false);
      }

      writeData();
      resetTestForm();
      renderTeacherTestsList();
      document.querySelector("#analyticsSection").classList.add("hidden");
    });
  }

  function renderTeacherMaterialsList() {
    const list = document.querySelector("#materialsList");
    if (!list) return;

    const items = data.courses.reduce(function (all, course) {
      return all.concat(courseMaterials(course.id));
    }, []).sort(function (a, b) {
      return b.createdAt - a.createdAt;
    });

    if (!items.length) {
      list.innerHTML = "<p class=\"empty-note\">Ще немає матеріалів.</p>";
      return;
    }

    list.innerHTML = items.map(function (item) {
      return [
        "<article class=\"material-item\">",
        materialCardMarkup(item),
        "<p class=\"auth-subtitle\">Курс: " + escapeHtml(courseTitle(item.courseId || ELECTRONICS_ID)) + "</p>",
        "<button class=\"button ghost danger-btn\" type=\"button\" data-delete-material=\"" + item.id + "\">Видалити</button>",
        "</article>"
      ].join("");
    }).join("");

    list.querySelectorAll("[data-delete-material]").forEach(function (button) {
      button.addEventListener("click", function () {
        if (!confirm("Видалити цей матеріал?")) return;
        const id = button.dataset.deleteMaterial;
        const course = data.courses.find(function (item) {
          return courseMaterials(item.id).some(function (material) {
            return String(material.id) === String(id);
          });
        }) || electronicsCourse();
        course.materials = course.materials.filter(function (item) {
          return String(item.id) !== String(id);
        });
        writeData();
        renderTeacherMaterialsList();
      });
    });
  }

  function renderTeacherTestsList() {
    const list = document.querySelector("#testsList");
    if (!list) return;

    const tests = data.courses.reduce(function (all, course) {
      return all.concat(courseTeacherTests(course.id));
    }, []).sort(function (a, b) {
      return b.createdAt - a.createdAt;
    });

    if (!tests.length) {
      list.innerHTML = "<p class=\"empty-note\">Ще не створено жодного тесту.</p>";
      return;
    }

    list.innerHTML = tests.map(function (test) {
      const attempts = data.testResults.filter(function (result) {
        return String(result.testId) === String(test.id);
      }).length;
      return [
        "<article class=\"test-item\">",
        "<div>",
        "<h4>" + escapeHtml(test.title) + "</h4>",
        "<p class=\"auth-subtitle\">" + test.questions.length + " питань · Прохідний бал " + test.passScore + "% · " + attempts + " спроб · " + escapeHtml(courseTitle(test.courseId || ELECTRONICS_ID)) + "</p>",
        "</div>",
        "<div class=\"hero-actions\">",
        "<button class=\"button ghost\" type=\"button\" data-analytics-test=\"" + test.id + "\">Аналітика</button>",
        "<button class=\"button ghost\" type=\"button\" data-edit-test=\"" + test.id + "\">Редагувати</button>",
        "<button class=\"button ghost danger-btn\" type=\"button\" data-delete-test=\"" + test.id + "\">Видалити</button>",
        "</div>",
        "</article>"
      ].join("");
    }).join("");

    list.querySelectorAll("[data-delete-test]").forEach(function (button) {
      button.addEventListener("click", function () {
        if (!confirm("Видалити цей тест і всі результати студентів?")) return;
        const id = button.dataset.deleteTest;
        const course = data.courses.find(function (item) {
          return courseTeacherTests(item.id).some(function (test) {
            return String(test.id) === String(id);
          });
        }) || electronicsCourse();
        course.teacherTests = course.teacherTests.filter(function (item) {
          return String(item.id) !== String(id);
        });
        data.testResults = data.testResults.filter(function (item) {
          return String(item.testId) !== String(id);
        });
        writeData();
        renderTeacherTestsList();
        document.querySelector("#analyticsSection").classList.add("hidden");
      });
    });

    list.querySelectorAll("[data-edit-test]").forEach(function (button) {
      button.addEventListener("click", function () {
        const id = button.dataset.editTest;
        const test = data.courses.reduce(function (found, course) {
          return found || courseTeacherTests(course.id).find(function (item) {
            return String(item.id) === String(id);
          });
        }, null);
        if (!test) return;
        document.querySelector("#testFormTitle").textContent = "Редагувати тест";
        document.querySelector("#editingTestId").value = String(test.id);
        const editCourseSelect = document.querySelector("#testCourse");
        if (editCourseSelect) editCourseSelect.value = test.courseId || ELECTRONICS_ID;
        document.querySelector("#testTitle").value = test.title;
        document.querySelector("#testPassScore").value = test.passScore;
        document.querySelector("#saveTestButton").textContent = "Оновити тест";
        document.querySelector("#cancelEditButton").classList.remove("hidden");
        renderQuestionBuilder(test.questions);
      });
    });

    list.querySelectorAll("[data-analytics-test]").forEach(function (button) {
      button.addEventListener("click", function () {
        renderTestAnalytics(button.dataset.analyticsTest);
      });
    });
  }

  function renderTestAnalytics(testId) {
    const section = document.querySelector("#analyticsSection");
    const title = document.querySelector("#analyticsTitle");
    const content = document.querySelector("#analyticsContent");
    const test = data.courses.reduce(function (found, course) {
      return found || courseTeacherTests(course.id).find(function (item) {
        return String(item.id) === String(testId);
      });
    }, null);
    if (!section || !test) return;

    const results = data.testResults.filter(function (item) {
      return String(item.testId) === String(testId);
    }).sort(function (a, b) {
      return b.percentage - a.percentage;
    });

    section.classList.remove("hidden");
    title.textContent = "Аналітика: " + test.title;

    if (!results.length) {
      content.innerHTML = "<p class=\"empty-note\">Ще немає спроб студентів.</p>";
      return;
    }

    const passed = results.filter(function (item) {
      return item.passed;
    }).length;
    const average = Math.round(results.reduce(function (sum, item) {
      return sum + item.percentage;
    }, 0) / results.length);

    content.innerHTML = [
      "<div class=\"stats-grid\" style=\"margin-bottom:18px\">",
      statCard(String(results.length), "Спроби"),
      statCard(String(passed), "Складено"),
      statCard(average + "%", "Середній бал"),
      statCard(Math.round((passed / results.length) * 100) + "%", "Відсоток успішності"),
      "</div>",
      "<div class=\"table-wrap\"><table><thead><tr><th>Студент</th><th>Бал</th><th>Відсоток</th><th>Статус</th><th>Дата</th></tr></thead><tbody>",
      results.map(function (result) {
        const student = data.users.find(function (user) {
          return String(user.id) === String(result.studentId);
        });
        return [
          "<tr>",
          "<td>" + escapeHtml(student ? student.name : "Невідомо") + "</td>",
          "<td>" + result.score + "/" + result.maxScore + "</td>",
          "<td>" + result.percentage + "%</td>",
          "<td>" + (result.passed ? "Складено" : "Не складено") + "</td>",
          "<td>" + formatDateTime(result.completedAt) + "</td>",
          "</tr>"
        ].join("");
      }).join(""),
      "</tbody></table></div>"
    ].join("");
  }

  function renderQuestionBuilder(questions) {
    const builder = document.querySelector("#questionsBuilder");
    if (!builder) return;
    builder.innerHTML = "";
    const items = questions && questions.length ? questions : [{ question: "", options: ["", ""], answer: 0, points: 1 }];
    items.forEach(function (item, index) {
      addQuestionField(item, index);
    });
  }

  function addQuestionField(question, index) {
    const builder = document.querySelector("#questionsBuilder");
    const fieldIndex = index !== undefined ? index : builder.children.length;
    const q = question || { question: "", options: ["", ""], answer: 0, points: 1 };
    const questionKey = "q-" + Date.now() + "-" + Math.floor(Math.random() * 100000);
    const block = document.createElement("div");
    block.className = "question-block content-panel";
    block.dataset.questionKey = questionKey;
    block.innerHTML = [
      "<h4>Питання " + (fieldIndex + 1) + "</h4>",
      "<label>Текст питання<input class=\"q-text\" type=\"text\" value=\"" + escapeHtml(q.question) + "\" required></label>",
      "<div class=\"options-list\">",
      q.options.map(function (option, optionIndex) {
        return questionOptionMarkup(questionKey, optionIndex, option, Number(q.answer || 0) === optionIndex);
      }).join(""),
      "</div>",
      "<div class=\"hero-actions\">",
      "<button class=\"button ghost add-option\" type=\"button\">Додати варіант</button>",
      "<label>Бали за питання<input class=\"q-points\" type=\"number\" min=\"1\" value=\"" + Number(q.points || 1) + "\" required></label>",
      "</div>",
      "<button class=\"button ghost danger-btn remove-question\" type=\"button\">Видалити питання</button>"
    ].join("");
    builder.appendChild(block);

    block.querySelector(".add-option").addEventListener("click", function () {
      const optionsList = block.querySelector(".options-list");
      const optionIndex = optionsList.querySelectorAll(".q-option-row").length;
      optionsList.insertAdjacentHTML("beforeend", questionOptionMarkup(block.dataset.questionKey, optionIndex, "", false));
      bindOptionRemoveButtons(block);
    });

    bindOptionRemoveButtons(block);

    block.querySelector(".remove-question").addEventListener("click", function () {
      if (builder.children.length === 1) return;
      block.remove();
      builder.querySelectorAll(".question-block h4").forEach(function (heading, idx) {
        heading.textContent = "Питання " + (idx + 1);
      });
    });
  }

  function questionOptionMarkup(questionIndex, optionIndex, value, checked) {
    return [
      "<div class=\"q-option-row\">",
      "<label class=\"q-answer-choice\"><input class=\"q-answer-radio\" type=\"radio\" name=\"answer-" + questionIndex + "\" value=\"" + optionIndex + "\"" + (checked ? " checked" : "") + " required> Правильна</label>",
      "<input class=\"q-option\" type=\"text\" value=\"" + escapeHtml(value || "") + "\" placeholder=\"Варіант відповіді\" required>",
      "<button class=\"button small ghost danger-btn remove-option\" type=\"button\">Видалити</button>",
      "</div>"
    ].join("");
  }

  function bindOptionRemoveButtons(block) {
    block.querySelectorAll(".remove-option").forEach(function (button) {
      button.onclick = function () {
        const rows = block.querySelectorAll(".q-option-row");
        if (rows.length <= 2) return;
        button.closest(".q-option-row").remove();
        block.querySelectorAll(".q-answer-radio").forEach(function (radio, index) {
          radio.value = String(index);
        });
      };
    });
  }

  function collectQuestionsFromForm() {
    const blocks = document.querySelectorAll("#questionsBuilder .question-block");
    const questions = [];
    blocks.forEach(function (block) {
      const text = block.querySelector(".q-text").value.trim();
      const options = Array.prototype.map.call(block.querySelectorAll(".q-option"), function (input) {
        return input.value.trim();
      }).filter(Boolean);
      const checkedAnswer = block.querySelector(".q-answer-radio:checked");
      const answer = checkedAnswer ? Number(checkedAnswer.value) : -1;
      const points = Math.max(1, Number(block.querySelector(".q-points").value || 1));
      if (!text || options.length < 2 || answer < 0 || answer >= options.length) return;
      questions.push({ question: text, options: options, answer: answer, points: points });
    });
    return questions;
  }

  function resetTestForm() {
    document.querySelector("#testFormTitle").textContent = "Створити тест";
    document.querySelector("#editingTestId").value = "";
    document.querySelector("#testTitle").value = "";
    document.querySelector("#testPassScore").value = "60";
    document.querySelector("#saveTestButton").textContent = "Зберегти тест";
    document.querySelector("#cancelEditButton").classList.add("hidden");
    renderQuestionBuilder();
  }

  function materialCardMarkup(item) {
    const typeLabel = item.type === "event" ? "Подія" : item.type === "file" ? "Файл" : "Текст";
    let body = "";

    if (item.type === "text") {
      body = "<p>" + escapeHtml(item.content) + "</p>";
    } else if (item.type === "event") {
      body = "<p>" + escapeHtml(item.content) + "</p><p class=\"eyebrow\">Дата події: " + formatDateTime(item.eventDate) + "</p>";
    } else if (item.type === "file") {
      if (item.fileType === "image") {
        body = "<img class=\"material-preview\" src=\"" + item.fileData + "\" alt=\"" + escapeHtml(item.fileName) + "\">";
      } else {
        body = "<p>Файл: " + escapeHtml(item.fileName) + " (" + item.fileType.toUpperCase() + ")</p>";
      }
      body += "<a class=\"button small\" href=\"" + item.fileData + "\" download=\"" + escapeHtml(item.fileName) + "\">Завантажити</a>";
    }

    return [
      "<div class=\"material-card\">",
      "<span class=\"eyebrow\">" + typeLabel + "</span>",
      "<h4>" + escapeHtml(item.title) + "</h4>",
      body,
      "<p class=\"auth-subtitle\">Опубліковано " + formatDateTime(item.createdAt) + "</p>",
      "</div>"
    ].join("");
  }

  function notifyEnrolledStudents(courseId, text, courseTitle) {
    data.users.forEach(function (student) {
      if (student.role !== "student") return;
      if (!(student.joinedCourses || []).includes(courseId)) return;
      student.notifications.push({
        type: "course",
        course: courseTitle,
        text: text
      });
    });
  }

  function readFileAsDataUrl(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () { resolve(reader.result); };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function getAcceptedFileType(file) {
    const name = file.name.toLowerCase();
    if (/\.(png|jpg|jpeg|gif|webp)$/.test(name) || file.type.startsWith("image/")) return "image";
    if (/\.pdf$/.test(name) || file.type === "application/pdf") return "pdf";
    if (/\.(doc|docx)$/.test(name)) return "word";
    if (/\.(ppt|pptx)$/.test(name)) return "ppt";
    return "";
  }

  function deleteAccount(userId) {
    deleteUserRecord(userId);
    if (data.currentUserId === userId) {
      data.currentUserId = null;
    }
    writeData();
    window.location.href = "index.html";
  }

  function deleteUserRecord(userId) {
    data.users = data.users.filter(function (user) {
      return String(user.id) !== String(userId);
    });
    data.testResults = data.testResults.filter(function (result) {
      return String(result.studentId) !== String(userId);
    });
    data.courses.forEach(function (course) {
      course.materials = course.materials.filter(function (item) {
        return String(item.teacherId) !== String(userId);
      });
      course.teacherTests = course.teacherTests.filter(function (item) {
        return String(item.teacherId) !== String(userId);
      });
    });
  }

  function formatDateTime(value) {
    if (!value) return "";
    const date = typeof value === "number" ? new Date(value) : new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString("uk-UA");
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderNotifications() {
    const list = document.querySelector("#notificationList");
    const markAllButton = document.querySelector("#markAllNotificationsButton");
    const user = currentUser();

    if (!user) {
      list.innerHTML = "<p class=\"empty-note\">Увійдіть, щоб переглянути сповіщення.</p>";
      return;
    }

    if (!user.notifications.length) {
      list.innerHTML = "<p class=\"empty-note\">Ще немає сповіщень.</p>";
      return;
    }

    if (markAllButton) {
      markAllButton.onclick = function () {
        user.notifications.forEach(function (item) {
          item.isRead = true;
        });
        writeData();
        renderNotifications();
      };
    }

    list.innerHTML = ["system", "course"].map(function (type) {
      const items = user.notifications.filter(function (item) {
        return item.type === type;
      });
      return [
        "<section class=\"notification-group\">",
        "<h2>" + (type === "system" ? "Системні сповіщення" : "Сповіщення курсу") + "</h2>",
        items.length ? items.map(notificationMarkup).join("") : "<p class=\"empty-note\">Немає " + (type === "system" ? "системних" : "курсових") + " сповіщень.</p>",
        "</section>"
      ].join("");
    }).join("");

    list.querySelectorAll("[data-read-notification]").forEach(function (button) {
      button.addEventListener("click", function () {
        const id = Number(button.dataset.readNotification);
        const item = user.notifications.find(function (notification) {
          return Number(notification.id) === id;
        });
        if (!item) return;
        item.isRead = true;
        writeData();
        renderNotifications();
      });
    });
  }

  function notificationMarkup(item) {
    return [
      "<article class=\"notification-item" + (item.isRead ? "" : " unread") + "\">",
      "<span>" + translateNotificationType(item.type) + "</span>",
      "<h3>" + item.course + "</h3>",
      "<p>" + item.text + "</p>",
      item.isRead ? "" : "<button class=\"button small\" type=\"button\" data-read-notification=\"" + item.id + "\">Позначити прочитаним</button>",
      "</article>"
    ].join("");
  }

  function setupMaterialPages() {
    const materialQuiz = document.querySelector("[data-material-quiz]");
    if (materialQuiz) setupMaterialQuiz(materialQuiz);
    if (document.querySelector("#pnCanvas")) setupPnAnimation();
    if (document.querySelector("#ivGraph")) setupVacGraph();
  }

  function setupMaterialQuiz(form) {
    const key = form.dataset.materialQuiz;
    const result = document.querySelector("#materialQuizResult");
    const quizzes = {
      pn: [
        {
          question: "Які основні носії в P-області?",
          options: ["Дірки", "Електрони", "Фотони"],
          answer: 0
        },
        {
          question: "Що утворюється біля межі P-N після рекомбінації?",
          options: ["Зона збіднення", "Мідний провід", "Магнітне ядро"],
          answer: 0
        },
        {
          question: "Що зазвичай робить пряме зміщення із зоною збіднення?",
          options: ["Звужує її", "Видаляє всі атоми", "Перетворює на резистор"],
          answer: 0
        }
      ],
      vac: [
        {
          question: "Що показує крива I-V?",
          options: ["Струм відносно напруги", "Масу відносно часу", "Лише опір"],
          answer: 0
        },
        {
          question: "Що відображає навантажувальна пряма?",
          options: ["Обмеження джерела живлення та опору навантаження", "Випадкову декорацію графіка", "Лише тепловий шум"],
          answer: 0
        },
        {
          question: "Де знаходиться робоча точка?",
          options: ["На перетині кривої I-V та навантажувальної прямої", "Завжди при нульовій напрузі", "Лише при максимальній напрузі"],
          answer: 0
        }
      ]
    };
    const questions = quizzes[key] || [];
    form.innerHTML = questions.map(function (item, questionIndex) {
      return [
        "<fieldset>",
        "<legend>" + item.question + "</legend>",
        item.options.map(function (option, optionIndex) {
          return "<label><input type=\"radio\" name=\"mq" + questionIndex + "\" value=\"" + optionIndex + "\" required> " + option + "</label>";
        }).join(""),
        "</fieldset>"
      ].join("");
    }).join("") + "<button class=\"button primary\" type=\"submit\">Зберегти бал</button>";

    const saved = JSON.parse(localStorage.getItem("KIFKMaterialScores") || "{}");
    if (result && saved[key] !== undefined) result.textContent = "Збережений бал: " + saved[key] + "/" + questions.length;

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      let score = 0;
      questions.forEach(function (item, index) {
        const checked = form.querySelector("input[name='mq" + index + "']:checked");
        if (checked && Number(checked.value) === item.answer) score += 1;
      });
      saved[key] = score;
      localStorage.setItem("KIFKMaterialScores", JSON.stringify(saved, null, 2));
      if (result) result.textContent = "Результат: " + score + "/" + questions.length + ". Бал збережено.";
    });
  }

  function setupPnAnimation() {
    const canvas = document.querySelector("#pnCanvas");
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    const junctionX = width / 2;
    const electrons = [];
    const holes = [];
    const flashes = [];

    function Particle(type) {
      this.type = type;
      this.x = type === "electron"
        ? junctionX + 80 + Math.random() * (width / 2 - 120)
        : 40 + Math.random() * (width / 2 - 120);
      this.y = 60 + Math.random() * (height - 120);
      this.r = type === "electron" ? 8 : 10;
      this.vx = type === "electron" ? -(0.15 + Math.random() * 0.1) : (0.12 + Math.random() * 0.08);
      this.phase = Math.random() * Math.PI * 2;
      this.opacity = 1;
      this.dying = false;
    }

    Particle.prototype.update = function () {
      if (this.dying) {
        this.opacity -= 0.08;
        this.r *= 0.94;
        return this.opacity <= 0;
      }
      this.x += this.vx * 16;
      this.phase += 0.03;
      this.y += Math.sin(this.phase) * 1.1;
      if (this.type === "electron" && this.x < junctionX - 30) this.x = junctionX + 80 + Math.random() * (width / 2 - 120);
      if (this.type === "hole" && this.x > junctionX + 30) this.x = 40 + Math.random() * (width / 2 - 120);
      return false;
    };

    Particle.prototype.draw = function () {
      ctx.save();
      ctx.globalAlpha = this.opacity;
      const color = this.type === "electron" ? "#54a0ff" : "#ff9f43";
      const glow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r * 2.2);
      glow.addColorStop(0, color);
      glow.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r * 2.2, 0, Math.PI * 2);
      ctx.fill();
      if (this.type === "electron") {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.fillText("-", this.x - 3, this.y + 4);
      } else {
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = color;
        ctx.fillText("+", this.x - 4, this.y + 4);
      }
      ctx.restore();
    };

    for (let i = 0; i < 34; i++) {
      electrons.push(new Particle("electron"));
      holes.push(new Particle("hole"));
    }

    function drawBackground() {
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "rgba(200,200,220,0.18)";
      ctx.fillRect(junctionX - 60, 0, 120, height);
      ctx.strokeStyle = "rgba(120,120,150,0.6)";
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(junctionX, 0);
      ctx.lineTo(junctionX, height);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#333";
      ctx.font = "bold 22px Arial";
      ctx.textAlign = "center";
      ctx.fillText("P-область", junctionX / 2, 35);
      ctx.fillText("N-область", junctionX + junctionX / 2, 35);
      ctx.font = "16px Arial";
      ctx.fillText("Зона збіднення", junctionX, height - 22);
    }

    function recombine() {
      electrons.forEach(function (electron) {
        if (electron.dying) return;
        holes.forEach(function (hole) {
          if (hole.dying) return;
          const dx = electron.x - hole.x;
          const dy = electron.y - hole.y;
          if (Math.sqrt(dx * dx + dy * dy) < 16 && Math.abs(electron.x - junctionX) < 50) {
            electron.dying = true;
            hole.dying = true;
            flashes.push({ x: (electron.x + hole.x) / 2, y: (electron.y + hole.y) / 2, life: 1 });
          }
        });
      });
    }

    function drawFlashes() {
      for (let i = flashes.length - 1; i >= 0; i--) {
        const flash = flashes[i];
        flash.life -= 0.035;
        ctx.fillStyle = "rgba(255,220,120," + flash.life + ")";
        ctx.beginPath();
        ctx.arc(flash.x, flash.y, 34 * (1 - flash.life + 0.15), 0, Math.PI * 2);
        ctx.fill();
        if (flash.life <= 0) flashes.splice(i, 1);
      }
    }

    function animate() {
      drawBackground();
      [holes, electrons].forEach(function (set) {
        for (let i = set.length - 1; i >= 0; i--) {
          if (set[i].update()) set[i] = new Particle(set[i].type);
          set[i].draw();
        }
      });
      recombine();
      drawFlashes();
      requestAnimationFrame(animate);
    }
    animate();
  }

  function setupVacGraph() {
    const canvas = document.querySelector("#ivGraph");
    const ctx = canvas.getContext("2d");
    const controls = ["voltage", "resistance", "satCurrent", "ideality"].reduce(function (acc, name) {
      acc[name] = {
        slider: document.querySelector("#" + name + "Slider"),
        input: document.querySelector("#" + name + "Input")
      };
      return acc;
    }, {});
    const thermalVoltage = 0.026;
    const padding = { top: 40, right: 40, bottom: 60, left: 70 };

    function diodeCurrent(voltage, saturationCurrent, ideality) {
      const isAmp = saturationCurrent * 1e-9;
      if (voltage < 0) return -isAmp;
      return isAmp * (Math.exp(voltage / (thermalVoltage * ideality)) - 1);
    }

    function operatingPoint(supplyVoltage, resistance, saturationCurrent, ideality) {
      const isAmp = saturationCurrent * 1e-9;
      const vt = thermalVoltage * ideality;
      let voltage = supplyVoltage * 0.7;
      for (let i = 0; i < 50; i++) {
        const diode = isAmp * (Math.exp(voltage / vt) - 1);
        const load = (supplyVoltage - voltage) / resistance;
        const delta = (diode - load) / ((isAmp / vt) * Math.exp(voltage / vt) + 1 / resistance);
        voltage = Math.max(0, Math.min(supplyVoltage, voltage - delta));
        if (Math.abs(delta) < 1e-9) break;
      }
      return { voltage: voltage, current: (supplyVoltage - voltage) / resistance };
    }

    function resize() {
      const rect = canvas.parentElement.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = (rect.width - 40) * dpr;
      canvas.height = Math.min(420, rect.width * 0.6) * dpr;
      canvas.style.width = (rect.width - 40) + "px";
      canvas.style.height = Math.min(420, rect.width * 0.6) + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    }

    function draw() {
      const width = canvas.width / (window.devicePixelRatio || 1);
      const height = canvas.height / (window.devicePixelRatio || 1);
      const graphWidth = width - padding.left - padding.right;
      const graphHeight = height - padding.top - padding.bottom;
      const supplyVoltage = Number(controls.voltage.slider.value);
      const resistance = Number(controls.resistance.slider.value);
      const saturationCurrent = Number(controls.satCurrent.slider.value);
      const ideality = Number(controls.ideality.slider.value);
      const maxVoltage = Math.max(supplyVoltage * 1.2, 1);
      const maxCurrent = Math.max((supplyVoltage / resistance) * 1.2, diodeCurrent(maxVoltage * 0.8, saturationCurrent, ideality) * 1.1, 0.001);
      const toX = function (voltage) { return padding.left + (voltage / maxVoltage) * graphWidth; };
      const toY = function (current) { return height - padding.bottom - (current / maxCurrent) * graphHeight; };

      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = "#e0e0e0";
      ctx.lineWidth = 1;
      for (let i = 0; i <= 5; i++) {
        const x = padding.left + graphWidth / 5 * i;
        const y = padding.top + graphHeight / 5 * i;
        ctx.beginPath(); ctx.moveTo(x, padding.top); ctx.lineTo(x, height - padding.bottom); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(padding.left, y); ctx.lineTo(width - padding.right, y); ctx.stroke();
      }
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(padding.left, padding.top);
      ctx.lineTo(padding.left, height - padding.bottom);
      ctx.lineTo(width - padding.right, height - padding.bottom);
      ctx.stroke();
      ctx.fillStyle = "#333";
      ctx.font = "14px Arial";
      ctx.textAlign = "center";
      ctx.fillText("Напруга (В)", width / 2, height - 15);
      ctx.save();
      ctx.translate(22, height / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText("Струм (мА)", 0, 0);
      ctx.restore();

      ctx.beginPath();
      ctx.strokeStyle = "#4a90d9";
      ctx.lineWidth = 3;
      let started = false;
      for (let voltage = 0; voltage <= maxVoltage; voltage += maxVoltage / 220) {
        const current = diodeCurrent(voltage, saturationCurrent, ideality);
        const x = toX(voltage);
        const y = toY(current);
        if (y < padding.top || y > height - padding.bottom) continue;
        if (!started) { ctx.moveTo(x, y); started = true; } else { ctx.lineTo(x, y); }
      }
      ctx.stroke();

      ctx.strokeStyle = "#e74c3c";
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 4]);
      ctx.beginPath();
      ctx.moveTo(toX(0), toY(supplyVoltage / resistance));
      ctx.lineTo(toX(supplyVoltage), toY(0));
      ctx.stroke();
      ctx.setLineDash([]);

      const op = operatingPoint(supplyVoltage, resistance, saturationCurrent, ideality);
      ctx.fillStyle = "#e74c3c";
      ctx.beginPath();
      ctx.arc(toX(op.voltage), toY(op.current), 8, 0, Math.PI * 2);
      ctx.fill();
      document.querySelector("#opVoltage").textContent = op.voltage.toFixed(3) + " V";
      document.querySelector("#opCurrent").textContent = (op.current * 1000).toFixed(3) + " mA";
      document.querySelector("#opPower").textContent = (op.voltage * op.current * 1000).toFixed(3) + " mW";
    }

    Object.keys(controls).forEach(function (key) {
      const pair = controls[key];
      pair.slider.addEventListener("input", function () {
        pair.input.value = pair.slider.value;
        draw();
      });
      pair.input.addEventListener("input", function () {
        pair.slider.value = pair.input.value;
        draw();
      });
    });
    window.addEventListener("resize", resize);
    resize();
  }

  function showCourseLoader(key, target, event) {
    event.preventDefault();

    let loader = document.querySelector("#globalCourseLoader");
    if (!loader) {
      loader = document.createElement("div");
      loader.id = "globalCourseLoader";
      loader.className = "course-loader";
      document.body.appendChild(loader);
    }

    loader.className = "course-loader electronics-loader";
    loader.innerHTML = "<div><span class=\"loader-ring\"></span><p>Завантаження «" + getCourse(key).title + "»...</p></div>";
    loader.classList.add("visible");

    setTimeout(function () {
      window.location.href = target;
    }, 900);
  }

  function addNotification(user, course, text) {
    user.notifications.push({
      type: "course",
      course: course,
      text: text
    });
  }

  function joinedCourseNames(user) {
    if (!user.joinedCourses.length) return ["Немає"];
    return user.joinedCourses.map(function (id) {
      const course = getCourse(id);
      return course ? course.title : id;
    });
  }

  function getCourse(id) {
    return data.courses.find(function (course) {
      return course.id === id;
    });
  }

  function courseProgress(user, id) {
    const tests = courseTeacherTests(id);
    if (!tests.length) return 0;

    const passed = tests.filter(function (test) {
      return data.testResults.some(function (result) {
        return String(result.testId) === String(test.id) && String(result.studentId) === String(user.id) && result.passed;
      });
    }).length;

    return Math.round((passed / tests.length) * 100);
  }

  function capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  function translateRole(role) {
    const map = { admin: "Адмін", teacher: "Викладач", student: "Студент" };
    return map[role] || capitalize(role);
  }

  function translateNotificationType(type) {
    const map = { system: "Система", course: "Курс" };
    return map[type] || capitalize(type);
  }
})();

<template>
  <div class="vue-dashboard-page">
    <aside class="vue-dashboard-sidebar">
      <div class="sidebar-brand">
        <span class="brand-mark">K</span>
        <RouterLink class="brand" to="/dashboard">
          <span>KIFK</span>
        </RouterLink>
      </div>

      <div class="sidebar-user">
        <strong>{{ user.name }}</strong>
        <span class="sidebar-role">{{ user.role }}</span>
      </div>

      <nav class="sidebar-nav">
        <RouterLink class="sidebar-link" to="/">Головна</RouterLink>
        <RouterLink class="sidebar-link" to="/dashboard">Панель керування</RouterLink>
        <RouterLink
          v-for="course in courseCatalog"
          :key="course.slug"
          class="sidebar-link"
          :to="`/courses/${course.slug}`"
        >
          {{ course.shortTitle }}
        </RouterLink>
        <RouterLink class="sidebar-link" to="/profile">Профіль</RouterLink>
        <RouterLink class="sidebar-link" to="/notifications">Сповіщення</RouterLink>
        <RouterLink class="sidebar-link" to="/results">Результати</RouterLink>

        <template v-if="user.role === 'teacher' || user.role === 'admin'">
          <RouterLink class="sidebar-link" to="/groups">Групи</RouterLink>
          <RouterLink class="sidebar-link" to="/teacher-materials">Матеріали</RouterLink>
          <RouterLink class="sidebar-link" to="/teacher-tests">Тести</RouterLink>
          <RouterLink class="sidebar-link" to="/teacher-gradebook">Журнал оцінок</RouterLink>
        </template>

        <RouterLink
          v-if="user.role === 'admin'"
          class="sidebar-link"
          to="/admin/users"
        >
          Користувачі
        </RouterLink>
      </nav>

      <div class="sidebar-footer">
        <button class="sidebar-link danger" type="button" @click="logout">
          Вийти
        </button>
      </div>
    </aside>

    <div class="vue-dashboard-main">
      <header class="dashboard-topbar">
        <h1>Панель керування</h1>
        <span class="user-chip">{{ user.name }} | {{ user.role }}</span>
      </header>

      <main class="dashboard-content">
        <div>
          <h2>З поверненням, {{ firstName }}</h2>
          <p class="auth-subtitle">Оберіть потрібний розділ платформи.</p>
        </div>

        <div class="stats-grid">
          <article class="stat-card">
            <strong>{{ user.role || "user" }}</strong>
            <span>Роль</span>
          </article>

          <article class="stat-card">
            <strong>{{ joinedCoursesCount }}</strong>
            <span>Курси</span>
          </article>

          <article class="stat-card">
            <strong>{{ upcomingTasks.length }}</strong>
            <span>Майбутні завдання</span>
          </article>
        </div>

        <section class="section dashboard-section" style="padding: 0; margin-top: 24px;">
          <div class="dashboard-grid">
            <article
              v-for="course in courseCatalog"
              :key="course.slug"
              class="dashboard-panel course-panel"
              :style="{ '--course-accent': course.accent }"
            >
              <p class="eyebrow">Навчальний курс</p>
              <h3>{{ course.title }}</h3>
              <p>{{ course.description }}</p>
              <RouterLink class="button primary" :to="`/courses/${course.slug}`">
                Відкрити курс
              </RouterLink>
            </article>

            <article class="dashboard-panel">
              <h3>Профіль</h3>
              <p>Перегляньте та оновіть свої дані.</p>

              <RouterLink class="button ghost" to="/profile">
                Відкрити профіль
              </RouterLink>
            </article>

            <article class="dashboard-panel">
              <h3>Сповіщення</h3>
              <p>Повідомлення про курси, тести та результати.</p>

              <RouterLink class="button ghost" to="/notifications">
                Переглянути
              </RouterLink>
            </article>

            <article class="dashboard-panel">
              <h3>Результати</h3>
              <p>Оцінки, відсотки та статус проходження тестів.</p>

              <RouterLink class="button ghost" to="/results">
                Відкрити результати
              </RouterLink>
            </article>
            <article class="dashboard-panel">
  <h3>Форум</h3>
  <p>Обговорення питань, матеріалів і практичних робіт.</p>

  <RouterLink class="button ghost" to="/forum">
    Відкрити форум
  </RouterLink>
</article>

            <article
              v-if="user.role === 'teacher' || user.role === 'admin'"
              class="dashboard-panel"
            >
              <h3>Групи</h3>
              <p>Створення груп та додавання студентів.</p>

              <RouterLink class="button primary" to="/groups">
                Керувати групами
              </RouterLink>
            </article>

            <article
              v-if="user.role === 'teacher' || user.role === 'admin'"
              class="dashboard-panel"
            >
              <h3>Матеріали викладача</h3>
              <p>Створюйте матеріали, файли та практичні роботи.</p>

              <RouterLink class="button primary" to="/teacher-materials">
                Створити матеріал
              </RouterLink>
            </article>

            <article
              v-if="user.role === 'teacher' || user.role === 'admin'"
              class="dashboard-panel"
            >
              <h3>Тести викладача</h3>
              <p>Створюйте тести, дедлайни та питання.</p>

              <RouterLink class="button primary" to="/teacher-tests">
                Створити тест
              </RouterLink>
            </article>

            <article
              v-if="user.role === 'teacher' || user.role === 'admin'"
              class="dashboard-panel"
            >
              <h3>Журнал оцінок</h3>
              <p>Перегляд результатів студентів за тестами.</p>

              <RouterLink class="button primary" to="/teacher-gradebook">
                Відкрити журнал
              </RouterLink>
            </article>
          </div>
        </section>

        <section class="content-panel tasks-panel">
          <div class="section-heading">
            <p class="eyebrow">Календар</p>
            <h2>Майбутні завдання</h2>
            <p>Тести, практичні роботи та матеріали з дедлайнами.</p>
          </div>

          <div v-if="upcomingTasks.length" class="tasks-list">
            <article
              v-for="task in upcomingTasks"
              :key="task.id"
              class="task-card"
            >
              <p class="eyebrow">
                {{ task.type }} • {{ task.courseTitle }}
              </p>

              <h3>{{ task.title }}</h3>

              <p>
                Дедлайн:
                <strong>{{ formatDate(task.deadline) }}</strong>
              </p>

              <RouterLink class="button small" :to="`/courses/${task.courseSlug}`">
                Відкрити курс
              </RouterLink>
            </article>
          </div>

          <p v-else class="auth-subtitle">
            Майбутніх завдань поки немає.
          </p>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import api from "../services/api";
import { courseBySlug, courseCatalog } from "../data/courseCatalog";

const router = useRouter();

const user = ref({});
const upcomingTasks = ref([]);

const firstName = computed(() => {
  return user.value.name ? user.value.name.split(" ")[0] : "";
});

const joinedCoursesCount = computed(() => {
  return user.value.joinedCourses?.length || 0;
});

onMounted(async () => {
  try {
    const res = await api.get("/users/me");
    user.value = res.data;

    await loadUpcomingTasks();
  } catch {
    router.push("/login");
  }
});

async function loadUpcomingTasks() {
  const courseSlugs = getAvailableCourseSlugs();

  const tasks = [];

  for (const slug of courseSlugs) {
    try {
      const testsRes = await api.get(`/tests/course/${slug}`);

      testsRes.data.forEach((test) => {
        if (test.deadline) {
          tasks.push({
            id: `test-${test._id}`,
            type: "Тест",
            title: test.title,
            deadline: test.deadline,
            courseSlug: slug,
            courseTitle: courseTitle(slug)
          });
        }
      });
    } catch {}

    try {
      const materialsRes = await api.get(`/materials/course/${slug}`);

      materialsRes.data.forEach((material) => {
        if (material.deadline || material.eventDate) {
          tasks.push({
            id: `material-${material._id}`,
            type: material.type === "practice"
              ? "Практична робота"
              : material.type === "event"
                ? "Подія"
                : "Матеріал",
            title: material.title,
            deadline: material.deadline || material.eventDate,
            courseSlug: slug,
            courseTitle: courseTitle(slug)
          });
        }
      });
    } catch {}
  }

  upcomingTasks.value = tasks
    .filter((task) => new Date(task.deadline).getTime() >= Date.now() - 86400000)
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
}

function getAvailableCourseSlugs() {
  if (user.value.role === "teacher" || user.value.role === "admin") {
    return courseCatalog.map((course) => course.slug);
  }

  const joined = user.value.joinedCourses || [];

  const slugs = joined
    .map((course) => {
      if (typeof course === "string") return course;
      return course.slug;
    })
    .filter(Boolean);

  return slugs.length ? slugs : courseCatalog.map((course) => course.slug);
}

function courseTitle(slug) {
  return courseBySlug[slug]?.title || "Курс";
}

function formatDate(value) {
  if (!value) return "Не вказано";
  return new Date(value).toLocaleString("uk-UA");
}

function logout() {
  localStorage.removeItem("token");
  router.push("/login");
}
</script>

<style scoped>
.vue-dashboard-page {
  display: flex !important;
  min-height: 100vh;
  width: 100%;
  align-items: stretch;
}

.vue-dashboard-sidebar {
  width: 280px;
  min-width: 280px;
  max-width: 280px;
  min-height: 100vh;
  height: 100vh;
  padding: 20px;
  border-right: 1px solid #293244;
  background: #111722;
  position: sticky;
  top: 0;
  align-self: flex-start;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-nav {
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-right: 4px;
  scrollbar-width: thin;
}

.sidebar-nav::-webkit-scrollbar {
  width: 6px;
}

.sidebar-nav::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(0, 229, 255, 0.42);
}

.sidebar-link {
  min-height: 38px;
  flex-shrink: 0;
  line-height: 1.2;
}

.sidebar-footer {
  flex-shrink: 0;
  margin-top: 10px;
}

.vue-dashboard-main {
  flex: 1;
  min-width: 0;
  width: calc(100% - 280px);
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 18px;
}

.dashboard-panel {
  display: grid;
  gap: 12px;
}

.course-panel {
  border-top: 3px solid var(--course-accent);
}

.tasks-panel {
  display: block;
  margin-top: 28px;
  padding: 24px;
}

.tasks-list {
  display: grid;
  gap: 16px;
  margin-top: 18px;
}

.task-card {
  display: grid;
  gap: 10px;
  padding: 18px;
  border: 1px solid #293244;
  border-radius: 10px;
  background: #111722;
}

@media (max-width: 800px) {
  .vue-dashboard-page {
    display: flex !important;
  }

  .vue-dashboard-sidebar {
    width: 240px;
    min-width: 240px;
    max-width: 240px;
    min-height: 100vh;
    height: 100vh;
    position: sticky;
    top: 0;
  }

  .vue-dashboard-main {
    width: auto;
  }
}
</style>

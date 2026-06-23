<template>
  <div class="profile-page">
    <aside class="profile-sidebar">
      <div class="sidebar-brand">
        <span class="brand-mark">K</span>
        <RouterLink class="brand" to="/dashboard">KIFK</RouterLink>
      </div>

      <nav class="sidebar-nav">
        <RouterLink class="sidebar-link" to="/">Головна</RouterLink>
        <RouterLink class="sidebar-link" to="/dashboard">Панель керування</RouterLink>
        <RouterLink class="sidebar-link" to="/courses/electronics">Електроніка</RouterLink>
        <RouterLink class="sidebar-link" to="/courses/logic">Логіка</RouterLink>
        <RouterLink class="sidebar-link" to="/notifications">Сповіщення</RouterLink>
        <RouterLink class="sidebar-link" to="/results">Результати</RouterLink>
      </nav>

      <button class="sidebar-link danger" type="button" @click="logout">
        Вийти
      </button>
    </aside>

    <main class="profile-main">
      <header class="dashboard-topbar">
        <h1>Профіль</h1>
        <span class="user-chip">{{ user.name }} | {{ user.role }}</span>
      </header>

      <section class="profile-card">
        <p class="profile-platform">KIFK</p>

        <div class="profile-header">
          <div class="profile-avatar">{{ initials }}</div>

          <div class="profile-identity">
            <h2>{{ user.name }}</h2>
            <p class="profile-email">{{ user.email }}</p>

            <div class="profile-badges">
              <span class="role-badge">{{ user.role || "Користувач" }}</span>
              <span class="group-badge">{{ user.group?.name || "Групу не призначено" }}</span>
            </div>
          </div>
        </div>

        <div class="profile-actions">
          <button class="button danger" type="button" @click="deleteAccount">
            Видалити акаунт
          </button>
        </div>

        <section class="profile-welcome">
          <h3>Вітаємо на платформі, {{ firstName || user.name }}</h3>
          <p>
            Тут зібрані ваші курси, найближчі дедлайни, тести та останні повідомлення.
          </p>
        </section>

        <section class="profile-section">
          <div class="section-heading compact">
            <p class="eyebrow">Курси</p>
            <h3>Курси, на які ви зареєстровані</h3>
          </div>

          <div v-if="profileCourses.length" class="profile-course-grid">
            <RouterLink
              v-for="course in profileCourses"
              :key="course.slug"
              class="content-panel profile-course-link"
              :to="course.path"
            >
              <h4>{{ course.title }}</h4>
              <p>{{ course.description }}</p>
            </RouterLink>
          </div>

          <p v-else class="auth-subtitle">
            Курсів поки немає. Перейдіть на головну сторінку та оберіть потрібний курс.
          </p>
        </section>

        <section class="profile-section">
          <div class="section-heading compact">
            <p class="eyebrow">Дедлайни</p>
            <h3>Завдання та тести</h3>
          </div>

          <div v-if="upcomingItems.length" class="profile-list">
            <article
              v-for="item in upcomingItems"
              :key="item.id"
              class="content-panel profile-list-item"
            >
              <div>
                <p class="eyebrow">{{ item.type }} - {{ item.courseTitle }}</p>
                <h4>{{ item.title }}</h4>
              </div>

              <strong>{{ formatDate(item.deadline) }}</strong>
            </article>
          </div>

          <p v-else class="auth-subtitle">
            Найближчих завдань або тестів з дедлайнами поки немає.
          </p>
        </section>

        <section class="profile-section">
          <div class="section-heading compact">
            <p class="eyebrow">Повідомлення</p>
            <h3>Останні повідомлення</h3>
          </div>

          <div v-if="recentNotifications.length" class="profile-list">
            <article
              v-for="notification in recentNotifications"
              :key="notification._id || notification.id"
              class="content-panel profile-list-item"
            >
              <div>
                <p class="eyebrow">{{ notification.type || "Система" }}</p>
                <h4>{{ notification.title || "Повідомлення" }}</h4>
                <p>{{ notification.text || notification.message }}</p>
              </div>

              <strong>{{ formatDate(notification.createdAt) }}</strong>
            </article>
          </div>

          <p v-else class="auth-subtitle">
            Нових повідомлень поки немає.
          </p>
        </section>

        <p v-if="message" class="message">{{ message }}</p>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import api from "../services/api";
import { courseBySlug, courseCatalog } from "../data/courseCatalog";

const router = useRouter();

const user = ref({});
const message = ref("");
const upcomingItems = ref([]);
const recentNotifications = ref([]);

const initials = computed(() => {
  if (!user.value.name) return "K";

  return user.value.name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
});

const firstName = computed(() => {
  return user.value.name ? user.value.name.split(" ")[0] : "";
});

const profileCourses = computed(() => {
  return courseCatalog.map((course) => ({
    slug: course.slug,
    path: `/courses/${course.slug}`,
    title: course.title,
    description: course.description
  }));
});

onMounted(async () => {
  try {
    const res = await api.get("/users/me");
    user.value = res.data;

    await Promise.all([
      loadUpcomingItems(),
      loadRecentNotifications()
    ]);
  } catch {
    router.push("/login");
  }
});

async function deleteAccount() {
  const confirmed = confirm(
    "Видалити акаунт назавжди? Цю дію не можна скасувати."
  );

  if (!confirmed) return;

  try {
    await api.delete("/users/me");
    localStorage.removeItem("token");
    router.push("/");
  } catch (error) {
    message.value = error.response?.data?.message || "Не вдалося видалити акаунт.";
  }
}

async function loadUpcomingItems() {
  const tasks = [];

  for (const slug of getAvailableCourseSlugs()) {
    try {
      const testsRes = await api.get(`/tests/course/${slug}`);

      testsRes.data.forEach((test) => {
        if (test.deadline) {
          tasks.push({
            id: `test-${test._id}`,
            type: "Тест",
            title: test.title,
            deadline: test.deadline,
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
            type: material.type === "practice" ? "Завдання" : "Матеріал",
            title: material.title,
            deadline: material.deadline || material.eventDate,
            courseTitle: courseTitle(slug)
          });
        }
      });
    } catch {}
  }

  upcomingItems.value = tasks
    .filter((task) => new Date(task.deadline).getTime() >= Date.now() - 86400000)
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 8);
}

async function loadRecentNotifications() {
  try {
    const res = await api.get("/notifications");
    recentNotifications.value = res.data
      .slice()
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 5);
  } catch {
    recentNotifications.value = [];
  }
}

function getAvailableCourseSlugs() {
  const joined = user.value.joinedCourses || [];

  const slugs = joined
    .map((course) => {
      if (typeof course === "string") return course;
      return course.slug;
    })
    .filter(Boolean);

  if (slugs.length) return slugs;
  if (user.value.role === "teacher" || user.value.role === "admin") {
    return courseCatalog.map((course) => course.slug);
  }

  return [];
}

function courseTitle(slug) {
  return courseBySlug[slug]?.title || "Курс";
}

function courseDescription(slug) {
  return courseBySlug[slug]?.description || "";
}

function formatDate(value) {
  if (!value) return "Дата не вказана";
  return new Date(value).toLocaleString("uk-UA");
}

function logout() {
  localStorage.removeItem("token");
  router.push("/login");
}
</script>

<style scoped>
.profile-page {
  display: flex;
  min-height: 100vh;
}

.profile-sidebar {
  width: 280px;
  min-width: 280px;
  height: 100vh;
  padding: 20px;
  border-right: 1px solid #293244;
  background: #111722;
  position: sticky;
  top: 0;
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

.sidebar-link {
  min-height: 38px;
  flex-shrink: 0;
  line-height: 1.2;
}

.profile-main {
  flex: 1;
  padding: 0;
  min-width: 0;
}

.profile-card {
  display: grid;
  gap: 24px;
  margin: 28px;
  padding: 28px;
}

.profile-platform {
  margin: 0;
  color: rgba(255, 255, 255, 0.35);
  font-size: clamp(44px, 8vw, 96px);
  font-weight: 900;
  line-height: 0.85;
  letter-spacing: 0;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 18px;
}

.profile-avatar {
  width: 96px;
  height: 96px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: linear-gradient(135deg, #00e5ff, #8b5cf6);
  color: #050712;
  font-size: 34px;
  font-weight: 900;
  box-shadow: 0 0 32px rgba(0, 229, 255, 0.3);
}

.profile-identity h2 {
  margin: 0 0 6px;
  font-size: clamp(34px, 4vw, 56px);
  line-height: 1;
}

.profile-email {
  margin: 0 0 12px;
  color: rgba(255, 255, 255, 0.76);
  font-size: 18px;
  font-weight: 700;
}

.profile-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.role-badge,
.group-badge {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 900;
  text-transform: capitalize;
}

.role-badge {
  color: #ffe9a8;
  border: 1px solid rgba(251, 191, 36, 0.82);
  background: rgba(251, 191, 36, 0.12);
  box-shadow:
    0 0 20px rgba(251, 191, 36, 0.16),
    inset 0 0 14px rgba(251, 191, 36, 0.1);
}

.group-badge {
  color: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.06);
}

.profile-welcome,
.profile-section {
  display: grid;
  gap: 14px;
}

.profile-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.profile-welcome {
  padding: 22px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(0, 229, 255, 0.1), transparent 38%),
    rgba(15, 23, 42, 0.72);
}

.profile-welcome h3,
.section-heading h3 {
  margin: 0;
}

.profile-course-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.profile-course-link {
  display: block;
  color: inherit;
  text-decoration: none;
  transition: transform 0.18s ease, border-color 0.18s ease;
}

.profile-course-link:hover {
  transform: translateY(-2px);
  border-color: rgba(0, 229, 255, 0.46);
}

.profile-list {
  display: grid;
  gap: 12px;
}

.profile-list-item {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: flex-start;
}

.profile-list-item h4,
.profile-list-item p {
  margin: 0 0 8px;
}

.content-panel {
  padding: 18px;
  border: 1px solid #293244;
  border-radius: 8px;
  background: #111722;
}

@media (max-width: 800px) {
  .profile-page {
    display: flex;
  }

  .profile-sidebar {
    width: 240px;
    min-width: 240px;
    position: sticky;
    top: 0;
    min-height: 100vh;
    height: 100vh;
  }

  .profile-header,
  .profile-list-item {
    flex-direction: column;
  }
}
</style>

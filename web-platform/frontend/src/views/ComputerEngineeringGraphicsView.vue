<template>
  <div class="course-shell electronics-course electric-course-page computer-engineering-graphics-course">
    <div class="electronics-bg" aria-hidden="true">
      <div class="electronics-grid"></div>
      <div class="electronics-glow glow-warm"></div>
      <div class="electronics-glow glow-cool"></div>
      <div class="electronics-shape ring"></div>
      <div class="electronics-shape chip"></div>
      <div class="electronics-shape pulse"></div>
      <div class="electric-bug-layer">
        <span v-for="bug in 9" :key="bug"></span>
      </div>
      <div class="electronics-particles">
        <span v-for="particle in 18" :key="particle"></span>
      </div>
    </div>

    <header class="topbar platform-topbar">
      <RouterLink class="brand" to="/dashboard">
        <span class="brand-mark">K</span>
        <span>KIFK</span>
      </RouterLink>

      <div class="course-user-menu">
        <button class="profile-trigger" type="button" :aria-expanded="profileMenuOpen" @click="profileMenuOpen = !profileMenuOpen">
          {{ profileInitials }}
        </button>
        <div v-if="profileMenuOpen" class="profile-menu">
          <strong>{{ user.name }}</strong>
          <RouterLink to="/profile" @click="profileMenuOpen = false">Персональний кабінет</RouterLink>
          <RouterLink to="/notifications" @click="profileMenuOpen = false">Сповіщення</RouterLink>
          <button v-if="canPreview" type="button" @click="toggleStudentPreview">
            {{ studentPreview ? "Повернути режим викладача" : "Перейти в режим студента" }}
          </button>
        </div>
      </div>
    </header>

    <main>
      <section class="hero template-course-hero">
        <div class="hero-content">
          <h1>Комп'ютерна та інженерна графіка</h1>
          <p class="subtitle">
            Креслення, проєкції, моделювання та інструменти комп'ютерної графіки.
          </p>
        </div>

        <div class="electronics-hero-visual" aria-hidden="true">
          <div class="course-signature" aria-hidden="true">
            <span v-for="signature in 12" :key="signature"></span>
          </div>

          <div class="board-frame">
            <span class="trace trace-a"></span>
            <span class="trace trace-b"></span>
            <span class="trace trace-c"></span>
            <span class="node node-a"></span>
            <span class="node node-b"></span>
            <span class="node node-c"></span>
            <div class="processor-core">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>

        <div class="cta-container">
          <button
            class="cta-button cta-primary"
            type="button"
            :disabled="isJoined"
            @click="joinCourse"
          >
            {{ isJoined ? "Ви вже на курсі" : "Приєднатися до курсу" }}
          </button>

          <a href="#learning" class="cta-button cta-secondary">
            Дізнатися більше
          </a>
        </div>
      </section>

      <section class="features course-content" id="learning">
        <h2 class="section-title">Навчальна зона</h2>

        <nav class="course-tabs electronics-tabs">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            :class="{ active: activeTab === tab.id }"
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </nav>

        <div class="course-panels">
          <div v-if="activeTab === 'overview'" class="tab-panel active">
            <div class="course-overview-grid">
              <article class="content-panel wide-panel">
                <p class="eyebrow">Банер курсу</p>
                <h3>Комп'ютерна та інженерна графіка</h3>
                <p>
                  Креслення, проєкції, моделювання та інструменти комп'ютерної графіки.
                </p>
              </article>

              <article class="content-panel">
                <h3>Деталі</h3>
                <ul>
                  <li>Тут ви вивчите креслення, проєкції, моделювання та інструменти комп'ютерної й інженерної графіки.</li>
                </ul>
              </article>
            </div>
          </div>

          <div v-if="activeTab === 'materials'" class="tab-panel active">
            <article class="content-panel">
              <h3>Матеріали курсу</h3>

              <div v-if="materials.length" class="materials-list">
                <article
                  v-for="material in materials"
                  :key="material._id"
                  class="content-panel"
                >
                  <p class="eyebrow">
                    {{ material.type || "text" }}
                    <span v-if="material.pinned"> • Закріплено</span>
                  </p>

                  <h4>{{ material.title }}</h4>

                  <p>{{ material.content }}</p>

                  <p v-if="material.deadline">
                    Дедлайн: {{ formatDate(material.deadline) }}
                  </p>

                  <p v-if="material.fileUrl">
  Файл:
  <a :href="fullFileUrl(material.fileUrl)" target="_blank">
    {{ material.fileName || "Відкрити файл" }}
  </a>
</p>

<RouterLink
  class="button primary"
  :to="`/materials/${material._id}`"
>
  Відкрити матеріал
</RouterLink>

<div
  v-if="user.role === 'teacher' || user.role === 'admin'"
  class="teacher-material-actions"
>
                    <button
                      class="button small"
                      type="button"
                      @click="togglePinned(material)"
                    >
                      {{ material.pinned ? "Відкріпити" : "Закріпити" }}
                    </button>

                    <button
                      class="button small danger"
                      type="button"
                      @click="toggleHidden(material)"
                    >
                      {{ material.hidden ? "Показати" : "Приховати" }}
                    </button>
                  </div>
                </article>
              </div>

              <p v-else class="auth-subtitle">Матеріалів поки немає.</p>
            </article>
          </div>

          <div v-if="activeTab === 'quiz'" class="tab-panel active">
            <article class="content-panel">
              <h3>Тести курсу</h3>

              <div v-if="tests.length">
                <article
                  v-for="test in tests"
                  :key="test._id"
                  class="content-panel"
                >
                  <h4>{{ test.title }}</h4>
                  <p>Питань: {{ test.questions?.length || 0 }}</p>
                  <p>Дедлайн: {{ test.deadline || "Не встановлено" }}</p>

                  <RouterLink
                    v-if="user.role === 'student' || studentPreview"
                    class="button primary"
                    :to="testLink(test._id)"
                  >
                    {{ studentPreview ? "Перевірити тест" : "Пройти тест" }}
                  </RouterLink>
                  <p v-else>Увімкніть режим студента через меню профілю, щоб перевірити тест.</p>
                </article>
              </div>

              <p v-else class="auth-subtitle">Тестів поки немає.</p>
            </article>
          </div>

          <div v-if="activeTab === 'progress'" class="tab-panel active">
            <article class="content-panel">
              <h3>Прогрес</h3>

              <div v-if="results.length">
                <article
                  v-for="result in results"
                  :key="result._id"
                  class="content-panel"
                >
                  <h4>{{ result.test?.title || "Тест" }}</h4>

                  <p>
                    Результат:
                    {{ result.score }}/{{ result.maxScore }}
                  </p>

                  <p>
                    Відсоток:
                    {{ result.percentage }}%
                  </p>

                  <p>
                    Статус:
                    {{ result.passed ? "Склав" : "Не склав" }}
                  </p>
                </article>
              </div>

              <p v-else class="auth-subtitle">
                Прогрес буде показано після проходження тестів.
              </p>
            </article>
          </div>

        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import api from "../services/api";
import "../assets/electronics-template.css";

const router = useRouter();

const user = ref({});
const activeTab = ref("overview");
const materials = ref([]);
const tests = ref([]);
const results = ref([]);
const studentPreview = ref(false);
const profileMenuOpen = ref(false);

const isJoined = computed(() => {
  return user.value.joinedCourses?.some((course) => {
    return (
      course.slug === "computer-engineering-graphics" ||
      course === "computer-engineering-graphics" ||
      course.title === "Computer and Engineering Graphics"
    );
  });
});

const canPreview = computed(() => {
  return user.value.role === "teacher" || user.value.role === "admin";
});

const profileInitials = computed(() => {
  return user.value.name?.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "K";
});

const tabs = computed(() => {
  const base = [
    { id: "overview", label: "Огляд" },
    { id: "materials", label: "Матеріали" },
    { id: "quiz", label: "Тести" },
    { id: "progress", label: "Прогрес" }
  ];

  return base;
});

onMounted(async () => {
  try {
    const userRes = await api.get("/users/me");
    user.value = userRes.data;

    await loadMaterials();

    try {
      const testsRes = await api.get("/tests/course/computer-engineering-graphics");
      tests.value = testsRes.data;
    } catch {
      tests.value = [];
    }

    try {
      const resultsRes = await api.get("/results");
      results.value = resultsRes.data.filter((result) => {
        return result.course?.slug === "computer-engineering-graphics";
      });
    } catch {
      results.value = [];
    }
  } catch {
    router.push("/login");
  }
});

async function loadMaterials() {
  try {
    const materialsRes = await api.get("/materials/course/computer-engineering-graphics");
    materials.value = materialsRes.data;
  } catch {
    materials.value = [];
  }
}

async function joinCourse() {
  if (isJoined.value) return;

  try {
    await api.post("/courses/computer-engineering-graphics/enroll");

    const userRes = await api.get("/users/me");
    user.value = userRes.data;

    alert("Ви приєдналися до курсу.");
  } catch (error) {
    alert(error.response?.data?.message || "Не вдалося приєднатися до курсу.");
  }
}

async function togglePinned(material) {
  try {
    await api.put(`/materials/${material._id}`, {
      pinned: !material.pinned
    });

    await loadMaterials();
  } catch {
    alert("Не вдалося змінити закріплення.");
  }
}

async function toggleHidden(material) {
  try {
    await api.put(`/materials/${material._id}`, {
      hidden: !material.hidden
    });

    await loadMaterials();
  } catch {
    alert("Не вдалося змінити видимість.");
  }
}

function fullFileUrl(url) {
  if (!url) return "#";

  if (url.startsWith("http")) {
    return url;
  }

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const baseUrl = apiUrl.replace("/api", "");

  return `${baseUrl}${url}`;
}

function formatDate(value) {
  return new Date(value).toLocaleString("uk-UA");
}

function testLink(testId) {
  if (studentPreview.value) {
    return {
      path: `/tests/${testId}`,
      query: { preview: "1", returnTo: "computer-engineering-graphics" }
    };
  }

  return { path: `/tests/${testId}`, query: { returnTo: "computer-engineering-graphics" } };
}

function toggleStudentPreview() {
  studentPreview.value = !studentPreview.value;
  profileMenuOpen.value = false;
}
</script>

<style scoped>
.course-content {
  display: block !important;
  padding: 40px 24px !important;
  position: relative;
  z-index: 20;
}

.course-tabs {
  display: flex !important;
  flex-wrap: wrap;
  gap: 12px;
  margin: 24px 0;
  position: relative;
  z-index: 30;
}

.course-tabs button {
  display: inline-flex !important;
  padding: 12px 18px;
  border: 1px solid #293244;
  border-radius: 8px;
  background: #111722;
  color: #f4f7fb;
  cursor: pointer;
}

.course-tabs button.active {
  background: #4f8cff;
  color: #061018;
}

.course-panels {
  display: block !important;
  position: relative;
  z-index: 20;
}

.tab-panel {
  display: block !important;
}

.content-panel {
  display: block !important;
  padding: 22px;
  margin-bottom: 18px;
}

.teacher-material-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 12px;
}

.course-user-menu { position: relative; margin-left: auto; }
.profile-trigger { width: 38px; height: 38px; border: 1px solid var(--electric-blue); border-radius: 50%; background: #111722; color: #fff; font-weight: 800; cursor: pointer; }
.profile-menu { position: absolute; top: calc(100% + 10px); right: 0; z-index: 80; display: grid; min-width: 240px; padding: 10px; border: 1px solid rgba(255, 255, 255, .18); border-radius: 8px; background: #111722; box-shadow: 0 16px 36px rgba(0,0,0,.36); }
.profile-menu strong, .profile-menu a, .profile-menu button { padding: 10px; color: #fff; text-align: left; text-decoration: none; font: inherit; }.profile-menu button { border: 0; background: transparent; cursor: pointer; }.profile-menu a:hover, .profile-menu button:hover { background: rgba(255,255,255,.08); }

.electronics-course {
  --electric-orange: #ff5e00;
  --electric-blue: #00b2ff;
  min-height: 100vh;
  overflow: hidden;
  background: #070707;
  color: #fff;
  position: relative;
}

.electronics-bg,
.electronics-grid,
.electronics-glow,
.electronics-shape,
.electric-bug-layer,
.electronics-particles {
  pointer-events: none;
  position: fixed;
}

.electronics-bg {
  inset: 0;
  z-index: 0;
  overflow: hidden;
}

.electronics-grid {
  inset: -20%;
  background-image:
    radial-gradient(circle at 25% 25%, transparent 2%, rgba(255, 94, 0, 0.08) 2%, rgba(255, 94, 0, 0.08) 3%, transparent 3%),
    radial-gradient(circle at 75% 75%, transparent 2%, rgba(0, 178, 255, 0.08) 2%, rgba(0, 178, 255, 0.08) 3%, transparent 3%),
    linear-gradient(rgba(255, 255, 255, 0.045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.045) 1px, transparent 1px);
  background-size: 86px 86px, 86px 86px, 44px 44px, 44px 44px;
  animation: electronics-grid-move 28s linear infinite;
}

.electronics-glow {
  width: 48vw;
  height: 48vw;
  border-radius: 999px;
  filter: blur(58px);
  opacity: 0.34;
}

.glow-warm {
  top: 5%;
  left: -12%;
  background: var(--electric-orange);
  animation: electronics-drift 18s ease-in-out infinite;
}

.glow-cool {
  right: -15%;
  bottom: 4%;
  background: var(--electric-blue);
  animation: electronics-drift 22s ease-in-out infinite reverse;
}

.electronics-shape {
  opacity: 0.22;
}

.electronics-shape.ring {
  width: 280px;
  height: 280px;
  border: 2px solid var(--electric-orange);
  border-radius: 50%;
  top: 16%;
  left: 7%;
  animation: electronics-float 19s ease-in-out infinite;
}

.electronics-shape.chip {
  width: 150px;
  height: 150px;
  border: 2px solid var(--electric-blue);
  right: 12%;
  top: 58%;
  transform: rotate(45deg);
  animation: electronics-float 23s ease-in-out infinite reverse;
}

.electronics-shape.pulse {
  width: 180px;
  height: 180px;
  border: 1px solid rgba(255, 255, 255, 0.28);
  left: 18%;
  bottom: 11%;
  clip-path: polygon(50% 0, 100% 86%, 0 86%);
  animation: electronics-float 21s ease-in-out infinite;
}

.electronics-particles {
  inset: 0;
}

.electric-bug-layer {
  inset: 0;
  mix-blend-mode: screen;
  opacity: 0.72;
}

.electric-bug-layer::before,
.electric-bug-layer::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(transparent 0 48%, rgba(255, 94, 0, 0.12) 49%, transparent 50%),
    repeating-linear-gradient(0deg, transparent 0 7px, rgba(0, 178, 255, 0.045) 7px 8px);
  animation: electric-screen-tear 4.2s steps(2, end) infinite;
}

.electric-bug-layer::after {
  background:
    linear-gradient(90deg, transparent, rgba(0, 178, 255, 0.16), transparent),
    repeating-linear-gradient(90deg, transparent 0 32px, rgba(255, 94, 0, 0.07) 32px 34px);
  clip-path: inset(32% 0 54% 0);
  animation: electric-slice-bug 3.6s steps(3, end) infinite;
}

.electric-bug-layer span {
  --bug: 1;
  position: absolute;
  left: calc((100% / 10) * var(--bug));
  top: calc(8% + (var(--bug) * 8%));
  width: clamp(58px, 8vw, 140px);
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--electric-orange), var(--electric-blue), transparent);
  box-shadow:
    0 0 12px rgba(255, 94, 0, 0.62),
    0 0 18px rgba(0, 178, 255, 0.42);
  transform: translateX(-20vw);
  animation: electric-bug-zap 5.8s steps(4, end) infinite;
  animation-delay: calc(var(--bug) * -0.38s);
}

.electric-bug-layer span:nth-child(1) { --bug: 1; }
.electric-bug-layer span:nth-child(2) { --bug: 2; }
.electric-bug-layer span:nth-child(3) { --bug: 3; }
.electric-bug-layer span:nth-child(4) { --bug: 4; }
.electric-bug-layer span:nth-child(5) { --bug: 5; }
.electric-bug-layer span:nth-child(6) { --bug: 6; }
.electric-bug-layer span:nth-child(7) { --bug: 7; }
.electric-bug-layer span:nth-child(8) { --bug: 8; }
.electric-bug-layer span:nth-child(9) { --bug: 9; }

.electronics-particles span {
  --delay: calc((var(--i, 1) - 1) * -0.85s);
  position: absolute;
  bottom: -24px;
  left: calc((100% / 19) * var(--i, 1));
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--electric-orange);
  box-shadow: 0 0 16px currentColor;
  animation: electronics-particle 16s linear infinite;
  animation-delay: var(--delay);
}

.electronics-particles span:nth-child(even) {
  color: var(--electric-blue);
  background: var(--electric-blue);
}

.electronics-particles span:nth-child(1) { --i: 1; }
.electronics-particles span:nth-child(2) { --i: 2; }
.electronics-particles span:nth-child(3) { --i: 3; }
.electronics-particles span:nth-child(4) { --i: 4; }
.electronics-particles span:nth-child(5) { --i: 5; }
.electronics-particles span:nth-child(6) { --i: 6; }
.electronics-particles span:nth-child(7) { --i: 7; }
.electronics-particles span:nth-child(8) { --i: 8; }
.electronics-particles span:nth-child(9) { --i: 9; }
.electronics-particles span:nth-child(10) { --i: 10; }
.electronics-particles span:nth-child(11) { --i: 11; }
.electronics-particles span:nth-child(12) { --i: 12; }
.electronics-particles span:nth-child(13) { --i: 13; }
.electronics-particles span:nth-child(14) { --i: 14; }
.electronics-particles span:nth-child(15) { --i: 15; }
.electronics-particles span:nth-child(16) { --i: 16; }
.electronics-particles span:nth-child(17) { --i: 17; }
.electronics-particles span:nth-child(18) { --i: 18; }

.platform-topbar {
  z-index: 50;
  border-bottom: 1px solid rgba(255, 94, 0, 0.26);
  background: rgba(7, 7, 7, 0.76);
  backdrop-filter: blur(18px);
  box-shadow: 0 10px 35px rgba(0, 0, 0, 0.32);
}

.brand-mark {
  background: linear-gradient(135deg, var(--electric-orange), var(--electric-blue));
  color: #050505;
  box-shadow: 0 0 24px rgba(255, 94, 0, 0.42);
}

main,
.template-course-hero,
.course-content {
  position: relative;
  z-index: 2;
}

.template-course-hero {
  min-height: 92vh;
  display: grid !important;
  grid-template-columns: minmax(0, 1.05fr) minmax(280px, 0.8fr);
  align-items: center;
  gap: 42px;
  padding: 118px 7vw 54px !important;
  background: transparent !important;
}

.hero-content {
  max-width: 760px;
}

.hero-content h1 {
  margin: 0;
  font-family: "Rajdhani", "Inter", system-ui, sans-serif;
  font-size: clamp(44px, 7vw, 94px);
  line-height: 0.92;
  letter-spacing: 0;
  text-transform: uppercase;
  text-shadow:
    0 0 18px rgba(255, 94, 0, 0.44),
    0 0 42px rgba(0, 178, 255, 0.24);
  animation: electric-title-bug 6s steps(1, end) infinite;
}

.subtitle {
  max-width: 650px;
  color: rgba(255, 255, 255, 0.74);
  font-size: clamp(18px, 2vw, 23px);
  line-height: 1.55;
}

.electronics-hero-visual {
  display: grid;
  place-items: center;
  min-height: 360px;
}

.board-frame {
  position: relative;
  width: min(410px, 78vw);
  aspect-ratio: 1;
  border: 1px solid rgba(0, 178, 255, 0.38);
  border-radius: 8px;
  background:
    linear-gradient(90deg, transparent 49%, rgba(0, 178, 255, 0.22) 50%, transparent 51%),
    linear-gradient(transparent 49%, rgba(255, 94, 0, 0.2) 50%, transparent 51%),
    rgba(6, 11, 12, 0.62);
  box-shadow:
    inset 0 0 45px rgba(0, 178, 255, 0.12),
    0 0 60px rgba(255, 94, 0, 0.2);
  transform: rotate(45deg);
  animation: board-float 8s ease-in-out infinite;
}

.processor-core {
  position: absolute;
  inset: 28%;
  display: grid;
  place-items: center;
  border: 2px solid var(--electric-orange);
  background: rgba(0, 0, 0, 0.64);
  box-shadow:
    0 0 32px rgba(255, 94, 0, 0.42),
    inset 0 0 28px rgba(0, 178, 255, 0.2);
}

.processor-core span {
  position: absolute;
  width: 54%;
  height: 2px;
  background: var(--electric-blue);
  box-shadow: 0 0 14px var(--electric-blue);
  animation: signal-scan 2.8s linear infinite;
}

.processor-core span:nth-child(2) {
  width: 2px;
  height: 54%;
  animation-delay: -0.9s;
}

.processor-core span:nth-child(3) {
  width: 36%;
  animation-delay: -1.8s;
}

.trace,
.node {
  position: absolute;
  display: block;
}

.trace {
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--electric-orange), var(--electric-blue), transparent);
  box-shadow: 0 0 12px var(--electric-blue);
  animation: trace-flow 3.4s linear infinite;
}

.trace-a {
  top: 22%;
  left: 8%;
  width: 60%;
}

.trace-b {
  right: 10%;
  bottom: 28%;
  width: 58%;
  transform: rotate(90deg);
}

.trace-c {
  left: 20%;
  bottom: 18%;
  width: 68%;
}

.node {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 0 22px var(--electric-orange);
  animation: node-pulse 1.8s ease-in-out infinite;
}

.node-a { top: 19%; left: 9%; }
.node-b { top: 60%; right: 13%; animation-delay: -0.55s; }
.node-c { bottom: 15%; left: 20%; animation-delay: -1.1s; }

.cta-container {
  grid-column: 1 / -1;
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  justify-content: center;
}

.cta-button,
.button {
  border-radius: 6px !important;
  border: 1px solid rgba(255, 255, 255, 0.2);
  text-transform: uppercase;
  letter-spacing: 0;
  transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
}

.cta-primary,
.button.primary {
  background: linear-gradient(135deg, var(--electric-orange), #ff9a3d) !important;
  color: #080808 !important;
  box-shadow: 0 0 24px rgba(255, 94, 0, 0.34);
}

.cta-secondary,
.button.ghost {
  background: rgba(0, 178, 255, 0.08) !important;
  color: #fff !important;
  border-color: rgba(0, 178, 255, 0.42) !important;
}

.cta-button:hover,
.button:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 28px rgba(0, 178, 255, 0.28);
}

.course-content {
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto 80px;
  padding: 42px 0 70px !important;
}

.section-title {
  color: #fff;
  font-family: "Rajdhani", "Inter", system-ui, sans-serif;
  font-size: clamp(30px, 4vw, 54px);
  text-transform: uppercase;
  text-shadow: 0 0 24px rgba(0, 178, 255, 0.28);
}

.course-tabs {
  top: 76px;
  padding: 12px;
  border: 1px solid rgba(255, 94, 0, 0.24);
  border-radius: 8px;
  background: rgba(7, 7, 7, 0.78);
  backdrop-filter: blur(18px);
}

.course-tabs button {
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0 18px;
  border-color: rgba(0, 178, 255, 0.22);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.84);
}

.course-tabs button.active {
  border-color: var(--electric-orange);
  background: linear-gradient(135deg, rgba(255, 94, 0, 0.88), rgba(0, 178, 255, 0.74));
  color: #050505;
  box-shadow: 0 0 26px rgba(255, 94, 0, 0.3);
}

.course-overview-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(260px, 0.6fr);
  gap: 18px;
}

.content-panel {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.13);
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(255, 94, 0, 0.11), transparent 36%),
    linear-gradient(315deg, rgba(0, 178, 255, 0.1), transparent 36%),
    rgba(7, 10, 12, 0.82);
  box-shadow: 0 18px 54px rgba(0, 0, 0, 0.24);
  animation: panel-rise 420ms ease both;
}

.content-panel::before {
  content: "";
  position: absolute;
  inset: 0;
  border-top: 1px solid rgba(255, 255, 255, 0.18);
  background: linear-gradient(90deg, transparent, rgba(255, 94, 0, 0.14), transparent);
  transform: translateX(-100%);
  animation: panel-sheen 5.5s ease-in-out infinite;
}

.content-panel > * {
  position: relative;
  z-index: 1;
}

.content-panel h3,
.content-panel h4 {
  color: #fff;
  letter-spacing: 0;
}

.content-panel p,
.content-panel li,
.auth-subtitle {
  color: rgba(255, 255, 255, 0.72);
}

.eyebrow {
  color: var(--electric-blue);
}

@keyframes electronics-grid-move {
  to { transform: translate3d(86px, 86px, 0); }
}

@keyframes electronics-drift {
  50% { transform: translate3d(9vw, 5vh, 0) scale(1.16); }
}

@keyframes electronics-float {
  0%, 100% { transform: translateY(0) rotate(0deg) scale(1); }
  50% { transform: translateY(-28px) rotate(180deg) scale(1.08); }
}

@keyframes electronics-particle {
  from { transform: translateY(0); opacity: 0; }
  12% { opacity: 0.82; }
  to { transform: translateY(-110vh); opacity: 0; }
}

@keyframes electric-screen-tear {
  0%, 72%, 100% { transform: translateY(0); opacity: 0.18; clip-path: inset(0 0 0 0); }
  74% { transform: translateY(-10px); opacity: 0.44; clip-path: inset(18% 0 68% 0); }
  76% { transform: translateY(8px); opacity: 0.3; clip-path: inset(64% 0 21% 0); }
  78% { transform: translateY(0); opacity: 0.18; clip-path: inset(0 0 0 0); }
}

@keyframes electric-slice-bug {
  0%, 58%, 100% { transform: translateX(0); opacity: 0; }
  61% { transform: translateX(-26px); opacity: 0.7; }
  64% { transform: translateX(38px); opacity: 0.34; }
  67% { transform: translateX(0); opacity: 0; }
}

@keyframes electric-bug-zap {
  0%, 68%, 100% { transform: translateX(-20vw) scaleX(0.2); opacity: 0; }
  70% { transform: translateX(4vw) scaleX(1); opacity: 0.86; }
  74% { transform: translateX(16vw) scaleX(0.55); opacity: 0.32; }
  76% { transform: translateX(26vw) scaleX(1.15); opacity: 0.76; }
  80% { transform: translateX(42vw) scaleX(0.15); opacity: 0; }
}

@keyframes electric-title-bug {
  0%, 86%, 100% { transform: translateX(0); filter: none; }
  88% { transform: translateX(2px) skewX(-2deg); filter: drop-shadow(-4px 0 var(--electric-orange)); }
  90% { transform: translateX(-3px) skewX(2deg); filter: drop-shadow(4px 0 var(--electric-blue)); }
  92% { transform: translateX(0); filter: none; }
}

@keyframes board-float {
  0%, 100% { transform: rotate(45deg) translateY(0); }
  50% { transform: rotate(45deg) translateY(-16px); }
}

@keyframes signal-scan {
  0%, 100% { opacity: 0.25; transform: scaleX(0.35); }
  50% { opacity: 1; transform: scaleX(1); }
}

@keyframes trace-flow {
  0% { opacity: 0.22; filter: hue-rotate(0deg); }
  50% { opacity: 1; filter: hue-rotate(70deg); }
  100% { opacity: 0.22; filter: hue-rotate(0deg); }
}

@keyframes node-pulse {
  50% { transform: scale(1.45); opacity: 0.58; }
}

@keyframes panel-rise {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes panel-sheen {
  0%, 55% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

@media (max-width: 820px) {
  .template-course-hero {
    grid-template-columns: 1fr;
    min-height: auto;
    padding-top: 104px !important;
  }

  .electronics-hero-visual {
    min-height: 260px;
  }

  .course-overview-grid {
    grid-template-columns: 1fr;
  }

  .course-tabs {
    position: relative;
    top: auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
  }
}

.course-tabs {
  position: relative !important;
  top: auto !important;
  z-index: 4 !important;
}

.course-panels,
.tab-panel {
  position: relative;
  z-index: 8;
  margin-top: 28px;
}

.computer-engineering-graphics-course { --electric-orange: #ff70a6; --electric-blue: #70d6ff; }

.computer-engineering-graphics-course .electronics-grid {
  background-size: 40px 40px;
  background-image: linear-gradient(30deg, rgba(255, 112, 166, 0.18) 1px, transparent 1px), linear-gradient(150deg, rgba(112, 214, 255, 0.18) 1px, transparent 1px);
  transform: skewY(-8deg);
  animation: graphics-drafting-slide 10s linear infinite;
}
.computer-engineering-graphics-course .electronics-shape.ring { border-radius: 0; transform: rotate(30deg); }
.computer-engineering-graphics-course .electronics-shape.chip { border-radius: 0; transform: rotate(-18deg); }
@keyframes graphics-drafting-slide { to { background-position: 40px 40px, -40px 40px; } }


.computer-engineering-graphics-course,
.computer-engineering-graphics-course h1,
.computer-engineering-graphics-course h2,
.computer-engineering-graphics-course h3,
.computer-engineering-graphics-course h4,
.computer-engineering-graphics-course p,
.computer-engineering-graphics-course button,
.computer-engineering-graphics-course a {
  font-family: "Segoe UI", Arial, sans-serif !important;
  letter-spacing: 0 !important;
}
.computer-engineering-graphics-course .electronics-hero-visual { isolation: isolate; }
.computer-engineering-graphics-course .board-frame { opacity: 0.16; filter: saturate(0.6); }
.computer-engineering-graphics-course .course-signature { position: absolute; inset: 10%; z-index: 4; pointer-events: none; }

.computer-engineering-graphics-course { background: #1a0913; color: #fff4fa; }
.computer-engineering-graphics-course .course-signature { overflow: hidden; padding: 8%; border: 1px solid rgba(112, 214, 255, .76); background: linear-gradient(90deg, rgba(112,214,255,.09) 1px, transparent 1px), linear-gradient(rgba(255,112,166,.09) 1px, transparent 1px); background-size: 18px 18px; }
.computer-engineering-graphics-course .course-signature span { position: absolute; width: 140%; height: 2px; left: -20%; top: 50%; background: #ff70a6; transform: rotate(28deg); box-shadow: 0 0 12px rgba(255,112,166,.65); animation: graphics-drafter-line 5s linear infinite; }
.computer-engineering-graphics-course .course-signature span:nth-child(2n) { transform: rotate(-28deg); background: #70d6ff; animation-delay: .45s; }
.computer-engineering-graphics-course .course-tabs button { border-radius: 0; clip-path: polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%); }
.computer-engineering-graphics-course .content-panel { border-radius: 0; }
@keyframes graphics-drafter-line { 0% { translate: -24% -30%; opacity: .15; } 50% { opacity: 1; } 100% { translate: 24% 30%; opacity: .15; } }

</style>

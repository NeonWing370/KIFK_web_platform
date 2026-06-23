<template>
  <div class="course-shell logic-course cyber-course-page">
    <div class="logic-bg" aria-hidden="true">
      <div class="logic-gradient"></div>
      <div class="logic-grid"></div>
      <div class="nexus-orb orb-primary"></div>
      <div class="nexus-orb orb-secondary"></div>
      <div class="nexus-ring ring-one"></div>
      <div class="nexus-ring ring-two"></div>
      <div class="logic-particles">
        <span v-for="particle in 20" :key="particle"></span>
      </div>
      <div class="logic-rain">
        <span v-for="column in 16" :key="column">1010011010</span>
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
          <h1>Комп'ютерна логіка</h1>
          <p class="subtitle">
            Булева алгебра, таблиці істинності, логічні вентилі та двійкові системи.
          </p>
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

        <nav class="course-tabs logic-tabs">
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
                <h3>Комп'ютерна логіка</h3>
                <p>
                  Булева алгебра, таблиці істинності, логічні вентилі та двійкові системи.
                </p>
              </article>

              <article class="content-panel">
                <h3>Деталі</h3>
                <ul>
                  <li>Тут ви вивчите двійкову систему числення, булеву алгебру та принципи роботи логічних елементів.</li>
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
import "../assets/logic-template.css";

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
      course.slug === "logic" ||
      course === "logic" ||
      course.title === "Computer Logic"
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
      const testsRes = await api.get("/tests/course/logic");
      tests.value = testsRes.data;
    } catch {
      tests.value = [];
    }

    try {
      const resultsRes = await api.get("/results");
      results.value = resultsRes.data.filter((result) => {
        return result.course?.slug === "logic";
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
    const materialsRes = await api.get("/materials/course/logic");
    materials.value = materialsRes.data;
  } catch {
    materials.value = [];
  }
}

async function joinCourse() {
  if (isJoined.value) return;

  try {
    await api.post("/courses/logic/enroll");

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
      query: { preview: "1", returnTo: "logic" }
    };
  }

  return { path: `/tests/${testId}`, query: { returnTo: "logic" } };
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
.profile-trigger { width: 38px; height: 38px; border: 1px solid var(--logic-cyan); border-radius: 50%; background: #111722; color: #fff; font-weight: 800; cursor: pointer; }
.profile-menu { position: absolute; top: calc(100% + 10px); right: 0; z-index: 80; display: grid; min-width: 240px; padding: 10px; border: 1px solid rgba(255, 255, 255, .18); border-radius: 8px; background: #111722; box-shadow: 0 16px 36px rgba(0,0,0,.36); }
.profile-menu strong, .profile-menu a, .profile-menu button { padding: 10px; color: #fff; text-align: left; text-decoration: none; font: inherit; }.profile-menu button { border: 0; background: transparent; cursor: pointer; }.profile-menu a:hover, .profile-menu button:hover { background: rgba(255,255,255,.08); }

.logic-course {
  --logic-cyan: #00ffff;
  --logic-pink: #ff00ff;
  --logic-purple: #7c3aed;
  --logic-orange: #f97316;
  min-height: 100vh;
  overflow: hidden;
  position: relative;
  background: #0f051a;
  color: #fff;
  font-family: "JetBrains Mono", "Fira Code", ui-monospace, monospace;
}

.logic-bg,
.logic-gradient,
.logic-grid,
.nexus-orb,
.nexus-ring,
.logic-particles,
.logic-rain {
  pointer-events: none;
  position: fixed;
}

.logic-bg {
  inset: 0;
  z-index: 0;
  overflow: hidden;
  background: #0f051a;
}

.logic-gradient {
  inset: -50%;
  background:
    radial-gradient(circle at 20% 30%, rgba(0, 255, 255, 0.16), transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(255, 0, 255, 0.15), transparent 50%),
    radial-gradient(circle at 40% 80%, rgba(124, 58, 237, 0.16), transparent 48%),
    radial-gradient(circle at 60% 20%, rgba(249, 115, 22, 0.14), transparent 45%);
  filter: blur(38px);
  animation: logic-gradient-spin 30s linear infinite;
}

.logic-grid {
  inset: 0;
  background-image:
    linear-gradient(rgba(0, 255, 255, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 0, 255, 0.06) 1px, transparent 1px);
  background-size: 56px 56px;
  mask-image: linear-gradient(to bottom, transparent, #000 16%, #000 84%, transparent);
  animation: logic-grid-slide 18s linear infinite;
}

.nexus-orb {
  width: clamp(220px, 32vw, 460px);
  height: clamp(220px, 32vw, 460px);
  border-radius: 50%;
  background:
    radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.4), transparent 16%),
    radial-gradient(circle, rgba(0, 255, 255, 0.22), rgba(255, 0, 255, 0.12) 46%, transparent 68%);
  filter: blur(1px);
  opacity: 0.72;
  animation: nexus-orb-drift 18s ease-in-out infinite;
}

.orb-primary {
  right: 8%;
  top: 18%;
}

.orb-secondary {
  left: -7%;
  bottom: 8%;
  width: clamp(180px, 25vw, 340px);
  height: clamp(180px, 25vw, 340px);
  background:
    radial-gradient(circle, rgba(249, 115, 22, 0.2), rgba(124, 58, 237, 0.16) 42%, transparent 70%);
  animation-duration: 22s;
  animation-direction: reverse;
}

.nexus-ring {
  width: clamp(260px, 34vw, 520px);
  height: clamp(260px, 34vw, 520px);
  border: 1px solid rgba(0, 255, 255, 0.22);
  border-radius: 50%;
  box-shadow:
    inset 0 0 32px rgba(255, 0, 255, 0.08),
    0 0 32px rgba(0, 255, 255, 0.08);
  animation: nexus-ring-spin 26s linear infinite;
}

.ring-one {
  right: 5%;
  top: 12%;
}

.ring-two {
  left: 12%;
  top: 42%;
  width: clamp(170px, 22vw, 310px);
  height: clamp(170px, 22vw, 310px);
  border-color: rgba(255, 0, 255, 0.2);
  animation-direction: reverse;
}

.logic-particles {
  inset: 0;
  overflow: hidden;
}

.logic-particles span {
  --dot: 1;
  position: absolute;
  left: calc((100% / 21) * var(--dot));
  top: calc(12% + (var(--dot) * 3.6%));
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--logic-cyan);
  box-shadow: 0 0 16px currentColor;
  opacity: 0.58;
  animation: nexus-particle-drift 13s ease-in-out infinite;
  animation-delay: calc(var(--dot) * -0.3s);
}

.logic-particles span:nth-child(2n) {
  color: var(--logic-pink);
  background: var(--logic-pink);
}

.logic-particles span:nth-child(3n) {
  color: var(--logic-orange);
  background: var(--logic-orange);
}

.logic-particles span:nth-child(1) { --dot: 1; }
.logic-particles span:nth-child(2) { --dot: 2; }
.logic-particles span:nth-child(3) { --dot: 3; }
.logic-particles span:nth-child(4) { --dot: 4; }
.logic-particles span:nth-child(5) { --dot: 5; }
.logic-particles span:nth-child(6) { --dot: 6; }
.logic-particles span:nth-child(7) { --dot: 7; }
.logic-particles span:nth-child(8) { --dot: 8; }
.logic-particles span:nth-child(9) { --dot: 9; }
.logic-particles span:nth-child(10) { --dot: 10; }
.logic-particles span:nth-child(11) { --dot: 11; }
.logic-particles span:nth-child(12) { --dot: 12; }
.logic-particles span:nth-child(13) { --dot: 13; }
.logic-particles span:nth-child(14) { --dot: 14; }
.logic-particles span:nth-child(15) { --dot: 15; }
.logic-particles span:nth-child(16) { --dot: 16; }
.logic-particles span:nth-child(17) { --dot: 17; }
.logic-particles span:nth-child(18) { --dot: 18; }
.logic-particles span:nth-child(19) { --dot: 19; }
.logic-particles span:nth-child(20) { --dot: 20; }

.logic-rain {
  inset: 0;
  opacity: 0.16;
  overflow: hidden;
}

.logic-rain span {
  --col: 1;
  position: absolute;
  top: -120%;
  left: calc((100% / 17) * var(--col));
  color: var(--logic-cyan);
  font-size: 14px;
  writing-mode: vertical-rl;
  text-orientation: upright;
  text-shadow: 0 0 8px currentColor;
  animation: logic-rain-fall 12s linear infinite;
  animation-delay: calc(var(--col) * -0.7s);
}

.logic-rain span:nth-child(2n) {
  color: var(--logic-pink);
}

.logic-rain span:nth-child(1) { --col: 1; }
.logic-rain span:nth-child(2) { --col: 2; }
.logic-rain span:nth-child(3) { --col: 3; }
.logic-rain span:nth-child(4) { --col: 4; }
.logic-rain span:nth-child(5) { --col: 5; }
.logic-rain span:nth-child(6) { --col: 6; }
.logic-rain span:nth-child(7) { --col: 7; }
.logic-rain span:nth-child(8) { --col: 8; }
.logic-rain span:nth-child(9) { --col: 9; }
.logic-rain span:nth-child(10) { --col: 10; }
.logic-rain span:nth-child(11) { --col: 11; }
.logic-rain span:nth-child(12) { --col: 12; }
.logic-rain span:nth-child(13) { --col: 13; }
.logic-rain span:nth-child(14) { --col: 14; }
.logic-rain span:nth-child(15) { --col: 15; }
.logic-rain span:nth-child(16) { --col: 16; }

.platform-topbar {
  z-index: 50;
  border-bottom: 1px solid rgba(0, 255, 255, 0.24);
  background: rgba(15, 5, 26, 0.78);
  backdrop-filter: blur(18px);
  box-shadow: 0 10px 36px rgba(0, 0, 0, 0.3);
}

.brand-mark {
  background: linear-gradient(135deg, var(--logic-cyan), var(--logic-pink));
  color: #08030d;
  box-shadow: 0 0 24px rgba(0, 255, 255, 0.38);
}

main,
.template-course-hero,
.course-content {
  position: relative;
  z-index: 2;
}

.template-course-hero {
  min-height: 88vh;
  display: flex !important;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 28px;
  padding: 118px 7vw 54px !important;
  background: transparent !important;
  text-align: center;
}

.hero-content {
  max-width: 940px;
}

.hero-content h1 {
  margin: 0;
  font-size: clamp(42px, 6.6vw, 88px);
  line-height: 0.98;
  letter-spacing: 0;
  text-transform: uppercase;
  text-shadow:
    0 0 16px rgba(0, 255, 255, 0.45),
    0 0 42px rgba(255, 0, 255, 0.28);
  animation: logic-glitch 5s ease-in-out infinite;
}

.subtitle {
  max-width: 760px;
  margin-inline: auto;
  color: rgba(255, 255, 255, 0.74);
  font-size: clamp(17px, 1.8vw, 22px);
  line-height: 1.7;
}

.logic-hero-visual {
  display: grid;
  place-items: center;
  min-height: 360px;
}

.logic-gate {
  position: relative;
  width: min(430px, 82vw);
  aspect-ratio: 1.12;
  border: 1px solid rgba(0, 255, 255, 0.26);
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(0, 255, 255, 0.08), transparent 36%),
    linear-gradient(315deg, rgba(255, 0, 255, 0.08), transparent 36%),
    rgba(13, 5, 23, 0.78);
  box-shadow:
    inset 0 0 42px rgba(124, 58, 237, 0.2),
    0 0 56px rgba(0, 255, 255, 0.16);
  animation: logic-float 8s ease-in-out infinite;
}

.gate-core {
  position: absolute;
  inset: 26% 24%;
  display: grid;
  place-items: center;
  border: 2px solid var(--logic-cyan);
  border-radius: 999px 8px 8px 999px;
  border-right-color: var(--logic-pink);
  color: #fff;
  font-size: clamp(24px, 4vw, 42px);
  font-weight: 800;
  text-shadow: 0 0 16px var(--logic-cyan);
  box-shadow:
    0 0 26px rgba(0, 255, 255, 0.28),
    inset 0 0 30px rgba(255, 0, 255, 0.12);
}

.input-line,
.output-line {
  position: absolute;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--logic-cyan), var(--logic-pink));
  box-shadow: 0 0 14px currentColor;
  animation: logic-signal 2.6s linear infinite;
}

.line-a {
  top: 37%;
  left: 5%;
  width: 28%;
}

.line-b {
  top: 63%;
  left: 5%;
  width: 28%;
  animation-delay: -0.7s;
}

.output-line {
  top: 50%;
  right: 5%;
  width: 30%;
  animation-delay: -1.3s;
}

.logic-bit {
  position: absolute;
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.42);
  color: var(--logic-cyan);
  text-shadow: 0 0 12px currentColor;
  animation: logic-bit-pulse 2.4s ease-in-out infinite;
}

.bit-a { left: 11%; top: 25%; }
.bit-b { left: 11%; bottom: 23%; color: var(--logic-pink); animation-delay: -0.8s; }
.bit-c { right: 12%; top: 39%; color: #fff; animation-delay: -1.6s; }

.cta-container {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  justify-content: center;
}

.cta-button,
.button {
  border-radius: 6px !important;
  border: 1px solid rgba(255, 255, 255, 0.2);
  letter-spacing: 0;
  transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
}

.cta-primary,
.button.primary {
  background: linear-gradient(135deg, var(--logic-cyan), var(--logic-pink)) !important;
  color: #0d0517 !important;
  box-shadow: 0 0 24px rgba(0, 255, 255, 0.3);
}

.cta-secondary,
.button.ghost {
  background: rgba(124, 58, 237, 0.12) !important;
  color: #fff !important;
  border-color: rgba(255, 0, 255, 0.38) !important;
}

.cta-button:hover,
.button:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 28px rgba(255, 0, 255, 0.24);
}

.course-content {
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto 80px;
  padding: 42px 0 70px !important;
}

.section-title {
  color: #fff;
  font-size: clamp(28px, 3.8vw, 50px);
  text-transform: uppercase;
  text-shadow: 0 0 24px rgba(255, 0, 255, 0.24);
}

.course-tabs {
  top: 76px;
  padding: 12px;
  border: 1px solid rgba(0, 255, 255, 0.22);
  border-radius: 8px;
  background: rgba(15, 5, 26, 0.8);
  backdrop-filter: blur(18px);
}

.course-tabs button {
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0 18px;
  border-color: rgba(255, 0, 255, 0.24);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.84);
}

.course-tabs button.active {
  border-color: var(--logic-cyan);
  background: linear-gradient(135deg, rgba(0, 255, 255, 0.9), rgba(255, 0, 255, 0.76));
  color: #0f051a;
  box-shadow: 0 0 26px rgba(0, 255, 255, 0.28);
}

.course-overview-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(260px, 0.6fr);
  gap: 18px;
}

.content-panel {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(229, 231, 235, 0.18);
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(0, 255, 255, 0.08), transparent 36%),
    linear-gradient(315deg, rgba(255, 0, 255, 0.08), transparent 36%),
    rgba(20, 9, 34, 0.84);
  box-shadow: 0 18px 54px rgba(0, 0, 0, 0.28);
  animation: logic-panel-rise 420ms ease both;
}

.content-panel::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.14), transparent),
    repeating-linear-gradient(90deg, transparent 0 22px, rgba(255, 255, 255, 0.035) 22px 23px);
  transform: translateX(-100%);
  animation: logic-panel-scan 5.8s ease-in-out infinite;
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
  color: var(--logic-cyan);
}

@keyframes logic-gradient-spin {
  0% { transform: rotate(0deg) scale(1); }
  50% { transform: rotate(180deg) scale(1.12); }
  100% { transform: rotate(360deg) scale(1); }
}

@keyframes logic-grid-slide {
  to { transform: translate3d(56px, 56px, 0); }
}

@keyframes nexus-orb-drift {
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  50% { transform: translate3d(-5vw, 4vh, 0) scale(1.08); }
}

@keyframes nexus-ring-spin {
  to { transform: rotate(360deg); }
}

@keyframes nexus-particle-drift {
  0%, 100% { transform: translate3d(0, 0, 0); opacity: 0.22; }
  45% { transform: translate3d(18px, -34px, 0); opacity: 0.72; }
  70% { transform: translate3d(-24px, 18px, 0); opacity: 0.44; }
}

@keyframes logic-rain-fall {
  to { transform: translateY(240vh); }
}

@keyframes logic-glitch {
  0%, 92%, 100% { transform: translateX(0); text-shadow: 0 0 16px rgba(0, 255, 255, 0.45), 0 0 42px rgba(255, 0, 255, 0.28); }
  94% { transform: translateX(2px); text-shadow: -2px 0 var(--logic-pink), 2px 0 var(--logic-cyan); }
  96% { transform: translateX(-2px); }
}

@keyframes logic-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-16px); }
}

@keyframes logic-signal {
  0%, 100% { opacity: 0.25; transform: scaleX(0.42); }
  50% { opacity: 1; transform: scaleX(1); }
}

@keyframes logic-bit-pulse {
  50% { transform: scale(1.12); box-shadow: 0 0 24px currentColor; }
}

@keyframes logic-panel-rise {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes logic-panel-scan {
  0%, 55% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

@media (max-width: 820px) {
  .template-course-hero {
    grid-template-columns: 1fr;
    min-height: auto;
    padding-top: 104px !important;
  }

  .logic-hero-visual {
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
</style>

<template>
  <div class="material-page">
    <aside class="material-sidebar">
      <RouterLink class="sidebar-link" to="/dashboard">Панель</RouterLink>
      <RouterLink class="sidebar-link" to="/profile">Профіль</RouterLink>
      <RouterLink class="sidebar-link" to="/teacher-materials">Матеріали</RouterLink>
      <RouterLink class="sidebar-link" to="/teacher-gradebook">Журнал оцінок</RouterLink>
    </aside>

    <main class="material-main">
      <header class="dashboard-topbar">
        <h1>Матеріал</h1>
        <span class="user-chip">{{ user.name }} | {{ user.role }}</span>
      </header>

      <section class="content-panel">
        <p class="eyebrow">
          {{ typeLabel(material.type) }}
          <span v-if="material.course"> • {{ material.course.title }}</span>
        </p>

        <h2>{{ material.title }}</h2>
        <p>{{ material.content }}</p>

        <p v-if="material.deadline">
          Дедлайн:
          <strong>{{ formatDate(material.deadline) }}</strong>
        </p>

        <p v-if="material.fileUrl">
          Файл:
          <a :href="fullFileUrl(material.fileUrl)" target="_blank" rel="noreferrer">
            {{ material.fileName || "Відкрити файл" }}
          </a>
        </p>

        <RouterLink
          v-if="material.course?.slug"
          class="button ghost"
          :to="'/courses/' + material.course.slug"
        >
          Назад до курсу
        </RouterLink>
      </section>

      <section
        v-if="material.type === 'practice' && user.role === 'student'"
        class="content-panel"
      >
        <div class="section-heading">
          <div>
            <p class="eyebrow">Практична робота</p>
            <h3>Здати роботу</h3>
          </div>
          <span v-if="mySubmission" class="status-badge" :class="mySubmission.status">
            {{ mySubmission.status === 'checked' ? "Перевірено" : "Здано" }}
          </span>
        </div>

        <div v-if="mySubmission" class="submission-summary">
          <p>
            Оцінка:
            <strong>{{ mySubmission.grade == null ? "—" : mySubmission.grade + "/12" }}</strong>
          </p>
          <p v-if="mySubmission.grade == null" class="auth-subtitle">
            Робота ще не оцінена. У журналі вона тимчасово рахується як 0.
          </p>
          <p v-if="mySubmission.feedback">
            Відгук викладача: {{ mySubmission.feedback }}
          </p>
        </div>

        <form class="form" @submit.prevent="submitPractice">
          <label>
            Коментар до роботи
            <textarea v-model="submissionText" placeholder="Додайте коментар до здачі..."></textarea>
          </label>

          <label>
            Файл роботи
            <input type="file" @change="handleFileChange" />
          </label>

          <p v-if="selectedFileName">Обрано файл: {{ selectedFileName }}</p>

          <button class="button primary" type="submit">
            {{ mySubmission ? "Оновити здачу" : "Надіслати роботу" }}
          </button>
        </form>

        <p v-if="message" class="message">{{ message }}</p>
      </section>

      <section
        v-if="material.type === 'practice' && canGrade"
        class="content-panel"
      >
        <div class="section-heading">
          <div>
            <p class="eyebrow">Перевірка</p>
            <h3>Здані роботи студентів</h3>
          </div>
          <button class="button ghost" type="button" @click="loadSubmissions">Оновити</button>
        </div>

        <article v-for="submission in submissions" :key="submission._id" class="submission-card">
          <div class="submission-head">
            <div>
              <h4>{{ submission.student?.name || "Студент" }}</h4>
              <p>{{ submission.student?.email }}</p>
            </div>
            <span class="status-badge" :class="submission.status">
              {{ submission.status === 'checked' ? "Перевірено" : "Очікує перевірки" }}
            </span>
          </div>

          <p v-if="submission.text">Коментар: {{ submission.text }}</p>
          <p v-if="submission.fileUrl">
            Файл:
            <a :href="fullFileUrl(submission.fileUrl)" target="_blank" rel="noreferrer">
              {{ submission.fileName || "Відкрити файл" }}
            </a>
          </p>

          <div class="grade-form">
            <label>
              Оцінка (1–12)
              <input v-model.number="gradeInputs[submission._id]" type="number" min="1" max="12" step="1" />
            </label>
            <label>
              Відгук викладача
              <textarea v-model="feedbackInputs[submission._id]" placeholder="Короткий коментар до оцінки"></textarea>
            </label>
            <button class="button primary" type="button" @click="checkSubmission(submission)">Зберегти оцінку</button>
          </div>
        </article>

        <p v-if="!submissions.length" class="auth-subtitle">Робіт поки не здано.</p>
        <p v-if="teacherMessage" class="message">{{ teacherMessage }}</p>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "../services/api";

const route = useRoute();
const router = useRouter();
const user = ref({});
const material = ref({});
const submissions = ref([]);
const mySubmission = ref(null);
const selectedFile = ref(null);
const selectedFileName = ref("");
const submissionText = ref("");
const message = ref("");
const teacherMessage = ref("");
const gradeInputs = ref({});
const feedbackInputs = ref({});

const canGrade = computed(() => user.value.role === "teacher" || user.value.role === "admin");

onMounted(async () => {
  try {
    const [userRes, materialRes] = await Promise.all([
      api.get("/users/me"),
      api.get("/materials/" + route.params.id)
    ]);
    user.value = userRes.data;
    material.value = materialRes.data;

    if (material.value.type === "practice") {
      if (canGrade.value) await loadSubmissions();
      if (user.value.role === "student") await loadMySubmission();
    }
  } catch {
    router.push("/dashboard");
  }
});

async function loadMySubmission() {
  try {
    const res = await api.get("/submissions/my");
    mySubmission.value = res.data.find((item) => String(item.material?._id || item.material) === String(route.params.id)) || null;
    if (mySubmission.value) submissionText.value = mySubmission.value.text || "";
  } catch {
    mySubmission.value = null;
  }
}

async function loadSubmissions() {
  try {
    const res = await api.get("/submissions/material/" + route.params.id);
    submissions.value = res.data;
    gradeInputs.value = Object.fromEntries(res.data.map((item) => [item._id, item.grade ?? ""]));
    feedbackInputs.value = Object.fromEntries(res.data.map((item) => [item._id, item.feedback || ""]));
  } catch {
    submissions.value = [];
  }
}

function handleFileChange(event) {
  const file = event.target.files?.[0];
  selectedFile.value = file || null;
  selectedFileName.value = file?.name || "";
}

async function submitPractice() {
  message.value = "";
  try {
    const formData = new FormData();
    formData.append("text", submissionText.value);
    if (selectedFile.value) formData.append("file", selectedFile.value);

    await api.post("/submissions/material/" + route.params.id, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    selectedFile.value = null;
    selectedFileName.value = "";
    message.value = "Роботу здано. Після повторної здачі оцінка чекатиме на нову перевірку.";
    await loadMySubmission();
  } catch (error) {
    message.value = error.response?.data?.message || "Не вдалося надіслати роботу.";
  }
}

async function checkSubmission(submission) {
  const grade = Number(gradeInputs.value[submission._id]);
  if (!Number.isInteger(grade) || grade < 1 || grade > 12) {
    teacherMessage.value = "Оцінка має бути цілим числом від 1 до 12.";
    return;
  }
  try {
    await api.put("/submissions/" + submission._id + "/check", {
      grade,
      feedback: feedbackInputs.value[submission._id] || ""
    });
    teacherMessage.value = "Оцінку збережено.";
    await loadSubmissions();
  } catch (error) {
    teacherMessage.value = error.response?.data?.message || "Не вдалося зберегти оцінку.";
  }
}

function typeLabel(type) {
  return { text: "Матеріал", file: "Файл", event: "Подія", practice: "Практична робота" }[type] || "Матеріал";
}

function fullFileUrl(url) {
  if (!url) return "#";
  if (url.startsWith("http")) return url;
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  return apiUrl.replace("/api", "") + url;
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString("uk-UA") : "Не вказано";
}
</script>

<style scoped>
.material-page { display: flex; min-height: 100vh; }
.material-sidebar { width: 280px; min-width: 280px; padding: 20px; border-right: 1px solid #293244; background: #111722; }
.material-main { flex: 1; min-width: 0; }
.content-panel { display: block; margin: 28px; padding: 24px; border: 1px solid #293244; border-radius: 8px; background: #111722; }
.section-heading, .submission-head { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; }
.section-heading h3, .submission-head h4 { margin: 0; }
.section-heading p, .submission-head p { margin: 4px 0 0; }
.form, .grade-form { display: grid; gap: 16px; }
label { display: grid; gap: 8px; }
input, textarea { width: 100%; min-height: 42px; padding: 10px; border: 1px solid #293244; border-radius: 6px; background: #090312; color: #f4f7fb; }
textarea { min-height: 96px; resize: vertical; }
.submission-card, .submission-summary { margin-top: 16px; padding: 16px; border: 1px solid #293244; border-radius: 6px; background: #090312; }
.status-badge { display: inline-flex; align-items: center; min-height: 28px; padding: 0 10px; border: 1px solid #f59e0b; border-radius: 999px; color: #fde68a; background: rgba(245, 158, 11, .12); font-size: 13px; font-weight: 700; }
.status-badge.checked { border-color: #22c55e; color: #bbf7d0; background: rgba(34, 197, 94, .12); }
@media (max-width: 800px) { .material-page { display: block; } .material-sidebar { width: 100%; min-width: 0; } .content-panel { margin: 16px; } .section-heading, .submission-head { flex-direction: column; } }
</style>

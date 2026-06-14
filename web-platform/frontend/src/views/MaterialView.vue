<template>
  <div class="material-page">
    <aside class="material-sidebar">
      <RouterLink class="sidebar-link" to="/dashboard">Панель</RouterLink>
      <RouterLink class="sidebar-link" to="/courses/electronics">Електроніка</RouterLink>
      <RouterLink class="sidebar-link" to="/courses/logic">Логіка</RouterLink>
      <RouterLink class="sidebar-link" to="/forum">Форум</RouterLink>
    </aside>

    <main class="material-main">
      <header class="dashboard-topbar">
        <h1>Матеріал</h1>
        <span class="user-chip">{{ user.name }} | {{ user.role }}</span>
      </header>

      <section class="content-panel">
        <p class="eyebrow">
          {{ material.type || "material" }}
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
          <a :href="fullFileUrl(material.fileUrl)" target="_blank">
            {{ material.fileName || "Відкрити файл" }}
          </a>
        </p>

        <RouterLink
          v-if="material.course?.slug === 'electronics'"
          class="button ghost"
          to="/courses/electronics"
        >
          Назад до курсу
        </RouterLink>

        <RouterLink
          v-if="material.course?.slug === 'logic'"
          class="button ghost"
          to="/courses/logic"
        >
          Назад до курсу
        </RouterLink>
      </section>

      <section
        v-if="material.type === 'practice' && user.role === 'student'"
        class="content-panel"
      >
        <h3>Здати практичну роботу</h3>

        <form class="form" @submit.prevent="submitPractice">
          <label>
            Коментар
            <textarea
              v-model="submissionText"
              placeholder="Додайте коментар до роботи..."
            ></textarea>
          </label>

          <label>
            Файл роботи
            <input
              type="file"
              @change="handleFileChange"
            />
          </label>

          <p v-if="selectedFileName">
            Обрано файл: {{ selectedFileName }}
          </p>

          <button class="button primary" type="submit">
            Надіслати роботу
          </button>
        </form>

        <p class="message">{{ message }}</p>
      </section>

      <section
        v-if="material.type === 'practice' && (user.role === 'teacher' || user.role === 'admin')"
        class="content-panel"
      >
        <h3>Здані роботи студентів</h3>

        <article
          v-for="submission in submissions"
          :key="submission._id"
          class="submission-card"
        >
          <h4>{{ submission.student?.name || "Студент" }}</h4>
          <p>{{ submission.student?.email }}</p>

          <p v-if="submission.text">
            Коментар: {{ submission.text }}
          </p>

          <p v-if="submission.fileUrl">
            Файл:
            <a :href="fullFileUrl(submission.fileUrl)" target="_blank">
              {{ submission.fileName || "Відкрити файл" }}
            </a>
          </p>

          <p>
            Статус: {{ submission.status }}
          </p>
        </article>

        <p v-if="!submissions.length" class="auth-subtitle">
          Робіт поки не здано.
        </p>
      </section>
    </main>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "../services/api";

const route = useRoute();
const router = useRouter();

const user = ref({});
const material = ref({});
const submissions = ref([]);

const selectedFile = ref(null);
const selectedFileName = ref("");
const submissionText = ref("");
const message = ref("");

onMounted(async () => {
  try {
    const userRes = await api.get("/users/me");
    user.value = userRes.data;

    const materialRes = await api.get(`/materials/${route.params.id}`);
    material.value = materialRes.data;

    if (
      material.value.type === "practice" &&
      (user.value.role === "teacher" || user.value.role === "admin")
    ) {
      await loadSubmissions();
    }
  } catch {
    router.push("/dashboard");
  }
});

async function loadSubmissions() {
  try {
    const res = await api.get(`/submissions/material/${route.params.id}`);
    submissions.value = res.data;
  } catch {
    submissions.value = [];
  }
}

function handleFileChange(event) {
  const file = event.target.files?.[0];

  if (!file) {
    selectedFile.value = null;
    selectedFileName.value = "";
    return;
  }

  selectedFile.value = file;
  selectedFileName.value = file.name;
}

async function submitPractice() {
  try {
    const formData = new FormData();

    formData.append("text", submissionText.value);

    if (selectedFile.value) {
      formData.append("file", selectedFile.value);
    }

    await api.post(`/submissions/material/${route.params.id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });

    message.value = "Роботу надіслано.";

    selectedFile.value = null;
    selectedFileName.value = "";
    submissionText.value = "";
  } catch (error) {
    message.value =
      error.response?.data?.message || "Не вдалося надіслати роботу.";
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
  if (!value) return "Не вказано";
  return new Date(value).toLocaleString("uk-UA");
}
</script>

<style scoped>
.material-page {
  display: flex;
  min-height: 100vh;
}

.material-sidebar {
  width: 280px;
  min-width: 280px;
  padding: 20px;
  border-right: 1px solid #293244;
  background: #111722;
}

.material-main {
  flex: 1;
  min-width: 0;
}

.content-panel {
  display: block;
  margin: 28px;
  padding: 24px;
  border: 1px solid #293244;
  border-radius: 10px;
  background: #111722;
}

.form {
  display: grid;
  gap: 16px;
}

label {
  display: grid;
  gap: 8px;
}

input,
textarea {
  width: 100%;
  min-height: 42px;
  padding: 10px;
  border: 1px solid #293244;
  border-radius: 8px;
  background: #090312;
  color: #f4f7fb;
}

textarea {
  min-height: 120px;
}

.submission-card {
  padding: 16px;
  border: 1px solid #293244;
  border-radius: 8px;
  background: #090312;
  margin-top: 14px;
}

@media (max-width: 800px) {
  .material-page {
    display: block;
  }

  .material-sidebar {
    width: 100%;
    min-width: 0;
  }
}
</style>
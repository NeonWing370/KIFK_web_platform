<template>
  <div class="teacher-page">
    <aside class="teacher-sidebar">
      <RouterLink class="sidebar-link" to="/dashboard">Панель</RouterLink>
      <RouterLink class="sidebar-link" to="/teacher-materials">Матеріали</RouterLink>
      <RouterLink class="sidebar-link" to="/teacher-tests">Тести</RouterLink>
      <RouterLink class="sidebar-link" to="/courses/electronics">Електроніка</RouterLink>
      <RouterLink class="sidebar-link" to="/courses/logic">Логіка</RouterLink>
    </aside>

    <main class="teacher-main">
      <header class="teacher-header">
        <h1>Матеріали</h1>
        <span class="user-chip">{{ user.name }} | {{ user.role }}</span>
      </header>

      <section class="content-panel teacher-form-panel">
        <h3>{{ editingId ? "Редагувати матеріал" : "Створити матеріал" }}</h3>

        <form class="form" @submit.prevent="saveMaterial">
          <label>
            Курс
            <select v-model="course" required>
              <option value="electronics">Комп'ютерна електроніка</option>
              <option value="logic">Комп'ютерна логіка</option>
            </select>
          </label>

          <label>
            Тип матеріалу
            <select v-model="type">
              <option value="text">Текст</option>
              <option value="event">Подія</option>
              <option value="file">Файл</option>
              <option value="practice">Практична робота</option>
            </select>
          </label>

          <label>
            Назва
            <input v-model="title" type="text" placeholder="Назва матеріалу" required />
          </label>

          <label>
            Зміст / опис
            <textarea
              v-model="content"
              class="profile-bio"
              placeholder="Напишіть текст або опис матеріалу..."
            ></textarea>
          </label>

          <label>
            Дедлайн / дата події
            <input v-model="deadline" type="datetime-local" />
          </label>

          <label>
            Завантажити файл
            <input
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.gif,.webp,.mp4,.zip"
              @change="handleFileChange"
            />
          </label>

          <div v-if="fileName" class="uploaded-file-box">
            <strong>Файл:</strong>
            <span>{{ fileName }}</span>
          </div>

          <div class="flags-row">
            <label class="check-label">
              <input v-model="pinned" type="checkbox" />
              Закріпити
            </label>

            <label class="check-label">
              <input v-model="hidden" type="checkbox" />
              Приховати
            </label>
          </div>

          <div class="actions-row">
            <button class="button primary" type="submit">
              {{ editingId ? "Зберегти зміни" : "Опублікувати матеріал" }}
            </button>

            <button
              v-if="editingId"
              class="button ghost"
              type="button"
              @click="resetForm"
            >
              Скасувати
            </button>
          </div>
        </form>

        <p class="message">{{ message }}</p>
      </section>

      <section class="content-panel">
        <h2>Опубліковані матеріали</h2>

        <article
          v-for="material in materials"
          :key="material._id"
          class="content-panel material-card"
        >
          <p class="eyebrow">
            {{ material.type || "text" }}
            <span v-if="material.pinned"> • Закріплено</span>
            <span v-if="material.hidden"> • Приховано</span>
          </p>

          <h3>{{ material.title }}</h3>

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

          <div class="actions-row">
            <button class="button small" type="button" @click="startEdit(material)">
              Редагувати
            </button>

            <button class="button small danger" type="button" @click="deleteMaterial(material._id)">
              Видалити
            </button>
          </div>
        </article>

        <p v-if="!materials.length" class="auth-subtitle">
          Матеріалів поки немає.
        </p>
      </section>
    </main>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import api from "../services/api";

const router = useRouter();

const user = ref({});
const materials = ref([]);

const editingId = ref(null);

const course = ref("electronics");
const type = ref("text");
const title = ref("");
const content = ref("");
const deadline = ref("");

const selectedFile = ref(null);
const fileUrl = ref("");
const fileName = ref("");
const fileType = ref("");
const fileSize = ref(null);

const pinned = ref(false);
const hidden = ref(false);

const message = ref("");

onMounted(async () => {
  try {
    const res = await api.get("/users/me");
    user.value = res.data;

    if (user.value.role !== "teacher" && user.value.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    await loadMaterials();
  } catch {
    router.push("/login");
  }
});

watch(course, async () => {
  await loadMaterials();
  resetForm(false);
});

async function loadMaterials() {
  try {
    const res = await api.get(`/materials/teacher/course/${course.value}`);
    materials.value = res.data;
  } catch {
    materials.value = [];
  }
}

function handleFileChange(event) {
  const file = event.target.files?.[0];

  if (!file) {
    selectedFile.value = null;
    return;
  }

  selectedFile.value = file;
  fileName.value = file.name;
  fileType.value = file.type;
  fileSize.value = file.size;
  
}

async function uploadFileIfNeeded() {
  if (!selectedFile.value) {
    return;
  }

  const formData = new FormData();
  formData.append("file", selectedFile.value);

  const res = await api.post("/materials/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });

  fileUrl.value = res.data.fileUrl;
  fileName.value = res.data.fileName;
  fileType.value = res.data.fileType;
  fileSize.value = res.data.fileSize;
}

async function saveMaterial() {
  message.value = "";

  try {
    await uploadFileIfNeeded();

    const payload = {
      courseId: course.value,
      title: title.value,
      content: content.value,
      type: type.value,
      deadline: deadline.value || null,
      eventDate: deadline.value || null,
      fileUrl: fileUrl.value,
      fileName: fileName.value,
      fileType: fileType.value,
      fileSize: fileSize.value,
      hidden: hidden.value,
      pinned: pinned.value
    };

    if (editingId.value) {
      await api.put(`/materials/${editingId.value}`, payload);
      message.value = "Матеріал оновлено.";
    } else {
      await api.post("/materials", payload);
      message.value = "Матеріал опубліковано.";
    }

    resetForm();
    await loadMaterials();
  } catch (error) {
    message.value =
      error.response?.data?.message || "Не вдалося зберегти матеріал.";
  }
}

function startEdit(material) {
  editingId.value = material._id;

  title.value = material.title || "";
  content.value = material.content || "";
  type.value = material.type || "text";

  deadline.value = material.deadline
    ? String(material.deadline).slice(0, 16)
    : "";

  fileUrl.value = material.fileUrl || "";
  fileName.value = material.fileName || "";
  fileType.value = material.fileType || "";
  fileSize.value = material.fileSize || null;
  selectedFile.value = null;

  hidden.value = Boolean(material.hidden);
  pinned.value = Boolean(material.pinned);

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

async function deleteMaterial(id) {
  if (!confirm("Видалити матеріал?")) return;

  try {
    await api.delete(`/materials/${id}`);
    message.value = "Матеріал видалено.";
    await loadMaterials();
  } catch (error) {
    message.value =
      error.response?.data?.message || "Не вдалося видалити матеріал.";
  }
}

function resetForm(clearMessage = true) {
  editingId.value = null;
  type.value = "text";
  title.value = "";
  content.value = "";
  deadline.value = "";

  selectedFile.value = null;
  fileUrl.value = "";
  fileName.value = "";
  fileType.value = "";
  fileSize.value = null;

  pinned.value = false;
  hidden.value = false;

  if (clearMessage) {
    message.value = "";
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
</script>

<style scoped>
.teacher-page {
  display: grid;
  grid-template-columns: 280px 1fr;
  min-height: 100vh;
  background: #090312;
}

.teacher-sidebar {
  padding: 18px;
  border-right: 1px solid #293244;
  background: #111722;
}

.teacher-main {
  padding: 28px;
  min-width: 0;
}

.teacher-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.teacher-main .content-panel {
  display: block;
  margin-bottom: 24px;
  padding: 22px;
}

.teacher-main .form {
  display: grid;
  gap: 16px;
}

.teacher-main label {
  display: grid;
  gap: 8px;
}

.teacher-main input,
.teacher-main select,
.teacher-main textarea {
  width: 100%;
  min-height: 44px;
  padding: 10px 12px;
  border: 1px solid #293244;
  border-radius: 8px;
  background: #111722;
  color: #f4f7fb;
}

.teacher-main textarea {
  min-height: 140px;
}

.uploaded-file-box {
  display: flex;
  gap: 8px;
  padding: 12px;
  border: 1px solid #293244;
  border-radius: 8px;
  background: #090312;
}

.flags-row,
.actions-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.check-label {
  display: flex !important;
  grid-template-columns: none !important;
  flex-direction: row;
  align-items: center;
  gap: 8px !important;
}

.check-label input {
  width: auto;
  min-height: auto;
}

.material-card {
  border: 1px solid #293244;
  border-radius: 10px;
}

@media (max-width: 800px) {
  .teacher-page {
    display: block;
  }
}
</style>
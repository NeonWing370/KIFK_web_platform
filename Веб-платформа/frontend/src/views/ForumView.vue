<template>
  <div class="forum-page">
    <aside class="forum-sidebar">
      <RouterLink class="sidebar-link" to="/dashboard">Панель</RouterLink>
      <RouterLink class="sidebar-link" to="/forum">Форум</RouterLink>
      <RouterLink class="sidebar-link" to="/courses/electronics">Електроніка</RouterLink>
      <RouterLink class="sidebar-link" to="/courses/logic">Логіка</RouterLink>
    </aside>

    <main class="forum-main">
      <header class="dashboard-topbar">
        <h1>Форум</h1>
        <span class="user-chip">{{ user.name }} | {{ user.role }}</span>
      </header>

      <section class="content-panel">
        <h3>Створити обговорення</h3>

        <form class="form" @submit.prevent="createPost">
          <label>
            Курс
            <select v-model="course">
              <option value="all">Загальне обговорення</option>
              <option value="electronics">Комп'ютерна електроніка</option>
              <option value="logic">Комп'ютерна логіка</option>
            </select>
          </label>

          <label>
            Заголовок
            <input
              v-model="title"
              type="text"
              placeholder="Тема обговорення"
              required
            />
          </label>

          <label>
            Повідомлення
            <textarea
              v-model="text"
              placeholder="Напишіть питання або повідомлення..."
              required
            ></textarea>
          </label>

          <button class="button primary" type="submit">
            Опублікувати
          </button>
        </form>

        <p class="message">{{ message }}</p>
      </section>

      <section class="content-panel">
        <div class="forum-filter">
          <h3>Обговорення</h3>

          <select v-model="filterCourse" @change="loadPosts">
            <option value="all">Усі</option>
            <option value="electronics">Електроніка</option>
            <option value="logic">Логіка</option>
          </select>
        </div>

        <article
          v-for="post in posts"
          :key="post._id"
          class="content-panel forum-post"
        >
          <p class="eyebrow">
            {{ post.course?.title || "Загальне" }}
            • {{ post.author?.name || "Користувач" }}
            • {{ formatDate(post.createdAt) }}
          </p>

          <h3>{{ post.title }}</h3>
          <p>{{ post.text }}</p>

          <div class="replies">
            <h4>Відповіді</h4>

            <article
              v-for="reply in post.replies"
              :key="reply._id || reply.createdAt"
              class="reply-card"
            >
              <p>
                {{ reply.text }}
              </p>

              <p class="auth-subtitle">
                {{ reply.author?.name || "Користувач" }}
                • {{ formatDate(reply.createdAt) }}
              </p>
            </article>

            <p v-if="!post.replies?.length" class="auth-subtitle">
              Відповідей поки немає.
            </p>
          </div>

          <form class="reply-form" @submit.prevent="replyToPost(post._id)">
            <input
              v-model="replyTexts[post._id]"
              type="text"
              placeholder="Написати відповідь..."
              required
            />

            <button class="button small" type="submit">
              Відповісти
            </button>
          </form>

          <button
            v-if="canDelete(post)"
            class="button small danger"
            type="button"
            @click="deletePost(post._id)"
          >
            Видалити тему
          </button>
        </article>

        <p v-if="!posts.length" class="auth-subtitle">
          Обговорень поки немає.
        </p>
      </section>
    </main>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import api from "../services/api";

const router = useRouter();

const user = ref({});
const posts = ref([]);
const replyTexts = ref({});

const course = ref("all");
const filterCourse = ref("all");
const title = ref("");
const text = ref("");
const message = ref("");

onMounted(async () => {
  try {
    const userRes = await api.get("/users/me");
    user.value = userRes.data;

    await loadPosts();
  } catch {
    router.push("/login");
  }
});

async function loadPosts() {
  try {
    const res = await api.get(`/forum?course=${filterCourse.value}`);
    posts.value = res.data;
  } catch {
    posts.value = [];
  }
}

async function createPost() {
  try {
    await api.post("/forum", {
      title: title.value,
      text: text.value,
      courseId: course.value
    });

    title.value = "";
    text.value = "";
    course.value = "all";
    message.value = "Обговорення створено.";

    await loadPosts();
  } catch (error) {
    message.value =
      error.response?.data?.message || "Не вдалося створити обговорення.";
  }
}

async function replyToPost(postId) {
  const replyText = replyTexts.value[postId];

  if (!replyText) return;

  try {
    await api.post(`/forum/${postId}/replies`, {
      text: replyText
    });

    replyTexts.value[postId] = "";

    await loadPosts();
  } catch {
    alert("Не вдалося додати відповідь.");
  }
}

async function deletePost(postId) {
  if (!confirm("Видалити тему форуму?")) return;

  try {
    await api.delete(`/forum/${postId}`);
    await loadPosts();
  } catch {
    alert("Не вдалося видалити тему.");
  }
}

function canDelete(post) {
  return (
    user.value.role === "admin" ||
    user.value.role === "teacher" ||
    post.author?._id === user.value._id
  );
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("uk-UA");
}
</script>

<style scoped>
.forum-page {
  display: flex;
  min-height: 100vh;
}

.forum-sidebar {
  width: 280px;
  min-width: 280px;
  padding: 20px;
  border-right: 1px solid #293244;
  background: #111722;
}

.forum-main {
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
select,
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
  min-height: 130px;
}

.forum-filter {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  margin-bottom: 20px;
}

.forum-filter select {
  max-width: 280px;
}

.forum-post {
  margin: 18px 0;
}

.replies {
  display: grid;
  gap: 10px;
  margin-top: 18px;
}

.reply-card {
  padding: 14px;
  border: 1px solid #293244;
  border-radius: 8px;
  background: #090312;
}

.reply-form {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.reply-form input {
  flex: 1;
}

button {
  width: fit-content;
}

@media (max-width: 800px) {
  .forum-page {
    display: block;
  }

  .forum-sidebar {
    width: 100%;
    min-width: 0;
  }

  .reply-form {
    display: grid;
  }
}
</style>
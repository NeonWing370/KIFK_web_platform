<template>
  <div class="teacher-page">
    <aside class="teacher-sidebar">
      <RouterLink class="sidebar-link" to="/dashboard">Панель</RouterLink>
      <RouterLink class="sidebar-link" to="/teacher-tests">Тести</RouterLink>
      <RouterLink class="sidebar-link" to="/results">Результати</RouterLink>
    </aside>

    <main class="teacher-main">
      <header class="teacher-header">
        <h1>Результати тестів</h1>
        <span class="user-chip">{{ user.name }} | {{ user.role }}</span>
      </header>

      <section class="content-panel">
        <article
          v-for="result in results"
          :key="result._id"
          class="content-panel"
        >
          <h3>{{ result.test?.title || "Тест" }}</h3>

          <p>
            Студент:
            {{ result.student?.name || "Невідомо" }}
          </p>

          <p>
            Курс:
            {{ result.course?.title || "Не вказано" }}
          </p>

          <p>
            Результат:
            {{ result.score }}/{{ result.maxScore }}
            — {{ result.percentage }}%
          </p>

          <p>
            Статус:
            {{ result.passed ? "Склав" : "Не склав" }}
          </p>
        </article>

        <p v-if="!results.length">
          Результатів поки немає.
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
const results = ref([]);

onMounted(async () => {
  try {
    const userRes = await api.get("/users/me");
    user.value = userRes.data;

    const res = await api.get("/results");
    results.value = res.data;
  } catch {
    router.push("/login");
  }
});
</script>

<style scoped>
.teacher-page {
  display: grid;
  grid-template-columns: 280px 1fr;
  min-height: 100vh;
}

.teacher-sidebar {
  padding: 20px;
  border-right: 1px solid #293244;
}

.teacher-main {
  padding: 30px;
}

.teacher-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 24px;
}

.content-panel {
  display: block;
  margin-bottom: 24px;
  padding: 22px;
  border: 1px solid #293244;
  border-radius: 8px;
  background: #111722;
}
</style>
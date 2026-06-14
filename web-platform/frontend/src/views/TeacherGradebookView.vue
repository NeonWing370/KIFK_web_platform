<template>
  <div class="gradebook-page">
    <aside class="gradebook-sidebar">
      <RouterLink class="sidebar-link" to="/dashboard">Панель</RouterLink>
      <RouterLink class="sidebar-link" to="/teacher-tests">Тести</RouterLink>
      <RouterLink class="sidebar-link" to="/results">Результати</RouterLink>
      <RouterLink class="sidebar-link" to="/teacher-gradebook">Журнал оцінок</RouterLink>
    </aside>

    <main class="gradebook-main">
      <header class="dashboard-topbar">
        <h1>Журнал оцінок</h1>
        <span class="user-chip">{{ user.name }} | {{ user.role }}</span>
      </header>

      <section class="content-panel">
        <label>
          Курс
          <select v-model="selectedCourse">
            <option value="all">Усі курси</option>
            <option value="electronics">Комп'ютерна електроніка</option>
            <option value="logic">Комп'ютерна логіка</option>
          </select>
        </label>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Студент</th>
                <th>Email</th>
                <th>Курс</th>
                <th>Тест</th>
                <th>Бал</th>
                <th>Відсоток</th>
                <th>Статус</th>
                <th>Дата</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="result in filteredResults" :key="result._id">
                <td>{{ result.student?.name || "Невідомо" }}</td>
                <td>{{ result.student?.email || "—" }}</td>
                <td>{{ result.course?.title || "—" }}</td>
                <td>{{ result.test?.title || "—" }}</td>
                <td>{{ result.score }}/{{ result.maxScore }}</td>
                <td>{{ result.percentage }}%</td>
                <td>
                  {{ result.passed ? "Склав" : "Не склав" }}
                </td>
                <td>{{ formatDate(result.createdAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p v-if="!filteredResults.length" class="auth-subtitle">
          Результатів поки немає.
        </p>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import api from "../services/api";

const router = useRouter();

const user = ref({});
const results = ref([]);
const selectedCourse = ref("all");

const filteredResults = computed(() => {
  if (selectedCourse.value === "all") {
    return results.value;
  }

  return results.value.filter((result) => {
    return result.course?.slug === selectedCourse.value;
  });
});

onMounted(async () => {
  try {
    const userRes = await api.get("/users/me");
    user.value = userRes.data;

    if (user.value.role !== "teacher" && user.value.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    const resultsRes = await api.get("/results");
    results.value = resultsRes.data;
  } catch {
    router.push("/login");
  }
});

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("uk-UA");
}
</script>

<style scoped>
.gradebook-page {
  display: flex;
  min-height: 100vh;
}

.gradebook-sidebar {
  width: 280px;
  min-width: 280px;
  padding: 20px;
  border-right: 1px solid #293244;
  background: #111722;
}

.gradebook-main {
  flex: 1;
  min-width: 0;
}

.content-panel {
  display: block;
  margin: 28px;
  padding: 24px;
  border: 1px solid #293244;
  border-radius: 8px;
  background: #111722;
}

label {
  display: grid;
  gap: 8px;
  max-width: 360px;
  margin-bottom: 24px;
}

select {
  min-height: 42px;
  padding: 10px;
  border: 1px solid #293244;
  border-radius: 8px;
  background: #090312;
  color: #f4f7fb;
}

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 12px;
  border-bottom: 1px solid #293244;
  text-align: left;
}

@media (max-width: 800px) {
  .gradebook-page {
    display: block;
  }

  .gradebook-sidebar {
    width: 100%;
    min-width: 0;
  }
}
</style>
<template>
  <div class="gradebook-page">
    <aside class="gradebook-sidebar">
      <RouterLink class="sidebar-link" to="/dashboard">Панель</RouterLink>
      <RouterLink class="sidebar-link" to="/groups">Групи</RouterLink>
      <RouterLink class="sidebar-link" to="/teacher-materials">Матеріали</RouterLink>
      <RouterLink class="sidebar-link" to="/teacher-tests">Тести</RouterLink>
      <RouterLink class="sidebar-link" to="/teacher-gradebook">Журнал оцінок</RouterLink>
    </aside>

    <main class="gradebook-main">
      <header class="dashboard-topbar">
        <h1>Електронний журнал оцінок</h1>
        <span class="user-chip">{{ user.name }} | {{ user.role }}</span>
      </header>

      <section class="content-panel filter-panel">
        <label>
          Курс
          <select v-model="selectedCourse">
            <option value="all">Усі курси</option>
            <option v-for="course in courseCatalog" :key="course.slug" :value="course.slug">
              {{ course.title }}
            </option>
          </select>
        </label>
        <button class="button ghost" type="button" @click="loadGradebook">Оновити</button>
      </section>

      <section class="content-panel">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Практичні роботи</p>
            <h2>Середній бал студентів</h2>
          </div>
          <p class="auth-subtitle">Пропуск або неоцінена здача рахується як 0.</p>
        </div>

        <div v-if="studentAverages.length" class="average-grid">
          <article v-for="student in studentAverages" :key="student.id" class="average-card">
            <p class="eyebrow">{{ student.email }}</p>
            <h3>{{ student.name }}</h3>
            <strong>{{ student.average.toFixed(1) }}</strong>
            <span>середній бал за {{ student.count }} роб.</span>
          </article>
        </div>
        <p v-else class="auth-subtitle">Зданих практичних робіт поки немає.</p>
      </section>

      <section class="content-panel">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Перевірка</p>
            <h2>Всі здані практичні роботи</h2>
          </div>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Студент</th>
                <th>Курс</th>
                <th>Робота</th>
                <th>Файл</th>
                <th>Оцінка</th>
                <th>Відгук</th>
                <th>Дії</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="submission in filteredSubmissions" :key="submission._id">
                <td>
                  <strong>{{ submission.student?.name || "Невідомо" }}</strong>
                  <small>{{ submission.student?.email }}</small>
                </td>
                <td>{{ submission.course?.title || "—" }}</td>
                <td>{{ submission.material?.title || "—" }}</td>
                <td>
                  <a v-if="submission.fileUrl" :href="fullFileUrl(submission.fileUrl)" target="_blank" rel="noreferrer">Відкрити</a>
                  <span v-else>—</span>
                </td>
                <td>
                  <input v-model.number="gradeInputs[submission._id]" class="grade-input" type="number" min="1" max="12" step="1" placeholder="—" />
                  <small v-if="submission.grade == null">Не оцінено = 0</small>
                </td>
                <td>
                  <textarea v-model="feedbackInputs[submission._id]" class="feedback-input" placeholder="Відгук"></textarea>
                </td>
                <td>
                  <button class="button small primary" type="button" @click="savePracticeGrade(submission)">Зберегти</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-if="!filteredSubmissions.length" class="auth-subtitle">Практичних робіт за обраним курсом поки немає.</p>
        <p v-if="message" class="message">{{ message }}</p>
      </section>

      <section class="content-panel">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Тести</p>
            <h2>Результати тестів</h2>
          </div>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Студент</th>
                <th>Курс</th>
                <th>Тест</th>
                <th>Бал</th>
                <th>Відсоток</th>
                <th>Статус</th>
                <th>Дії</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="result in filteredResults" :key="result._id">
                <td>{{ result.student?.name || "Невідомо" }}</td>
                <td>{{ result.course?.title || "—" }}</td>
                <td>{{ result.test?.title || "—" }}</td>
                <td>{{ result.score }}/{{ result.maxScore }}</td>
                <td>{{ result.percentage }}%</td>
                <td>{{ result.passed ? "Склав" : "Не склав" }}</td>
                <td><button class="button small danger" type="button" @click="deleteResult(result._id)">Видалити</button></td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-if="!filteredResults.length" class="auth-subtitle">Результатів поки немає.</p>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import api from "../services/api";
import { courseCatalog } from "../data/courseCatalog";

const router = useRouter();
const user = ref({});
const results = ref([]);
const submissions = ref([]);
const selectedCourse = ref("all");
const gradeInputs = ref({});
const feedbackInputs = ref({});
const message = ref("");

const filteredResults = computed(() => selectedCourse.value === "all"
  ? results.value
  : results.value.filter((result) => result.course?.slug === selectedCourse.value));

const filteredSubmissions = computed(() => selectedCourse.value === "all"
  ? submissions.value
  : submissions.value.filter((submission) => submission.course?.slug === selectedCourse.value));

const studentAverages = computed(() => {
  const grouped = new Map();
  for (const submission of filteredSubmissions.value) {
    const id = submission.student?._id || submission.student || "unknown";
    const current = grouped.get(id) || {
      id,
      name: submission.student?.name || "Невідомо",
      email: submission.student?.email || "",
      total: 0,
      count: 0
    };
    current.total += Number.isFinite(Number(submission.grade)) ? Number(submission.grade) : 0;
    current.count += 1;
    grouped.set(id, current);
  }
  return [...grouped.values()]
    .map((student) => ({ ...student, average: student.count ? student.total / student.count : 0 }))
    .sort((a, b) => a.name.localeCompare(b.name, "uk"));
});

onMounted(async () => {
  try {
    const userRes = await api.get("/users/me");
    user.value = userRes.data;
    if (user.value.role !== "teacher" && user.value.role !== "admin") {
      router.push("/dashboard");
      return;
    }
    await loadGradebook();
  } catch {
    router.push("/login");
  }
});

async function loadGradebook() {
  try {
    const [resultsRes, submissionsRes] = await Promise.all([
      api.get("/results"),
      api.get("/submissions")
    ]);
    results.value = resultsRes.data;
    submissions.value = submissionsRes.data;
    gradeInputs.value = Object.fromEntries(submissionsRes.data.map((item) => [item._id, item.grade ?? ""]));
    feedbackInputs.value = Object.fromEntries(submissionsRes.data.map((item) => [item._id, item.feedback || ""]));
  } catch (error) {
    message.value = error.response?.data?.message || "Не вдалося завантажити журнал.";
  }
}

async function savePracticeGrade(submission) {
  const grade = Number(gradeInputs.value[submission._id]);
  if (!Number.isInteger(grade) || grade < 1 || grade > 12) {
    message.value = "Оцінка має бути цілим числом від 1 до 12.";
    return;
  }
  try {
    await api.put("/submissions/" + submission._id + "/check", {
      grade,
      feedback: feedbackInputs.value[submission._id] || ""
    });
    message.value = "Оцінку збережено.";
    await loadGradebook();
  } catch (error) {
    message.value = error.response?.data?.message || "Не вдалося зберегти оцінку.";
  }
}

async function deleteResult(id) {
  if (!confirm("Видалити результат тесту?")) return;
  try {
    await api.delete("/results/" + id);
    await loadGradebook();
  } catch (error) {
    message.value = error.response?.data?.message || "Не вдалося видалити результат.";
  }
}

function fullFileUrl(url) {
  if (!url) return "#";
  if (url.startsWith("http")) return url;
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  return apiUrl.replace("/api", "") + url;
}
</script>

<style scoped>
.gradebook-page { display: flex; min-height: 100vh; }
.gradebook-sidebar { width: 280px; min-width: 280px; padding: 20px; border-right: 1px solid #293244; background: #111722; }
.gradebook-main { flex: 1; min-width: 0; }
.content-panel { display: block; margin: 28px; padding: 24px; border: 1px solid #293244; border-radius: 8px; background: #111722; }
.filter-panel, .section-heading { display: flex; gap: 16px; justify-content: space-between; align-items: end; }
.section-heading { align-items: flex-start; margin-bottom: 18px; }
.section-heading h2, .section-heading p { margin: 0; }
.filter-panel label { display: grid; gap: 8px; width: min(360px, 100%); }
select, input, textarea { width: 100%; min-height: 40px; padding: 8px 10px; border: 1px solid #293244; border-radius: 6px; background: #090312; color: #f4f7fb; }
textarea { min-height: 64px; resize: vertical; }
.table-wrap { overflow-x: auto; }
table { width: 100%; min-width: 900px; border-collapse: collapse; }
th, td { padding: 12px; border-bottom: 1px solid #293244; text-align: left; vertical-align: top; }
td small { display: block; margin-top: 4px; color: rgba(255,255,255,.62); }
.grade-input { min-width: 78px; }
.feedback-input { min-width: 190px; }
.average-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
.average-card { padding: 16px; border: 1px solid #293244; border-radius: 8px; background: #090312; }
.average-card p, .average-card h3 { margin: 0 0 8px; }
.average-card strong { display: block; font-size: 34px; color: #67e8f9; }
.average-card span { color: rgba(255,255,255,.68); }
.button.small { min-height: 34px; padding: 7px 10px; }
@media (max-width: 800px) { .gradebook-page { display: block; } .gradebook-sidebar { width: 100%; min-width: 0; } .content-panel { margin: 16px; } .filter-panel, .section-heading { align-items: stretch; flex-direction: column; } }
</style>

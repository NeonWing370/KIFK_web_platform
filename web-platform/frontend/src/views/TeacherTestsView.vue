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
        <h1>Тести</h1>
        <span class="user-chip">{{ user.name }} | {{ user.role }}</span>
      </header>

      <section class="content-panel">
        <h3>{{ editingId ? "Редагувати тест" : "Створити тест" }}</h3>

        <form class="form" @submit.prevent="saveTest">
          <label>
            Курс
            <select v-model="course">
              <option value="electronics">Комп'ютерна електроніка</option>
              <option value="logic">Комп'ютерна логіка</option>
            </select>
          </label>

          <label>
            Назва тесту
            <input v-model="title" type="text" required />
          </label>

          <label>
            Дедлайн
            <input v-model="dueDate" type="datetime-local" />
          </label>

          <label>
            Прохідний бал (%)
            <input v-model.number="passScore" type="number" min="1" max="100" />
          </label>

          <hr />

          <h3>Питання</h3>

          <article
            v-for="(questionItem, index) in questions"
            :key="questionItem.localId"
            class="question-builder"
          >
            <h4>Питання {{ index + 1 }}</h4>

            <label>
              Текст питання
              <input
                v-model="questionItem.question"
                type="text"
                placeholder="Введіть питання"
                required
              />
            </label>

            <label>
              Варіант A
              <input v-model="questionItem.options[0]" type="text" required />
            </label>

            <label>
              Варіант B
              <input v-model="questionItem.options[1]" type="text" required />
            </label>

            <label>
              Варіант C
              <input v-model="questionItem.options[2]" type="text" required />
            </label>

            <label>
              Правильна відповідь
              <select v-model.number="questionItem.answer">
                <option :value="0">A</option>
                <option :value="1">B</option>
                <option :value="2">C</option>
              </select>
            </label>

            <label>
              Бали
              <input v-model.number="questionItem.points" type="number" min="1" />
            </label>

            <button
              v-if="questions.length > 1"
              class="button small danger"
              type="button"
              @click="removeQuestion(index)"
            >
              Видалити питання
            </button>
          </article>

          <button class="button ghost" type="button" @click="addQuestion">
            Додати питання
          </button>

          <div class="actions-row">
            <button class="button primary" type="submit">
              {{ editingId ? "Зберегти зміни" : "Створити тест" }}
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

        <p>{{ message }}</p>
      </section>

      <section class="content-panel">
        <h3>Створені тести</h3>

        <article
          v-for="test in tests"
          :key="test._id"
          class="content-panel test-card"
        >
          <h4>{{ test.title }}</h4>

          <p>
            Дедлайн:
            {{ test.deadline || test.dueDate || "Не встановлено" }}
          </p>

          <p>
            Прохідний бал:
            {{ test.passScore || 60 }}%
          </p>

          <p>
            Питань:
            {{ test.questions?.length || 0 }}
          </p>

          <div class="actions-row">
            <button class="button small" type="button" @click="startEdit(test)">
              Редагувати
            </button>

            <button class="button small danger" type="button" @click="deleteTest(test._id)">
              Видалити
            </button>
          </div>
        </article>

        <p v-if="!tests.length">
          Тестів поки немає.
        </p>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import api from "../services/api";

const router = useRouter();

const user = ref({});
const tests = ref([]);

const editingId = ref(null);

const title = ref("");
const course = ref("electronics");
const dueDate = ref("");
const passScore = ref(60);
const message = ref("");

const questions = ref([
  createEmptyQuestion()
]);

function createEmptyQuestion() {
  return {
    localId: `${Date.now()}-${Math.random()}`,
    question: "",
    options: ["", "", ""],
    answer: 0,
    points: 1
  };
}

onMounted(async () => {
  try {
    const res = await api.get("/users/me");
    user.value = res.data;

    if (user.value.role !== "teacher" && user.value.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    await loadTests();
  } catch {
    router.push("/login");
  }
});

watch(course, async () => {
  await loadTests();
  resetForm(false);
});

async function loadTests() {
  try {
    const res = await api.get(`/tests/course/${course.value}`);
    tests.value = res.data;
  } catch {
    tests.value = [];
  }
}

function addQuestion() {
  questions.value.push(createEmptyQuestion());
}

function removeQuestion(index) {
  questions.value.splice(index, 1);
}

async function saveTest() {
  message.value = "";

  const preparedQuestions = questions.value.map((item) => ({
    question: item.question,
    options: item.options,
    answer: Number(item.answer),
    points: Number(item.points || 1)
  }));

  const payload = {
    title: title.value,
    courseId: course.value,
    deadline: dueDate.value || null,
    passScore: Number(passScore.value || 60),
    questions: preparedQuestions
  };

  try {
    if (editingId.value) {
      await api.put(`/tests/${editingId.value}`, payload);
      message.value = "Тест оновлено.";
    } else {
      await api.post("/tests", payload);
      message.value = "Тест створено.";
    }

    resetForm();
    await loadTests();
  } catch (error) {
    message.value =
      error.response?.data?.message ||
      "Помилка збереження тесту";
  }
}

function startEdit(test) {
  editingId.value = test._id;

  title.value = test.title || "";
  dueDate.value = test.deadline
    ? String(test.deadline).slice(0, 16)
    : "";
  passScore.value = test.passScore || 60;

  questions.value = test.questions?.length
    ? test.questions.map((item) => ({
        localId: `${Date.now()}-${Math.random()}`,
        question: item.question || "",
        options: item.options?.length ? [...item.options] : ["", "", ""],
        answer: Number(item.answer || 0),
        points: Number(item.points || 1)
      }))
    : [createEmptyQuestion()];

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

async function deleteTest(id) {
  if (!confirm("Видалити тест?")) return;

  try {
    await api.delete(`/tests/${id}`);
    message.value = "Тест видалено.";
    await loadTests();
  } catch (error) {
    message.value =
      error.response?.data?.message ||
      "Не вдалося видалити тест.";
  }
}

function resetForm(clearMessage = true) {
  editingId.value = null;
  title.value = "";
  dueDate.value = "";
  passScore.value = 60;
  questions.value = [createEmptyQuestion()];

  if (clearMessage) {
    message.value = "";
  }
}
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

.form {
  display: grid;
  gap: 14px;
}

input,
select {
  width: 100%;
}

.teacher-main .content-panel {
  display: block;
  margin-bottom: 24px;
  padding: 22px;
  border: 1px solid #293244;
  border-radius: 8px;
  background: #111722;
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
.teacher-main select {
  width: 100%;
  min-height: 44px;
  padding: 10px 12px;
  border: 1px solid #293244;
  border-radius: 8px;
  background: #090312;
  color: #f4f7fb;
}

.teacher-main button {
  width: fit-content;
}

.question-builder {
  display: grid;
  gap: 14px;
  padding: 18px;
  border: 1px solid #293244;
  border-radius: 8px;
  background: #090312;
}

.actions-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.test-card {
  border: 1px solid #293244;
}

hr {
  width: 100%;
  border: none;
  border-top: 1px solid #293244;
}

@media (max-width: 800px) {
  .teacher-page {
    display: block;
  }
}
</style>
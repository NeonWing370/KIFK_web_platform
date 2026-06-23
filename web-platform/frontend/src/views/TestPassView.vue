<template>
  <div class="test-page">
    <header class="topbar">
      <RouterLink class="brand" to="/dashboard">
        <span class="brand-mark">K</span>
        <span>KIFK</span>
      </RouterLink>

      <span class="user-chip">{{ user.name }} | {{ user.role }}</span>
    </header>

    <main class="test-main">
      <section class="content-panel" v-if="test">
        <h1>{{ test.title }}</h1>

        <p class="auth-subtitle">
          Прохідний бал: {{ test.passScore || 60 }}%
        </p>

        <p v-if="isPreview" class="preview-note">
          Режим перевірки викладача: результат не буде збережено в журналі оцінок.
        </p>

        <div
          v-for="(q, index) in test.questions"
          :key="index"
          class="question-card"
        >
          <h3>{{ index + 1 }}. {{ q.question }}</h3>

          <label
            v-for="(option, optionIndex) in q.options"
            :key="optionIndex"
            class="answer-option"
          >
            <input
              type="radio"
              :name="`question-${index}`"
              :value="optionIndex"
              v-model="answers[index]"
            />

            {{ option }}
          </label>
        </div>

        <button class="button primary" type="button" @click="submitTest">
          {{ isPreview ? "Перевірити тест" : "Завершити тест" }}
        </button>

        <p class="message">{{ message }}</p>
      </section>

      <section class="content-panel" v-else>
        <h2>Завантаження тесту...</h2>
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
const test = ref(null);
const answers = ref([]);
const message = ref("");
const isPreview = computed(() => {
  return route.query.preview === "1" && ["teacher", "admin"].includes(user.value.role);
});

onMounted(async () => {
  try {
    const userRes = await api.get("/users/me");
    user.value = userRes.data;

    const testRes = await api.get(`/tests/${route.params.id}`);
    test.value = testRes.data;

    answers.value = new Array(test.value.questions?.length || 0).fill(null);
  } catch (error) {
    message.value = error.response?.data?.message || "Не вдалося завантажити тест.";
  }
});

async function submitTest() {
  try {
    const res = await api.post(`/tests/${route.params.id}/submit`, {
      answers: answers.value,
      preview: isPreview.value
    });

    message.value = `Результат: ${res.data.score}/${res.data.maxScore}, ${res.data.percentage}%`;

    if (!isPreview.value) {
      setTimeout(() => {
        router.push(`/courses/${route.query.returnTo || "electronics"}`);
      }, 1500);
    }
  } catch (error) {
    message.value = error.response?.data?.message || "Не вдалося відправити тест.";
  }
}
</script>

<style scoped>
.test-main {
  display: block !important;
  padding: 32px !important;
  position: relative;
  z-index: 50;
}

.content-panel {
  display: block !important;
  padding: 24px;
  border: 1px solid #293244;
  border-radius: 8px;
  background: #111722;
}

.question-card {
  display: block !important;
  margin: 24px 0;
  padding: 18px;
  border: 1px solid #293244;
  border-radius: 8px;
  background: #090312;
}

.answer-option {
  display: flex !important;
  gap: 10px;
  margin-top: 12px;
  cursor: pointer;
}

.preview-note {
  padding: 12px 14px;
  border-left: 3px solid #00e5ff;
  background: rgba(0, 229, 255, 0.08);
}
</style>

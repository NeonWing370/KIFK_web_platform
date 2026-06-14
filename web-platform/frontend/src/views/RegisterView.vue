<template>
  <main class="auth-page">
    <section class="auth-card">
      <RouterLink class="brand" to="/">
        <span class="brand-mark">K</span>
        <span>KIFK</span>
      </RouterLink>

      <h1>Створіть обліковий запис</h1>

      <p class="auth-subtitle">
        Приєднуйтесь до платформи, оберіть роль і переходьте до особистої сторінки.
      </p>

      <form class="form" @submit.prevent="register">
        <label>
          Повне ім'я
          <input
            v-model="name"
            type="text"
            placeholder="Ваше ім'я"
            required
          />
        </label>

        <label>
          Email
          <input
            v-model="email"
            type="email"
            placeholder="you@example.com"
            required
          />
        </label>

        <div>
          <span class="eyebrow">Роль</span>

          <div class="role-selector">
            <button
              type="button"
              :class="{ active: role === 'student' }"
              @click="role = 'student'"
            >
              Студент
            </button>

            <button
              type="button"
              :class="{ active: role === 'teacher' }"
              @click="role = 'teacher'"
            >
              Викладач
            </button>

            <button
              type="button"
              :class="{ active: role === 'admin' }"
              @click="role = 'admin'"
            >
              Адмін
            </button>
          </div>
        </div>

        <label>
          Пароль
          <input
            v-model="password"
            type="password"
            minlength="6"
            placeholder="Щонайменше 6 символів"
            required
          />
        </label>

        <label>
          Підтвердіть пароль
          <input
            v-model="confirmPassword"
            type="password"
            minlength="6"
            placeholder="Повторіть пароль"
            required
          />
        </label>

        <button class="button primary full" type="submit">
          Створити обліковий запис
        </button>
      </form>

      <p class="auth-link">
        Вже зареєстровані?
        <RouterLink to="/login">Увійти</RouterLink>
      </p>

      <p v-if="message" class="message error">{{ message }}</p>
    </section>
  </main>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import api from "../services/api";

const router = useRouter();

const name = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const role = ref("student");
const message = ref("");

async function register() {
  message.value = "";

  if (password.value !== confirmPassword.value) {
    message.value = "Паролі не збігаються.";
    return;
  }

  try {
    const res = await api.post("/auth/register", {
      name: name.value,
      email: email.value,
      password: password.value,
      role: role.value
    });

    localStorage.setItem("token", res.data.token);

    router.push("/");
  } catch (error) {
    message.value =
      error.response?.data?.message || "Помилка реєстрації";
  }
}
</script>

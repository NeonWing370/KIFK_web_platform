<template>
  <main class="auth-page">
    <section class="auth-card">
      <RouterLink class="brand" to="/">
        <span class="brand-mark">K</span>
        <span>KIFK</span>
      </RouterLink>

      <h1>З поверненням</h1>
      <p class="auth-subtitle">
        Увійдіть до свого облікового запису KIFK і відкрийте особисту панель.
      </p>

      <form class="form" @submit.prevent="login" autocomplete="off">
        <label>
          Email
          <input v-model="email" type="email" placeholder="Адреса email" required />
        </label>

        <label>
          Пароль
          <input v-model="password" type="password" placeholder="Пароль" required />
        </label>

        <button class="button primary full" type="submit">
          Увійти
        </button>
      </form>

      <p class="auth-link">
        Немає облікового запису?
        <RouterLink to="/register">Створити безкоштовно</RouterLink>
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

const email = ref("");
const password = ref("");
const message = ref("");

async function login() {

  try {

    const res = await api.post("/auth/login", {
      email: email.value,
      password: password.value
    });

    localStorage.setItem(
      "token",
      res.data.token
    );

    router.push("/dashboard");

  } catch (error) {

    message.value =
      error.response?.data?.message || "Invalid credentials";

  }

}
</script>

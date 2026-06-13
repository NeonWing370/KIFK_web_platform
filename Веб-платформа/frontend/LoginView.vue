<template>
  <main class="auth-page">
    <section class="auth-card">

      <h1>Login</h1>

      <form @submit.prevent="login">

        <input
          v-model="email"
          type="email"
          placeholder="Email"
          required
        />

        <input
          v-model="password"
          type="password"
          placeholder="Password"
          required
        />

        <button type="submit">
          Login
        </button>

      </form>

      <p>{{ message }}</p>

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

  } catch {

    message.value = "Invalid credentials";

  }

}
</script>
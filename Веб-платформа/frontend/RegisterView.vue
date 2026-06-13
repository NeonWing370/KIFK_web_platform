<template>
  <main class="auth-page">

    <section class="auth-card">

      <h1>Register</h1>

      <form @submit.prevent="register">

        <input
          v-model="name"
          placeholder="Name"
          required
        />

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

        <button>
          Register
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

const name = ref("");
const email = ref("");
const password = ref("");
const message = ref("");

async function register() {

  try {

    await api.post("/auth/register", {
      name: name.value,
      email: email.value,
      password: password.value
    });

    router.push("/login");

  } catch {

    message.value = "Registration error";

  }

}
</script>
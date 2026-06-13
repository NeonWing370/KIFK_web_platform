<template>

<div>

  <h1>Dashboard</h1>

  <h3>{{ user.name }}</h3>

  <p>{{ user.role }}</p>

  <router-link to="/profile">
    Profile
  </router-link>

  <router-link to="/notifications">
    Notifications
  </router-link>

</div>

</template>

<script setup>
import { onMounted, ref } from "vue";
import api from "../services/api";

const user = ref({});

onMounted(async () => {

  const res =
    await api.get("/users/me");

  user.value = res.data;

});
</script>
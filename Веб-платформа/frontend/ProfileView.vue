<template>

<div>

  <h1>Profile</h1>

  <input v-model="user.name">

  <textarea
    v-model="user.bio"
  />

  <button @click="save">
    Save
  </button>

</div>

</template>

<script setup>
import { ref, onMounted } from "vue";
import api from "../services/api";

const user = ref({});

onMounted(async () => {

  const res =
    await api.get("/users/me");

  user.value = res.data;

});

async function save() {

  await api.put(
    "/users/profile",
    user.value
  );

}
</script>
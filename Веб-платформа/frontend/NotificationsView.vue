<template>

<div>

  <h1>Notifications</h1>

  <div
    v-for="n in notifications"
    :key="n._id"
  >
    <h4>{{ n.title }}</h4>
    <p>{{ n.text }}</p>
  </div>

</div>

</template>

<script setup>
import { ref, onMounted } from "vue";
import api from "../services/api";

const notifications = ref([]);

onMounted(async () => {

  const res =
    await api.get(
      "/notifications"
    );

  notifications.value =
    res.data;

});
</script>
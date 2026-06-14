<template>
  <div class="admin-page">
    <aside class="admin-sidebar">
      <RouterLink class="sidebar-link" to="/dashboard">Панель</RouterLink>
      <RouterLink class="sidebar-link" to="/admin/users">Користувачі</RouterLink>
      <RouterLink class="sidebar-link" to="/results">Результати</RouterLink>
    </aside>

    <main class="admin-main">
      <header class="dashboard-topbar">
        <h1>Користувачі</h1>
        <span class="user-chip">{{ currentUser.name }} | {{ currentUser.role }}</span>
      </header>

      <section class="content-panel">
        <table>
          <thead>
            <tr>
              <th>Ім'я</th>
              <th>Email</th>
              <th>Роль</th>
              <th>Група</th>
              <th>Дії</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="user in users" :key="user._id">
              <td>
                <input v-model="user.name" />
              </td>

              <td>{{ user.email }}</td>

              <td>
                <select v-model="user.role">
                  <option value="student">student</option>
                  <option value="teacher">teacher</option>
                  <option value="admin">admin</option>
                </select>
              </td>

              <td>
                {{ user.group?.name || "—" }}
              </td>

              <td>
                <button class="button small" @click="saveUser(user)">
                  Зберегти
                </button>

                <button class="button small danger" @click="deleteUser(user._id)">
                  Видалити
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <p class="message">{{ message }}</p>
      </section>
    </main>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import api from "../services/api";

const router = useRouter();

const currentUser = ref({});
const users = ref([]);
const message = ref("");

onMounted(async () => {
  try {
    const me = await api.get("/users/me");
    currentUser.value = me.data;

    if (currentUser.value.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    await loadUsers();
  } catch {
    router.push("/login");
  }
});

async function loadUsers() {
  const res = await api.get("/users");
  users.value = res.data;
}

async function saveUser(user) {
  try {
    await api.put(`/users/${user._id}`, {
      name: user.name,
      role: user.role,
      group: user.group?._id || null
    });

    message.value = "Користувача збережено.";
    await loadUsers();
  } catch (error) {
    message.value = error.response?.data?.message || "Не вдалося зберегти.";
  }
}

async function deleteUser(id) {
  if (!confirm("Видалити користувача?")) return;

  try {
    await api.delete(`/users/${id}`);
    message.value = "Користувача видалено.";
    await loadUsers();
  } catch (error) {
    message.value = error.response?.data?.message || "Не вдалося видалити.";
  }
}
</script>

<style scoped>
.admin-page {
  display: flex;
  min-height: 100vh;
}

.admin-sidebar {
  width: 280px;
  min-width: 280px;
  padding: 20px;
  border-right: 1px solid #293244;
  background: #111722;
}

.admin-main {
  flex: 1;
  min-width: 0;
}

.content-panel {
  display: block;
  margin: 28px;
  padding: 24px;
  border: 1px solid #293244;
  border-radius: 8px;
  background: #111722;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 12px;
  border-bottom: 1px solid #293244;
  text-align: left;
}

input,
select {
  width: 100%;
  min-height: 36px;
  padding: 8px;
  background: #090312;
  color: #f4f7fb;
  border: 1px solid #293244;
  border-radius: 6px;
}

td:last-child {
  display: flex;
  gap: 8px;
}
</style>
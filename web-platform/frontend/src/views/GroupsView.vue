<template>
  <div class="groups-page">
    <aside class="groups-sidebar">
      <RouterLink class="sidebar-link" to="/dashboard">Панель</RouterLink>
      <RouterLink class="sidebar-link" to="/groups">Групи</RouterLink>
      <RouterLink class="sidebar-link" to="/admin/users">Користувачі</RouterLink>
      <RouterLink class="sidebar-link" to="/teacher-tests">Тести</RouterLink>
      <RouterLink class="sidebar-link" to="/teacher-materials">Матеріали</RouterLink>
    </aside>

    <main class="groups-main">
      <header class="dashboard-topbar">
        <h1>Групи</h1>
        <span class="user-chip">{{ user.name }} | {{ user.role }}</span>
      </header>

      <section class="content-panel">
        <h3>Створити групу</h3>

        <form class="form" @submit.prevent="createGroup">
          <label>
            Назва групи
            <input
              v-model="groupName"
              type="text"
              placeholder="Наприклад: КН-21"
              required
            />
          </label>

          <button class="button primary" type="submit">
            Створити групу
          </button>
        </form>

        <p class="message">{{ message }}</p>
      </section>

      <section class="content-panel">
        <h3>Список груп</h3>

        <article
          v-for="group in groups"
          :key="group._id"
          class="content-panel group-card"
        >
          <h3>{{ group.name }}</h3>

          <p>
            Викладач:
            {{ group.teacher?.name || "Не вказано" }}
          </p>

          <h4>Студенти групи</h4>

          <div v-if="group.students?.length">
            <p
              v-for="student in group.students"
              :key="student._id"
            >
              {{ student.name }} — {{ student.email }}

              <button
                class="button small danger"
                type="button"
                @click="removeStudent(group._id, student._id)"
              >
                Прибрати
              </button>
            </p>
          </div>

          <p v-else class="auth-subtitle">
            Студентів у групі поки немає.
          </p>

          <label>
            Додати студента
            <select v-model="selectedStudents[group._id]">
              <option value="">Оберіть студента</option>

              <option
                v-for="student in availableStudents"
                :key="student._id"
                :value="student._id"
              >
                {{ student.name }} — {{ student.email }}
              </option>
            </select>
          </label>

          <button
            class="button primary"
            type="button"
            @click="addStudent(group._id)"
          >
            Додати до групи
          </button>
        </article>

        <p v-if="!groups.length">
          Груп поки немає.
        </p>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import api from "../services/api";

const router = useRouter();

const user = ref({});
const groups = ref([]);
const users = ref([]);
const groupName = ref("");
const message = ref("");
const selectedStudents = ref({});

const availableStudents = computed(() => {
  return users.value.filter((item) => item.role === "student");
});

onMounted(async () => {
  try {
    const userRes = await api.get("/users/me");
    user.value = userRes.data;

    if (user.value.role !== "teacher" && user.value.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    await loadGroups();

    if (user.value.role === "admin") {
      await loadUsers();
    } else {
      await loadUsersForTeacher();
    }
  } catch {
    router.push("/login");
  }
});

async function loadGroups() {
  const res = await api.get("/groups");
  groups.value = res.data;
}

async function loadUsers() {
  const res = await api.get("/users");
  users.value = res.data;
}

async function loadUsersForTeacher() {
  try {
    const res = await api.get("/users");
    users.value = res.data;
  } catch {
    users.value = [];
  }
}

async function createGroup() {
  try {
    await api.post("/groups", {
      name: groupName.value
    });

    groupName.value = "";
    message.value = "Групу створено.";

    await loadGroups();
  } catch (error) {
    message.value = error.response?.data?.message || "Не вдалося створити групу.";
  }
}

async function addStudent(groupId) {
  const studentId = selectedStudents.value[groupId];

  if (!studentId) {
    message.value = "Оберіть студента.";
    return;
  }

  try {
    await api.post(`/groups/${groupId}/students/${studentId}`);
    selectedStudents.value[groupId] = "";
    message.value = "Студента додано до групи.";

    await loadGroups();
    await reloadUsers();
  } catch (error) {
    message.value = error.response?.data?.message || "Не вдалося додати студента.";
  }
}

async function removeStudent(groupId, studentId) {
  try {
    await api.delete(`/groups/${groupId}/students/${studentId}`);
    message.value = "Студента прибрано з групи.";

    await loadGroups();
    await reloadUsers();
  } catch (error) {
    message.value = error.response?.data?.message || "Не вдалося прибрати студента.";
  }
}

async function reloadUsers() {
  if (user.value.role === "admin") {
    await loadUsers();
  } else {
    await loadUsersForTeacher();
  }
}
</script>

<style scoped>
.groups-page {
  display: flex;
  min-height: 100vh;
}

.groups-sidebar {
  width: 280px;
  min-width: 280px;
  padding: 20px;
  border-right: 1px solid #293244;
  background: #111722;
}

.groups-main {
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
}

.group-card {
  margin: 18px 0;
}

.form {
  display: grid;
  gap: 16px;
}

label {
  display: grid;
  gap: 8px;
}

input,
select {
  width: 100%;
  min-height: 42px;
  padding: 10px;
  border: 1px solid #293244;
  border-radius: 8px;
  background: #090312;
  color: #f4f7fb;
}

button {
  width: fit-content;
}

@media (max-width: 800px) {
  .groups-page {
    display: block;
  }

  .groups-sidebar {
    width: 100%;
    min-width: 0;
  }
}
</style>
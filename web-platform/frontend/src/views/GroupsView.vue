<template>
  <div class="groups-page">
    <aside class="groups-sidebar">
      <RouterLink class="sidebar-link" to="/dashboard">Панель</RouterLink>
      <RouterLink class="sidebar-link" to="/groups">Групи</RouterLink>
      <RouterLink class="sidebar-link" to="/teacher-materials">Матеріали</RouterLink>
      <RouterLink class="sidebar-link" to="/teacher-tests">Тести</RouterLink>
      <RouterLink class="sidebar-link" to="/teacher-gradebook">Журнал оцінок</RouterLink>
    </aside>

    <main class="groups-main">
      <header class="dashboard-topbar">
        <h1>Групи</h1>
        <span class="user-chip">{{ user.name }} | {{ user.role }}</span>
      </header>

      <section class="content-panel">
        <h2>Створити групу</h2>
        <form class="form" @submit.prevent="createGroup">
          <label>
            Назва групи
            <input v-model="groupName" type="text" placeholder="Наприклад: КН-21" required />
          </label>
          <button class="button primary" type="submit">Створити групу</button>
        </form>
        <p v-if="message" class="message">{{ message }}</p>
      </section>

      <section class="content-panel">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Навчальні групи</p>
            <h2>Список груп</h2>
          </div>
          <button class="button ghost" type="button" @click="loadGroups">Оновити</button>
        </div>

        <article v-for="group in groups" :key="group._id" class="group-card">
          <div class="group-heading">
            <div>
              <h3>{{ group.name }}</h3>
              <p>Викладач: {{ group.teacher?.name || "Не вказано" }}</p>
            </div>
            <div class="leader-card">
              <span>Староста</span>
              <strong>{{ group.leader?.name || "Не призначено" }}</strong>
            </div>
          </div>

          <h4>Студенти групи</h4>
          <div v-if="group.students?.length" class="student-list">
            <div v-for="student in group.students" :key="student._id" class="student-row">
              <div>
                <strong>{{ student.name }}</strong>
                <span>{{ student.email }}</span>
                <small v-if="group.leader?._id === student._id">Староста</small>
              </div>
              <div class="student-actions">
                <button class="button small ghost" type="button" @click="setLeader(group, student._id)">
                  {{ group.leader?._id === student._id ? "Зняти роль старости" : "Призначити старостою" }}
                </button>
                <button class="button small danger" type="button" @click="removeStudent(group._id, student._id)">Прибрати</button>
              </div>
            </div>
          </div>
          <p v-else class="auth-subtitle">Студентів у групі поки немає.</p>

          <div class="add-student-row">
            <label>
              Додати студента
              <select v-model="selectedStudents[group._id]">
                <option value="">Оберіть студента</option>
                <option v-for="student in availableStudents" :key="student._id" :value="student._id">
                  {{ student.name }} — {{ student.email }}
                </option>
              </select>
            </label>
            <button class="button primary" type="button" @click="addStudent(group._id)">Додати до групи</button>
          </div>
        </article>

        <p v-if="!groups.length" class="auth-subtitle">Груп поки немає.</p>
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

const availableStudents = computed(() => users.value.filter((item) => item.role === "student"));

onMounted(async () => {
  try {
    const userRes = await api.get("/users/me");
    user.value = userRes.data;
    if (user.value.role !== "teacher" && user.value.role !== "admin") {
      router.push("/dashboard");
      return;
    }
    await Promise.all([loadGroups(), reloadUsers()]);
  } catch {
    router.push("/login");
  }
});

async function loadGroups() {
  const res = await api.get("/groups");
  groups.value = res.data;
}

async function reloadUsers() {
  const path = user.value.role === "admin" ? "/users" : "/users/students";
  const res = await api.get(path);
  users.value = res.data;
}

async function createGroup() {
  try {
    await api.post("/groups", { name: groupName.value });
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
    await api.post("/groups/" + groupId + "/students/" + studentId);
    selectedStudents.value[groupId] = "";
    message.value = "Студента додано до групи.";
    await Promise.all([loadGroups(), reloadUsers()]);
  } catch (error) {
    message.value = error.response?.data?.message || "Не вдалося додати студента.";
  }
}

async function removeStudent(groupId, studentId) {
  try {
    await api.delete("/groups/" + groupId + "/students/" + studentId);
    message.value = "Студента прибрано з групи.";
    await Promise.all([loadGroups(), reloadUsers()]);
  } catch (error) {
    message.value = error.response?.data?.message || "Не вдалося прибрати студента.";
  }
}

async function setLeader(group, studentId) {
  const leaderId = group.leader?._id === studentId ? null : studentId;
  try {
    await api.put("/groups/" + group._id + "/leader", { leaderId });
    message.value = leaderId
      ? "Старосту призначено."
      : "Роль старости знято.";
    await loadGroups();
  } catch (error) {
    message.value = error.response?.data?.message || "Не вдалося оновити старосту.";
  }
}
</script>

<style scoped>
.groups-page { display: flex; min-height: 100vh; }
.groups-sidebar { width: 280px; min-width: 280px; padding: 20px; border-right: 1px solid #293244; background: #111722; }
.groups-main { flex: 1; min-width: 0; }
.content-panel { display: block; margin: 28px; padding: 24px; border: 1px solid #293244; border-radius: 8px; background: #111722; }
.section-heading, .group-heading, .student-row, .add-student-row { display: flex; gap: 16px; justify-content: space-between; align-items: center; }
.section-heading h2, .section-heading p, .group-heading h3, .group-heading p { margin: 0; }
.group-card { margin-top: 18px; padding: 18px; border: 1px solid #293244; border-radius: 8px; background: #090312; }
.leader-card { min-width: 180px; padding: 12px; border-left: 3px solid #fbbf24; background: rgba(251,191,36,.08); }
.leader-card span, .student-row span, .student-row small { display: block; color: rgba(255,255,255,.66); }
.student-list { display: grid; gap: 8px; }
.student-row { padding: 12px; border: 1px solid rgba(41,50,68,.85); border-radius: 6px; }
.student-row small { color: #fde68a; font-weight: 700; }
.student-actions { display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-end; }
.add-student-row { margin-top: 18px; align-items: end; }
.add-student-row label { flex: 1; }
.form, label { display: grid; gap: 10px; }
input, select { width: 100%; min-height: 42px; padding: 10px; border: 1px solid #293244; border-radius: 6px; background: #090312; color: #f4f7fb; }
.button.small { min-height: 34px; padding: 7px 10px; }
@media (max-width: 800px) { .groups-page { display: block; } .groups-sidebar { width: 100%; min-width: 0; } .content-panel { margin: 16px; } .section-heading, .group-heading, .student-row, .add-student-row { align-items: stretch; flex-direction: column; } .leader-card { min-width: 0; } }
</style>

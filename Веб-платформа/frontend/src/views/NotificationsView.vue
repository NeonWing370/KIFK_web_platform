<template>
  <div class="notifications-page">
    <header class="topbar">
      <RouterLink class="brand" to="/dashboard">
        <span class="brand-mark">K</span>
        <span>KIFK</span>
      </RouterLink>

      <span class="user-chip">
        {{ user.name }} | {{ user.role }}
      </span>
    </header>

    <main class="section">
      <div class="section-heading">
        <p class="eyebrow">Вхідні</p>
        <h1>Сповіщення</h1>
        <p>Системні повідомлення, матеріали, тести та результати зібрані тут.</p>
      </div>

      <div class="hero-actions">
        <button
          class="button small"
          type="button"
          @click="markAllRead"
        >
          Позначити все прочитаним
        </button>

        <button
          class="button small"
          type="button"
          @click="loadNotifications"
        >
          Оновити
        </button>

        <RouterLink class="button ghost" to="/dashboard">
          Назад до панелі
        </RouterLink>
      </div>

      <div class="notification-list">
        <article
          v-for="notification in notifications"
          :key="notification._id || notification.id"
          class="content-panel notification-card"
          :class="{ unread: !isRead(notification) }"
        >
          <div class="notification-head">
            <div>
              <p class="eyebrow">
                {{ notification.type || "Система" }}
                <span v-if="notification.course">
                  • {{ notification.course.title || notification.course }}
                </span>
              </p>

              <h3>
                {{ notification.title || "Сповіщення" }}
              </h3>
            </div>

            <span class="status-pill">
              {{ isRead(notification) ? "Прочитано" : "Нове" }}
            </span>
          </div>

          <p>
            {{ notification.text || notification.message }}
          </p>

          <p class="auth-subtitle">
            {{ formatDate(notification.createdAt) }}
          </p>

          <div class="notification-actions">
            <button
              v-if="!isRead(notification)"
              class="button small"
              type="button"
              @click="markOneRead(notification._id)"
            >
              Позначити прочитаним
            </button>

            <button
              class="button small danger"
              type="button"
              @click="deleteNotification(notification._id)"
            >
              Видалити
            </button>
          </div>
        </article>

        <article v-if="!notifications.length" class="content-panel">
          <h3>Сповіщень поки немає</h3>
          <p class="auth-subtitle">
            Тут зʼявляться повідомлення про нові матеріали, тести або події курсу.
          </p>
        </article>
      </div>
    </main>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import api from "../services/api";

const router = useRouter();

const user = ref({});
const notifications = ref([]);

onMounted(async () => {
  try {
    const userRes = await api.get("/users/me");
    user.value = userRes.data;

    await loadNotifications();
  } catch {
    router.push("/login");
  }
});

async function loadNotifications() {
  try {
    const notifRes = await api.get("/notifications");
    notifications.value = notifRes.data;
  } catch {
    notifications.value = [];
  }
}

async function markAllRead() {
  try {
    await api.put("/notifications/read/all");
    await loadNotifications();
  } catch {
    alert("Не вдалося позначити сповіщення прочитаними.");
  }
}

async function markOneRead(id) {
  if (!id) return;

  try {
    await api.put(`/notifications/${id}/read`);
    await loadNotifications();
  } catch {
    alert("Не вдалося позначити сповіщення прочитаним.");
  }
}

async function deleteNotification(id) {
  if (!id) return;

  if (!confirm("Видалити сповіщення?")) return;

  try {
    await api.delete(`/notifications/${id}`);
    await loadNotifications();
  } catch {
    alert("Не вдалося видалити сповіщення.");
  }
}

function isRead(notification) {
  return Boolean(notification.read || notification.isRead);
}

function formatDate(value) {
  if (!value) return "Дата не вказана";

  return new Date(value).toLocaleString("uk-UA");
}
</script>

<style scoped>
.notifications-page {
  min-height: 100vh;
}

.notification-list {
  display: grid;
  gap: 16px;
  margin-top: 24px;
}

.notification-card {
  display: block;
  padding: 22px;
  border: 1px solid #293244;
  border-radius: 10px;
  background: #111722;
}

.notification-card.unread {
  border-color: #4f8cff;
}

.notification-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.status-pill {
  padding: 6px 10px;
  border: 1px solid #293244;
  border-radius: 999px;
  font-size: 12px;
}

.unread .status-pill {
  border-color: #4f8cff;
}

.notification-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 14px;
}
</style>

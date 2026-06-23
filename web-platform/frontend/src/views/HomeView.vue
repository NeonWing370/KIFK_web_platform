<template>
  <div class="home-page">
    <aside class="home-sidebar">
      <RouterLink class="brand" to="/">
        <span class="brand-mark">K</span>
        <span>KIFK</span>
      </RouterLink>

      <nav class="sidebar-nav">
        <RouterLink class="sidebar-link" to="/">Головна</RouterLink>
        <RouterLink class="sidebar-link" to="/courses/electronics">Електроніка</RouterLink>
        <RouterLink class="sidebar-link" to="/courses/logic">Логіка</RouterLink>
        <RouterLink v-if="hasToken" class="sidebar-link" to="/dashboard">Панель</RouterLink>
        <RouterLink v-if="hasToken" class="sidebar-link" to="/profile">Профіль</RouterLink>
        <RouterLink v-if="!hasToken" class="sidebar-link" to="/login">Увійти</RouterLink>
        <RouterLink v-if="!hasToken" class="sidebar-link" to="/register">Реєстрація</RouterLink>
      </nav>
    </aside>

    <header class="home-header">
      <RouterLink class="brand" to="/">
        <span class="brand-mark">K</span>
        <span>KIFK</span>
      </RouterLink>

      <nav class="home-nav">
        <RouterLink to="/courses/electronics">Електроніка</RouterLink>
        <RouterLink to="/courses/logic">Логіка</RouterLink>

        <RouterLink v-if="!hasToken" to="/login">
          Увійти
        </RouterLink>

        <RouterLink v-if="!hasToken" class="button small" to="/register">
          Зареєструватися
        </RouterLink>

        <RouterLink v-if="hasToken" class="button small" to="/dashboard">
          Панель
        </RouterLink>
      </nav>
    </header>

    <main>
      <section class="home-hero">
        <p class="eyebrow">Інтерактивна освітня платформа</p>

        <h1>
          KIFK — веб-платформа для вивчення компʼютерних дисциплін
        </h1>

        <p class="auth-subtitle">
          Курси, матеріали, практичні роботи, тести, прогрес, сповіщення та журнал оцінок
          в одному навчальному середовищі.
        </p>

        <div class="hero-actions">
          <RouterLink v-if="!hasToken" class="button primary" to="/register">
            Почати навчання
          </RouterLink>

          <RouterLink v-if="!hasToken" class="button ghost" to="/login">
            Увійти
          </RouterLink>

          <RouterLink v-if="hasToken" class="button primary" to="/dashboard">
            Перейти в панель
          </RouterLink>
        </div>
      </section>

      <section class="home-welcome">
        <p class="eyebrow">KIFK</p>
        <h2>Вітаємо на платформі</h2>
        <p>
          Оберіть курс, переглядайте матеріали, проходьте тести та слідкуйте за дедлайнами у власному навчальному просторі.
        </p>
      </section>

      <section class="home-courses">
        <article class="content-panel">
          <h3>Компʼютерна електроніка</h3>
          <p>
            Електронні компоненти, схеми, сигнали, сенсори та основи апаратного забезпечення.
          </p>

          <RouterLink class="button primary" to="/courses/electronics">
            Відкрити курс
          </RouterLink>
        </article>

        <article class="content-panel">
          <h3>Компʼютерна логіка</h3>
          <p>
            Булева алгебра, таблиці істинності, логічні вентилі та двійкові системи.
          </p>

          <RouterLink class="button primary" to="/courses/logic">
            Відкрити курс
          </RouterLink>
        </article>
        <article class="content-panel">
          <h3>Комп'ютерні технології</h3>
          <p>Сучасні цифрові інструменти, мережі та робочі процеси в ІТ.</p>
          <RouterLink class="button primary" to="/courses/technologies">Відкрити курс</RouterLink>
        </article>

        <article class="content-panel">
          <h3>Системне програмування</h3>
          <p>Процеси, пам'ять, файлові системи та взаємодія програм з операційною системою.</p>
          <RouterLink class="button primary" to="/courses/system-programming">Відкрити курс</RouterLink>
        </article>

        <article class="content-panel">
          <h3>Електрорадіо вимірювання</h3>
          <p>Прилади, сигнали, точність вимірювань та аналіз електричних параметрів.</p>
          <RouterLink class="button primary" to="/courses/electro-radio-measurements">Відкрити курс</RouterLink>
        </article>
      </section>

    </main>
  </div>
</template>

<script setup>
import { computed } from "vue";

const hasToken = computed(() => {
  return Boolean(localStorage.getItem("token"));
});
</script>

<style scoped>
.home-page {
  display: flex;
  min-height: 100vh;
  background:
    radial-gradient(circle at 18% 18%, rgba(0, 229, 255, 0.18), transparent 30%),
    radial-gradient(circle at 86% 16%, rgba(139, 92, 246, 0.16), transparent 34%),
    #070816;
  color: #f4f7fb;
}

.home-sidebar {
  position: sticky;
  top: 0;
  left: 0;
  width: 280px;
  min-width: 280px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 20px;
  border-right: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(7, 8, 22, 0.94);
  backdrop-filter: blur(18px);
}

.home-header {
  display: none;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 22px 36px;
  border-bottom: 1px solid #293244;
  background: #111722;
}

.home-nav {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.home-nav a {
  color: #f4f7fb;
  text-decoration: none;
}

.home-hero {
  position: relative;
  max-width: 980px;
  min-height: 68vh;
  display: grid;
  align-content: center;
  padding: 80px 36px 40px;
}

.home-hero h1 {
  max-width: 900px;
  font-size: clamp(34px, 6vw, 72px);
  line-height: 1.05;
  margin: 14px 0;
}

.home-welcome,
.home-courses {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
  padding: 24px 36px;
}

.home-welcome {
  display: block;
  margin: 0 36px 10px;
  padding: 26px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(0, 229, 255, 0.1), transparent 38%),
    rgba(15, 23, 42, 0.78);
}

.home-welcome h2 {
  margin: 0 0 10px;
  font-size: clamp(28px, 4vw, 48px);
}

.content-panel {
  display: grid;
  gap: 14px;
  padding: 24px;
  border: 1px solid #293244;
  border-radius: 14px;
  background: #111722;
}

.hero-actions {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  margin-top: 24px;
}

@media (max-width: 700px) {
  .home-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .home-hero {
    padding-top: 48px;
  }
}
</style>

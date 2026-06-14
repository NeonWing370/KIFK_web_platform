<script setup>
import { onBeforeUnmount, ref, watch } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const isCourseLoading = ref(false);
let loadingTimer = null;

watch(
  () => route.fullPath,
  (to, from) => {
    const isCourseTarget = to.startsWith("/courses/");
    const cameFromHome = from === "/";
    const movedBetweenCourses =
      from?.startsWith("/courses/") && isCourseTarget && from !== to;

    if (!isCourseTarget || (!cameFromHome && !movedBetweenCourses)) return;

    window.clearTimeout(loadingTimer);
    isCourseLoading.value = true;

    loadingTimer = window.setTimeout(() => {
      isCourseLoading.value = false;
    }, 1300);
  }
);

onBeforeUnmount(() => {
  window.clearTimeout(loadingTimer);
});
</script>

<template>
  <div>
    <Transition name="course-loader">
      <div v-if="isCourseLoading" class="course-loading-screen" aria-live="polite">
        <div class="loader-grid"></div>
        <div class="loader-core">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <p>KIFK</p>
      </div>
    </Transition>

    <router-view />
  </div>
</template>

<style scoped>
.course-loading-screen {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: grid;
  place-items: center;
  overflow: hidden;
  background:
    radial-gradient(circle at 28% 28%, rgba(255, 94, 0, 0.2), transparent 34%),
    radial-gradient(circle at 72% 72%, rgba(0, 178, 255, 0.22), transparent 34%),
    #06070b;
}

.loader-grid {
  position: absolute;
  inset: -20%;
  background-image:
    linear-gradient(rgba(0, 178, 255, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 94, 0, 0.08) 1px, transparent 1px);
  background-size: 48px 48px;
  animation: loader-grid-move 1.4s linear infinite;
}

.loader-core {
  position: relative;
  width: 132px;
  height: 132px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 8px;
  background: rgba(5, 7, 12, 0.76);
  box-shadow:
    0 0 34px rgba(0, 178, 255, 0.32),
    inset 0 0 28px rgba(255, 94, 0, 0.16);
  transform: rotate(45deg);
  animation: loader-float 1.2s ease-in-out infinite;
}

.loader-core span {
  position: absolute;
  width: 72%;
  height: 2px;
  background: linear-gradient(90deg, transparent, #ff5e00, #00b2ff, transparent);
  box-shadow: 0 0 16px #00b2ff;
  animation: loader-scan 0.9s ease-in-out infinite;
}

.loader-core span:nth-child(2) {
  width: 2px;
  height: 72%;
  animation-delay: -0.3s;
}

.loader-core span:nth-child(3) {
  width: 44%;
  animation-delay: -0.6s;
}

.course-loading-screen p {
  position: absolute;
  bottom: 22%;
  margin: 0;
  color: #fff;
  font-size: 18px;
  font-weight: 900;
  letter-spacing: 0;
  text-shadow:
    0 0 18px rgba(255, 94, 0, 0.56),
    0 0 28px rgba(0, 178, 255, 0.42);
  animation: loader-text-glitch 1.1s steps(2, end) infinite;
}

.course-loader-enter-active,
.course-loader-leave-active {
  transition: opacity 0.22s ease;
}

.course-loader-enter-from,
.course-loader-leave-to {
  opacity: 0;
}

@keyframes loader-grid-move {
  to { transform: translate3d(48px, 48px, 0); }
}

@keyframes loader-float {
  0%, 100% { transform: rotate(45deg) translateY(0); }
  50% { transform: rotate(45deg) translateY(-10px); }
}

@keyframes loader-scan {
  0%, 100% { opacity: 0.25; transform: scaleX(0.35); }
  50% { opacity: 1; transform: scaleX(1); }
}

@keyframes loader-text-glitch {
  0%, 88%, 100% { transform: translateX(0); }
  90% { transform: translateX(2px); }
  94% { transform: translateX(-2px); }
}
</style>

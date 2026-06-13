import { createRouter, createWebHistory } from "vue-router";

import LoginView from "../views/LoginView.vue";
import RegisterView from "../views/RegisterView.vue";
import DashboardView from "../views/DashboardView.vue";
import ProfileView from "../views/ProfileView.vue";
import NotificationsView from "../views/NotificationsView.vue";

const routes = [
  {
    path: "/",
    redirect: "/login"
  },
  {
    path: "/login",
    component: LoginView
  },
  {
    path: "/register",
    component: RegisterView
  },
  {
    path: "/dashboard",
    component: DashboardView
  },
  {
    path: "/profile",
    component: ProfileView
  },
  {
    path: "/notifications",
    component: NotificationsView
  }
];

export default createRouter({
  history: createWebHistory(),
  routes
});
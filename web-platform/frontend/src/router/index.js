import { createRouter, createWebHistory } from "vue-router";

import HomeView from "../views/HomeView.vue";
import LoginView from "../views/LoginView.vue";
import RegisterView from "../views/RegisterView.vue";
import DashboardView from "../views/DashboardView.vue";
import ProfileView from "../views/ProfileView.vue";
import NotificationsView from "../views/NotificationsView.vue";
import CourseElectronicsView from "../views/CourseElectronicsView.vue";
import CourseLogicView from "../views/CourseLogicView.vue";
import TeacherMaterialsView from "../views/TeacherMaterialsView.vue";
import TeacherTestsView from "../views/TeacherTestsView.vue";
import TestPassView from "../views/TestPassView.vue";
import ResultsView from "../views/ResultsView.vue";
import AdminUsersView from "../views/AdminUsersView.vue";
import GroupsView from "../views/GroupsView.vue";
import TeacherGradebookView from "../views/TeacherGradebookView.vue";
import ForumView from "../views/ForumView.vue";
import MaterialView from "../views/MaterialView.vue";

const routes = [
  {
    path: "/",
    component: HomeView,
    meta: {
      public: true
    }
  },
  {
    path: "/login",
    component: LoginView,
    meta: {
      public: true
    }
  },
  {
    path: "/register",
    component: RegisterView,
    meta: {
      public: true
    }
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
  },
  {
    path: "/courses/electronics",
    component: CourseElectronicsView
  },
  {
    path: "/courses/logic",
    component: CourseLogicView
  },
  {
    path: "/teacher-materials",
    component: TeacherMaterialsView
  },
  {
    path: "/teacher-tests",
    component: TeacherTestsView
  },
  {
    path: "/tests/:id",
    component: TestPassView
  },
  {
    path: "/results",
    component: ResultsView
  },
  {
    path: "/admin/users",
    component: AdminUsersView
  },
  {
    path: "/groups",
    component: GroupsView
  },
  {
    path: "/teacher-gradebook",
    component: TeacherGradebookView
  },
  {
  path: "/forum",
  component: ForumView
},
{
  path: "/materials/:id",
  component: MaterialView
}
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to) => {
  const hasToken = Boolean(localStorage.getItem("token"));

  if (!to.meta.public && !hasToken) {
    return "/login";
  }

  return true;
});

export default router;
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
import TechnologiesView from "../views/TechnologiesView.vue";
import SystemProgrammingView from "../views/SystemProgrammingView.vue";
import ElectroRadioMeasurementsView from "../views/ElectroRadioMeasurementsView.vue";
import PeripheralDevicesView from "../views/PeripheralDevicesView.vue";
import ComputerArchitectureView from "../views/ComputerArchitectureView.vue";
import JavaScriptProgrammingView from "../views/JavaScriptProgrammingView.vue";
import ElectricMagneticCircuitsView from "../views/ElectricMagneticCircuitsView.vue";
import ComputerCircuitryView from "../views/ComputerCircuitryView.vue";
import MicroprocessorSystemsView from "../views/MicroprocessorSystemsView.vue";
import ComputerEngineeringGraphicsView from "../views/ComputerEngineeringGraphicsView.vue";
import CProgrammingView from "../views/CProgrammingView.vue";
import OperatingSystemsView from "../views/OperatingSystemsView.vue";

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
    path: "/courses/technologies",
    component: TechnologiesView
  },
  {
    path: "/courses/system-programming",
    component: SystemProgrammingView
  },
  {
    path: "/courses/electro-radio-measurements",
    component: ElectroRadioMeasurementsView
  },
  {
    path: "/courses/peripheral-devices",
    component: PeripheralDevicesView
  },
  {
    path: "/courses/computer-architecture",
    component: ComputerArchitectureView
  },
  {
    path: "/courses/javascript-programming",
    component: JavaScriptProgrammingView
  },
  {
    path: "/courses/electric-magnetic-circuits",
    component: ElectricMagneticCircuitsView
  },
  {
    path: "/courses/computer-circuitry",
    component: ComputerCircuitryView
  },
  {
    path: "/courses/microprocessor-systems",
    component: MicroprocessorSystemsView
  },
  {
    path: "/courses/computer-engineering-graphics",
    component: ComputerEngineeringGraphicsView
  },
  {
    path: "/courses/c-programming",
    component: CProgrammingView
  },
  {
    path: "/courses/operating-systems",
    component: OperatingSystemsView
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


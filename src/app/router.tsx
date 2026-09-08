import { createMemoryRouter, Navigate } from 'react-router'
import { AppShell } from '@/ui/layout/AppShell'
import { SCREEN_META } from '@/ui/layout/screenMeta'
import { CapacityScreen } from '@/ui/screens/capacity/CapacityScreen'
import { DashboardsScreen } from '@/ui/screens/dashboards/DashboardsScreen'
import { NotesScreen } from '@/ui/screens/notes/NotesScreen'
import { ProjectScreen } from '@/ui/screens/project/ProjectScreen'
import { ProjectsScreen } from '@/ui/screens/projects/ProjectsScreen'
import { SettingsScreen } from '@/ui/screens/SettingsScreen'
import { TimelineScreen } from '@/ui/screens/timeline/TimelineScreen'
import { TodayScreen } from '@/ui/screens/today/TodayScreen'
import { TodoListScreen } from '@/ui/screens/todos/TodoListScreen'

export const DEV_PRIMITIVES_PATH = '/dev/primitivos'

export const router = createMemoryRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to={SCREEN_META.today.path} replace /> },
      { path: SCREEN_META.today.path, element: <TodayScreen /> },
      { path: SCREEN_META.projects.path, element: <ProjectsScreen /> },
      { path: SCREEN_META.project.path, element: <ProjectScreen /> },
      { path: SCREEN_META.timeline.path, element: <TimelineScreen /> },
      { path: SCREEN_META.capacity.path, element: <CapacityScreen /> },
      { path: SCREEN_META.todos.path, element: <TodoListScreen /> },
      { path: SCREEN_META.notes.path, element: <NotesScreen /> },
      { path: SCREEN_META.dashboards.path, element: <DashboardsScreen /> },
      { path: SCREEN_META.settings.path, element: <SettingsScreen /> },
      ...(import.meta.env.DEV
        ? [
            {
              path: DEV_PRIMITIVES_PATH,
              lazy: async () => {
                const { DevPrimitivesScreen } = await import('@/ui/dev/DevPrimitivesScreen')

                return { Component: DevPrimitivesScreen }
              },
            },
          ]
        : []),
    ],
  },
])

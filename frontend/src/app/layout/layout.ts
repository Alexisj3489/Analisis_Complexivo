import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen flex bg-gray-100">
      <!-- Sidebar -->
      <aside class="w-64 bg-blue-900 text-white flex-shrink-0 flex flex-col">
        <div class="px-6 py-5 border-b border-blue-800">
          <h1 class="text-lg font-bold leading-tight">Análisis de Encuestas</h1>
          <p class="text-xs text-blue-300 mt-1">con n8n</p>
        </div>
        <nav class="flex-1 px-3 py-4 space-y-1">
          @for (item of navItems; track item.path) {
            <a
              [routerLink]="item.path"
              routerLinkActive="bg-blue-700 text-white"
              [routerLinkActiveOptions]="{ exact: item.exact }"
              class="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-blue-100 hover:bg-blue-800 hover:text-white transition-colors"
            >
              {{ item.label }}
            </a>
          }
        </nav>
      </aside>

      <!-- Contenido -->
      <main class="flex-1 overflow-y-auto">
        <router-outlet />
      </main>
    </div>
  `,
})
export class Layout {
  navItems = [
    { path: '/dashboard', label: 'Dashboard', exact: false },
    { path: '/surveys', label: 'Encuestas', exact: false },
    { path: '/reports', label: 'Reportes', exact: false },
    { path: '/users', label: 'Usuarios', exact: false },
  ];
}
import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen flex bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <aside class="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white flex-shrink-0 flex flex-col transition-colors duration-300">
        <div class="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div class="w-10 h-10 flex-shrink-0">
            <img src="assets/logo.png" alt="Logo Empresa" class="w-full h-full object-contain" onerror="this.src='https://via.placeholder.com/40'" />
          </div>
          <div>
            <h1 class="text-sm font-bold leading-tight">Análisis de Encuestas</h1>
            <p class="text-xs text-indigo-500">con n8n</p>
          </div>
        </div>

        <nav class="flex-1 px-3 py-4 space-y-1">
          @for (item of navItems; track item.path) {
            @if (!item.role || authService.currentUser()?.role === item.role) {
              <a
                [routerLink]="item.path"
                routerLinkActive="bg-indigo-600 text-white font-semibold"
                [routerLinkActiveOptions]="{ exact: item.exact }"
                class="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-white transition-colors"
              >
                <span [innerHTML]="item.icon"></span>
                {{ item.label }}
              </a>
            }
          }
        </nav>
      </aside>

      <div class="flex-1 flex flex-col overflow-hidden">
        <!-- Se cambia 'z-10' por 'relative z-50' para que el menú flote por encima del contenido -->
        <header class="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-8 transition-colors duration-300 relative z-50">
          <div class="text-sm font-medium text-slate-500 dark:text-slate-400">
            Bienvenido, {{ authService.currentUser()?.name }}
          </div>

          <div class="flex items-center gap-4">
            <button
              (click)="themeService.toggleTheme()"
              class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
              <div class="w-5 h-5 rounded-full flex items-center justify-center">
                @if (themeService.theme() === 'dark') {
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 5a7 7 0 100 14 7 7 0 000-14z" />
                  </svg>
                } @else {
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                }
              </div>
              <span class="text-xs font-medium">
                {{ themeService.theme() === 'dark' ? 'Modo Claro' : 'Modo Oscuro' }}
              </span>
            </button>

            <div class="relative">
              <button
                (click)="menuOpen.set(!menuOpen())"
                class="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div class="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden border border-slate-300 dark:border-slate-600">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              @if (menuOpen()) {
                <div class="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-2xl overflow-hidden z-[100] pointer-events-auto">
                  <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <p class="text-sm font-bold text-slate-900 dark:text-white truncate">{{ authService.currentUser()?.name }}</p>
                    <p class="text-xs text-slate-500 dark:text-slate-400 truncate">{{ authService.currentUser()?.role }}</p>
                  </div>
                  <a
                    routerLink="/profile"
                    (click)="menuOpen.set(false)"
                    class="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Mi Perfil
                  </a>
                  <button
                    (click)="authService.logout(); menuOpen.set(false)"
                    class="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Cerrar sesión
                  </button>
                </div>
              }
            </div>
          </div>
        </header>
        <main class="flex-1 overflow-y-auto">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class Layout {
  authService = inject(AuthService);
  themeService = inject(ThemeService);
  menuOpen = signal(false);

  constructor() {
    this.themeService.applyTheme(this.themeService.theme());
  }

  navItems = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      exact: false,
      icon: `<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>`,
    },
    {
      path: '/surveys',
      label: 'Encuestas',
      exact: false,
      icon: `<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>`,
    },
    {
      path: '/reports',
      label: 'Reportes',
      exact: false,
      icon: `<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14" /></svg>`,
    },
    {
      path: '/users',
      label: 'Usuarios',
      exact: false,
      icon: `<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m5-6.13a4 4 0 100 8 4 4 0 000-8zm7 4a4 4 0 11-8 0 4 4 0 018 0z" /></svg>`,
      role: 'ADMIN',
    },
  ];
}
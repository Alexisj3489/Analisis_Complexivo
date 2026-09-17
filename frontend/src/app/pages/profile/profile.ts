import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-slate-50 dark:bg-slate-950 p-8 relative overflow-hidden">
      <svg class="absolute bottom-0 right-0 w-80 h-80 text-slate-200 dark:text-zinc-900 pointer-events-none" viewBox="0 0 200 200" fill="none">
        <defs>
          <pattern id="dots-profile" width="16" height="16" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.5" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="200" height="200" fill="url(#dots-profile)" />
      </svg>

      <div class="max-w-2xl mx-auto relative z-10">
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Mi Perfil</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Información de tu cuenta</p>
        </div>

        @if (authService.currentUser(); as user) {
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-xl">
            <div class="p-8 flex items-center gap-6 border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/30">
              <div class="w-20 h-20 rounded-full bg-amber-500 flex items-center justify-center text-zinc-900 text-3xl font-bold">
                {{ user.name.charAt(0).toUpperCase() }}
              </div>
              <div>
                <h2 class="text-xl font-bold text-slate-900 dark:text-white">{{ user.name }}</h2>
                <p class="text-slate-500 dark:text-slate-400">{{ user.email }}</p>
              </div>
            </div>
            <div class="p-8 grid grid-cols-2 gap-8">
              <div>
                <p class="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-500 font-semibold mb-1">Rol de Usuario</p>
                <p class="text-slate-700 dark:text-slate-200 font-medium">{{ user.role }}</p>
              </div>
              <div>
                <p class="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-500 font-semibold mb-1">Estado de Cuenta</p>
                <p class="text-green-600 dark:text-green-400 font-medium">Activo</p>
              </div>
            </div>
          </div>
        } @else {
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-8 text-center text-slate-500 dark:text-slate-400">
            No se encontró información del usuario.
          </div>
        }
      </div>
    </div>
  `,
})
export class Profile {
  authService = inject(AuthService);
}

import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
})
export class Login {
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  public themeService = inject(ThemeService);

  email = '';
  password = '';
  loading = signal(false);
  errorMsg = signal<string | null>(null);
  showPassword = signal(false);

  togglePassword() {
    this.showPassword.update((v) => !v);
  }

  submit() {
    if (!this.email || !this.password) {
      this.errorMsg.set('Ingresa tu correo y contraseña.');
      return;
    }

    this.loading.set(true);
    this.errorMsg.set(null);

    this.authService.login(this.email, this.password).subscribe({
      next: (response) => {
        this.authService.saveSession(response);
        this.loading.set(false);

        const role = response.user?.role || 'Usuario';
        this.toastService.success(`Entrando como ${role}`);

        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.errorMsg.set('Correo o contraseña incorrectos.');
        this.loading.set(false);
      },
    });
  }
}
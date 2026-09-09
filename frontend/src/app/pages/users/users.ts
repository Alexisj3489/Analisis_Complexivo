import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppUsersService } from '../../services/app-users.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { AppUser } from '../../models/user.model';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.html',
})
export class Users {
  private usersService = inject(AppUsersService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  users = signal<AppUser[]>([]);
  loading = signal(true);
  error = signal(false);

  showForm = signal(false);
  editingId = signal<string | null>(null);
  saving = signal(false);
  formError = signal<string | null>(null);

  name = '';
  email = '';
  password = '';
  role = 'USER';
  showPassword = signal(false);

  togglePassword() {
    this.showPassword.update((v) => !v);
  }

  constructor() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set(false);
    this.usersService.getAll().subscribe({
      next: (data) => {
        this.users.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  openCreateForm() {
    this.editingId.set(null);
    this.name = '';
    this.email = '';
    this.password = '';
    this.role = 'USER';
    this.formError.set(null);
    this.showForm.set(true);
  }

  openEditForm(user: AppUser) {
    this.editingId.set(user.id);
    this.name = user.name;
    this.email = user.email;
    this.password = '';
    this.role = user.role;
    this.formError.set(null);
    this.showForm.set(true);
  }

  cancelForm() {
    this.showForm.set(false);
  }

  save() {
    if (!this.name.trim() || !this.email.trim()) {
      this.formError.set('Nombre y correo son obligatorios.');
      return;
    }

    const id = this.editingId();

    if (!id && this.password.length < 6) {
      this.formError.set('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    this.saving.set(true);
    this.formError.set(null);

    if (id) {
      const payload: any = { name: this.name, email: this.email, role: this.role };
      if (this.password) payload.password = this.password;

      this.usersService.update(id, payload).subscribe({
        next: () => {
          this.saving.set(false);
          this.showForm.set(false);
          this.load();
          this.toastService.success('Usuario actualizado correctamente.');
        },
        error: (err) => {
          this.formError.set(err?.error?.message ?? 'No se pudo actualizar el usuario.');
          this.saving.set(false);
        },
      });
    } else {
      this.usersService
        .create({ name: this.name, email: this.email, password: this.password, role: this.role })
        .subscribe({
          next: () => {
            this.saving.set(false);
            this.showForm.set(false);
            this.load();
            this.toastService.success('Usuario creado correctamente.');
          },
          error: (err) => {
            this.formError.set(err?.error?.message ?? 'No se pudo crear el usuario.');
            this.saving.set(false);
          },
        });
    }
  }

  deleteUser(user: AppUser) {
    if (user.id === this.authService.currentUser()?.id) {
      this.toastService.error('No puedes eliminar tu propio usuario mientras tienes la sesión iniciada.');
      return;
    }
    if (!confirm(`¿Eliminar al usuario "${user.name}"?`)) return;

    this.usersService.delete(user.id).subscribe({
      next: () => {
        this.load();
        this.toastService.success('Usuario eliminado.');
      },
      error: () => this.toastService.error('No se pudo eliminar el usuario.'),
    });
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
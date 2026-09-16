import { Injectable, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly THEME_KEY = 'app-theme';

  theme = signal<Theme>(this.loadTheme());

  private loadTheme(): Theme {
    const stored = localStorage.getItem(this.THEME_KEY);
    return (stored === 'light' || stored === 'dark') ? stored : 'dark';
  }

  toggleTheme() {
    const newTheme = this.theme() === 'light' ? 'dark' : 'light';
    this.theme.set(newTheme);
    localStorage.setItem(this.THEME_KEY, newTheme);
    this.applyTheme(newTheme);
  }

  applyTheme(theme: Theme) {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}

import { Routes } from '@angular/router';
import { Layout } from './layout/layout';
import { Login } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { SurveyList } from './pages/surveys/survey-list/survey-list';
import { SurveyEditor } from './pages/surveys/survey-editor/survey-editor';
import { SurveyAnswer } from './pages/surveys/survey-answer/survey-answer';
import { SurveyResults } from './pages/surveys/survey-results/survey-results';
import { Reports } from './pages/reports/reports';
import { Users } from './pages/users/users';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'surveys/:id/answer', component: SurveyAnswer },
  {
    path: '',
    component: Layout,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: Dashboard },
      { path: 'surveys', component: SurveyList },
      { path: 'surveys/new', component: SurveyEditor },
      { path: 'surveys/:id/edit', component: SurveyEditor },
      { path: 'surveys/:id/results', component: SurveyResults },
      { path: 'reports', component: Reports },
      { path: 'users', component: Users },
    ],
  },
];
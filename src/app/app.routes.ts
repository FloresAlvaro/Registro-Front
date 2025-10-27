import { Routes } from '@angular/router';
import { WorkspaceComponent } from './workspace/workspace.component';
import { RoleComponent } from './role/role.component';
import { GradeComponent } from './grade/grade.component';
import { SubjectComponent } from './subject/subject.component';

export const routes: Routes = [
  { path: '', component: WorkspaceComponent },
  { path: 'workspace', component: WorkspaceComponent },
  { path: 'roles', component: RoleComponent },
  { path: 'grades', component: GradeComponent },
  { path: 'subjects', component: SubjectComponent },
  { path: '**', redirectTo: '' },
];

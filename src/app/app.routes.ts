import { Routes } from '@angular/router';
import { WorkspaceComponent } from './workspace/workspace.component';
import { RoleComponent } from './role/role.component';

export const routes: Routes = [
  { path: '', component: WorkspaceComponent },
  { path: 'workspace', component: WorkspaceComponent },
  { path: 'roles', component: RoleComponent },
  { path: '**', redirectTo: '' },
];

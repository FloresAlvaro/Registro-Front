import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-workspace',
  imports: [],
  templateUrl: './workspace.component.html',
  styleUrl: './workspace.component.scss',
})
export class WorkspaceComponent {
  private router = inject(Router);

  navigateToRoles() {
    this.router.navigate(['/roles']);
  }

  navigateToGrades() {
    this.router.navigate(['/grades']);
  }

  navigateToSubjects() {
    this.router.navigate(['/subjects']);
  }
}

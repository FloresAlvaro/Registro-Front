import { Component, inject, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface Role {
  id?: number;
  roleName: string;
  roleStatus: boolean;
  description?: string;
  permissions?: string[];
}

@Component({
  selector: 'app-role',
  imports: [CommonModule],
  templateUrl: './role.component.html',
  styleUrl: './role.component.scss',
})
export class RoleComponent implements OnInit {
  private router = inject(Router);
  private http = inject(HttpClient);

  // Estado del dropdown
  isDropdownOpen = false;

  // Filtros
  selectedFilter: 'all' | 'active' | 'inactive' = 'active';
  selectedFilterLabel = 'Roles activos';

  // Datos
  roles: Role[] = [];
  isLoading = false;

  // URL base del endpoint
  private readonly baseUrl = 'http://localhost:3000/roles';

  ngOnInit() {
    this.loadRoles();
  }

  goBack() {
    this.router.navigate(['/workspace']);
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  selectFilter(filter: 'all' | 'active' | 'inactive', label: string) {
    this.selectedFilter = filter;
    this.selectedFilterLabel = label;
    this.isDropdownOpen = false;
    this.loadRoles();
  }

  private loadRoles() {
    this.isLoading = true;

    // Mapear el filtro al parámetro correcto para el endpoint
    let statusParam = '';
    if (this.selectedFilter === 'active') {
      statusParam = '?status=active';
    } else if (this.selectedFilter === 'inactive') {
      statusParam = '?status=inactive';
    }
    // Para 'all' no agregamos parámetros

    const url = `${this.baseUrl}${statusParam}`;

    this.http.get<Role[]>(url).subscribe({
      next: (roles) => {
        // Si el filtro es local (cuando el endpoint no soporta filtros), filtramos aquí
        if (this.selectedFilter !== 'all' && statusParam === '') {
          this.roles = roles.filter((role) => {
            if (this.selectedFilter === 'active') {
              return role.roleStatus === true;
            } else if (this.selectedFilter === 'inactive') {
              return role.roleStatus === false;
            }
            return true;
          });
        } else {
          this.roles = roles;
        }
        this.isLoading = false;
      },
      error: () => {
        // En caso de error del servidor, mostrar datos de ejemplo
        this.roles = this.getMockData();
        this.isLoading = false;
      },
    });
  }

  private getMockData(): Role[] {
    const mockRoles: Role[] = [
      {
        id: 1,
        roleName: 'Administrador',
        roleStatus: true,
        description: 'Acceso completo al sistema con permisos de administración',
        permissions: ['create', 'read', 'update', 'delete', 'admin'],
      },
      {
        id: 2,
        roleName: 'Editor',
        roleStatus: true,
        description: 'Puede crear y editar contenido del sistema',
        permissions: ['create', 'read', 'update'],
      },
      {
        id: 3,
        roleName: 'Visor',
        roleStatus: false,
        description: 'Solo permisos de lectura en el sistema',
        permissions: ['read'],
      },
      {
        id: 4,
        roleName: 'Moderador',
        roleStatus: true,
        description: 'Permisos para moderar contenido y usuarios',
        permissions: ['read', 'update', 'moderate'],
      },
    ];

    // Filtrar según la selección actual
    if (this.selectedFilter === 'active') {
      return mockRoles.filter((role) => role.roleStatus === true);
    } else if (this.selectedFilter === 'inactive') {
      return mockRoles.filter((role) => role.roleStatus === false);
    }

    return mockRoles;
  }

  getStatusIcon(roleStatus: boolean): string {
    return roleStatus ? 'pi-check-circle' : 'pi-times-circle';
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    const dropdown = target.closest('.filter-dropdown');
    if (!dropdown && this.isDropdownOpen) {
      this.isDropdownOpen = false;
    }
  }
}

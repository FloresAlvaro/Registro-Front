import { Component, inject, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

interface Role {
  roleId?: number;
  id?: number; // Mantener para compatibilidad
  roleName: string;
  roleStatus: boolean;
  description?: string;
  permissions?: string[];
}

@Component({
  selector: 'app-role',
  imports: [CommonModule, FormsModule],
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

  // Modal de edición
  isEditModalOpen = false;
  editingRole: Role = { roleName: '', roleStatus: false };
  isSaving = false;

  // Modal de eliminación
  isDeleteModalOpen = false;
  roleToDelete: Role | null = null;
  isDeleting = false;

  // Modal de creación
  isCreateModalOpen = false;
  newRole: Role = { roleName: '', roleStatus: true };
  isCreating = false;

  // Toast notifications
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' = 'info';
  showToast = false;

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
        roleId: 1,
        roleName: 'Administrador',
        roleStatus: true,
        description: 'Acceso completo al sistema con permisos de administración',
        permissions: ['create', 'read', 'update', 'delete', 'admin'],
      },
      {
        roleId: 2,
        roleName: 'Editor',
        roleStatus: true,
        description: 'Puede crear y editar contenido del sistema',
        permissions: ['create', 'read', 'update'],
      },
      {
        roleId: 3,
        roleName: 'Visor',
        roleStatus: false,
        description: 'Solo permisos de lectura en el sistema',
        permissions: ['read'],
      },
      {
        roleId: 4,
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

  // Acciones de los botones
  editRole(role: Role) {
    this.editingRole = { ...role };
    this.isEditModalOpen = true;
  }

  deleteRole(role: Role) {
    this.roleToDelete = role;
    this.isDeleteModalOpen = true;
  }

  // Métodos del modal de edición
  closeEditModal() {
    this.isEditModalOpen = false;
    this.editingRole = { roleName: '', roleStatus: false };
  }

  async saveRole() {
    if (!this.editingRole.roleName.trim()) {
      alert('El nombre del rol es obligatorio');
      return;
    }

    this.isSaving = true;
    try {
      const roleId = this.editingRole.roleId || this.editingRole.id;

      // Preparar los datos para actualizar
      const updateData: Partial<Role> = {
        roleName: this.editingRole.roleName.trim(),
        roleStatus: this.editingRole.roleStatus,
      };

      // Usar el endpoint PATCH para actualizar el rol
      const response = await this.http
        .patch<Role>(`${this.baseUrl}/${roleId}`, updateData)
        .toPromise();

      // Actualizar el rol en la lista local con la respuesta del servidor
      if (response) {
        const roleIndex = this.roles.findIndex((r) => (r.roleId || r.id) === roleId);
        if (roleIndex !== -1) {
          this.roles[roleIndex] = { ...this.roles[roleIndex], ...response };
        }
      }

      // Recargar los roles para asegurar sincronización
      await this.loadRoles();
      this.closeEditModal();
      this.showToastNotification(
        `Rol "${this.editingRole.roleName}" actualizado exitosamente`,
        'success'
      );
    } catch (error) {
      this.handleSaveError(error);
    } finally {
      this.isSaving = false;
    }
  }

  private handleSaveError(error: unknown) {
    const httpError = error as { status?: number; error?: unknown };

    if (httpError?.status === 404) {
      this.showToastNotification('El rol no fue encontrado. Puede haber sido eliminado.', 'error');
      this.loadRoles();
      this.closeEditModal();
    } else if (httpError?.status === 400) {
      this.showToastNotification('Datos inválidos. Verifica el nombre del rol.', 'error');
    } else if (httpError?.status === 403) {
      this.showToastNotification('No tienes permisos para editar este rol.', 'error');
    } else {
      this.showToastNotification(
        'Error al guardar el rol. Por favor, inténtalo de nuevo.',
        'error'
      );
    }
  }

  // Métodos del modal de eliminación
  closeDeleteModal() {
    this.isDeleteModalOpen = false;
    this.roleToDelete = null;
  }

  async confirmDelete() {
    const roleId = this.roleToDelete?.roleId || this.roleToDelete?.id;
    if (!roleId) {
      return;
    }

    this.isDeleting = true;

    try {
      // Usar el endpoint específico: DELETE http://localhost:3000/roles/{role-id}
      await this.http.delete(`${this.baseUrl}/${roleId}`).toPromise();

      // Recargar la lista de roles después de eliminar exitosamente
      await this.loadRoles();
      const deletedRoleName = this.roleToDelete?.roleName || 'el rol';
      this.closeDeleteModal();
      this.showToastNotification(`Rol "${deletedRoleName}" eliminado exitosamente`, 'success');
    } catch (error) {
      // Manejar errores específicos del servidor
      this.handleDeleteError(error);
    } finally {
      this.isDeleting = false;
    }
  }

  private handleDeleteError(error: unknown) {
    const httpError = error as { status?: number };

    // Si es un error de red o el servidor no está disponible
    if (httpError?.status === 0 || httpError?.status === undefined) {
      // Simular eliminación local para pruebas cuando el servidor no esté disponible
      this.simulateLocalDelete();
    } else if (httpError?.status === 404) {
      // El rol ya no existe
      this.loadRoles(); // Actualizar la lista
      this.closeDeleteModal();
    } else if (httpError?.status === 403) {
      // Sin permisos para eliminar
      this.showToastNotification('No tienes permisos para eliminar este rol', 'error');
    } else {
      // Otro error del servidor
      this.showToastNotification(
        'Error al eliminar el rol. Por favor, inténtalo de nuevo.',
        'error'
      );
    }
  }

  private simulateLocalDelete() {
    const roleIdToDelete = this.roleToDelete?.roleId || this.roleToDelete?.id;
    if (roleIdToDelete) {
      // Eliminar de la lista local para testing
      this.roles = this.roles.filter((role) => (role.roleId || role.id) !== roleIdToDelete);
      this.closeDeleteModal();
    }
  }

  // Métodos del modal de creación
  openCreateModal() {
    this.newRole = { roleName: '', roleStatus: true };
    this.isCreateModalOpen = true;
  }

  closeCreateModal() {
    this.isCreateModalOpen = false;
    this.newRole = { roleName: '', roleStatus: true };
  }

  async createRole() {
    if (!this.newRole.roleName.trim()) {
      this.showToastNotification('El nombre del rol es obligatorio', 'error');
      return;
    }

    this.isCreating = true;
    try {
      const roleData = {
        roleName: this.newRole.roleName.trim(),
        roleStatus: true, // Siempre true como especificaste
      };

      const response = await this.http.post<Role>(this.baseUrl, roleData).toPromise();

      if (response) {
        this.showToastNotification(`Rol "${response.roleName}" creado exitosamente`, 'success');
        await this.loadRoles();
        this.closeCreateModal();
      }
    } catch (error) {
      this.handleCreateError(error);
    } finally {
      this.isCreating = false;
    }
  }

  private handleCreateError(error: unknown) {
    const httpError = error as { status?: number; error?: unknown };

    if (httpError?.status === 400) {
      this.showToastNotification('Datos inválidos. Verifica el nombre del rol.', 'error');
    } else if (httpError?.status === 409) {
      this.showToastNotification('Ya existe un rol con ese nombre.', 'error');
    } else if (httpError?.status === 403) {
      this.showToastNotification('No tienes permisos para crear roles.', 'error');
    } else {
      this.showToastNotification('Error al crear el rol. Por favor, inténtalo de nuevo.', 'error');
    }
  }

  // Métodos de toast notifications
  showToastNotification(message: string, type: 'success' | 'error' | 'info') {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;

    // Auto-hide después de 4 segundos
    setTimeout(() => {
      this.hideToast();
    }, 4000);
  }

  hideToast() {
    this.showToast = false;
  }

  getToastIcon(): string {
    switch (this.toastType) {
      case 'success':
        return 'pi-check-circle';
      case 'error':
        return 'pi-exclamation-triangle';
      case 'info':
      default:
        return 'pi-info-circle';
    }
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

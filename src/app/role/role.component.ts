import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseCrudComponent } from '../shared/components/base-crud.component';
import { EntityConfig } from '../shared/interfaces/base-entity.interface';
import { Role, RoleService } from './role.service';

@Component({
  selector: 'app-role',
  imports: [CommonModule, FormsModule],
  templateUrl: './role.component.html',
  styleUrl: './role.component.scss',
})
export class RoleComponent extends BaseCrudComponent<Role> {
  protected apiService = inject(RoleService);

  protected config: EntityConfig = {
    entityName: 'Rol',
    entityPluralName: 'Roles',
    entityGender: 'm',
    apiEndpoint: 'roles',
    nameField: 'roleName',
    descriptionField: 'description',
    idField: 'roleId',
    statusField: 'roleStatus',
    layout: 'table',
    subtitle: 'Administra los roles del sistema y sus permisos',
    createButtonLabel: 'Crear Rol',
    tableHeaders: {
      name: 'Nombre del Rol',
      status: 'Estado',
      actions: 'Acciones',
    },
  };

  protected createEmptyEntity(): Role {
    return {
      roleName: '',
      roleStatus: true,
      name: '',
      status: true,
    };
  }

  protected validateEntity(entity: Role): boolean {
    if (!entity.roleName?.trim()) {
      this.showToastNotification('El nombre del rol es obligatorio', 'error');
      return false;
    }
    return true;
  }

  override getStatusIcon(roleStatus: boolean): string {
    return roleStatus ? 'pi-check-circle' : 'pi-times-circle';
  }

  getToastIcon(): string {
    return this.notificationServiceRef.toastMessage.icon;
  }

  get roles() {
    return this.entities;
  }

  get editingRole() {
    return this.editingEntity;
  }

  get newRole() {
    return this.newEntity;
  }

  get roleToDelete() {
    return this.entityToDelete;
  }

  editRole(role: Role) {
    this.openEditModal(role);
  }

  deleteRole(role: Role) {
    this.openDeleteModal(role);
  }

  saveRole() {
    return this.saveEntity();
  }

  createRole() {
    return this.createEntity();
  }

  closeEditModalRole() {
    this.closeEditModal();
  }

  closeDeleteModalRole() {
    this.closeDeleteModal();
  }

  closeCreateModalRole() {
    this.closeCreateModal();
  }

  openCreateModalRole() {
    this.openCreateModal();
  }
}

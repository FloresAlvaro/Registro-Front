import { Component, OnInit, HostListener, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  BaseEntity,
  EntityConfig,
  FilterType,
  FilterOption,
} from '../interfaces/base-entity.interface';
import { BaseApiService } from '../services/base-api.service';
import { NotificationService } from '../services/notification.service';

@Component({
  template: '',
  imports: [CommonModule, FormsModule],
  templateUrl: './base-crud.template.html',
})
export abstract class BaseCrudComponent<T extends BaseEntity> implements OnInit {
  protected router = inject(Router);
  protected notificationService = inject(NotificationService);

  // Abstract properties que deben ser implementadas
  protected abstract apiService: BaseApiService<T>;
  protected abstract config: EntityConfig;
  protected abstract createEmptyEntity(): T;

  // Estado del dropdown
  isDropdownOpen = false;

  // Filtros
  selectedFilter: FilterType = 'active';
  selectedFilterLabel = '';

  // Datos
  entities: T[] = [];
  isLoading = false;

  // Modal de edición
  isEditModalOpen = false;
  editingEntity: T = this.createEmptyEntity();
  isSaving = false;

  // Modal de eliminación
  isDeleteModalOpen = false;
  entityToDelete: T | null = null;
  isDeleting = false;

  // Modal de creación
  isCreateModalOpen = false;
  newEntity: T = this.createEmptyEntity();
  isCreating = false;

  // Toast notifications
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' = 'info';
  toastIcon = '';

  // Opciones de filtro - inicializada en ngOnInit
  filterOptions: FilterOption[] = [];

  ngOnInit(): void {
    this.initializeFilterOptions();
    this.initializeFilterLabel();
    this.loadEntities();
  }

  private initializeFilterOptions(): void {
    this.filterOptions = [
      { value: 'all', label: `Todos los ${this.config.entityPluralName}`, icon: 'pi-list' },
      {
        value: 'active',
        label: `${this.config.entityPluralName} activos`,
        icon: 'pi-check-circle',
      },
      {
        value: 'inactive',
        label: `${this.config.entityPluralName} inactivos`,
        icon: 'pi-times-circle',
      },
    ];
  }

  private initializeFilterLabel(): void {
    const activeOption = this.filterOptions.find((option) => option.value === 'active');
    this.selectedFilterLabel = activeOption?.label || `${this.config.entityPluralName} activos`;
  }

  // Gestión de filtros
  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  selectFilter(filter: FilterType, label: string): void {
    this.selectedFilter = filter;
    this.selectedFilterLabel = label;
    this.isDropdownOpen = false;
    this.loadEntities();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.filter-dropdown')) {
      this.isDropdownOpen = false;
    }
  }

  // CRUD Operations
  private async loadEntities(): Promise<void> {
    this.isLoading = true;
    try {
      const data = await this.apiService.getAll().toPromise();
      this.entities = data?.filter((entity) => this.applyFilter(entity)) || [];
    } catch {
      // Error handling - could be enhanced with proper logging service
      this.showToastNotification(`Error al cargar ${this.config.entityPluralName}`, 'error');
    } finally {
      this.isLoading = false;
    }
  }

  private applyFilter(entity: T): boolean {
    switch (this.selectedFilter) {
      case 'active':
        return this.getEntityStatus(entity);
      case 'inactive':
        return !this.getEntityStatus(entity);
      case 'all':
      default:
        return true;
    }
  }

  private getEntityId(entity: T): number {
    return ((entity as Record<string, unknown>)[this.config.idField] as number) || entity.id || 0;
  }

  // Modal Management
  openCreateModal(): void {
    this.newEntity = this.createEmptyEntity();
    this.isCreateModalOpen = true;
  }

  closeCreateModal(): void {
    this.isCreateModalOpen = false;
    this.newEntity = this.createEmptyEntity();
  }

  openEditModal(entity: T): void {
    this.editingEntity = { ...entity };
    this.isEditModalOpen = true;
  }

  closeEditModal(): void {
    this.isEditModalOpen = false;
    this.editingEntity = this.createEmptyEntity();
  }

  openDeleteModal(entity: T): void {
    this.entityToDelete = entity;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen = false;
    this.entityToDelete = null;
  }

  // CRUD Actions
  async saveEntity(): Promise<void> {
    if (!this.validateEntity(this.editingEntity)) {
      return;
    }

    this.isSaving = true;
    try {
      const entityId = this.getEntityId(this.editingEntity);
      await this.apiService.update(entityId, this.editingEntity).toPromise();

      await this.loadEntities();
      this.closeEditModal();
      this.showToastNotification(
        `${this.config.entityName} "${this.getEntityName(this.editingEntity)}" actualizado exitosamente`,
        'success'
      );
    } catch (error: unknown) {
      this.handleApiError(error, 'editar');
    } finally {
      this.isSaving = false;
    }
  }

  async confirmDelete(): Promise<void> {
    if (!this.entityToDelete) return;

    this.isDeleting = true;
    const deletedEntityName = this.getEntityName(this.entityToDelete);
    const entityId = this.getEntityId(this.entityToDelete);

    try {
      await this.apiService.delete(entityId).toPromise();
      await this.loadEntities();
      this.closeDeleteModal();

      this.showToastNotification(
        `${this.config.entityName} "${deletedEntityName}" eliminado exitosamente`,
        'success'
      );
    } catch (error: unknown) {
      this.handleApiError(error, 'eliminar');
    } finally {
      this.isDeleting = false;
    }
  }

  async createEntity(): Promise<void> {
    if (!this.validateEntity(this.newEntity)) {
      return;
    }

    this.isCreating = true;
    try {
      const response = await this.apiService.create(this.newEntity).toPromise();

      if (response) {
        this.showToastNotification(
          `${this.config.entityName} "${this.getEntityName(response)}" creado exitosamente`,
          'success'
        );
        await this.loadEntities();
        this.closeCreateModal();
      }
    } catch (error: unknown) {
      this.handleApiError(error, 'crear');
    } finally {
      this.isCreating = false;
    }
  }

  // Validation - debe ser implementado por cada componente
  protected abstract validateEntity(entity: T): boolean;

  // Error handling
  private handleApiError(error: unknown, action: string): void {
    const errorObj = error as { status?: number };
    if (errorObj.status === 400) {
      this.showToastNotification('Datos inválidos. Verifica la información.', 'error');
    } else if (errorObj.status === 403) {
      this.showToastNotification(
        `No tienes permisos para ${action} este ${this.config.entityName.toLowerCase()}.`,
        'error'
      );
    } else {
      this.showToastNotification(
        `Error al ${action} ${this.config.entityName.toLowerCase()}. Inténtalo nuevamente.`,
        'error'
      );
    }
  }

  // Toast Notifications
  showToastNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    this.notificationService.showToastNotification(message, type);
  }

  hideToast(): void {
    this.notificationService.hideToast();
  }

  // Navigation
  goBack(): void {
    this.router.navigate(['/workspace']);
  }

  // Getters for template
  get filteredEntities(): T[] {
    return this.entities;
  }

  get hasEntities(): boolean {
    return this.entities.length > 0;
  }

  get notificationServiceRef() {
    return this.notificationService;
  }

  // Helper methods for template
  getEntityStatus(entity: T): boolean {
    return (entity as Record<string, unknown>)[this.config.statusField] === true;
  }

  getEntityName(entity: T | null): string {
    if (!entity) return '';
    return ((entity as Record<string, unknown>)[this.config.nameField] as string) || '';
  }

  getEntityDescription(entity: T | null): string {
    if (!entity || !this.config.descriptionField) return '';
    return ((entity as Record<string, unknown>)[this.config.descriptionField] as string) || '';
  }

  getStatusIcon(status: boolean): string {
    return status ? 'pi-check-circle' : 'pi-times-circle';
  }
}

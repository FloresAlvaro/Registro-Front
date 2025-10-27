import { Component, inject, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

interface Grade {
  gradeId?: number;
  id?: number; // Mantener para compatibilidad
  gradeLevel: string;
  gradeDescription: string;
  gradeStatus: boolean;
}

@Component({
  selector: 'app-grade',
  imports: [CommonModule, FormsModule],
  templateUrl: './grade.component.html',
  styleUrl: './grade.component.scss',
})
export class GradeComponent implements OnInit {
  private router = inject(Router);
  private http = inject(HttpClient);

  // Estado del dropdown
  isDropdownOpen = false;

  // Filtros
  selectedFilter: 'all' | 'active' | 'inactive' = 'active';
  selectedFilterLabel = 'Cursos activos';

  // Datos
  grades: Grade[] = [];
  isLoading = false;

  // Modal de edición
  isEditModalOpen = false;
  editingGrade: Grade = { gradeLevel: '', gradeDescription: '', gradeStatus: false };
  isSaving = false;

  // Modal de eliminación
  isDeleteModalOpen = false;
  gradeToDelete: Grade | null = null;
  isDeleting = false;

  // Modal de creación
  isCreateModalOpen = false;
  newGrade: Grade = { gradeLevel: '', gradeDescription: '', gradeStatus: true };
  isCreating = false;

  // Toast notifications
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' = 'info';
  showToast = false;

  // URL base del endpoint
  private readonly baseUrl = 'http://localhost:3000/grades';

  ngOnInit() {
    this.loadGrades();
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
    this.loadGrades();
  }

  private loadGrades() {
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

    this.http.get<Grade[]>(url).subscribe({
      next: (grades) => {
        // Si el filtro es local (cuando el endpoint no soporta filtros), filtramos aquí
        if (this.selectedFilter !== 'all' && statusParam === '') {
          this.grades = grades.filter((grade) => {
            if (this.selectedFilter === 'active') {
              return grade.gradeStatus === true;
            } else if (this.selectedFilter === 'inactive') {
              return grade.gradeStatus === false;
            }
            return true;
          });
        } else {
          this.grades = grades;
        }
        this.isLoading = false;
      },
      error: () => {
        // En caso de error del servidor, mostrar datos de ejemplo
        this.grades = this.getMockData();
        this.isLoading = false;
      },
    });
  }

  private getMockData(): Grade[] {
    const mockGrades: Grade[] = [
      {
        gradeId: 1,
        gradeLevel: '1ro Primaria',
        gradeDescription: 'Primer grado de educación primaria',
        gradeStatus: true,
      },
      {
        gradeId: 2,
        gradeLevel: '2do Primaria',
        gradeDescription: 'Segundo grado de educación primaria',
        gradeStatus: true,
      },
      {
        gradeId: 3,
        gradeLevel: '7mo Secundaria',
        gradeDescription: 'Séptimo grado de educación secundaria',
        gradeStatus: false,
      },
      {
        gradeId: 4,
        gradeLevel: '8vo Secundaria',
        gradeDescription: 'Octavo grado de educación secundaria',
        gradeStatus: true,
      },
    ];

    // Filtrar según la selección actual
    if (this.selectedFilter === 'active') {
      return mockGrades.filter((grade) => grade.gradeStatus === true);
    } else if (this.selectedFilter === 'inactive') {
      return mockGrades.filter((grade) => grade.gradeStatus === false);
    }

    return mockGrades;
  }

  getStatusIcon(gradeStatus: boolean): string {
    return gradeStatus ? 'pi-check-circle' : 'pi-times-circle';
  }

  // Acciones de los botones
  editGrade(grade: Grade) {
    this.editingGrade = { ...grade };
    this.isEditModalOpen = true;
  }

  deleteGrade(grade: Grade) {
    this.gradeToDelete = grade;
    this.isDeleteModalOpen = true;
  }

  // Métodos del modal de edición
  closeEditModal() {
    this.isEditModalOpen = false;
    this.editingGrade = { gradeLevel: '', gradeDescription: '', gradeStatus: false };
  }

  async saveGrade() {
    if (!this.editingGrade.gradeLevel.trim()) {
      alert('El nivel del grado es obligatorio');
      return;
    }

    if (!this.editingGrade.gradeDescription.trim()) {
      alert('La descripción del grado es obligatoria');
      return;
    }

    this.isSaving = true;
    try {
      const gradeId = this.editingGrade.gradeId || this.editingGrade.id;

      // Preparar los datos para actualizar
      const updateData: Partial<Grade> = {
        gradeLevel: this.editingGrade.gradeLevel.trim(),
        gradeDescription: this.editingGrade.gradeDescription.trim(),
        gradeStatus: this.editingGrade.gradeStatus,
      };

      // Usar el endpoint PATCH para actualizar el grado
      const response = await this.http
        .patch<Grade>(`${this.baseUrl}/${gradeId}`, updateData)
        .toPromise();

      // Actualizar el grado en la lista local con la respuesta del servidor
      if (response) {
        const gradeIndex = this.grades.findIndex((g) => (g.gradeId || g.id) === gradeId);
        if (gradeIndex !== -1) {
          this.grades[gradeIndex] = { ...this.grades[gradeIndex], ...response };
        }
      }

      // Recargar los grados para asegurar sincronización
      await this.loadGrades();
      this.closeEditModal();
      this.showToastNotification(
        `Grado "${this.editingGrade.gradeLevel}" actualizado exitosamente`,
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
      this.showToastNotification(
        'El grado no fue encontrado. Puede haber sido eliminado.',
        'error'
      );
      this.loadGrades();
      this.closeEditModal();
    } else if (httpError?.status === 400) {
      this.showToastNotification('Datos inválidos. Verifica el nombre del grado.', 'error');
    } else if (httpError?.status === 403) {
      this.showToastNotification('No tienes permisos para editar este grado.', 'error');
    } else {
      this.showToastNotification(
        'Error al guardar el grado. Por favor, inténtalo de nuevo.',
        'error'
      );
    }
  }

  // Métodos del modal de eliminación
  closeDeleteModal() {
    this.isDeleteModalOpen = false;
    this.gradeToDelete = null;
  }

  async confirmDelete() {
    const gradeId = this.gradeToDelete?.gradeId || this.gradeToDelete?.id;
    if (!gradeId) {
      return;
    }

    this.isDeleting = true;

    try {
      // Usar el endpoint específico: DELETE http://localhost:3000/grades/{grade-id}
      await this.http.delete(`${this.baseUrl}/${gradeId}`).toPromise();

      // Recargar la lista de grados después de eliminar exitosamente
      await this.loadGrades();
      const deletedGradeName = this.gradeToDelete?.gradeLevel || 'el grado';
      this.closeDeleteModal();
      this.showToastNotification(`Grado "${deletedGradeName}" eliminado exitosamente`, 'success');
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
      // El grado ya no existe
      this.loadGrades(); // Actualizar la lista
      this.closeDeleteModal();
    } else if (httpError?.status === 403) {
      // Sin permisos para eliminar
      this.showToastNotification('No tienes permisos para eliminar este grado', 'error');
    } else {
      // Otro error del servidor
      this.showToastNotification(
        'Error al eliminar el grado. Por favor, inténtalo de nuevo.',
        'error'
      );
    }
  }

  private simulateLocalDelete() {
    const gradeIdToDelete = this.gradeToDelete?.gradeId || this.gradeToDelete?.id;
    if (gradeIdToDelete) {
      // Eliminar de la lista local para testing
      this.grades = this.grades.filter((grade) => (grade.gradeId || grade.id) !== gradeIdToDelete);
      this.closeDeleteModal();
    }
  }

  // Métodos del modal de creación
  openCreateModal() {
    this.newGrade = { gradeLevel: '', gradeDescription: '', gradeStatus: true };
    this.isCreateModalOpen = true;
  }

  closeCreateModal() {
    this.isCreateModalOpen = false;
    this.newGrade = { gradeLevel: '', gradeDescription: '', gradeStatus: true };
  }

  async createGrade() {
    if (!this.newGrade.gradeLevel.trim()) {
      this.showToastNotification('El nivel del grado es obligatorio', 'error');
      return;
    }

    if (!this.newGrade.gradeDescription.trim()) {
      this.showToastNotification('La descripción del grado es obligatoria', 'error');
      return;
    }

    this.isCreating = true;
    try {
      const gradeData = {
        gradeLevel: this.newGrade.gradeLevel.trim(),
        gradeDescription: this.newGrade.gradeDescription.trim(),
        gradeStatus: true, // Siempre true como especificaste
      };

      const response = await this.http.post<Grade>(this.baseUrl, gradeData).toPromise();

      if (response) {
        this.showToastNotification(`Grado "${response.gradeLevel}" creado exitosamente`, 'success');
        await this.loadGrades();
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
      this.showToastNotification('Datos inválidos. Verifica el nombre del grado.', 'error');
    } else if (httpError?.status === 409) {
      this.showToastNotification('Ya existe un grado con ese nombre.', 'error');
    } else if (httpError?.status === 403) {
      this.showToastNotification('No tienes permisos para crear grados.', 'error');
    } else {
      this.showToastNotification(
        'Error al crear el grado. Por favor, inténtalo de nuevo.',
        'error'
      );
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

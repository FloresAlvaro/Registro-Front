import { Component, inject, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

interface Subject {
  subjectID?: number;
  id?: number; // Mantener para compatibilidad
  subjectName: string;
  subjectDescription: string;
  subjectStatus: boolean;
}

@Component({
  selector: 'app-subject',
  imports: [CommonModule, FormsModule],
  templateUrl: './subject.component.html',
  styleUrl: './subject.component.scss',
})
export class SubjectComponent implements OnInit {
  private router = inject(Router);
  private http = inject(HttpClient);

  // Estado del dropdown
  isDropdownOpen = false;

  // Filtros
  selectedFilter: 'all' | 'active' | 'inactive' = 'active';
  selectedFilterLabel = 'Materias activas';

  // Datos
  subjects: Subject[] = [];
  isLoading = false;

  // Modal de edición
  isEditModalOpen = false;
  editingSubject: Subject = { subjectName: '', subjectDescription: '', subjectStatus: false };
  isSaving = false;

  // Modal de eliminación
  isDeleteModalOpen = false;
  subjectToDelete: Subject | null = null;
  isDeleting = false;

  // Modal de creación
  isCreateModalOpen = false;
  newSubject: Subject = { subjectName: '', subjectDescription: '', subjectStatus: true };
  isCreating = false;

  // Toast notifications
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' = 'info';
  showToast = false;

  // URL base del endpoint
  private readonly baseUrl = 'http://localhost:3000/subjects';

  ngOnInit() {
    this.loadSubjects();
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
    this.loadSubjects();
  }

  private loadSubjects() {
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

    this.http.get<Subject[]>(url).subscribe({
      next: (subjects) => {
        // Si el filtro es local (cuando el endpoint no soporta filtros), filtramos aquí
        if (this.selectedFilter !== 'all' && statusParam === '') {
          this.subjects = subjects.filter((subject) => {
            if (this.selectedFilter === 'active') {
              return subject.subjectStatus === true;
            } else if (this.selectedFilter === 'inactive') {
              return subject.subjectStatus === false;
            }
            return true;
          });
        } else {
          this.subjects = subjects;
        }
        this.isLoading = false;
      },
      error: () => {
        // En caso de error del servidor, mostrar datos de ejemplo
        this.subjects = this.getMockData();
        this.isLoading = false;
      },
    });
  }

  private getMockData(): Subject[] {
    const mockSubjects: Subject[] = [
      {
        subjectID: 1,
        subjectName: 'Matemática',
        subjectDescription: 'Matemática básica y avanzada',
        subjectStatus: true,
      },
      {
        subjectID: 2,
        subjectName: 'Lenguaje',
        subjectDescription: 'Comprensión lectora y redacción',
        subjectStatus: true,
      },
      {
        subjectID: 3,
        subjectName: 'Ciencias Naturales',
        subjectDescription: 'Biología, química y física básica',
        subjectStatus: false,
      },
      {
        subjectID: 4,
        subjectName: 'Historia',
        subjectDescription: 'Historia universal y nacional',
        subjectStatus: true,
      },
    ];

    // Filtrar según la selección actual
    if (this.selectedFilter === 'active') {
      return mockSubjects.filter((subject) => subject.subjectStatus === true);
    } else if (this.selectedFilter === 'inactive') {
      return mockSubjects.filter((subject) => subject.subjectStatus === false);
    }

    return mockSubjects;
  }

  getStatusIcon(subjectStatus: boolean): string {
    return subjectStatus ? 'pi-check-circle' : 'pi-times-circle';
  }

  // Acciones de los botones
  editSubject(subject: Subject) {
    this.editingSubject = { ...subject };
    this.isEditModalOpen = true;
  }

  deleteSubject(subject: Subject) {
    this.subjectToDelete = subject;
    this.isDeleteModalOpen = true;
  }

  // Métodos del modal de edición
  closeEditModal() {
    this.isEditModalOpen = false;
    this.editingSubject = { subjectName: '', subjectDescription: '', subjectStatus: false };
  }

  async saveSubject() {
    if (!this.editingSubject.subjectName.trim()) {
      alert('El nombre de la materia es obligatorio');
      return;
    }

    if (!this.editingSubject.subjectDescription.trim()) {
      alert('La descripción de la materia es obligatoria');
      return;
    }

    this.isSaving = true;
    try {
      const subjectId = this.editingSubject.subjectID || this.editingSubject.id;

      // Preparar los datos para actualizar
      const updateData: Partial<Subject> = {
        subjectName: this.editingSubject.subjectName.trim(),
        subjectDescription: this.editingSubject.subjectDescription.trim(),
        subjectStatus: this.editingSubject.subjectStatus,
      };

      // Usar el endpoint PATCH para actualizar la materia
      const response = await this.http
        .patch<Subject>(`${this.baseUrl}/${subjectId}`, updateData)
        .toPromise();

      // Actualizar la materia en la lista local con la respuesta del servidor
      if (response) {
        const subjectIndex = this.subjects.findIndex((s) => (s.subjectID || s.id) === subjectId);
        if (subjectIndex !== -1) {
          this.subjects[subjectIndex] = { ...this.subjects[subjectIndex], ...response };
        }
      }

      // Recargar las materias para asegurar sincronización
      await this.loadSubjects();
      this.closeEditModal();
      this.showToastNotification(
        `Materia "${this.editingSubject.subjectName}" actualizada exitosamente`,
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
        'La materia no fue encontrada. Puede haber sido eliminada.',
        'error'
      );
      this.loadSubjects();
      this.closeEditModal();
    } else if (httpError?.status === 400) {
      this.showToastNotification('Datos inválidos. Verifica el nombre de la materia.', 'error');
    } else if (httpError?.status === 403) {
      this.showToastNotification('No tienes permisos para editar esta materia.', 'error');
    } else {
      this.showToastNotification(
        'Error al guardar la materia. Por favor, inténtalo de nuevo.',
        'error'
      );
    }
  }

  // Métodos del modal de eliminación
  closeDeleteModal() {
    this.isDeleteModalOpen = false;
    this.subjectToDelete = null;
  }

  async confirmDelete() {
    const subjectId = this.subjectToDelete?.subjectID || this.subjectToDelete?.id;
    if (!subjectId) {
      return;
    }

    this.isDeleting = true;

    try {
      // Usar el endpoint específico: DELETE http://localhost:3000/subjects/{subject-id}
      await this.http.delete(`${this.baseUrl}/${subjectId}`).toPromise();

      // Recargar la lista de materias después de eliminar exitosamente
      await this.loadSubjects();
      const deletedSubjectName = this.subjectToDelete?.subjectName || 'la materia';
      this.closeDeleteModal();
      this.showToastNotification(
        `Materia "${deletedSubjectName}" eliminada exitosamente`,
        'success'
      );
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
      // La materia ya no existe
      this.loadSubjects(); // Actualizar la lista
      this.closeDeleteModal();
    } else if (httpError?.status === 403) {
      // Sin permisos para eliminar
      this.showToastNotification('No tienes permisos para eliminar esta materia', 'error');
    } else {
      // Otro error del servidor
      this.showToastNotification(
        'Error al eliminar la materia. Por favor, inténtalo de nuevo.',
        'error'
      );
    }
  }

  private simulateLocalDelete() {
    const subjectIdToDelete = this.subjectToDelete?.subjectID || this.subjectToDelete?.id;
    if (subjectIdToDelete) {
      // Eliminar de la lista local para testing
      this.subjects = this.subjects.filter(
        (subject) => (subject.subjectID || subject.id) !== subjectIdToDelete
      );
      this.closeDeleteModal();
    }
  }

  // Métodos del modal de creación
  openCreateModal() {
    this.newSubject = { subjectName: '', subjectDescription: '', subjectStatus: true };
    this.isCreateModalOpen = true;
  }

  closeCreateModal() {
    this.isCreateModalOpen = false;
    this.newSubject = { subjectName: '', subjectDescription: '', subjectStatus: true };
  }

  async createSubject() {
    if (!this.newSubject.subjectName.trim()) {
      this.showToastNotification('El nombre de la materia es obligatorio', 'error');
      return;
    }

    if (!this.newSubject.subjectDescription.trim()) {
      this.showToastNotification('La descripción de la materia es obligatoria', 'error');
      return;
    }

    this.isCreating = true;
    try {
      const subjectData = {
        subjectName: this.newSubject.subjectName.trim(),
        subjectDescription: this.newSubject.subjectDescription.trim(),
        subjectStatus: true, // Siempre true como especificaste
      };

      const response = await this.http.post<Subject>(this.baseUrl, subjectData).toPromise();

      if (response) {
        this.showToastNotification(
          `Materia "${response.subjectName}" creada exitosamente`,
          'success'
        );
        await this.loadSubjects();
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
      this.showToastNotification('Datos inválidos. Verifica el nombre de la materia.', 'error');
    } else if (httpError?.status === 409) {
      this.showToastNotification('Ya existe una materia con ese nombre.', 'error');
    } else if (httpError?.status === 403) {
      this.showToastNotification('No tienes permisos para crear materias.', 'error');
    } else {
      this.showToastNotification(
        'Error al crear la materia. Por favor, inténtalo de nuevo.',
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

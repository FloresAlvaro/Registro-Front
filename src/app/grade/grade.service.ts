import { Injectable } from '@angular/core';
import { BaseApiService } from '../shared/services/base-api.service';
import { BaseEntity } from '../shared/interfaces/base-entity.interface';

export interface Grade extends BaseEntity {
  gradeId?: number;
  gradeLevel: string;
  gradeDescription: string;
  gradeStatus: boolean;
  // BaseEntity mappings
  name: string; // Maps to gradeLevel
  status: boolean; // Maps to gradeStatus
  description: string; // Maps to gradeDescription
}

@Injectable({
  providedIn: 'root',
})
export class GradeService extends BaseApiService<Grade> {
  protected apiUrl = 'http://localhost:3000/grades';
}

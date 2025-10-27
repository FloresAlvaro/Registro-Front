import { Injectable } from '@angular/core';
import { BaseApiService } from '../shared/services/base-api.service';
import { BaseEntity } from '../shared/interfaces/base-entity.interface';

export interface Subject extends BaseEntity {
  subjectID?: number;
  subjectName: string;
  subjectDescription: string;
  subjectStatus: boolean;
  // BaseEntity mappings
  name: string; // Maps to subjectName
  status: boolean; // Maps to subjectStatus
  description: string; // Maps to subjectDescription
}

@Injectable({
  providedIn: 'root',
})
export class SubjectService extends BaseApiService<Subject> {
  protected apiUrl = 'http://localhost:3000/subjects';
}

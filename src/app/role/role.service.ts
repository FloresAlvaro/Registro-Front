import { Injectable } from '@angular/core';
import { BaseApiService } from '../shared/services/base-api.service';
import { BaseEntity } from '../shared/interfaces/base-entity.interface';

export interface Role extends BaseEntity {
  roleId?: number;
  roleName: string;
  roleStatus: boolean;
  description?: string;
  permissions?: string[];
  // BaseEntity mappings
  name: string; // Maps to roleName
  status: boolean; // Maps to roleStatus
}

@Injectable({
  providedIn: 'root',
})
export class RoleService extends BaseApiService<Role> {
  protected apiUrl = 'http://localhost:3000/roles';
}

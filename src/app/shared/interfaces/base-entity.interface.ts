export interface BaseEntity {
  id?: number;
  status: boolean;
  name: string;
  description?: string;
}

export interface EntityConfig {
  entityName: string;
  entityPluralName: string;
  entityGender: 'm' | 'f'; // masculino o femenino para artículos
  apiEndpoint: string;
  nameField: string;
  descriptionField?: string;
  idField: string;
  statusField: string;
  layout: 'table' | 'grid';
  subtitle?: string;
  createButtonLabel?: string;
  tableHeaders?: {
    name?: string;
    status?: string;
    actions?: string;
  };
}

// Filtro types
export type FilterType = 'all' | 'active' | 'inactive';

export interface FilterOption {
  value: FilterType;
  label: string;
  icon: string;
}

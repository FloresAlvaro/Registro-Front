import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Role } from './role.component';

describe('Role', () => {
  let component: Role;
  let fixture: ComponentFixture<Role>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Role],
    }).compileComponents();

    fixture = TestBed.createComponent(Role);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

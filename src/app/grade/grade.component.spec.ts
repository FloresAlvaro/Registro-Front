import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Grade } from './grade.component';

describe('Grade', () => {
  let component: Grade;
  let fixture: ComponentFixture<Grade>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Grade],
    }).compileComponents();

    fixture = TestBed.createComponent(Grade);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

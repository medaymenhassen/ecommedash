import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrgComponent } from './org.component';

describe('OrgComponent', () => {
  let component: OrgComponent;
  let fixture: ComponentFixture<OrgComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrgComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrgComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

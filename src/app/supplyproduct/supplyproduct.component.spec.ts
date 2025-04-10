import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupplyproductComponent } from './supplyproduct.component';

describe('SupplyproductComponent', () => {
  let component: SupplyproductComponent;
  let fixture: ComponentFixture<SupplyproductComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupplyproductComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SupplyproductComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

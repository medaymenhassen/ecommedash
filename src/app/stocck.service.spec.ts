import { TestBed } from '@angular/core/testing';

import { StocckService } from './stocck.service';

describe('StocckService', () => {
  let service: StocckService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StocckService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

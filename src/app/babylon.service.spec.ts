import { TestBed } from '@angular/core/testing';

import { BabylonService } from './babylon.service';

describe('BabylonService', () => {
  let service: BabylonService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BabylonService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

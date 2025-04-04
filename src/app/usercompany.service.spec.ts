import { TestBed } from '@angular/core/testing';

import { UsercompanyService } from './usercompany.service';

describe('UsercompanyService', () => {
  let service: UsercompanyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UsercompanyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

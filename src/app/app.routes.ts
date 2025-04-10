import { Routes } from '@angular/router';
import { RegisterComponent } from './register/register.component';
import { authGuard } from './auth.guard';
import { HomeComponent } from './home/home.component';
import { AttributeComponent } from './attribute/attribute.component';
import { StockComponent } from './stock/stock.component';
import { ClientComponent } from './client/client.component';
import { CompanyComponent } from './company/company.component';
import { SupplyComponent } from './supply/supply.component';
import { SupplyproductComponent } from './supplyproduct/supplyproduct.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'attribut', component: AttributeComponent, canActivate: [authGuard] },
  { path: 'analyse', component: StockComponent },
  { path: 'client', component: ClientComponent },
  { path: 'mycompany', component: CompanyComponent, canActivate: [authGuard] },
  { path: 'join/:token', component: CompanyComponent, canActivate: [authGuard] },
  { path: 'supply', component: SupplyComponent, canActivate: [authGuard] },
  { path: 'product', component: SupplyproductComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '', pathMatch: 'full' }
];

import { Routes } from '@angular/router';
import { RegisterComponent } from './register/register.component';
import { authGuard } from './auth.guard';
import { SettingComponent } from './setting/setting.component';
import { HomeComponent } from './home/home.component';
import { ProductComponent } from './product/product.component';
import { BrandComponent } from './brand/brand.component';
import { SizeComponent } from './size/size.component';
import { LengthComponent } from './length/length.component';
import { AttributeComponent } from './attribute/attribute.component';
import { ShopaddressComponent } from './shopaddress/shopaddress.component';
import { ProductlistComponent } from './productlist/productlist.component';
import { CartComponent } from './cart/cart.component';
import { ProductdetailComponent } from './productdetail/productdetail.component';
import { CategoriesComponent } from './categories/categories.component';
import { ColorComponent } from './color/color.component';
import { StockComponent } from './stock/stock.component';
import { ClientComponent } from './client/client.component';
import { CompanyComponent } from './company/company.component';
import { SupplyComponent } from './supply/supply.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'settings', component: SettingComponent, canActivate: [authGuard] },
  { path: 'product', component: ProductComponent },
  { path: 'update/:id', component: ProductComponent, canActivate: [authGuard] },
  { path: 'categories', component: CategoriesComponent, canActivate: [authGuard] },
  { path: 'brand', component: BrandComponent, canActivate: [authGuard] },
  { path: 'color', component: ColorComponent, canActivate: [authGuard] },
  { path: 'size', component: SizeComponent, canActivate: [authGuard] },
  { path: 'length', component: LengthComponent, canActivate: [authGuard] },
  { path: 'attribut', component: AttributeComponent, canActivate: [authGuard] },
  { path: 'address', component: ShopaddressComponent, canActivate: [authGuard] },
  { path: 'liste', component: ProductlistComponent},
  { path: 'product/:slug', component: ProductdetailComponent}, // Route pour le détail du produit
  { path: 'cart', component: CartComponent, canActivate: [authGuard] },
  { path: 'analyse', component: StockComponent },
  { path: 'client', component: ClientComponent },
  { path: 'mycompany', component: CompanyComponent, canActivate: [authGuard] },
  { path: 'join/:token', component: CompanyComponent, canActivate: [authGuard] },
  { path: 'supply', component: SupplyComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '', pathMatch: 'full' }
];

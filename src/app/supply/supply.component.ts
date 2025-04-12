import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { HistoryProduct, Supply, User, UsercompanyService } from '../usercompany.service';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { Product } from '../auth.service';
Chart.register(...registerables);

@Component({
  selector: 'app-supply',
  standalone: true,
  imports: [CommonModule,ReactiveFormsModule,FormsModule],
  templateUrl: './supply.component.html',
  styleUrl: './supply.component.css'
})

export class SupplyComponent implements OnInit, AfterViewInit {
  showHistory = false;
  isMobile = false;

  toggleProduct() {
    this.isMobile = !this.isMobile;
  }

  toggleHistory() {
    this.showHistory = !this.showHistory;
  }
  accessLink: string | null = null;

  supplyForm!: FormGroup;
  productForm!: FormGroup;
  supplies: Supply[] = [];
  selectedSupply: Supply | null = null;
  currentCompanyId: number | null = null;
  private _selectedProduct: Product | null = null;
  currentUser: User | null = null;  // Déclaration de la variable currentUser

  @ViewChild('productChart') productChartRef!: ElementRef;
  private historyChart!: Chart;

  set selectedProduct(product: Product | null) {
    this._selectedProduct = product;
    if (product) {
      // Réinitialiser le formulaire avec les valeurs du produit sélectionné
      this.productForm.patchValue({
        quantityToSell: 0,
        lifo: product.lifo,
        supply: product.supplyId
      });
    }
  }

  get selectedProduct(): Product | null {
    return this._selectedProduct;
  }

  constructor(
    private fb: FormBuilder,
    private supplyService: UsercompanyService,
    private route: ActivatedRoute,
    private router: Router
  ) { }
  ngOnInit(): void {

    this.supplyService.getUserProfile().subscribe({
      next: user => {
        this.currentUser = user;
        console.log('Utilisateur récupéré depuis le token :', user);
      },
      error: err => {
        console.error('Erreur récupération user', err);
      }
    });
    
    this.initForm();
    this.route.queryParams.subscribe(params => {
      const rawId = params['companyId'];
      const companyId = Number(rawId);

      if (!isNaN(companyId) && companyId > 0) {
        this.currentCompanyId = companyId;
        this.getSuppliesByCompany(companyId);
      } else {
        this.supplies = [];
      }
    });
  }



  

  /*

  createFournisseurPurchaseChart() {
    const fournisseurData = this.fournisseurs.map(fournisseur => ({
      label: fournisseur.nom,
      data: fournisseur.historiqueachat ? fournisseur.historiqueachat.map(p => p.price) : [0], // Évite le bug si `historiqueachat` est undefined
      borderWidth: 1
    }));

    const chartConfig: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels: this.fournisseurs.map(f => f.nom),
        datasets: fournisseurData
      },
      options: {
        scales: {
          y: { title: { display: true, text: 'Prix des produits' } }
        }
      }
    };

    this.fournisseurChart = new Chart(this.fournisseurChartRef.nativeElement, chartConfig);
  }*/

  // ✅ Initialisation du formulaire avec FormArray pour les produits
  initForm(): void {
    this.productForm = this.fb.group({
      quantityToSell: [0, [Validators.required, Validators.min(1)]],
      lifo: [this.selectedProduct ? this.selectedProduct.lifo : false], // Valeur basée sur `selectedProduct`
    });
    this.supplyForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      totalAmt: [100, Validators.required],
      companiesIds: [this.currentCompanyId],
      products: this.fb.array([]), // important
    });
  }

  viewProduct(supplyId: number): void {
    this.router.navigate(['/product'], { queryParams: { supplyId } });
  }


  // ✅ Accès aux produits dans le FormArray
  /*get products(): FormArray {
    return this.supplyForm.get('products') as FormArray;
  }*/



  // ✅ Supprimer un produit du FormArray
  /*removeProduct(index: number): void {
    this.products.removeAt(index);
  }*/

  getSuppliesByCompany(companyId: number): void {
    this.supplyService.getSuppliesByCompanyId(companyId).subscribe(
      (supplies) => {
        this.supplies = supplies;
        this.loadProductsForSupplies();
      },
      (error) => console.error('Erreur supplies:', error)
    );
  }

  private loadProductsForSupplies(): void {
    this.supplies.forEach(supply => {
      if (supply.id) {
        this.supplyService.getProductsByCompany(supply.id).subscribe(
          (products) => {
            // Ajout de supplyId à chaque produit
            supply.products = products.map(product => ({
              ...product,
              supplyId: supply.id // Associe l'id du fournisseur au produit
            }));
          },
          (error) => {
            console.error('Erreur produits:', error);
          }
        );
        this.getHistoryBySupply(supply.id);
      }
    });
  }

  sellProduct(): void {
    if (!this.selectedProduct?.id || !this.productForm.get('quantityToSell')?.valid) {
      return;
    }

    const quantity = this.productForm.get('quantityToSell')?.value;

    this.supplyService.updateProductQuantity(
      this.selectedProduct.id.toString(), // Supprime explicitement undefined
      this.selectedProduct.title,
      -quantity, // Conversion en négatif
      this.productForm.get('lifo')?.value,
      this.selectedProduct.supplyId ?? 0
    ).subscribe({
      next: () => {
        this.loadProductsForSupplies();  // Recharge les produits pour mettre à jour la vue
        this.productForm.get('quantityToSell')?.reset(0);
        this.selectedProduct = null;
      },
      error: (error) => {
        console.error('Erreur de vente', error);
      }
    });
  }

  increaseStock(): void {
    if (!this.selectedProduct?.id || !this.productForm.get('quantityToSell')?.valid) {
      return;
    }

    const quantity = this.productForm.get('quantityToSell')?.value;

    this.supplyService.updateProductQuantity(
      this.selectedProduct.id.toString(),
      this.selectedProduct.title,
      quantity, // Ajout de stock
      this.productForm.get('lifo')?.value,
      this.selectedProduct.supplyId ?? 0
    ).subscribe({
      next: () => {
        this.loadProductsForSupplies();  // Recharge les produits pour mettre à jour la vue
        this.productForm.get('quantityToSell')?.reset(0);
        this.selectedProduct = null;
      },
      error: (error) => {
        console.error('Erreur d\'ajout de stock', error);
      }
    });
  }



  onSubmit(): void {
    if (!this.currentCompanyId) {
      console.error('Impossible d\'envoyer : companyId non défini');
      return;
    }

    const formData = new FormData();
    formData.append('name', this.supplyForm.value.name);
    formData.append('email', this.supplyForm.value.email);
    formData.append('totalAmt', this.supplyForm.value.totalAmt.toString());

    // Ensure companiesIds is valid
    const companiesIds = this.supplyForm.value.companiesIds || this.currentCompanyId;
    formData.append('companies', companiesIds.toString());

    if (this.supplyForm.value.products && this.supplyForm.value.products.length > 0) {
      formData.append('products', JSON.stringify(this.supplyForm.value.products));
    }

    if (this.selectedSupply) {
      // Update existing supply
      this.supplyService.updateSupply(this.selectedSupply.id!, formData).subscribe(() => {
        this.getSuppliesByCompany(this.currentCompanyId!);
        this.resetForm();
      });
    } else {
      // Create new supply
      this.supplyService.createSupply(formData).subscribe(() => {
        this.getSuppliesByCompany(this.currentCompanyId!);
        this.resetForm();
      });
    }
  }

  // ✅ Modifier une supply existante
  editSupply(supply: Supply): void {
    this.selectedSupply = supply;
    this.supplyForm.patchValue({
      name: supply.name,
      email: supply.email,
      totalAmt: supply.totalAmt,
      companiesIds: supply.companiesIds
    });
  }

  // ✅ Supprimer une supply
  deleteSupply(id?: number): void {
    if (id !== undefined) {
      this.supplyService.deleteSupply(id).subscribe(() => {
        if (this.currentCompanyId) {
          this.getSuppliesByCompany(this.currentCompanyId);
        }
      });
    }
  }

  // ✅ Réinitialiser le formulaire
  resetForm(): void {
    this.supplyForm.reset();
    this.selectedSupply = null;
  }







  historyProducts: HistoryProduct[] = [];
  totalQuantity: number = 0;

  private formatDate(date: Date, period: 'hour' | 'day' | 'month' | 'quarter' | 'semester' | 'year'): string {
    switch (period) {
      case 'hour':
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      case 'day':
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      case 'month':
        return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
      case 'quarter':
        return `T${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`;
      case 'semester':
        return `S${Math.floor(date.getMonth() / 6) + 1} ${date.getFullYear()}`;
      case 'year':
        return date.getFullYear().toString();
    }
  }
  ngAfterViewInit(): void {
    if (!this.productChartRef?.nativeElement) {
      console.error('Référence au canvas manquante');
      return;
    }

    this.createHistoryProductChart();
    this.createPieCharts()
  }

  private getHistoryBySupply(supplyId: number): void {
    console.log('SupplyId envoyé au service :', supplyId);

    this.supplyService.getGrapgicsBySupply(supplyId).subscribe({
      next: (history) => {
        console.log('Réponse brute API getGrapgicsBySupply :', history);

        if (!history || history.length === 0) {
          console.warn('Aucune donnée disponible pour créer le graphique.');
          this.historyProducts = [];
          return;
        }

        this.historyProducts = history;
        this.calculateTotalQuantity();
        this.logPositiveAndNegativeQuantities();

        if (this.productChartRef) {
          this.createHistoryProductChart();
        }
      },
      error: (error) => {
        console.error('Erreur lors de la récupération de l\'historique :', error);
      }
    });
  }

  calculateTotalQuantity(): void {
    this.totalQuantity = this.historyProducts.reduce((sum, item) => sum + item.quantity, 0);
    console.log('Somme totale des quantités :', this.totalQuantity);
  }



  private groupDataByPeriod(
    data: { date: string; quantity: number }[],
    periodType: 'hour' | 'day' | 'month' | 'quarter' | 'semester' | 'year'
  ): { date: string; quantity: number }[] {
    const grouped: { [key: string]: number } = {};

    data.forEach(entry => {
      const date = new Date(entry.date);
      const key = this.formatDate(date, periodType);

      if (!grouped[key]) {
        grouped[key] = 0;
      }
      grouped[key] += entry.quantity;
    });

    return Object.entries(grouped).map(([date, quantity]) => ({
      date,
      quantity
    }));
  }

  onPeriodChange(event: Event): void {
    const selectedPeriod = (event.target as HTMLSelectElement).value as 'hour' | 'day' | 'month' | 'quarter' | 'semester' | 'year';
    this.createHistoryProductChart(selectedPeriod);
  }


  private destroyChart(chart?: Chart) {
    chart?.destroy();
  }

  createHistoryProductChart(period: 'hour' | 'day' | 'month' | 'quarter' | 'semester' | 'year' = 'day'): void {
    if (!this.productChartRef?.nativeElement) {
      console.error('Référence au canvas manquante');
      return;
    }

    if (!this.historyProducts || this.historyProducts.length === 0) {
      console.error('Données manquantes pour créer le graphique principal ou les graphiques Pie.');
      return;
    }

    // Crée le graphique linéaire (existant)
    this.destroyChart(this.historyChart);

    const historyData = this.historyProducts
      .map(h => ({ date: h.dateEvent, quantity: h.quantity }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const groupedData = this.groupDataByPeriod(historyData, period);

    this.historyChart = new Chart(this.productChartRef.nativeElement, {
      type: 'line',
      data: {
        labels: groupedData.map(g => g.date),
        datasets: [{
          label: 'Historique des quantités',
          data: groupedData.map(g => g.quantity),
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true }
        }
      }
    });

    // Crée les graphiques Pie
    this.createPieCharts();
  }

  getKeys = Object.keys; // Déclaration dans la classe


  // Données initiales
  positiveQuantityProducts: { id: number; quantity: number; product: Product; supply: Supply }[] = [];
  negativeQuantityProducts: { id: number; quantity: number; product: Product; supply: Supply }[] = [];

  private logPositiveAndNegativeQuantities(): void {
    if (!this.historyProducts || this.historyProducts.length === 0) {
      return;
    }

    this.positiveQuantityProducts = this.historyProducts.filter(product => product.quantity > 0);
    this.negativeQuantityProducts = this.historyProducts.filter(product => product.quantity < 0);

  }

  // Fonctions utilitaires
  private getUniqueSupplies(products: { supply: Supply }[]): string[] {
    return [...new Set(products.map(p => p.supply.name))];
  }

  private getQuantitiesBySupply(products: { supply: Supply; quantity: number }[]): number[] {
    return this.getUniqueSupplies(products).map(supplyName => {
      return products
        .filter(p => p.supply.name === supplyName)
        .reduce((sum, p) => sum + Math.abs(p.quantity), 0);
    });
  }

  private getUniqueProducts(products: { product: Product }[]): string[] {
    return [...new Set(products.map(p => p.product.title))];
  }

  private getQuantitiesByProduct(products: { product: Product; quantity: number }[]): number[] {
    return this.getUniqueProducts(products).map(productName => {
      return products
        .filter(p => p.product.title === productName)
        .reduce((sum, p) => sum + Math.abs(p.quantity), 0);
    });
  }
  

  private pieCharts: { [key: string]: Chart } = {};


  private createPieCharts(): void {
    const salesBySupplyLabels = this.getUniqueSupplies(this.negativeQuantityProducts);
    const salesBySupplyData = this.getQuantitiesBySupply(this.negativeQuantityProducts);

    const purchasesBySupplyLabels = this.getUniqueSupplies(this.positiveQuantityProducts);
    const purchasesBySupplyData = this.getQuantitiesBySupply(this.positiveQuantityProducts);

    const salesByProductLabels = this.getUniqueProducts(this.negativeQuantityProducts);
    const salesByProductData = this.getQuantitiesByProduct(this.negativeQuantityProducts);

    const purchasesByProductLabels = this.getUniqueProducts(this.positiveQuantityProducts);
    const purchasesByProductData = this.getQuantitiesByProduct(this.positiveQuantityProducts);

    // Créer les graphiques
    this.createPieChart('salesBySupplyChart', salesBySupplyLabels, salesBySupplyData, 'Ventes par fournisseur');
    this.createPieChart('purchasesBySupplyChart', purchasesBySupplyLabels, purchasesBySupplyData, 'Achats par fournisseur');
    this.createPieChart('salesByProductChart', salesByProductLabels, salesByProductData, 'Ventes par produit');
    this.createPieChart('purchasesByProductChart', purchasesByProductLabels, purchasesByProductData, 'Achats par produit');
  }

  private createPieChart(canvasId: string, labels: string[], data: number[], title: string): void {
    if (!labels?.length || !data?.length) {
      console.warn(`Données manquantes pour le graphique "${title}".`);
      return;
    }

    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) {
      console.error(`Canvas avec l'ID ${canvasId} introuvable.`);
      return;
    }

    // Détruire l'ancien graphique s'il existe
    if (this.pieCharts[canvasId]) {
      this.pieCharts[canvasId].destroy();
    }

    // Créer un nouveau graphique
    this.pieCharts[canvasId] = new Chart(canvas, {
      type: 'pie',
      data: {
        labels,
        datasets: [{
          label: title,
          data,
          backgroundColor: [
            'rgb(255, 99, 132)',
            'rgb(54, 162, 235)',
            'rgb(255, 205, 86)',
            'rgb(75, 192, 192)',
            'rgb(153, 102, 255)'
          ]
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: { display: true, text: title }
        }
      }
    });
  }


generateAccessLink(companyId: number): void {
  if (!companyId) {
    console.error('companyId is invalid or undefined');
    return;
  }
  this.supplyService.generateAccessLink(companyId).subscribe({
    next: (res: any) => {
      this.accessLink = res.url;
      setTimeout(() => this.accessLink = null, 3600000);
    },
    error: (err) => console.error('Erreur génération lien', err)
  });
}

}

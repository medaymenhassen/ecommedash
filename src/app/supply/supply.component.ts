import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { HistoryProduct, Supply, UsercompanyService } from '../usercompany.service';
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
  supplyForm!: FormGroup;
  productForm!: FormGroup;
  supplies: Supply[] = [];
  selectedSupply: Supply | null = null;
  currentCompanyId: number | null = null;
  private _selectedProduct: Product | null = null;
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
    if (this.selectedProduct) {
      console.log('Valeur de selectedProduct:', this.selectedProduct); // Vérification de l'objet complet
      console.log('Valeur de lifo:', this.selectedProduct.lifo); // Vérification du lifo
    }
    this.initForm();
    this.route.queryParams.subscribe(params => {
      const rawId = params['companyId'];
      const companyId = Number(rawId);

      if (!isNaN(companyId) && companyId > 0) {
        this.currentCompanyId = companyId;
        this.getSuppliesByCompany(companyId);
      } else {
        console.error('ID entreprise invalide:', rawId);
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
      totalAmt: [0, Validators.required],
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
        this.classifyProductsByQuantity();

        // Récupérer l'historique après les produits
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
    if (this.supplies.length > 0 && this.supplies.some(s => s.products && s.products.length > 0)) {
      this.classifyProductsByQuantity();
    }
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
















  // Propriétés pour stocker les données classées
  positiveQuantityProducts: any[] = [];
  negativeQuantityProducts: any[] = [];
  positiveSupplyData: any = {};
  negativeSupplyData: any = {};

  @ViewChild('positiveProductChart') positiveProductChartRef!: ElementRef;
  @ViewChild('negativeProductChart') negativeProductChartRef!: ElementRef;
  @ViewChild('positiveSupplyChart') positiveSupplyChartRef!: ElementRef;
  @ViewChild('negativeSupplyChart') negativeSupplyChartRef!: ElementRef;


  private positiveProductChart!: Chart;
  private negativeProductChart!: Chart;
  private positiveSupplyChart!: Chart;
  private negativeSupplyChart!: Chart;


  createHistoryProductChart(period: 'hour' | 'day' | 'month' | 'quarter' | 'semester' | 'year' = 'day') {
    if (!this.productChartRef?.nativeElement) {
      console.error('Référence au canvas manquante');
      return;
    }

    if (!this.historyProducts.length) {
      console.error('Données manquantes pour créer le graphique');
      return;
    }

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
  }
  private classifyProductsByQuantity(): void {
    // Réinitialiser les données
    this.positiveQuantityProducts = [];
    this.negativeQuantityProducts = [];
    this.positiveSupplyData = {};
    this.negativeSupplyData = {};

    this.historyProducts.forEach(historyEntry => {
      if (!historyEntry.supply) return; // Sécurité

      const entryWithAbs = {
        ...historyEntry,
        absQte: Math.abs(historyEntry.quantity),
      };

      const supplyName = historyEntry.supply.name;

      if (historyEntry.quantity > 0) {
        this.positiveQuantityProducts.push(entryWithAbs);
        this.positiveSupplyData[supplyName] =
          (this.positiveSupplyData[supplyName] || 0) + entryWithAbs.absQte;
      } else {
        this.negativeQuantityProducts.push(entryWithAbs);
        this.negativeSupplyData[supplyName] =
          (this.negativeSupplyData[supplyName] || 0) + entryWithAbs.absQte;
      }
    });

    this.createAllPieCharts();
  }


  // À ajouter à ngAfterViewInit() ou appeler après le chargement des données
  /*private createAllPieCharts(): void {
    // Détruire les graphiques existants si nécessaire
    this.destroyChart(this.positiveProductChart);
    this.destroyChart(this.negativeProductChart);
    this.destroyChart(this.positiveSupplyChart);
    this.destroyChart(this.negativeSupplyChart);

    // Créer les diagrammes
    this.createPositiveProductChart();
    this.createNegativeProductChart();
    this.createPositiveSupplyChart();
    this.createNegativeSupplyChart();
  }*/

  private createPositiveProductChart(): void {
    if (!this.positiveProductChartRef?.nativeElement || this.positiveQuantityProducts.length === 0) {
      console.warn('Canvas manquant ou pas de données positives');
      return;
    }

    // Préparer les données
    const labels = this.positiveQuantityProducts.map(p => p.title);
    const data = this.positiveQuantityProducts.map(p => p.absQte);

    // Créer le graphique
    this.positiveProductChart = new Chart(this.positiveProductChartRef.nativeElement, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: this.generateColors(data.length),
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Produits avec quantité positive'
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const total = context.dataset.data.reduce((sum: any, val: any) => sum + val, 0);
                const value = context.raw as number;
                const percentage = ((value / total) * 100).toFixed(1);
                return `${context.label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }

  private createNegativeProductChart(): void {
    if (!this.negativeProductChartRef?.nativeElement || this.negativeQuantityProducts.length === 0) {
      console.warn('Canvas manquant ou pas de données négatives');
      return;
    }

    // Préparer les données
    const labels = this.negativeQuantityProducts.map(p => p.title);
    const data = this.negativeQuantityProducts.map(p => p.absQte);

    // Créer le graphique
    this.negativeProductChart = new Chart(this.negativeProductChartRef.nativeElement, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: this.generateColors(data.length),
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Produits avec quantité négative ou nulle'
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const total = context.dataset.data.reduce((sum: any, val: any) => sum + val, 0);
                const value = context.raw as number;
                const percentage = ((value / total) * 100).toFixed(1);
                return `${context.label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }

  getKeys = Object.keys; // Déclaration dans la classe

  /*private createPositiveSupplyChart(): void {
    if (!this.positiveSupplyChartRef?.nativeElement || Object.keys(this.positiveSupplyData).length === 0) {
      console.warn('Canvas manquant ou pas de données de fournisseurs positives');
      return;
    }

    // Préparer les données
    const labels = Object.keys(this.positiveSupplyData);
    const data = Object.values(this.positiveSupplyData);

    // Créer le graphique
    this.positiveSupplyChart = new Chart(this.positiveSupplyChartRef.nativeElement, {
      type: 'pie',
      data: {
        labels: this.positiveQuantityProducts.map(p => p.title),
        datasets: [{
          data: this.positiveQuantityProducts.map(p => p.absQte), // number[]
          backgroundColor: this.generateColors(data.length)
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Fournisseurs - Produits avec quantité positive'
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const total = context.dataset.data.reduce((sum: any, val: any) => sum + val, 0);
                const value = context.raw as number;
                const percentage = ((value / total) * 100).toFixed(1);
                return `${context.label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }*/
  private createNegativeSupplyChart(): void {
    if (!this.negativeSupplyChartRef?.nativeElement || Object.keys(this.negativeSupplyData).length === 0) return;

    const labels = Object.keys(this.negativeSupplyData);
    const data = Object.values(this.negativeSupplyData) as number[];

    this.negativeSupplyChart = new Chart(this.negativeSupplyChartRef.nativeElement, {
      type: 'pie' as const,
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: this.generateColors(data.length),
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: { display: true, text: 'Fournisseurs - Produits avec quantité négative ou nulle' },
          tooltip: {
            callbacks: {
              label: (context) => {
                const total = context.dataset.data.reduce((sum: number, val: number) => sum + val, 0);
                const value = context.raw as number;
                const percentage = ((value / total) * 100).toFixed(1);
                return `${context.label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }

  // Fonction utilitaire pour générer des couleurs
  private generateColors(count: number): string[] {
    const colors = [
      '#4dc9f6', '#f67019', '#f53794', '#537bc4', '#acc236',
      '#166a8f', '#00a950', '#58595b', '#8549ba', '#a6cee3',
      '#1f78b4', '#b2df8a', '#33a02c', '#fb9a99', '#e31a1c'
    ];

    // Si plus de couleurs sont nécessaires, les répéter
    if (count > colors.length) {
      return [...colors, ...Array(count - colors.length).fill('').map((_, i) => colors[i % colors.length])];
    }

    return colors.slice(0, count);
  }


  // Ajouter cette méthode pour détruire tous les graphiques
  private destroyAllCharts(): void {
    this.destroyChart(this.positiveProductChart);
    this.destroyChart(this.negativeProductChart);
    this.destroyChart(this.positiveSupplyChart);
    this.destroyChart(this.negativeSupplyChart);

  }

  // Corriger createPositiveSupplyChart()
  private createPositiveSupplyChart(): void {
    if (!this.positiveSupplyChartRef?.nativeElement || Object.keys(this.positiveSupplyData).length === 0) return;

    const labels = Object.keys(this.positiveSupplyData);
    const data = Object.values(this.positiveSupplyData) as number[];

    this.positiveSupplyChart = new Chart(this.positiveSupplyChartRef.nativeElement, {
      type: 'pie' as const,
      data: {
        labels: labels, // Correction ici (avant : positiveQuantityProducts)
        datasets: [{
          data: data,
          backgroundColor: this.generateColors(data.length),
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Fournisseurs - Produits avec quantité positive'
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const total = context.dataset.data.reduce((sum: number, val: number) => sum + val, 0);
                const value = context.raw as number;
                const percentage = ((value / total) * 100).toFixed(1);
                return `${context.label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }

  // Modifier createAllPieCharts()
  private createAllPieCharts(): void {
    this.destroyAllCharts(); // Nouvelle méthode de nettoyage

    this.createPositiveProductChart();
    this.createNegativeProductChart();
    this.createPositiveSupplyChart(); // Ajout manquant
    this.createNegativeSupplyChart(); // Ajout manquant
  }

}

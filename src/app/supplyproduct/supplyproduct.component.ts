import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Product } from '../auth.service';
import { Company, HistoryProduct, User, UsercompanyService } from '../usercompany.service';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-supplyproduct',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './supplyproduct.component.html',
  styleUrl: './supplyproduct.component.css'
})
export class SupplyproductComponent implements OnInit, AfterViewInit {
  showHistory = false;

  toggleHistory() {
    this.showHistory = !this.showHistory;
  }
  currentUser: User | null = null; // Utilisateur connecté
  currentCompanyId: number | null = null; // ID de l'entreprise en cours

  @ViewChild('productChart') productChartRef!: ElementRef;
  private historyChart!: Chart;
  productForm!: FormGroup;
  products: Product[] = [];
  selectedProduct: Product | null = null;
  currentsupplyId: number | null = null;
  companies: Company[] = [];

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

  constructor(
    private fb: FormBuilder,
    private productService: UsercompanyService,
    private route: ActivatedRoute
  ) { }
  ngAfterViewInit(): void {
    if (!this.productChartRef?.nativeElement) {
      console.error('Référence au canvas manquante');
      return;
    }

    this.createHistoryProductChart();
  }

  ngOnInit(): void {
    this.productService.getUserProfile().subscribe({
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
      const supplyId = Number(params['supplyId']);
      if (supplyId) {
        this.currentsupplyId = supplyId;
        this.getProductsByCompany(supplyId);
        this.getCompanysBySupply(supplyId);
        this.getHistoryBySupply(supplyId);
        this.productForm.patchValue({
          supplyId: supplyId
        });

      } else {
        console.error('supplyId manquant dans les query params');
      }
    });
  }

  onPeriodChange(event: Event): void {
    const selectedPeriod = (event.target as HTMLSelectElement).value as 'hour' | 'day' | 'month' | 'quarter' | 'semester' | 'year';
    this.createHistoryProductChart(selectedPeriod);
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


  initForm(): void {
    this.productForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      sku: ['', Validators.required],
      lifo: [false],
      qte: [0, Validators.required],
      price: [0, Validators.required],
      categorie: [''],
      marque: [''],
      debut: ['', Validators.required],
      datePeremption: [''],
      dateFabrication: [''],
      costManufacturing: [0, Validators.required],
      costCommercialization: [0, Validators.required],
      codeBarre: [''],
      stockMinimum: [0],
      lotNumber: [''],
      imageUrl: [''],
      quantityToSell: [null]
    });
  }

  sellProduct(): void {
    if (!this.selectedProduct?.id || !this.productForm.get('quantityToSell')?.valid || !this.currentsupplyId) {
      return;
    }

    const quantity = this.productForm.get('quantityToSell')?.value;
    const supplyId: number = this.currentsupplyId; // ✅ Variable locale typée

    this.productService.updateProductQuantity(
      this.selectedProduct.id.toString(),
      this.selectedProduct.title,
      -quantity,
      this.productForm.get('lifo')?.value,
      supplyId
    ).subscribe({
      next: () => {
        this.getProductsByCompany(supplyId); // ✅ Utilisation de la variable locale
        this.productForm.get('quantityToSell')?.reset(0);
        this.selectedProduct = null;
      },
      error: (error) => {
        console.error('Erreur de vente', error);
      }
    });
  }

  increaseStock(): void {
    if (!this.selectedProduct?.id || !this.productForm.get('quantityToSell')?.valid || !this.currentsupplyId) {
      return;
    }

    const quantity = this.productForm.get('quantityToSell')?.value;
    const supplyId: number = this.currentsupplyId; // ✅ Variable locale typée

    this.productService.updateProductQuantity(
      this.selectedProduct.id.toString(),
      this.selectedProduct.title,
      quantity,
      this.productForm.get('lifo')?.value,
      supplyId
    ).subscribe({
      next: () => {
        this.getProductsByCompany(supplyId); // ✅ Utilisation de la variable locale
        this.productForm.get('quantityToSell')?.reset(0);
        this.selectedProduct = null;
      },
      error: (error) => {
        console.error('Erreur de vente', error);
      }
    });
  }

  private getHistoryBySupply(supplyId: number): void {
    this.productService.getGrapgicsBySupply(supplyId).subscribe({
      next: (history) => {
        this.historyProducts = history;
        console.log('Données récupérées pour historyProducts:', this.historyProducts);
        this.calculateTotalQuantity();
        if (this.productChartRef) {
          this.createHistoryProductChart(); // Créer le graphique après récupération des données
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

  getProductsByCompany(supplyId: number): void {
    this.productService.getProductsByCompany(supplyId).subscribe(products => {
      this.products = products;
    });
  }

  getCompanysBySupply(supplyId: number): void {
    this.productService.getCompanysBySupply(supplyId).subscribe({
      next: (companies) => {
        this.companies = companies;
      },
      error: (error) => {
        console.error('Erreur lors de la récupération des entreprises :', error);
      },
    });
  }

  createProduct(): void {
    if (!this.productForm.valid || !this.currentsupplyId) return;

    const formData = new FormData();
    const values = this.productForm.value;

    // Champs obligatoires
    formData.append('title', values.title || '');
    formData.append('sku', values.sku || '');
    formData.append('lifo', String(values.lifo));
    formData.append('qte', String(values.qte));
    formData.append('price', String(values.price));
    formData.append('debut', new Date(values.debut).toISOString().split('T')[0]);
    formData.append('costManufacturing', String(values.costManufacturing));
    formData.append('costCommercialization', String(values.costCommercialization));

    // Champs optionnels
    formData.append('description', values.description || '');
    formData.append('categorie', values.categorie || '');
    formData.append('marque', values.marque || '');
    formData.append('datePeremption', values.datePeremption || '');
    formData.append('dateFabrication', values.dateFabrication || '');
    formData.append('lotNumber', values.lotNumber || '');
    formData.append('codeBarre', values.codeBarre || '');
    formData.append('stockMinimum', String(values.stockMinimum || ''));
    formData.append('imageUrl', values.imageUrl || '');

    // Fournisseur
    formData.append('supplyId', this.currentsupplyId.toString());

    this.productService.createProduct(formData).subscribe({
      next: (response) => {
        console.log('Produit créé avec succès', response);
        this.productForm.reset(); // reset form après succès
        this.getProductsByCompany(this.currentsupplyId!); // refresh liste
      },
      error: (error) => {
        console.error('Erreur lors de la création du produit', error);
      }
    });
    console.table(values); // Affiche les valeurs clef/valeur

  }
  updateProduct(): void {
    if (!this.productForm.valid || !this.selectedProduct) {
      console.warn('Formulaire invalide ou produit non sélectionné');
      return;
    }

    const formData = new FormData();
    const values = this.productForm.value;

    // Champs obligatoires
    formData.append('title', values.title || ''); // Assurez-vous que c'est une chaîne
    formData.append('sku', values.sku || '');
    formData.append('lifo', String(values.lifo));
    formData.append('qte', String(values.qte));
    formData.append('price', String(values.price));
    formData.append('debut', new Date(values.debut).toISOString().split('T')[0]);
    formData.append('costManufacturing', String(values.costManufacturing));
    formData.append('costCommercialization', String(values.costCommercialization));

    // Champs optionnels
    formData.append('description', values.description || '');
    formData.append('categorie', values.categorie || '');
    formData.append('marque', values.marque || '');
    formData.append('datePeremption', values.datePeremption || '');
    formData.append('dateFabrication', values.dateFabrication || '');
    formData.append('lotNumber', values.lotNumber || '');
    formData.append('codeBarre', values.codeBarre || '');
    formData.append('stockMinimum', String(values.stockMinimum || ''));
    formData.append('imageUrl', values.imageUrl || '');

    // Fournisseur
    if (this.currentsupplyId) {
      formData.append('supplyId', this.currentsupplyId.toString());
    }

    this.productService.updateProduct(this.selectedProduct.id!, formData).subscribe({
      next: (response) => {
        console.log('Produit mis à jour avec succès', response);
        this.productForm.reset(); // reset après succès
        this.getProductsByCompany(this.currentsupplyId!); // refresh liste
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour du produit', error);
      }
    });
    console.table(values); // Affiche les valeurs clef/valeur

  }

  deleteProduct(id: number): void {
    this.productService.deleteProduct(id).subscribe(() => {
      this.getProductsByCompany(this.currentsupplyId!);
    });
  }

  selectProduct(product: Product): void {
    this.selectedProduct = product;

    this.productForm.patchValue({
      title: product.title,
      description: product.description,
      sku: product.sku,
      lifo: product.lifo,
      qte: product.qte,
      price: product.price,
      categorie: product.categorie,
      marque: product.marque,
      debut: product.debut ? product.debut.split('T')[0] : '',
      datePeremption: product.datePeremption ? product.datePeremption.split('T')[0] : '',
      dateFabrication: product.dateFabrication ? product.dateFabrication.split('T')[0] : '',
      lotNumber: product.lotNumber,
      codeBarre: product.codeBarre,
      stockMinimum: product.stockMinimum,
      costManufacturing: product.costManufacturing,
      costCommercialization: product.costCommercialization,
      imageUrl: product.imageUrl
    });
  }



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


  private destroyChart(chart?: Chart) {
    chart?.destroy();
  }
}

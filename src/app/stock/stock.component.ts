import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Product, StocckService, Client, GameBehavior, Fournisseur } from '../stocck.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-stock',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, CommonModule],
  templateUrl: './stock.component.html',
  styleUrl: './stock.component.css'
})
export class StockComponent implements OnInit, AfterViewInit {
  private productChart?: Chart;
  private salesChart?: Chart;
  // Ajoutez ces références aux canvas
  @ViewChild('productChart') productChartRef!: ElementRef;
  @ViewChild('salesChart') salesChartRef!: ElementRef;
  products: Product[] = [];
  clients: Client[] = [];
  selectedClientId: string = '';
  fournisseurs: Fournisseur[] = [];
  selectedFournisseursId: string = ''; // Initialisé à une chaîne vide

  gameLogs: any[] = [];

  private profitChart?: Chart;

  message: string = '';
  quantityToRemove: number = 1;
  
  totalRevenue: number = 0;
  totalProfit: number = 0;

  newProduct: Omit<Product, 'id'> = {
    name: '',
    qte: 0,
    expirationDate: new Date(),
    brand: '',
    category: '',
    price: 0,
    productionCost: 0,
    method: 'FIFO'
  };

  constructor(private stockService: StocckService) { }

  ngOnInit() {
    this.refreshProducts();
    this.refreshClients();
    this.refreshGameLogs();
    this.updateTotalRevenueAndProfit();
    this.refreshData();
    this.refreshFoursseurs(); // Assurez-vous que cette méthode est appelée ici
    console.log('Fournisseurs après initialisation:', this.fournisseurs);

  }

  ngAfterViewInit() {
    this.initCharts();
    this.createProductStockChart();
    this.createProfitEvolutionChart();
  }

  refreshProducts() {
    this.products = this.stockService.getProducts();
  }

  refreshClients() {
    this.clients = this.stockService.getClients();
  }
  refreshFoursseurs() {
    this.fournisseurs = this.stockService.getFournisseur();
    console.log('Liste des fournisseurs:', this.fournisseurs);
  }

  refreshGameLogs() {
    this.gameLogs = this.stockService.getGameLogs();
  }

  addProduct() {
    console.log('Fournisseur sélectionné:', this.selectedFournisseursId);

    if (this.selectedFournisseursId && this.selectedFournisseursId !== '') {
      const selectedFournisseur = this.fournisseurs.find(f => f.id === this.selectedFournisseursId);
      console.log('Fournisseur trouvé:', selectedFournisseur);

      if (selectedFournisseur) {
        this.message = this.stockService.addProduct(this.newProduct, selectedFournisseur);
        this.refreshProducts();
        this.updateTotalRevenueAndProfit();
        this.updateUI();

        // Réinitialiser le formulaire et le fournisseur sélectionné
        this.newProduct = {
          name: '',
          qte: 0,
          expirationDate: new Date(),
          brand: '',
          category: '',
          price: 0,
          productionCost: 0,
          method: 'FIFO',
        };
        this.selectedFournisseursId = ''; // Réinitialiser à une chaîne vide
      } else {
        this.message = 'Fournisseur non trouvé.';
      }
    } else {
      this.message = 'Veuillez sélectionner un fournisseur.';
    }
  }


  removeProduct(id: string) {
    const selectedClient = this.getSelectedClient();
    if (selectedClient) {
      const result = this.stockService.removeProduct(id, this.quantityToRemove, selectedClient);
      this.message = result;
      this.refreshProducts();
      this.updateTotalRevenueAndProfit();
      this.updateUI();
    } else {
      this.message = 'Veuillez sélectionner un client.';
    }
  }


  private getSelectedClient(): Client | null {
    // Supposons que vous ayez une propriété selectedClientId dans votre composant
    return this.clients.find(client => client.id === this.selectedClientId) || null;
  }


  updateProduct(productId: string) {
    // Trouver le produit dans la liste
    let product = this.products.find(p => p.id === productId);
    if (!product) {
      console.error('Produit non trouvé.');
      return;
    }

    // Trouver le fournisseur du produit
    let fournisseur = this.fournisseurs.find(f => f.id === this.selectedFournisseursId);

    if (!fournisseur) {
      console.error('Fournisseur non trouvé.');
      return;
    }

    // Ajouter le produit mis à jour à l'historique du fournisseur
    if (!fournisseur.historiqueachat) {
      fournisseur.historiqueachat = [];
    }

    fournisseur.historiqueachat.push({
      ...product,  // Copier les propriétés du produit
      qte: product.qte, // Nouvelle quantité ajoutée
      dateAjout: new Date() // Ajouter une date d'ajout
    });

    console.log('Historique mis à jour pour le fournisseur:', fournisseur);

    // Mettre à jour la liste des fournisseurs dans stockService
    this.stockService.updateFournisseur(fournisseur);

    // Rafraîchir la vue
    this.refreshFoursseurs();
    product.qte += this.quantityToRemove;
  }

  updateFournisseur(fournisseur: Fournisseur) {
    let index = this.fournisseurs.findIndex(f => f.id === fournisseur.id);
    if (index !== -1) {
      this.fournisseurs[index] = fournisseur;
      console.log('Fournisseur mis à jour:', this.fournisseurs[index]);
    } else {
      console.error('Fournisseur introuvable.');
    }
  }

  refreshFournisseurs() {
    this.fournisseurs = this.stockService.getFournisseur();
  }



  deleteProduct(id: string) {
    this.message = this.stockService.deleteProduct(id);
    this.refreshProducts();
    this.updateTotalRevenueAndProfit();
  }

  private updateTotalRevenueAndProfit() {
    const { revenue, profit } = this.stockService.getTotalRevenueAndProfit();
    this.totalRevenue = revenue;
    this.totalProfit = profit;
  }

  // Nouvelles méthodes pour gérer les clients et les comportements de jeu
  addClientInteraction(clientId: string, interactionType: string) {
    this.stockService.addClientInteraction(clientId, interactionType);
    this.refreshClients();
    this.refreshGameLogs();
  }

  simulatePurchase(clientId: string, productId: string) {
    this.stockService.simulatePurchase(clientId, productId);
    this.refreshProducts();
    this.refreshClients();
    this.updateTotalRevenueAndProfit();
  }

  updateClientGameBehavior(clientId: string, gameBehavior: GameBehavior) {
    this.stockService.updateClientGameBehavior(clientId, gameBehavior);
    this.refreshClients();
    this.refreshGameLogs();
  }

  getOrCreateClientByCookie(cookieId: string): Client {
    return this.stockService.getOrCreateClientByCookie(cookieId);
  }

  private refreshData() {
    this.products = this.stockService.getProducts();
    this.totalProfit = this.stockService.getTotalProfit();
  }

  private initCharts() {
    this.createProductStockChart();
    this.createProfitEvolutionChart();
  }

  private destroyChart(chart?: Chart) {
    chart?.destroy();
  }

  private createProductStockChart() {
    this.destroyChart(this.productChart);

    const productData = this.products.map(p => ({
      name: p.name,
      quantity: p.qte
    }));

    this.productChart = new Chart(this.productChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: productData.map(p => p.name),
        datasets: [{
          label: 'Stock actuel',
          data: productData.map(p => p.quantity),
          backgroundColor: 'rgba(54, 162, 235, 0.5)'
        }]
      },
      options: {
        responsive: true,
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  private createProfitEvolutionChart(period: 'hour' | 'day' | 'month' | 'quarter' | 'semester' | 'year' = 'day') {
    this.destroyChart(this.profitChart);
    const profitHistory = this.stockService.getProfitHistory();
    const last6Periods = this.getLast6Periods(period);

    // Trier les données chronologiquement
    profitHistory.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Filtrer et regrouper les données par période
    const groupedData = this.groupDataByPeriod(profitHistory, last6Periods, period);

    // Calculer les valeurs cumulatives
    const cumulativeData = groupedData.reduce((acc, value, index) => {
      acc.push((acc[index - 1] || 0) + value);
      return acc;
    }, [] as number[]);

    this.profitChart = new Chart(this.salesChartRef.nativeElement, {
      type: 'line',
      data: {
        labels: last6Periods.map(date => this.formatDate(date, period)),
        datasets: [{
          label: 'Évolution du bénéfice cumulé',
          data: cumulativeData,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Bénéfice cumulé (€)' }
          }
        }
      }
    });
  }

  private getLast6Periods(period: 'hour' | 'day' | 'month' | 'quarter' | 'semester' | 'year'): Date[] {
    const now = new Date();
    const periods: Date[] = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now);
      switch (period) {
        case 'hour':
          date.setHours(date.getHours() - i);
          break;
        case 'day':
          date.setDate(date.getDate() - i);
          break;
        case 'month':
          date.setMonth(date.getMonth() - i);
          break;
        case 'quarter':
          date.setMonth(date.getMonth() - i * 3);
          break;
        case 'semester':
          date.setMonth(date.getMonth() - i * 6);
          break;
        case 'year':
          date.setFullYear(date.getFullYear() - i);
          break;
      }
      periods.push(date);
    }

    return periods;
  }

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

  private groupDataByPeriod(data: any[], periods: Date[], periodType: 'hour' | 'day' | 'month' | 'quarter' | 'semester' | 'year'): number[] {
    return periods.map(period => {
      const filteredData = data.filter(entry => this.isInSamePeriod(entry.timestamp, period, periodType));
      return filteredData.reduce((sum, entry) => sum + entry.profit, 0);
    });
  }

  private isInSamePeriod(date1: Date, date2: Date, periodType: 'hour' | 'day' | 'month' | 'quarter' | 'semester' | 'year'): boolean {
    switch (periodType) {
      case 'hour':
        return date1.getFullYear() === date2.getFullYear() &&
          date1.getMonth() === date2.getMonth() &&
          date1.getDate() === date2.getDate() &&
          date1.getHours() === date2.getHours();
      case 'day':
        return date1.getFullYear() === date2.getFullYear() &&
          date1.getMonth() === date2.getMonth() &&
          date1.getDate() === date2.getDate();
      case 'month':
        return date1.getFullYear() === date2.getFullYear() &&
          date1.getMonth() === date2.getMonth();
      case 'quarter':
        return date1.getFullYear() === date2.getFullYear() &&
          Math.floor(date1.getMonth() / 3) === Math.floor(date2.getMonth() / 3);
      case 'semester':
        return date1.getFullYear() === date2.getFullYear() &&
          Math.floor(date1.getMonth() / 6) === Math.floor(date2.getMonth() / 6);
      case 'year':
        return date1.getFullYear() === date2.getFullYear();
    }
  }

  onPeriodChange(event: Event) {
    const selectedPeriod = (event.target as HTMLSelectElement).value as 'hour' | 'day' | 'month' | 'quarter' | 'semester' | 'year';
    this.createProfitEvolutionChart(selectedPeriod);
  }


/*  private createProfitEvolutionChart() {
    this.destroyChart(this.profitChart);

    const profitHistory = this.stockService.getProfitHistory();

    this.profitChart = new Chart(this.salesChartRef.nativeElement, {
      type: 'line',
      data: {
        labels: profitHistory.map(entry => entry.timestamp.toLocaleTimeString()),
        datasets: [{
          label: 'Évolution du bénéfice',
          data: profitHistory.map(entry => entry.profit),
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: false,
            title: { display: true, text: 'Bénéfice (€)' }
          }
        }
      }
    });
  }
  */

  private updateUI() {
    this.refreshData();
    this.createProductStockChart();
    this.createProfitEvolutionChart();
  }



  
}

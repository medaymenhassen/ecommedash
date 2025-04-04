import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { Observable } from 'rxjs/internal/Observable';
import { v4 as uuidv4 } from 'uuid';

export interface Client {
  id: string;
  nom: string;
  status: 'qualifié' | 'non-qualifié' | 'converti';
  score_jeu: number;
  pattern_achat: 'impulsif' | 'réfléchi' | 'comparateur';
  frequence_interaction: number;
  derniere_activite: Date;
  historique_achats: Product[];
  comportements_jeu: GameBehavior[];
  cookie_id: string;
  totalPurchases: number;
}


export interface Fournisseur {
  id: string;
  nom: string;
  contact?: string;
  historiqueachat?: Product[];
}

export interface Product {
  id: string;
  name: string;
  qte: number;
  expirationDate: Date;
  brand: string;
  category: string;
  price: number;
  method: 'FIFO' | 'LIFO';
  productionCost: number;
  dateAjout?: Date;
}
export interface Finance {
  productId: string;
  productName: string;
  quantitySold: number;
  revenue: number;
  profit: number;
  lastSaleDate: Date;
}

// Nouveau modèle de données
export interface GameBehavior {
  name: string; // Ajout de la propriété name
  niveau_atteint: number;
  choix_risques: number;
  temps_decision: number;
  interactions_sociales: number;
  pattern_erreurs: string[];
}

@Injectable({ providedIn: 'root' })
export class StocckService {
  private products: Product[] = [];
  private totalRevenue: number = 0;
  private totalProfit: number = 0;
  private clients: Client[] = [];
  private gameLogs: any[] = [];
  private finances: Finance[] = [];
  private fournisseurs: Fournisseur[] = [];

  constructor() {
    this.addFakeProducts();
    this.addFakeClients();
    this.addFakeGameLogs();
    this.addFakeSales();
    this.addFakeFournisseurs();
  }


  private addFakeProducts() {
    this.products = [
      { id: this.generateId(), name: 'Produit A', qte: 5, expirationDate: new Date('2025-06-01'), brand: 'Marque X', category: 'Alimentaire', price: 10, method: 'FIFO', productionCost: 1 },
      { id: this.generateId(), name: 'Produit A', qte: 8, expirationDate: new Date('2025-05-15'), brand: 'Marque X', category: 'Alimentaire', price: 10, method: 'FIFO', productionCost: 2 },
      { id: this.generateId(), name: 'Produit A', qte: 3, expirationDate: new Date('2025-07-01'), brand: 'Marque X', category: 'Alimentaire', price: 10, method: 'FIFO', productionCost: 3 },
      { id: this.generateId(), name: 'Produit B', qte: 5, expirationDate: new Date('2025-12-15'), brand: 'Marque Y', category: 'Cosmétique', price: 20, method: 'LIFO', productionCost: 4 },
      { id: this.generateId(), name: 'Produit B', qte: 7, expirationDate: new Date('2025-04-20'), brand: 'Marque Y', category: 'Cosmétique', price: 20, method: 'LIFO', productionCost: 5 },
      { id: this.generateId(), name: 'Produit B', qte: 4, expirationDate: new Date('2025-11-30'), brand: 'Marque Y', category: 'Cosmétique', price: 20, method: 'LIFO', productionCost: 8 }
    ];
  }

  
  private addFakeSales() {
    this.finances = [
      { productId: this.products[0].id, productName: 'Produit A', quantitySold: 10, revenue: 100, profit: 90, lastSaleDate: new Date('2022-03-20') },
      { productId: this.products[3].id, productName: 'Produit B', quantitySold: 5, revenue: 100, profit: 80, lastSaleDate: new Date('2023-03-21') },
      { productId: this.products[0].id, productName: 'Produit A', quantitySold: 8, revenue: 80, profit: 64, lastSaleDate: new Date('2024-01-22') },
      { productId: this.products[3].id, productName: 'Produit B', quantitySold: 3, revenue: 60, profit: 36, lastSaleDate: new Date('2024-02-23') },
      { productId: this.products[0].id, productName: 'Produit A', quantitySold: 15, revenue: 150, profit: 135, lastSaleDate: new Date('2025-03-24') },
      { productId: this.products[0].id, productName: 'Produit A', quantitySold: 15, revenue: 150, profit: 135, lastSaleDate: new Date('2025-03-23') },
      { productId: this.products[0].id, productName: 'Produit A', quantitySold: 15, revenue: 150, profit: 135, lastSaleDate: new Date('2025-03-22') },
      { productId: this.products[0].id, productName: 'Produit A', quantitySold: 15, revenue: 150, profit: 135, lastSaleDate: new Date('2024-06-22') },
      { productId: this.products[0].id, productName: 'Produit A', quantitySold: 15, revenue: 150, profit: 135, lastSaleDate: new Date('2024-08-22') },
      { productId: this.products[0].id, productName: 'Produit A', quantitySold: 15, revenue: 150, profit: 135, lastSaleDate: new Date('2024-09-22') }
    ];
  }

  private addFakeClients() {
    const achatCommun: Product[] = [
      { id: this.generateId(), name: 'Produit A', qte: 2, price: 50, expirationDate: new Date('2026-03-23'), brand: 'MarqueA', category: 'CatégorieA', method: 'FIFO' as 'FIFO', productionCost: 30 },
      { id: this.generateId(), name: 'Produit B', qte: 1, price: 100, expirationDate: new Date('2026-03-23'), brand: 'MarqueB', category: 'CatégorieB', method: 'LIFO' as 'LIFO', productionCost: 60 }
    ];
    this.clients = [
      {
        id: this.generateId(),
        nom: 'Alice Dupont',
        status: 'converti',
        score_jeu: 1200,
        pattern_achat: 'impulsif',
        frequence_interaction: 5,
        derniere_activite: new Date('2025-03-23'),
        historique_achats: [...achatCommun],
        comportements_jeu: [],
        cookie_id: this.generateCookieId(),
        totalPurchases: 3500
      },
      {
        id: this.generateId(),
        nom: 'Bob Martin',
        status: 'converti',
        score_jeu: 1800,
        pattern_achat: 'impulsif',
        frequence_interaction: 8,
        derniere_activite: new Date('2025-03-24'),
        historique_achats: [...achatCommun],
        comportements_jeu: [],
        cookie_id: this.generateCookieId(),
        totalPurchases: 3500
      },
      {
        id: this.generateId(),
        nom: 'Alice Dupont',
        status: 'qualifié',
        score_jeu: 1200,
        pattern_achat: 'impulsif',
        frequence_interaction: 5,
        derniere_activite: new Date('2025-03-23'),
        historique_achats: [
          { id: this.generateId(), name: 'Produit A', qte: 2, price: 50, expirationDate: new Date('2026-03-23'), brand: 'MarqueA', category: 'CatégorieA', method: 'FIFO', productionCost: 30 },
          { id: this.generateId(), name: 'Produit B', qte: 1, price: 100, expirationDate: new Date('2026-03-23'), brand: 'MarqueB', category: 'CatégorieB', method: 'LIFO', productionCost: 60 }
        ],
        comportements_jeu: [],
        cookie_id: this.generateCookieId(),
        totalPurchases: 3500
      },
      {
        id: this.generateId(),
        nom: 'Bob Martin',
        status: 'converti',
        score_jeu: 1800,
        pattern_achat: 'réfléchi',
        frequence_interaction: 8,
        derniere_activite: new Date('2025-03-24'),
        historique_achats: [
          { id: this.generateId(), name: 'Produit C', qte: 3, price: 75, expirationDate: new Date('2026-04-15'), brand: 'MarqueC', category: 'CatégorieC', method: 'FIFO', productionCost: 45 },
          { id: this.generateId(), name: 'Produit D', qte: 2, price: 120, expirationDate: new Date('2026-05-01'), brand: 'MarqueD', category: 'CatégorieD', method: 'LIFO', productionCost: 80 }
        ],
        comportements_jeu: [],
        cookie_id: this.generateCookieId(),
        totalPurchases: 7200
      },
      {
        id: this.generateId(),
        nom: 'Claire Lefebvre',
        status: 'non-qualifié',
        score_jeu: 800,
        pattern_achat: 'comparateur',
        frequence_interaction: 2,
        derniere_activite: new Date('2025-03-20'),
        historique_achats: [],
        comportements_jeu: [],
        cookie_id: this.generateCookieId(),
        totalPurchases: 1200
      },
      {
        id: this.generateId(),
        nom: 'David Rousseau',
        status: 'qualifié',
        score_jeu: 1500,
        pattern_achat: 'impulsif',
        frequence_interaction: 6,
        derniere_activite: new Date('2025-03-22'),
        historique_achats: [
          { id: this.generateId(), name: 'Produit E', qte: 1, price: 200, expirationDate: new Date('2026-06-30'), brand: 'MarqueE', category: 'CatégorieE', method: 'FIFO', productionCost: 120 },
          { id: this.generateId(), name: 'Produit F', qte: 4, price: 25, expirationDate: new Date('2026-07-15'), brand: 'MarqueF', category: 'CatégorieF', method: 'LIFO', productionCost: 15 }
        ],
        comportements_jeu: [],
        cookie_id: this.generateCookieId(),
        totalPurchases: 4800
      }
    ];
  }


  getClients(options?: { status?: string }): Client[] {
    let filteredClients = [...this.clients];

    if (options?.status) {
      filteredClients = filteredClients.filter(client => client.status === options.status);
    }

    return filteredClients;
  }


  private addFakeFournisseurs() {
    this.fournisseurs = [
      {
        id: this.generateId(),
        nom: 'Fournisseur Alpha',
        contact: 'contact@alpha.com',
        historiqueachat: [
          {
            id: this.generateId(),
            name: 'Produit A',
            qte: 5,
            expirationDate: new Date('2025-06-01'),
            brand: 'Marque X',
            category: 'Alimentaire',
            price: 10,
            method: 'FIFO',
            productionCost: 1
          },
          {
            id: this.generateId(),
            name: 'Produit A',
            qte: 8,
            expirationDate: new Date('2025-05-15'),
            brand: 'Marque X',
            category: 'Alimentaire',
            price: 10,
            method: 'FIFO',
            productionCost: 2
          }
        ]
      },
      {
        id: this.generateId(),
        nom: 'Fournisseur Beta',
        contact: 'contact@beta.com',
        historiqueachat: [
          {
            id: this.generateId(),
            name: 'Produit B',
            qte: 5,
            expirationDate: new Date('2025-12-15'),
            brand: 'Marque Y',
            category: 'Cosmétique',
            price: 20,
            method: 'LIFO',
            productionCost: 4
          },
          {
            id: this.generateId(),
            name: 'Produit B',
            qte: 7,
            expirationDate: new Date('2025-04-20'),
            brand: 'Marque Y',
            category: 'Cosmétique',
            price: 20,
            method: 'LIFO',
            productionCost: 5
          }
        ]
      },
      {
        id: this.generateId(),
        nom: 'Fournisseur Gamma',
        contact: 'contact@gamma.com',
        historiqueachat: [
          {
            id: this.generateId(),
            name: 'Produit C',
            qte: 10,
            expirationDate: new Date('2025-10-01'),
            brand: 'Marque Z',
            category: 'Electronique',
            price: 50,
            method: 'FIFO',
            productionCost: 30
          },
          {
            id: this.generateId(),
            name: 'Produit C',
            qte: 12,
            expirationDate: new Date('2025-09-15'),
            brand: 'Marque Z',
            category: 'Electronique',
            price: 50,
            method: 'FIFO',
            productionCost: 35
          }
        ]
      }
    ];
  }



  getFournisseur(): Fournisseur[] {
    let filteredFournisser = [...this.fournisseurs];
    return filteredFournisser;
  }


  private generateId(): string {
    return uuidv4().replace(/-/g, '').slice(0, 50);
  }

  getTotalProfit(): number {
    return this.totalProfit;
  }


  getProducts(): Product[] {
    return [...this.products];
  }
  /*
  removeProduct(id: string, quantity: number): string {
    const productToRemove = this.products.find(p => p.id === id);
    if (!productToRemove) return 'Produit introuvable';

    const sameNameProducts = this.products.filter(p => p.name === productToRemove.name && p.method === productToRemove.method);

    if (productToRemove.method === 'FIFO') {
      sameNameProducts.sort((a, b) => a.expirationDate.getTime() - b.expirationDate.getTime());
      const earlierProduct = sameNameProducts.find(p => p.expirationDate < productToRemove.expirationDate);
      if (earlierProduct) {
        return `Alerte : Un produit ${productToRemove.name} avec une date d'expiration antérieure (${earlierProduct.expirationDate.toISOString().split('T')[0]}) existe. ID : ${earlierProduct.id}. Vous devez le retirer en premier.`;
      }
    } else if (productToRemove.method === 'LIFO') {
      sameNameProducts.sort((a, b) => b.expirationDate.getTime() - a.expirationDate.getTime());
      const laterProduct = sameNameProducts.find(p => p.expirationDate > productToRemove.expirationDate);
      if (laterProduct) {
        return `Alerte : Un produit ${productToRemove.name} avec une date d'expiration ultérieure (${laterProduct.expirationDate.toISOString().split('T')[0]}) existe. ID : ${laterProduct.id}. Vous devez le retirer en premier.`;
      }
    }
    let remainingQuantity = quantity;
    let message = '';
    let removedProducts: Product[] = [];

    while (remainingQuantity > 0 && sameNameProducts.length > 0) {
      const currentProduct = sameNameProducts.shift()!;
      const quantityToRemove = Math.min(remainingQuantity, currentProduct.qte);

      const saleDate = new Date(); // Capture la date et l'heure exactes de la vente
      this.updateFinances(productToRemove, quantity, saleDate);

      currentProduct.qte -= quantityToRemove;
      remainingQuantity -= quantityToRemove;

      removedProducts.push({ ...currentProduct, qte: quantityToRemove });

      if (currentProduct.qte === 0) {
        this.products = this.products.filter(p => p.id !== currentProduct.id);
      }

      message += `Retiré ${quantityToRemove} de ${currentProduct.name} (ID : ${currentProduct.id}). Restant : ${currentProduct.qte}\n`;

      if (remainingQuantity > 0) {
        message += `Il reste ${remainingQuantity} à retirer. Veuillez utiliser l'ID suivant : ${sameNameProducts[0]?.id}\n`;
      }
    }

    if (remainingQuantity > 0) {
      message += `Attention : Quantité insuffisante. Il manque ${remainingQuantity} unités.\n`;
    }

    this.calculateRevenueAndProfit(removedProducts);

    message += `Chiffre d'affaires total : ${this.totalRevenue.toFixed(2)} €, Bénéfice total : ${this.totalProfit.toFixed(2)} €`;

    return message.trim();
  }*/
  removeProduct(id: string, quantity: number, client: Client): string {
    const productToRemove = this.products.find(p => p.id === id);
    if (!productToRemove) return 'Produit introuvable';

    const sameNameProducts = this.products.filter(p => p.name === productToRemove.name && p.method === productToRemove.method);

    if (!client.historique_achats) {
      client.historique_achats = [];
    }

    client.historique_achats.push({ ...productToRemove, qte: quantity });

    if (productToRemove.method === 'FIFO') {
      sameNameProducts.sort((a, b) => a.expirationDate.getTime() - b.expirationDate.getTime());
      const earlierProduct = sameNameProducts.find(p => p.expirationDate < productToRemove.expirationDate);
      if (earlierProduct) {
        return `Alerte : Un produit ${productToRemove.name} avec une date d'expiration antérieure (${earlierProduct.expirationDate.toISOString().split('T')[0]}) existe. ID : ${earlierProduct.id}. Vous devez le retirer en premier.`;
      }
    } else if (productToRemove.method === 'LIFO') {
      sameNameProducts.sort((a, b) => b.expirationDate.getTime() - a.expirationDate.getTime());
      const laterProduct = sameNameProducts.find(p => p.expirationDate > productToRemove.expirationDate);
      if (laterProduct) {
        return `Alerte : Un produit ${productToRemove.name} avec une date d'expiration ultérieure (${laterProduct.expirationDate.toISOString().split('T')[0]}) existe. ID : ${laterProduct.id}. Vous devez le retirer en premier.`;
      }
    }

    let remainingQuantity = quantity;
    let message = '';
    let removedProducts: Product[] = [];

    while (remainingQuantity > 0 && sameNameProducts.length > 0) {
      const currentProduct = sameNameProducts.shift()!;
      const quantityToRemove = Math.min(remainingQuantity, currentProduct.qte);

      // Si le produit est expiré, on ne l'ajoute pas à l'historique
      if (currentProduct.expirationDate < new Date()) {
        // Retirer le produit expiré de la liste
        currentProduct.qte -= quantityToRemove;
        remainingQuantity -= quantityToRemove;
        removedProducts.push({ ...currentProduct, qte: quantityToRemove });

        if (currentProduct.qte === 0) {
          this.products = this.products.filter(p => p.id !== currentProduct.id);
        }

        message += `Retiré ${quantityToRemove} de ${currentProduct.name} (ID : ${currentProduct.id}). Restant : ${currentProduct.qte}\n`;

        if (remainingQuantity > 0) {
          message += `Il reste ${remainingQuantity} à retirer. Veuillez utiliser l'ID suivant : ${sameNameProducts[0]?.id}\n`;
        }

      } else {
        // Ajouter à l'historique du client si le produit n'est pas expiré
        client.historique_achats.push(currentProduct);

        // Capture de la date et de l'heure exactes de l'achat
        const saleDate = new Date();
        this.updateFinances(currentProduct, quantityToRemove, saleDate);

        currentProduct.qte -= quantityToRemove;
        remainingQuantity -= quantityToRemove;

        removedProducts.push({ ...currentProduct, qte: quantityToRemove });

        if (currentProduct.qte === 0) {
          this.products = this.products.filter(p => p.id !== currentProduct.id);
        }

        message += `Retiré ${quantityToRemove} de ${currentProduct.name} (ID : ${currentProduct.id}). Restant : ${currentProduct.qte}\n`;

        if (remainingQuantity > 0) {
          message += `Il reste ${remainingQuantity} à retirer. Veuillez utiliser l'ID suivant : ${sameNameProducts[0]?.id}\n`;
        }
      }
    }

    if (remainingQuantity > 0) {
      message += `Attention : Quantité insuffisante. Il manque ${remainingQuantity} unités.\n`;
    }
    this.calculateRevenueAndProfit(removedProducts);


    message += `Chiffre d'affaires total : ${this.totalRevenue.toFixed(2)} €, Bénéfice total : ${this.totalProfit.toFixed(2)} €`;

    return message.trim();
  }


  private calculateRevenueAndProfit(removedProducts: Product[]): void {
    const currentDate = new Date();

    removedProducts.forEach(product => {
      const isExpired = new Date(product.expirationDate) < currentDate;
      const revenue = product.price * product.qte;
      const cost = product.productionCost * product.qte;

      if (isExpired) {
        this.totalRevenue -= revenue; // Perte de CA pour les produits expirés
        this.totalProfit -= cost; // Perte du coût de production
        this.updateFinances(product, -product.qte, currentDate); // Mise à jour des finances pour les produits expirés
      } else {
        this.totalRevenue += revenue;
        this.totalProfit += revenue - cost;
        this.updateFinances(product, product.qte, currentDate); // Mise à jour des finances pour les ventes normales
      }
    });

    // Mise à jour des totaux dans l'objet finances
    const lastFinance = this.finances[this.finances.length - 1];
    if (lastFinance) {
      lastFinance.revenue = this.totalRevenue;
      lastFinance.profit = this.totalProfit;
    }
  }


  getFinanceData(): { sales: Finance[], totalRevenue: number, totalProfit: number } {
    return {
      sales: [...this.finances],
      totalRevenue: this.totalRevenue,
      totalProfit: this.totalProfit
    };
  }

  private findProductSupplier(productId: string): Fournisseur | undefined {
    return this.fournisseurs.find(f => f.historiqueachat?.some(p => p.id === productId));
  }

  private updateFournisseurHistorique(fournisseur: Fournisseur, product: Product, quantity: number) {
    if (!fournisseur.historiqueachat) {
      fournisseur.historiqueachat = [];
    }

    const existingEntry = fournisseur.historiqueachat.find(p => p.id === product.id);
    if (existingEntry) {
      existingEntry.qte += quantity;
    } else {
      fournisseur.historiqueachat.push({ ...product, qte: quantity });
    }
  }

  updateFournisseur(fournisseur: Fournisseur): void {
    let index = this.fournisseurs.findIndex(f => f.id === fournisseur.id);
    if (index !== -1) {
      this.fournisseurs[index] = fournisseur;
      console.log('Fournisseur mis à jour:', this.fournisseurs[index]);
    } else {
      console.error('Fournisseur introuvable.');
    }
  }

  updateProduct(id: string, quantity: number, client: Client): string {
    if (quantity < 0) {
      return this.removeProduct(id, Math.abs(quantity), client);
    }

    const product = this.products.find(p => p.id === id);
    if (!product) return 'Produit introuvable';

    const fournisseur = this.findProductSupplier(id);
    if (fournisseur) {
      this.updateFournisseurHistorique(fournisseur, product, quantity);
    }

    product.qte += quantity;
    return `Mise à jour réussie : ${product.qte} unités maintenant disponibles.`;
  }


  addProduct(productData: Omit<Product, 'id'>, fournisseur: Fournisseur): string {
    const newProduct = { ...productData, id: this.generateId() };
    this.products.push(newProduct);

    if (!fournisseur.historiqueachat) {
      fournisseur.historiqueachat = [];
    }
    fournisseur.historiqueachat.push(newProduct);

    return `Produit ajouté avec succès : ${newProduct.id}`;
  }


  getTotalRevenueAndProfit(): { revenue: number, profit: number } {
    return {
      revenue: this.totalRevenue,
      profit: this.totalProfit
    };
  }

  deleteProduct(id: string): string {
    const productIndex = this.products.findIndex(p => p.id === id);
    if (productIndex === -1) return `Produit introuvable.`;

    const deletedProduct = this.products[productIndex];
    this.products.splice(productIndex, 1);

    return `Produit supprimé avec succès : ${deletedProduct.name}, ID : ${deletedProduct.id}`;
  }


  private createAnonymousClient(): Client {
    const cookieId = this.generateCookieId();
    return {
      id: this.generateId(),
      nom: 'Client Anonyme',
      status: 'non-qualifié',
      score_jeu: 0,
      pattern_achat: 'comparateur',
      frequence_interaction: 0,
      derniere_activite: new Date(),
      historique_achats: [],
      comportements_jeu: [],
      cookie_id: cookieId,
      totalPurchases: 0
    };
  }

  private generateCookieId(): string {
    return 'cookie_' + Math.random().toString(36).substr(2, 9);
  }



  private addFakeGameLogs() {
    this.gameLogs = [
      {
        name: "qq",
        clientId: this.clients[0].id,
        timestamp: new Date('2025-03-22T14:00:00'),
        action: 'start_game',
        duration: 1200 // secondes
      },
      {
        name:"dd",
        clientId: this.clients[0].id,
        timestamp: new Date('2025-03-22T14:20:00'),
        action: 'purchase_attempt',
        item: this.products[0]
      }
    ];
  }



  getClient(id: string): Client | undefined {
    return this.clients.find(c => c.id === id);
  }

  addClientInteraction(clientId: string, interactionType: string) {
    const client = this.clients.find(c => c.id === clientId);
    if (client) {
      client.frequence_interaction++;
      client.derniere_activite = new Date();
      this.gameLogs.push({
        clientId,
        timestamp: new Date(),
        type: interactionType
      });
    }
  }

  simulatePurchase(clientId: string, productId: string) {
    const client = this.clients.find(c => c.id === clientId);
    const product = this.products.find(p => p.id === productId);
    if (client && product) {
      const purchase = { ...product, qte: 1 };
      client.historique_achats.push(purchase);
      this.removeProduct(productId, 1, client);
      client.status = 'converti';
    }
  }

  getGameLogs() {
    return [...this.gameLogs];
  }

  updateClientGameBehavior(clientId: string, gameBehavior: GameBehavior) {
    const client = this.clients.find(c => c.id === clientId);
    if (client) {
      client.comportements_jeu.push(gameBehavior);
      client.score_jeu += this.calculateGameScore(gameBehavior);
      client.derniere_activite = new Date();
      client.frequence_interaction++;
      this.updateClientStatus(client);
    }
  }

  private calculateGameScore(gameBehavior: GameBehavior): number {
    // Logique de calcul du score basée sur le comportement de jeu
    // Ceci est un exemple simple, à adapter selon vos besoins
    return gameBehavior.niveau_atteint * 100 + gameBehavior.interactions_sociales * 10;
  }

  private updateClientStatus(client: Client) {
    if (client.score_jeu > 2000) {
      client.status = 'qualifié';
    }
    if (client.historique_achats.length > 0) {
      client.status = 'converti';
    }
  }

  getOrCreateClientByCookie(cookieId: string): Client {
    let client = this.clients.find(c => c.cookie_id === cookieId);
    if (!client) {
      client = this.createAnonymousClient();
      this.clients.push(client);
    }
    return client;
  }

  private updateFinances(product: Product, quantity: number, saleDate: Date) {
    const existingFinance = this.finances.find(f => f.productId === product.id);
    const revenue = product.price * quantity;
    const profit = revenue - (product.productionCost * quantity);

    if (existingFinance) {
      existingFinance.quantitySold += quantity;
      existingFinance.revenue += revenue;
      existingFinance.profit += profit;
      existingFinance.lastSaleDate = saleDate;
    } else {
      this.finances.push({
        productId: product.id,
        productName: product.name,
        quantitySold: quantity,
        revenue: revenue,
        profit: profit,
        lastSaleDate: saleDate
      });
    }

    this.totalRevenue += revenue;
    this.totalProfit += profit;
  }
  getFinances(): Finance[] {
    return [...this.finances];
  }

  getProfitHistory(): { timestamp: Date; profit: number }[] {
    return this.finances.map(f => ({
      timestamp: f.lastSaleDate,
      profit: f.profit
    }));
  }

  
  addClient(clientData: Omit<Client, 'id'>): Observable<string> {
    const newClient: Client = { ...clientData, id: this.generateId() };
    this.clients.push(newClient);
    return of(`Client ajouté avec succès : ${newClient.nom}`);
  }
  addFournisseur(fournisseurData: Omit<Fournisseur, 'id'>): Observable<string> {
    const newFournisseur: Fournisseur = { ...fournisseurData, id: this.generateId() };
    this.fournisseurs.push(newFournisseur);
    return of(`Fournisseur ajouté avec succès : ${newFournisseur.nom}`);
  }

  deleteClient(id: string): string {
    const index = this.clients.findIndex(client => client.id === id);
    if (index === -1) return 'Client introuvable.';
    const deletedClient = this.clients.splice(index, 1)[0];
    return `Client supprimé avec succès : ${deletedClient.nom}`;
  }

  deleteFournisseur(id: string): string {
    const index = this.fournisseurs.findIndex(fournisseur => fournisseur.id === id);
    if (index === -1) return 'Fournisseur introuvable.';
    const deletedFournisseur = this.fournisseurs.splice(index, 1)[0];
    return `Fournisseur supprimé avec succès : ${deletedFournisseur.nom}`;
  }
  updateClient(id: string, updatedData: Partial<Client>): Observable<string> {
    const client = this.clients.find(c => c.id === id);
    if (!client) return of('Client introuvable.');
    Object.assign(client, updatedData);
    return of(`Client mis à jour avec succès : ${client.nom}`);
  }

  updateFournisseurdata(id: string, updatedData: Partial<Fournisseur>): Observable<string> {
    const fournisseur = this.fournisseurs.find(f => f.id === id);
    if (!fournisseur) return of('Fournisseur introuvable.');
    Object.assign(fournisseur, updatedData);
    return of(`Fournisseur mis à jour avec succès : ${fournisseur.nom}`);
  }
}

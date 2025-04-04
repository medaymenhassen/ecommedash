import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Client, Fournisseur, GameBehavior, StocckService } from '../stocck.service';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { Observable, catchError, of } from 'rxjs';
Chart.register(...registerables);

@Component({
  selector: 'app-client',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, CommonModule],
  templateUrl: './client.component.html',
  styleUrl: './client.component.css'
})

export class ClientComponent implements OnInit, AfterViewInit {
  clients: Client[] = [];
  selectedClientId: string = '';
  fournisseurs: Fournisseur[] = [];
  selectedFournisseursId: string = '';
  clientForm!: FormGroup;
  fournisseurForm!: FormGroup;
  message!: string;

  @ViewChild('clientChart') clientChartRef!: ElementRef;
  @ViewChild('fournisseurChart') fournisseurChartRef!: ElementRef;
  clientChart?: Chart;
  fournisseurChart?: Chart;

  gameLogs: ReturnType<StocckService['getGameLogs']> = [];

  constructor(private fb: FormBuilder, private stockService: StocckService) { }

  ngOnInit() {
    this.loadClients();
    this.loadFournisseurs();

    this.clientForm = this.fb.group({
      id: [''],
      nom: ['', Validators.required],
      status: ['qualifié', Validators.required],
      score_jeu: [0, Validators.required],
      pattern_achat: [''],
      frequence_interaction: [''],
      totalPurchases: [0]
    });

    this.fournisseurForm = this.fb.group({
      id: [''],
      nom: ['', Validators.required],
      contact: ['', [Validators.required, Validators.pattern('^[0-9]+$')]]
    });
  }

  ngAfterViewInit() {
    this.createClientPurchasePatternChart();
    this.createFournisseurPurchaseChart();
  }

  loadClients() {
    this.clients = this.stockService.getClients();
    setTimeout(() => this.createClientPurchasePatternChart(), 500);
  }

  loadFournisseurs() {
    this.fournisseurs = this.stockService.getFournisseur();
    setTimeout(() => this.createFournisseurPurchaseChart(), 500);
  }

  deleteClient(id: string): string {
    if (!confirm('Voulez-vous vraiment supprimer ce client ?')) return 'Suppression annulée';
    const index = this.clients.findIndex(client => client.id === id);
    if (index === -1) return 'Client introuvable.';
    const deletedClient = this.clients.splice(index, 1)[0];
    return `Client supprimé avec succès : ${deletedClient.nom}`;
  }

  private aggregateClientData() {
    const patternData: { [key: string]: { [status: string]: { totalPurchases: number, count: number }[] } } = {};
    this.clients.forEach(client => {
      const pattern = client.pattern_achat;
      const status = client.status;
      const totalPurchases = client.totalPurchases;

      if (!patternData[pattern]) {
        patternData[pattern] = {};
      }
      if (!patternData[pattern][status]) {
        patternData[pattern][status] = [];
      }

      const existingEntry = patternData[pattern][status].find(entry => entry.totalPurchases === totalPurchases);
      if (existingEntry) {
        existingEntry.count++;
      } else {
        patternData[pattern][status].push({ totalPurchases, count: 1 });
      }
    });
    return patternData;
  }



  createClientPurchasePatternChart() {
    const patternData = this.aggregateClientData();
    const uniquePatterns: Client['pattern_achat'][] = Array.from(new Set(this.clients.map(client => client.pattern_achat)));

    const chartConfig: ChartConfiguration<'scatter'> = {
      type: 'scatter',
      data: {
        datasets: Object.entries(patternData).flatMap(([pattern, statusData]) =>
          Object.entries(statusData).map(([status, data]) => ({
            label: `${pattern} - ${status}`,
            data: data.map(d => ({
              x: d.totalPurchases,
              y: uniquePatterns.indexOf(pattern as Client['pattern_achat'])
            })),
            pointRadius: 5,
            pointHoverRadius: 7
          }))
        )
      },
      options: {
        scales: {
          x: {
            type: 'linear',
            position: 'bottom',
            title: { display: true, text: 'Total des achats' }
          },
          y: {
            type: 'category',
            position: 'left',
            title: { display: true, text: 'Pattern d\'achat' },
            labels: uniquePatterns
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (context) => {
                const dataPoint = context.raw as { x: number, y: number };
                const pattern = uniquePatterns[dataPoint.y];
                return `${context.dataset.label}: ${dataPoint.x} achats (Pattern: ${pattern})`;
              }
            }
          }
        }
      }
    };

    this.clientChart = new Chart(this.clientChartRef.nativeElement, chartConfig);
  }

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
  }



  addOrUpdateClient(): void {
    const clientData = this.clientForm.value;

    if (clientData.id) {
      // Mise à jour d'un client existant
      this.stockService.updateClient(clientData.id, clientData).subscribe(
        (response: string) => {
          console.log(response);
          alert(response);
        },
        (error) => console.error(error)
      );
    } else {
      // Ajout d'un nouveau client
      const { id, ...dataWithoutId } = clientData; // Retirer l'ID avant d'envoyer les données
      this.stockService.addClient(dataWithoutId).pipe(
        catchError(err => {
          console.error(err);
          return of('Erreur lors de l\'ajout du client');
        })
      ).subscribe(response => {
        console.log(response);
        alert(response);
      });

    }

    this.clientForm.reset(); // Réinitialiser le formulaire après soumission
    this.loadClients();
  }

  addOrUpdateFournisseur(): void {
    const fournisseurData = this.fournisseurForm.value;

    if (fournisseurData.id) {
      // Mise à jour d'un fournisseur existant
      this.stockService.updateFournisseurdata(fournisseurData.id, fournisseurData).subscribe(
        (response: string) => {
          console.log(response);
          alert(response);
        },
        (error) => console.error(error)
      );
    } else {
      // Ajout d'un nouveau fournisseur
      const { id, ...dataWithoutId } = fournisseurData; // Retirer l'ID avant d'envoyer les données
      this.stockService.addFournisseur(dataWithoutId).subscribe(
        (response: string) => {
          console.log(response);
          alert(response);
        },
        (error) => console.error(error)
      );
    }

    this.fournisseurForm.reset(); // Réinitialiser le formulaire après soumission
    this.loadFournisseurs();
  }

  editClient(client: any): void {
    this.clientForm.patchValue(client);
  }

  editFournisseur(fournisseur: any): void {
    this.fournisseurForm.patchValue(fournisseur);
  }


  deleteFournisseur(id: string): string {
    if (!confirm('Voulez-vous vraiment supprimer ce fournisseur ?')) return 'Suppression annulée';
    const index = this.fournisseurs.findIndex(fournisseur => fournisseur.id === id);
    if (index === -1) return 'Fournisseur introuvable.';
    const deletedFournisseur = this.fournisseurs.splice(index, 1)[0];
    return `Fournisseur supprimé avec succès : ${deletedFournisseur.nom}`;
  }
}


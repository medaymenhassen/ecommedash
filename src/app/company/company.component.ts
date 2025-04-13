import { Component, OnInit } from '@angular/core';
import { Company, SubscriptionType, User, UsercompanyService } from '../usercompany.service';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';


@Component({
  selector: 'app-company',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, CommonModule],
  templateUrl: './company.component.html',
  styleUrl: './company.component.css'
})
export class CompanyComponent implements OnInit {
  owner!: number;
  isOwner: boolean = false;
  isEditing = false;
  companies: Company[] = [];
  subscriptionTypes = Object.values(SubscriptionType);
  currentUser: User | null = null; // Utilisateur connecté

  selectedCompany: Company = {
    id: 0,
    name: '',
    subscription: SubscriptionType.BASIC,
    subscriptionStartDate: '',
    subscriptionEndDate: '',
  };

  constructor(
    private fb: FormBuilder,
    private authService: UsercompanyService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.companyForm = this.fb.group({ // Déclaration ici après l'initialisation de `fb`
      name: ['', Validators.required],
      subscription: [SubscriptionType.BASIC, Validators.required],
      subscriptionDuration: [1, [Validators.required, Validators.min(1)]],
    });
  }

  companyForm: FormGroup;

  ngOnInit(): void {
    this.authService.getUserProfile().subscribe({
      next: user => {
        this.currentUser = user;
        console.log('Utilisateur récupéré depuis le token :', user);

        this.loadUserCompanies();
        this.owner != this.currentUser.owner?.id;
      },
      error: err => {
        console.error('Erreur récupération user', err);
      }
    });
    this.route.paramMap.subscribe(params => {
      const token = params.get('token');
      if (token) {
        this.handleInvitation(token);
      }
    });
  }

  loadUserCompanies() {
    this.authService.getUserCompanies().subscribe({
      next: (companies: Company[]) => {
        console.log('Données reçues du backend:', companies);

        // Ajouter une propriété `isOwner` à chaque entreprise
        this.companies = companies.map(company => ({
          ...company,
          isOwner: company.id === this.currentUser?.owner?.id
        }));
      },
      error: (err) => console.error("Erreur chargement entreprises", err)
    });
  }

  viewSupplies(companyId: number): void {
    this.router.navigate(['/supply'], { queryParams: { companyId } });
  }


  createCompany() {
    const formValue = this.companyForm.value;
    const formData = new FormData();

    formData.append('name', formValue.name);
    formData.append('subscription', formValue.subscription);
    formData.append('subscriptionStartDate', new Date().toISOString()); // Date de début : maintenant

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + formValue.subscriptionDuration * 30); // Calcul de la date de fin
    formData.append('subscriptionEndDate', endDate.toISOString());

    this.authService.createCompany(formData).subscribe({
      next: (res) => {
        console.log('Entreprise créée', res);
        this.loadUserCompanies();
        this.companyForm.reset();
      },
      error: (err) => console.error('Erreur création', err)
    });
  }

  deleteCompany(companyId?: number) {
    if (!companyId) return;
    if (confirm('Confirmer la suppression ?')) {
      this.authService.deleteCompany(companyId).subscribe({
        next: () => {
          this.companies = this.companies.filter(c => c.id !== companyId);
        },
        error: (err) => console.error('Erreur suppression', err)
      });
    }
  }



  editCompany(company: Company) { // <-- Utiliser l'interface Company
    console.log('Données avant patch:', company);

    this.isEditing = true;
    this.selectedCompany = company;

    // Nouveau formatage des dates (sans conversion timezone)
    const formatDate = (date: string) => date?.split('T')[0] || '';

    this.companyForm.patchValue({
      name: company.name,
      subscription: company.subscription || SubscriptionType.BASIC,
      subscriptionStartDate: formatDate(company.subscriptionStartDate),
      subscriptionEndDate: formatDate(company.subscriptionEndDate)
    });
  }

  updateCompany() {
    if (!this.selectedCompany.id) return;
    const formValue = this.companyForm.value;
    const updateData = {
      ...formValue,
      subscriptionStartDate: new Date().toISOString(), // Date de début : maintenant
      subscriptionEndDate: new Date(new Date().getTime() + formValue.subscriptionDuration * 30 * 24 * 60 * 60 * 1000).toISOString() // Calcul de la date de fin
    };

    this.authService.updateCompany(this.selectedCompany.id, updateData).subscribe({
      next: () => {
        this.isEditing = false;
        this.loadUserCompanies(); // Recharger les entreprises mises à jour
      },
      error: (err) => console.error('Erreur mise à jour', err)
    });
  }

  handleInvitation(token: string) {
    this.authService.joinCompanyByToken(token).subscribe({
      next: (res: any) => {
        console.log('Invitation acceptée:', res);
        this.loadUserCompanies(); // Recharge les entreprises après ajout
      },
      error: (err) => console.error('Erreur lors de l\'acceptation de l\'invitation', err)
    });
  }
  updateDates(event: Event): void {
    const inputElement = event.target as HTMLInputElement; // Cast explicite vers HTMLInputElement
    const durationInMonths = parseInt(inputElement.value, 10);

    if (!isNaN(durationInMonths) && durationInMonths > 0) {
      const startDate = new Date(); // Date actuelle
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + durationInMonths * 30); // Ajout approximatif de x mois (x * 30 jours)

      // Mettre à jour les champs cachés du formulaire avec uniquement la date (format YYYY-MM-DD)
      this.companyForm.patchValue({
        subscriptionStartDate: startDate.toISOString().split('T')[0], // Format YYYY-MM-DD
        subscriptionEndDate: endDate.toISOString().split('T')[0],   // Format YYYY-MM-DD
      });
    }
  }


}

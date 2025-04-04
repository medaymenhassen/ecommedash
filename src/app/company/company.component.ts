import { Component, OnInit } from '@angular/core';
import { Company, SubscriptionType, UsercompanyService } from '../usercompany.service';
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
  accessLink: string | null = null;
  isEditing = false;
  companies: Company[] = [];
  subscriptionTypes = Object.values(SubscriptionType);

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
      subscriptionStartDate: ['', Validators.required],
      subscriptionEndDate: ['', Validators.required],
    });
  }

  companyForm: FormGroup;

  ngOnInit(): void {
    this.owner = this.getCurrentUserId();
    this.loadUserCompanies();
    this.route.paramMap.subscribe(params => {
      const token = params.get('token');
      if (token) {
        this.handleInvitation(token);
      }
    });
  }

  private getCurrentUserId(): number {
    return 100; // À remplacer par la récupération réelle de l'utilisateur
  }

  loadUserCompanies() {
    this.authService.getUserCompanies().subscribe({
      next: (companies: Company[]) => { // <-- Typage explicite
        console.log('Données reçues du backend:', companies);
        this.companies = companies;
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
    formData.append('subscriptionStartDate', formValue.subscriptionStartDate);
    formData.append('subscriptionEndDate', formValue.subscriptionEndDate);
    
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

    const updateData = { ...this.companyForm.value }; // Cloner les valeurs
    this.authService.updateCompany(this.selectedCompany.id, updateData).subscribe({
      next: () => {
        this.isEditing = false;
        this.loadUserCompanies(); // Recharger les entreprises mises à jour
      },
      error: (err) => console.error('Erreur mise à jour', err)
    });
  }

  generateAccessLink(companyId: number) {
    this.authService.generateAccessLink(companyId).subscribe({
      next: (res: any) => {
        this.accessLink = res.url;
        setTimeout(() => this.accessLink = null, 3600000);
      },
      error: (err) => console.error('Erreur génération lien', err)
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

}

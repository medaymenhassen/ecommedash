import { Component, OnInit } from '@angular/core';
import { Supply, UsercompanyService } from '../usercompany.service';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-supply',
  standalone: true,
  imports: [CommonModule,ReactiveFormsModule,FormsModule],
  templateUrl: './supply.component.html',
  styleUrl: './supply.component.css'
})
export class SupplyComponent implements OnInit {
  supplyForm!: FormGroup;
  supplies: Supply[] = [];
  selectedSupply: Supply | null = null;

  constructor(private fb: FormBuilder, private supplyService: UsercompanyService) { }

  ngOnInit(): void {
    this.initForm();
    this.getAllSupplies();
  }

  // Initialisation du formulaire
  initForm(): void {
    this.supplyForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      totalAmt: [0, [Validators.required, Validators.min(0.01)]]
    });
  }

  // Récupérer tous les supplies
  getAllSupplies(): void {
    this.supplyService.getAllSupplies().subscribe(
      (data) => this.supplies = data,
      (error) => console.error('Erreur lors du chargement des supplies:', error)
    );
  }

  // Soumission du formulaire (Ajout / Modification)
  onSubmit(): void {
    if (this.selectedSupply) {
      // Mode modification
      this.supplyService.updateSupply(this.selectedSupply.id!, this.supplyForm.value)
        .subscribe(() => {
          this.getAllSupplies();
          this.resetForm();
        });
    } else {
      // Mode création
      this.supplyService.createSupply(this.supplyForm.value)
        .subscribe(() => {
          this.getAllSupplies();
          this.resetForm();
        });
    }
  }

  // Modifier un Supply
  editSupply(supply: Supply): void {
    this.selectedSupply = supply;
    this.supplyForm.patchValue(supply);
  }

  // Supprimer un Supply
  deleteSupply(id?: number): void {
    if (id !== undefined) {
      this.supplyService.deleteSupply(id).subscribe(() => {
        this.getAllSupplies();
      });
    }
  }

  // Réinitialiser le formulaire
  resetForm(): void {
    this.supplyForm.reset();
    this.selectedSupply = null;
  }
}

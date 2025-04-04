import { Component } from '@angular/core';
import { AuthService } from '../auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-changepassword',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './changepassword.component.html',
  styleUrl: './changepassword.component.css'
})
export class ChangepasswordComponent {
  oldPassword: string = '';
  newPassword: string = '';
  message: string = '';

  constructor(private authService: AuthService) { }

  changePassword() {
    this.authService.changePassword(this.oldPassword, this.newPassword).subscribe(
      response => {
        // Assurez-vous d'extraire la propriété 'message' de la réponse JSON
        this.message = response.message;  // Accédez au message du backend
      },
      error => {
        console.error('Erreur lors du changement du mot de passe', error);
        // Assurez-vous que l'erreur est également traitée correctement
        this.message = error.error.message || 'Erreur lors du changement du mot de passe.';
      }
    );
  }

}

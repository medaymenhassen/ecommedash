import { Component } from '@angular/core';
import { AuthService } from '../auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-delete-user',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './delete-user.component.html',
  styleUrl: './delete-user.component.css'
})
export class DeleteUserComponent {
  message: string = '';

  constructor(private authService: AuthService) { }

  deleteUser() {
    this.authService.deleteUser().subscribe(
      (response) => {
        this.message = 'Votre compte a été supprimé avec succès.';
        setTimeout(() => {
          window.location.href = '/login';  // Redirection vers la page de login ou autre
        }, 3000); // Rediriger après 3 secondes
      },
      (error) => {
        console.error('Error deleting user:', error);
        this.message = 'Une erreur est survenue lors de la suppression de votre compte.';
      }
    );
  }

}

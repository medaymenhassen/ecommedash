import { Component } from '@angular/core';
import { ScienceService } from '../science.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-org',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, CommonModule],
  templateUrl: './org.component.html',
  styleUrl: './org.component.css'
})
export class OrgComponent {
  
}

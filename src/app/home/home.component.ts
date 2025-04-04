import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../auth.service';
import { MirrorComponent } from '../mirror/mirror.component';
import { MecontactComponent } from '../mecontact/mecontact.component';
import { SquatComponent } from '../squat/squat.component';
import { DetectComponent } from '../detect/detect.component';
import { GameComponent } from '../game/game.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, CommonModule, MirrorComponent, MecontactComponent, SquatComponent, DetectComponent, GameComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  
  constructor(
    private meta: Meta,
    private titleService: Title,
  ) {
  }
  ngOnInit(): void {
    this.titleService.setTitle("Cognitiex: Your Gateway to Innovation and Success");
    this.meta.addTags([
      { name: 'description', content: 'Unlock your potential with Cognitiex. Transform challenges into opportunities through AI, sales psychology, and 3D design.' },
      { name: 'keywords', content: 'AI, 3D design, sales psychology, data science, growth strategies' },
      { name: 'author', content: 'Cognitiex' },
      { property: 'og:title', content: "Cognitiex: Your Gateway to Innovation and Success" },
      { property: 'og:description', content: 'Join industry leaders who trust Cognitiex for AI, sales psychology, and immersive 3D experiences. Your success starts here.' },
      { property: 'og:image', content: '/logo.png' },
      { property: 'og:url', content: 'https://www.cognitiex.com' },
      { property: 'og:type', content: 'website' },
      { name: 'robots', content: 'index, follow' },
      { name: 'language', content: 'en' },
      { name: 'distribution', content: 'global' },
      { name: 'rating', content: 'general' },
      { name: 'theme-color', content: '#3a6cf4' },
      { property: 'og:site_name', content: 'Cognitiex' },
      { property: 'og:locale', content: 'en_US' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:site', content: '@Cognitiex' },
      { name: 'twitter:title', content: 'Cognitiex: Your Partner for Growth and Innovation' },
      { name: 'twitter:description', content: 'Our cutting-edge solutions combine technology with human insight to help you thrive.' },
      { name: 'twitter:image', content: '/logo.png' },
      { name: 'twitter:image:alt', content: 'Cognitiex Logo' },
      { property: 'og:emotional_value', content: 'Empowerment, Innovation, Trust' },
      { name: 'persuasion', content: 'Join Cognitiex and be part of a revolutionary journey. Secure your future today.' }
    ]);
  }
}

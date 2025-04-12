import { AfterViewInit, Component, OnDestroy, OnInit, Inject } from '@angular/core';
import { AuthService, AuthenticationRequest, User } from '../auth.service';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { UsercompanyService } from '../usercompany.service';
import { PLATFORM_ID } from '@angular/core';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit, AfterViewInit, OnDestroy {
  isLogin: boolean = true;
  username: string = '';
  password: string = '';
  confirmPassword: string = '';
  errorMessage: string = '';
  showPassword: boolean = false;
  
  constructor(
    private authService: AuthService,
    private usercompanyService: UsercompanyService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: object,
    private meta: Meta,
    private titleService: Title
  ) { }


  ngOnInit(): void {

    this.titleService.setTitle('Welcome to Cognitiex - Join or Sign In');
    this.meta.addTags([
      { name: 'description', content: 'Create meaningful connections and access exclusive content by joining Cognitiex. Log in or sign up now.' },
      { name: 'keywords', content: 'login, register, Cognitiex, community, connection' },
      { name: 'author', content: 'Cognitiex' },
      { property: 'og:title', content: 'Join the Cognitiex Community' },
      { property: 'og:description', content: 'Sign in or register to connect with a world of opportunities. Your journey starts here.' },
      { property: 'og:image', content: '/logo.png' },
      { property: 'og:url', content: `https://www.cognitiex.com/register` },
      { property: 'og:type', content: 'website' },
      { property: 'twitter:card', content: 'summary_large_image' },
      { property: 'twitter:title', content: 'Welcome to Cognitiex - Sign In or Join' },
      { property: 'twitter:description', content: 'Sign in or register to connect with a world of opportunities. Your journey starts here.' },
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
      { name: 'twitter:description', content: 'Sign in or register to connect with a world of opportunities. Your journey starts here.' },
      { name: 'twitter:image', content: '/logo.png' },
      { name: 'twitter:image:alt', content: 'Cognitiex Logo' },
      { property: 'og:emotional_value', content: 'Empowerment, Innovation, Trust' },
      { name: 'persuasion', content: 'Join Cognitiex and be part of a revolutionary journey. Secure your future today.' }
    ]);

  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.reveal();
      window.addEventListener('scroll', this.reveal.bind(this));
    }
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('scroll', this.reveal.bind(this));
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  login(): void {
    const authRequest: AuthenticationRequest = {
      username: this.username,
      password: this.password
    };

    this.authService.authenticate(authRequest).subscribe({
      next: (response) => {
        if (response && response.accessToken) {
          this.authService.saveToken(response.accessToken);
          this.authService.storeNewRefreshToken(response.refreshToken);
          this.router.navigate(['/']);
        } else {
          this.errorMessage = 'Invalid response received from server.';
        }
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Error while logging in';
      }
    });
  }

  // Dans RegisterComponent
  register(): void {
    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      return;
    }
    this.processRegistration();

  }


  processRegistration(): void {
    const authRequest: AuthenticationRequest = {
      username: this.username,
      password: this.password,
    };

    this.usercompanyService.register(authRequest).subscribe({
      next: (response) => {
        if (response && response.accessToken) {
          this.authService.saveToken(response.accessToken);
          this.authService.storeNewRefreshToken(response.refreshToken);
          this.router.navigate(['/']);
        } else {
          this.errorMessage = 'Invalid response received from server.';
          console.error('Error in response: ', response);
        }
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Error while registering';
        console.error('Error during registration: ', error);
      }
    });
  }

  toggleForm(isLogin: boolean): void {
    this.isLogin = isLogin;
    this.errorMessage = '';
    setTimeout(() => this.reveal(), 100);
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  reveal(): void {
    if (isPlatformBrowser(this.platformId)) {
      const reveals = document.querySelectorAll(".reveal");
      const triggerBottom = window.innerHeight / 5 * 4;

      reveals.forEach(box => {
        const boxTop = (box as HTMLElement).getBoundingClientRect().top;
        if (boxTop < triggerBottom) {
          (box as HTMLElement).classList.add('active');
        } else {
          (box as HTMLElement).classList.remove('active');
        }
      });
    }


  }
  get isUserLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  get currentUsername(): string | null {
    return this.authService.getUsernameFromToken();
  }

}

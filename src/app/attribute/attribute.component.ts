import { Attribute, Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { AuthService, Color, Length, Product, ProductAttribute, Size } from '../auth.service';
import { CommonModule, DOCUMENT } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-attribute',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './attribute.component.html',
  styleUrl: './attribute.component.css'
})

export class AttributeComponent implements OnInit {
  selectedFilePreviews: { imagePath?: string; texturePath?: string; videoPath?: string } = {};
  
  productAttributes: (ProductAttribute & {
    imageUrl?: string | null;
    textureUrl?: string | null;
    videoUrl?: string | null;
  })[] = [];
  colors: Color[] = [];
  sizes: Size[] = [];
  products: Product[] = [];
  lengths: Length[] = [];

  // Form Groups
  attributForm: FormGroup;
  selectedAttribute: (ProductAttribute & {
    imageUrl?: string | null;
    textureUrl?: string | null;
    videoUrl?: string | null;
  }) | null = null;

  // Références aux éléments d'entrée de fichier pour le formulaire de création
  @ViewChild('ImageInput') ImageInput!: ElementRef;
  @ViewChild('TextureInput') TextureInput!: ElementRef;
  @ViewChild('VideoInput') VideoInput!: ElementRef;

  
  previewHtml: string = '';
  defaultText: string = `# My favorite things
Here are some of my favorite things:
* Pizza, Hiking, Reading books, Playing video games
1. Paris, New York City, Tokyo, Sydney
## Why I love pizza
Pizza is my all-time favorite food. I could eat pizza every day and never get tired of it. My favorite kind of pizza is pepperoni and mushroom, but I also like to try new toppings and combinations.
### What makes a good pizza?
In my opinion, a good pizza has a crispy crust, plenty of cheese, and a generous amount of toppings. I also like it when the sauce is a little bit spicy.`;

  constructor(private authService: AuthService, private fb: FormBuilder, @Inject(DOCUMENT) private document: Document) {
    // Initialize Create Form
    this.attributForm = this.fb.group({
      productId: [null, Validators.required],
      colorId: [null, Validators.required],
      sizeId: [null, Validators.required],
      lengthId: [null],
      detail: [''],
      text: [this.defaultText, Validators.required],
      price: [null, [Validators.required, Validators.min(0.01)]],
      qte: [null, [Validators.required, Validators.min(1)]],
      sales: [0, [Validators.required, Validators.min(0)]],
      imagePath: [null],
      texturePath: [null],
      videoPath: [null],
    });
  }
  ngOnInit(): void {
    this.loadColors();
    this.loadSizes();
    this.loadProducts();
    this.loadLengths();
    this.loadProductAttributes();
    this.attributForm.get('text')?.valueChanges.subscribe(value => {
      this.updatePreview(value);
    });

  }

  // Chargement des données de référence
  loadColors(): void {
    this.authService.getColor().subscribe(
      (data: Color[]) => (this.colors = data),
      (error) => console.error('Erreur lors du chargement des couleurs', error)
    );
  }

  loadSizes(): void {
    this.authService.getSize().subscribe(
      (data: Size[]) => (this.sizes = data),
      (error) => console.error('Erreur lors du chargement des tailles', error)
    );
  }

  loadProducts(): void {
    this.authService.getProducts().subscribe(
      (data: Product[]) => {
        this.products = data;
      },
      (error) => console.error('Erreur lors du chargement des produits', error)
    );
  }

  loadLengths(): void {
    this.authService.getLength().subscribe(
      (data: Length[]) => (this.lengths = data),
      (error) => console.error('Erreur lors du chargement des longueurs', error)
    );
  }

  loadProductAttributes(): void {
    this.authService.getProductAttributeUser().subscribe(
      (data: ProductAttribute[]) => {
        this.productAttributes = data.map(attr => ({
          ...attr,
          imageUrl: attr.imagePath ? this.authService.getImageUrl(attr.imagePath) : null,
          textureUrl: attr.texturePath ? this.authService.getImageUrl(attr.texturePath) : null,
          videoUrl: attr.videoPath ? this.authService.getVideoUrl(attr.videoPath) : null
        }));
      },
      (error) => console.error('Erreur lors du chargement des attributs de produit', error)
    );
  }

  // Gestion des changements de fichiers
  onFileChange(event: Event, controlName: string, form: FormGroup, isUpdate: boolean = false): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      const file = input.files[0];
      form.patchValue({
        [controlName]: file
      });
      form.get(controlName)?.updateValueAndValidity();

      // Générer une URL de prévisualisation
      const reader = new FileReader();
      reader.onload = (e: any) => {
        if (controlName === 'imagePath') {
          isUpdate ? this.selectedFilePreviews.imagePath = e.target.result
            : this.selectedFilePreviews.imagePath = e.target.result;
        } else if (controlName === 'texturePath') {
          isUpdate ? this.selectedFilePreviews.texturePath = e.target.result
            : this.selectedFilePreviews.texturePath = e.target.result;
        }
      };
      if (controlName === 'videoPath') {
        // Pour les vidéos, utiliser createObjectURL
        const videoUrl = URL.createObjectURL(file);
        isUpdate ? this.selectedFilePreviews.videoPath = videoUrl
          : this.selectedFilePreviews.videoPath = videoUrl;
      } else {
        reader.readAsDataURL(file);
      }
    }
  }

  // Create a new product attribute
  onCreate(): void {
    if (this.attributForm.invalid) {
      return;
    }

    const formValue = this.attributForm.value;
    const files = {
      imagePath: formValue.imagePath,
      texturePath: formValue.texturePath,
      videoPath: formValue.videoPath,
    };

    const newAttribute: ProductAttribute = {
      color: { id: formValue.colorId } as Color,
      size: { id: formValue.sizeId } as Size,
      product: { id: formValue.productId } as Product,
      length: formValue.lengthId ? { id: formValue.lengthId } as Length : undefined,
      detail: this.previewHtml,
      text: formValue.text,

      price: formValue.price,
      qte: formValue.qte,
      sales: formValue.sales,
      userId: 0, // Cette valeur sera gérée côté backend
    };
    if (this.selectedAttribute) {
      this.authService.updateProductAttribute(this.selectedAttribute.id!, newAttribute, files).subscribe(
        (data: ProductAttribute) => {
          const updatedAttrWithUrls = {
            ...data,
            imageUrl: data.imagePath ? this.authService.getImageUrl(data.imagePath) : null,
            textureUrl: data.texturePath ? this.authService.getImageUrl(data.texturePath) : null,
            videoUrl: data.videoPath ? this.authService.getVideoUrl(data.videoPath) : null
          };
          const index = this.productAttributes.findIndex((attr) => attr.id === data.id);
          if (index !== -1) {
            this.productAttributes[index] = updatedAttrWithUrls;
          }
          this.selectedAttribute = null;
          this.attributForm.reset();
          this.resetFileInputs(); // Réinitialiser les entrées de fichier
          this.selectedFilePreviews = {};
        },
        (error) => console.error('Erreur lors de la mise à jour de l\'attribut de produit', error)
      );
    } else {
    this.authService.createProductAttribute(newAttribute, files).subscribe(
      (data: ProductAttribute) => {
        const newAttrWithUrls = {
          ...data,
          imageUrl: data.imagePath ? this.authService.getImageUrl(data.imagePath) : null,
          textureUrl: data.texturePath ? this.authService.getImageUrl(data.texturePath) : null,
          videoUrl: data.videoPath ? this.authService.getVideoUrl(data.videoPath) : null
        };
        this.productAttributes.push(newAttrWithUrls);
        this.attributForm.reset();
        this.resetFileInputs(); // Réinitialiser les entrées de fichier
        this.selectedFilePreviews = {};
      },
      (error) => console.error('Erreur lors de la création de l\'attribut de produit', error)
      );
    }
  }

  // Sélectionner un attribut pour mise à jour
  onSelect(attribute: ProductAttribute & {
    imageUrl?: string | null;
    textureUrl?: string | null;
    videoUrl?: string | null;
  }): void {
    this.selectedAttribute = attribute;
    this.attributForm.patchValue({
      productId: attribute.product.id,
      colorId: attribute.color.id,
      sizeId: attribute.size.id,
      lengthId: attribute.length ? attribute.length.id : null,
      price: attribute.price,
      qte: attribute.qte,
      sales: attribute.sales,
      detail: this.previewHtml,
      text: attribute.text,

      imagePath: null,
      texturePath: null,
      videoPath: null,
    });
  }

  // Mettre à jour un attribut de produit
  onUpdate(): void {
    if (!this.selectedAttribute || this.attributForm.invalid) {
      return;
    }

    const formValue = this.attributForm.value;
    const files = {
      imagePath: formValue.imagePath,
      texturePath: formValue.texturePath,
      videoPath: formValue.videoPath,
    };

    const updatedAttribute: ProductAttribute = {
      ...this.selectedAttribute,
      color: { id: formValue.colorId } as Color,
      size: { id: formValue.sizeId } as Size,
      product: { id: formValue.productId } as Product,
      length: formValue.lengthId ? { id: formValue.lengthId } as Length : undefined,
      price: formValue.price,
      qte: formValue.qte,
      sales: formValue.sales,
      detail: this.previewHtml,
      text: formValue.text,

    };

    this.authService.updateProductAttribute(this.selectedAttribute.id!, updatedAttribute, files).subscribe(
      (data: ProductAttribute) => {
        const updatedAttrWithUrls = {
          ...data,
          imageUrl: data.imagePath ? this.authService.getImageUrl(data.imagePath) : null,
          textureUrl: data.texturePath ? this.authService.getImageUrl(data.texturePath) : null,
          videoUrl: data.videoPath ? this.authService.getVideoUrl(data.videoPath) : null
        };
        const index = this.productAttributes.findIndex((attr) => attr.id === data.id);
        if (index !== -1) {
          this.productAttributes[index] = updatedAttrWithUrls;
        }
        this.selectedAttribute = null;
        this.selectedFilePreviews = {};
      },
      (error) => console.error('Erreur lors de la mise à jour de l\'attribut de produit', error)
    );
  }

  // Supprimer un attribut de produit
  onDelete(id: number): void {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet attribut de produit ?')) {
      return;
    }

    this.authService.deleteProductAttribute(id).subscribe(
      () => {
        this.productAttributes = this.productAttributes.filter((attr) => attr.id !== id);
      },
      (error) => console.error('Erreur lors de la suppression de l\'attribut de produit', error)
    );
  }


  // Méthodes pour réinitialiser les entrées de fichier du formulaire de création
  private resetFileInputs(): void {
    if (this.ImageInput) {
      this.ImageInput.nativeElement.value = '';
    }
    if (this.TextureInput) {
      this.TextureInput.nativeElement.value = '';
    }
    if (this.VideoInput) {
      this.VideoInput.nativeElement.value = '';
    }
  }

  updatePreview(value: string): void {
    this.previewHtml = value
      .replace(/^# (.*)/gm, "<h2>$1</h2>")
      .replace(/^## (.*)/gm, "<h3>$1</h3>")
      .replace(/^### (.*)/gm, "<h4>$1</h4>")
      .replace(/^(\*|\d+\.)\s+(.*)(?=\n|$)/gm, (_, type, item) => {
        if (item.startsWith("<li>")) {
          return item;
        }
        const items = item.split(/,\s+/);
        const prefix = type === "*" ? "<ul>" : `<ol start="${parseInt(type)}">`;
        const suffix = type === "*" ? "</ul>" : "</ol>";
        return `${prefix}${items.map((i: string) => `<li>${i.trim()}</li>`).join("")}${suffix}`;
      })
      .replace(/<\/li><\/ul><\/ol><li>/g, "</li><li>")
      .replace(/(^|\n)(?!<[hluo])(.+)(?=\n|$)/g, (_, before, text) => {
        if (text.includes("<ul>") || text.includes("<ol>")) {
          return text;
        } else if (before.startsWith("#")) {
          return `${before}${text}`;
        } else {
          return `<p>${text}</p>`;
        }
      });
  }

  isBrowser(): boolean {
    return typeof document !== 'undefined';
  }

  setCookie(name: string, value: string, days: number): void {
    if (this.isBrowser()) {
      let expires = "";
      if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
      }
      this.document.cookie = name + "=" + (value || "") + expires + "; path=/";
    }
  }

  getCookie(name: string): string | null {
    if (this.isBrowser()) {
      const nameEQ = name + "=";
      const ca = document.cookie.split(';');
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
      }
    }
    return null;
  }

  eraseCookie(name: string): void {
    if (this.isBrowser()) {
      document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    }
  }

  loadDraft(): void {
    const draft = this.getCookie('draftDetailInput_productcreate');
    if (draft) {
      this.attributForm.get('text')?.setValue(draft);
    } else {
      this.attributForm.get('text')?.setValue(this.defaultText);
    }
  }

  saveAsDraft(): void {
    const detailValue = this.attributForm.get('text')?.value;
    this.setCookie('draftDetailInput_productcreate', detailValue, 1);
    alert("Brouillon sauvegardé.");
  }

  deleteDraft(): void {
    this.eraseCookie('draftDetailInput_productcreate');
    alert("Brouillon supprimé.");
    this.attributForm.get('text')?.setValue(this.defaultText);
  }
  onDetailInput(event: Event) {
    const input = event.target as HTMLTextAreaElement;
    this.updatePreview(input.value);
  }
}

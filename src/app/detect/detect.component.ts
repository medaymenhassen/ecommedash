import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, ViewChild } from '@angular/core';
import { MoveService } from '../move.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder } from '@angular/forms';

@Component({
  selector: 'app-detect',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, CommonModule],
  templateUrl: './detect.component.html',
  styleUrls: ['./detect.component.css']
})
export class DetectComponent implements AfterViewInit, OnDestroy {
  @ViewChild('videoElement', { static: false }) videoElement!: ElementRef<HTMLVideoElement>;
  imageForm: FormGroup;
  private video!: HTMLVideoElement;
  private animationFrameId: number | null = null;
  private lastPredictionTime = 0;
  private predictionInterval = 200;
  private isProcessing = false;
  private isStreamActive = false;
  private stream: MediaStream | null = null; // MediaStream | null as a class property

  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;

  constructor(private tfService: MoveService, private ngZone: NgZone, private fb: FormBuilder) {
    this.imageForm = this.fb.group({
      className: ['']  // Input field for class name
    });

    if (typeof document !== 'undefined') {
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d')!;
    }
  }

  async ngAfterViewInit() {
    this.video = this.videoElement.nativeElement;

    try {
      const [modelPath, expressionModelPath] = ['/tfjs_model/model.json', '/generation_tfjs/model.json'];
      this.stream = await this.setupWebcam();

      if (this.stream instanceof MediaStream) {
        console.log('Webcam stream is valid');
      } else {
        console.error('Webcam stream is not valid');
      }

      await Promise.all([this.tfService.loadModel(modelPath), this.tfService.loadExpressionModel(expressionModelPath)]);
    } catch (error) {
      console.error('Error initializing webcam or models', error);
    }
  }

  private async setupWebcam(): Promise<MediaStream | null> {
    if (typeof window === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error('Webcam API not supported in this browser.');
      alert('Your browser does not support webcam access.');
      return null;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      this.video.srcObject = stream;
      return stream;
    } catch (error) {
      console.error('Error accessing webcam:', error);
      return null;
    }
  }

  private startDetection() {
    this.ngZone.runOutsideAngular(() => {
      this.animationLoop(performance.now());
    });
  }

  private animationLoop(timestamp: number) {
    if (!this.isStreamActive) return;

    if (!this.isProcessing && timestamp - this.lastPredictionTime > this.predictionInterval) {
      this.isProcessing = true;
      this.lastPredictionTime = timestamp;

      this.processCurrentFrame().finally(() => {
        this.isProcessing = false;
      });
    }

    this.animationFrameId = requestAnimationFrame(this.animationLoop.bind(this));
  }

  private async processCurrentFrame() {
    if (!this.video.videoWidth) return;

    this.canvas.width = this.video.videoWidth;
    this.canvas.height = this.video.videoHeight;

    this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

    const detectedClass = await this.tfService.predict(this.canvas);

    if (detectedClass) {
      this.ngZone.run(() => {
        this.handleAction(detectedClass);
        this.generateImageFromClass(detectedClass); // Generate image based on detected class
      });
    }
  }

  // Handle detected actions
  private handleAction(action: string): void {
    switch (action) {
      case 'squat':
        console.log('📌 Charger squat.fbx dans Angular !');
        break;
      case 'kick':
        console.log('⚽ Charger kick.fbx !');
        break;
      case 'peur':
        console.log('😱 Réaction de peur détectée !');
        break;
      case 'joie':
        console.log('😄 Expression de joie détectée !');
        break;
      case 'suprise':
        console.log('😮 Surprise détectée !');
        break;
      case 'takehand':
        console.log('👋 Geste de main détecté !');
        break;
      default:
        console.log(`Action inconnue: ${action}`);
    }
  }

private async generateImageFromClass(detectedClass: string) {
  try {
    if (!detectedClass) {
      console.error('Detected class is undefined or empty.');
      return;
    }

    const generatedImage = await this.tfService.generateExpression(detectedClass);

    if (generatedImage && generatedImage instanceof HTMLImageElement) {
      console.log(`Generated image for class ${detectedClass}:`, generatedImage);
      document.body.appendChild(generatedImage);  // Append image to DOM
    } else {
      console.error('Generated image is not of type HTMLImageElement.');
    }
  } catch (error) {
    console.error('Error generating image:', error);
  }
}

  // Submit form to generate image based on user input
  onSubmit(): void {
    const className = this.imageForm.get('className')?.value;
    if (className) {
      this.generateImageFromClass(className); // Generate image for the class entered in the form
    }
  }

  ngOnDestroy(): void {
    this.isStreamActive = false;

    if (this.animationFrameId != null) {
      cancelAnimationFrame(this.animationFrameId);
    }

    if (this.video.srcObject) {
      const stream = this.video.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  }
}

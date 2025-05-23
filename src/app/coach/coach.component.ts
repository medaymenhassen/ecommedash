import { Component, ViewChild, ElementRef, OnDestroy, PLATFORM_ID, Inject, AfterViewInit } from '@angular/core';
import { CommonModule, isPlatformBrowser, PercentPipe } from '@angular/common';
import { CoachService } from '../coach.service';
import { PoseLandmarker, FilesetResolver, DrawingUtils, NormalizedLandmark } from '@mediapipe/tasks-vision';

type LandmarkData = {
  from?: NormalizedLandmark;
  to?: NormalizedLandmark;
  index?: number;
};

@Component({
  selector: 'app-coach',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './coach.component.html',
  styleUrls: ['./coach.component.css']
})
export class CoachComponent implements AfterViewInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('outputCanvas') outputCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('referenceCanvas') referenceCanvas!: ElementRef<HTMLCanvasElement>;

  isCameraOn = false;
  private poseLandmarker!: PoseLandmarker;
  private animationFrameId!: number;
  currentAnalysis: any = null;
  private drawingUtils!: DrawingUtils;
  private sequence: number[][][] = [];
  private readonly SEQ_LEN = 30;
  private errorCount = 0;
  private lastGoodReference: number[] | null = null;


  availableVoices: SpeechSynthesisVoice[] = [];
  currentAudioStatus: 'playing' | 'paused' | 'stopped' = 'stopped';
  isAudioEnabled = true;

  toggleAudio() {
    this.coachService.toggleAudio();
    this.isAudioEnabled = this.coachService.audioEnabled;
  }


  constructor(
    private coachService: CoachService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  async ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      await this.initializePoseLandmarker();
      this.initializeDrawingUtils();
      this.initializeAudio();
    }
  }

  private async initializePoseLandmarker() {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
    );

    this.poseLandmarker = await PoseLandmarker.createFromOptions(
      vision,
      {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      }
    );
  }

  private initializeDrawingUtils() {
    if (isPlatformBrowser(this.platformId)) {
      const ctx = this.outputCanvas.nativeElement.getContext('2d');
      if (ctx) this.drawingUtils = new DrawingUtils(ctx);
    }
  }

  async toggleCamera() {
    this.isCameraOn ? this.stopCamera() : await this.activateCamera();
    this.isCameraOn = !this.isCameraOn;
  }

  private async activateCamera() {
    try {
      this.stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 }
      });
      await this.initializeVideoStream(stream);
      this.startDetectionLoop();
    } catch (error) {
      console.error('Erreur activation caméra:', error);
    }
  }

  private async initializeVideoStream(stream: MediaStream) {
    this.videoElement.nativeElement.srcObject = stream;

    // Correction ici
    await new Promise<void>(resolve => {
      this.videoElement.nativeElement.onloadedmetadata = (event) => {
        resolve();
      };
    });

    await this.videoElement.nativeElement.play();
  }
  getPrecisionColor(deviation: number): string {
    if (deviation <= 0.1) {
      return 'green';
    } else if (deviation <= 0.4) {
      return 'orange';
    } else {
      return 'red';
    }
  }
  getConfidenceColor(confidence: number): string {
    if (confidence >= 0.9) {
      return 'green';
    } else if (confidence >= 0.6) {
      return 'orange';
    } else {
      return 'red';
    }
  }
  private startDetectionLoop() {
    const processFrame = async () => {
      if (!this.isCameraOn) return;

      try {
        const results = this.poseLandmarker.detectForVideo(
          this.videoElement.nativeElement,
          performance.now()
        );

        this.handlePoseResults(results);
        this.animationFrameId = requestAnimationFrame(processFrame);
      } catch (e) {
        console.error('Erreur détection:', e);
      }
    };
    this.animationFrameId = requestAnimationFrame(processFrame);
  }

  private handlePoseResults(results: any) {
    const canvas = this.outputCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = this.videoElement.nativeElement.videoWidth;
    canvas.height = this.videoElement.nativeElement.videoHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(this.videoElement.nativeElement, 0, 0, canvas.width, canvas.height);

    if (results.landmarks?.[0]) {
      this.drawLandmarks(results.landmarks[0]);
      this.updateAnalysisData(results.landmarks[0]);
    }
  }

  private drawLandmarks(landmarks: any[]) {
    this.drawingUtils.drawLandmarks(landmarks, {
      color: '#FF0000',
      radius: (data) => 5 * (data.from?.visibility ?? 0.5)
    });

    this.drawingUtils.drawConnectors(
      landmarks,
      PoseLandmarker.POSE_CONNECTIONS,
      { color: '#00FF00', lineWidth: 4 }
    );
  }

  private updateAnalysisData(landmarks: any[]) {
    const poseData = this.normalizeLandmarks(landmarks);
    this.sequence.push(poseData);
    if (this.sequence.length > this.SEQ_LEN) this.sequence.shift();

    if (this.sequence.length === this.SEQ_LEN) {
      const inputTensor = this.prepareInputTensor();
      this.coachService.predictWithAnalysis(inputTensor)
        .then(analysis => {
          this.currentAnalysis = analysis;
          this.updateErrorHandling(analysis);
          this.drawReferenceComparison();
        });
    }
  }

  private normalizeLandmarks(landmarks: any[]): number[][] {
    return landmarks.map(l => [l.x, l.y, l.z, l.visibility]);
  }

  private prepareInputTensor(): number[][][] {
    // Chaque frame = 33 landmarks × 4 valeurs = 132 features
    return [this.sequence.map(frame =>
      frame.flatMap(landmark => landmark.slice(0, 4)) // ✅ Aplatit correctement
    )];
  }


  private updateErrorHandling(analysis: any) {
    if (analysis.deviation < 0.8) {
      this.errorCount++;
      if (this.errorCount >= 2) this.lastGoodReference = analysis.reference_pose;
    } else {
      this.errorCount = 0;
    }
  }

  private drawReferenceComparison() {
    if (!this.lastGoodReference) return;

    const refCtx = this.referenceCanvas.nativeElement.getContext('2d');
    if (!refCtx) return;

    refCtx.clearRect(0, 0, refCtx.canvas.width, refCtx.canvas.height);
    const referenceLandmarks = this.formatReferenceLandmarks();

    referenceLandmarks.forEach(([x, y]) => {
      refCtx.beginPath();
      refCtx.arc(x, y, 5, 0, 2 * Math.PI);
      refCtx.fillStyle = '#00FF00';
      refCtx.fill();
    });
  }

  private formatReferenceLandmarks(): number[][] {
    return this.lastGoodReference?.reduce((acc, _, i, arr) => {
      if (i % 4 === 0) acc.push([arr[i] * 1280, arr[i + 1] * 720]);
      return acc;
    }, [] as number[][]) || [];
  }

  private stopCamera() {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    const stream = this.videoElement.nativeElement.srcObject as MediaStream;
    stream?.getTracks().forEach(track => track.stop());
    this.videoElement.nativeElement.srcObject = null;
  }














  private initializeAudio() {
    this.availableVoices = this.coachService.getAvailableVoices();
    setTimeout(() => { // Laisse le temps de charger les voix
      this.availableVoices = this.coachService.getAvailableVoices();
    }, 1000);
  }


  togglePlayback() {
    this.coachService.togglePlayback();
    this.currentAudioStatus = this.coachService.currentAudioStatus;
  }

  stopPlayback() {
    this.coachService.stopPlayback();
    this.currentAudioStatus = 'stopped';
  }

  selectVoice(event: Event) {
    const voiceName = (event.target as HTMLSelectElement).value;
    const voice = this.availableVoices.find(v => v.name === voiceName);
    if (voice) this.coachService.setVoice(voice);
  }



  ngOnDestroy() {
    this.stopCamera();
    this.poseLandmarker?.close();
  }

}

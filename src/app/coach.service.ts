import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import * as ort from 'onnxruntime-web';

@Injectable({
  providedIn: 'root'
})
export class CoachService {
  private session: ort.InferenceSession | null = null;
  private labelMap: string[] | { [key: string]: string } = {};
  private jointNames: string[] = [];
  private idxToLabel: { [key: number]: string } = {};
  public ready: Promise<void>;
  private resolveReady!: () => void;
  // Modifiez la déclaration de la propriété avec l'assertion de définition définitive
  private speechSynthesis!: SpeechSynthesis;
  private utterance: SpeechSynthesisUtterance | null = null;
  public currentAudioStatus: 'playing' | 'paused' | 'stopped' = 'stopped';
  private recommendationQueue: string[] = [];
  isAudioEnabled = true;

  // Dans CoachService
  getLabels(): string[] {
    if (Array.isArray(this.labelMap)) return this.labelMap;
    return Object.values(this.labelMap);
  }

  constructor(private http: HttpClient, @Inject(PLATFORM_ID) private platformId: Object) {
    this.ready = new Promise(resolve => this.resolveReady = resolve);


    if (isPlatformBrowser(this.platformId)) {
      this.init().catch(console.error);
      this.speechSynthesis = window.speechSynthesis;
      this.initVoices();
    }
  }

  // coach.service.ts
  private async init() {
    try {
      // Configuration avancée WebAssembly
      ort.env.wasm.numThreads = 1;
      ort.env.wasm.proxy = true;
      ort.env.wasm.simd = false;
      ort.env.wasm.wasmPaths = window.location.origin + '/assets/onnx/';

      // Chargement asynchrone amélioré
      const [model, labelMap] = await Promise.all([
        this.loadModel(),
        this.loadLabelMap()
      ]);

      //this.jointNames = Array.from({ length: 33 }, (_, i) => `POSE_LANDMARK_${i}`);
      /*
      this.jointNames = [
        "nez", "œil gauche intérieur", "œil gauche", "œil gauche extérieur",
        "œil droit intérieur", "œil droit", "œil droit extérieur",
        "oreille gauche", "oreille droite", "coin gauche de la bouche", "coin droit de la bouche",
        "épaule gauche", "épaule droite", "coude gauche", "coude droit",
        "poignet gauche", "poignet droit", "auriculaire gauche", "auriculaire droit",
        "index gauche", "index droit", "pouce gauche", "pouce droit",
        "hanche gauche", "hanche droite", "genou gauche", "genou droit",
        "cheville gauche", "cheville droite", "talon gauche", "talon droit",
        "avant du pied gauche", "avant du pied droit"
      ];
      */
      this.jointNames = [
        // Tête
        "tête", "tête", "tête", "tête",         // nez, œil gauche intérieur, œil gauche, œil gauche extérieur
        "tête", "tête", "tête",                 // œil droit intérieur, œil droit, œil droit extérieur
        "tête", "tête", "tête",                 // oreille gauche, oreille droite, coin gauche de la bouche, coin droit de la bouche

        // Épaules et bras
        "épaule gauche", "épaule droite",
        "coude gauche", "coude droit",
        "poignet gauche", "poignet droit",

        // Main gauche
        "main gauche", "main gauche", "main gauche", // auriculaire gauche, index gauche, pouce gauche

        // Main droite
        "main droite", "main droite", "main droite", // auriculaire droit, index droit, pouce droit

        // Hanches et jambes
        "hanche gauche", "hanche droite",
        "genou gauche", "genou droit",
        "cheville gauche", "cheville droite",

        // Pied gauche
        "talon gauche", "avant-pied gauche",

        // Pied droit
        "talon droit", "avant-pied droit"
      ];


      this.resolveReady();
    } catch (error) {
      console.error('❌ Initialisation échouée :', error);
      throw error;
    }
  }

  // coach.service.ts
  async loadModel() {
    try {
      const modelUrl = this.getAssetUrl('/assets/onnx/exercise_guide.onnx');
      this.session = await ort.InferenceSession.create(/* @vite-ignore */ modelUrl);
    } catch (error) {
      console.error('❌ Erreur de chargement du modèle:', error);
    }
  }


  async loadLabelMap() {
    const url = this.getAssetUrl('/assets/onnx/label_map.json');
    const res = await fetch(url);
    this.labelMap = await res.json();

    if (Array.isArray(this.labelMap)) {
      this.labelMap.forEach((label, i) => this.idxToLabel[i] = label);
    } else {
      Object.entries(this.labelMap).forEach(([k, v]) => {
        this.idxToLabel[parseInt(v as string)] = k;
      });
    }
    console.log('✅ Label map loaded', this.idxToLabel);
  }

  private getAssetUrl(path: string): string {
    if (isPlatformBrowser(this.platformId)) {
      return window.location.origin + path;
    }
    return path;
  }

  async predictWithAnalysis(input: number[][][]): Promise<any> {
    if (!this.session) throw new Error('ONNX session not loaded');

    const inputName = this.session.inputNames[0];
    const batch = input.length;
    const sequence = input[0].length;
    const features = input[0][0].length;

    const tensor = new ort.Tensor(
      'float32',
      new Float32Array(input.flat(2)),
      [batch, sequence, features]
    );

    const feeds: Record<string, ort.Tensor> = { [inputName]: tensor };
    const outputs = await this.session.run(feeds);

    // COPIE les données AVANT de disposer les tensors
    const logits = Array.from(outputs[this.session.outputNames[0]].data as Float32Array);
    const reference = this.session.outputNames.length > 1
      ? Array.from(outputs[this.session.outputNames[1]].data as Float32Array)
      : null;

    // Dispose APRÈS avoir copié les données
    tensor.dispose();
    Object.values(outputs).forEach(t => t.dispose?.());

    const probs = this.softmax(logits);
    const classIdx = probs.indexOf(Math.max(...probs));
    const predictedClass = this.idxToLabel[classIdx];
    const confidence = probs[classIdx];

    const currentPose = input[0][0];
    let deviation = 0.5;
    let recommendations: string[] = [];

    if (reference) {
      deviation = this.cosineSimilarity(currentPose, reference);
      recommendations = this.generateRecommendations(currentPose, reference);
    }
    if (recommendations.length > 0) {
      this.speakRecommendations(recommendations).catch(console.error);
    } else {
      this.lastSpokenRecommendation = null;
      if (this.isSpeaking) {
        this.speechSynthesis.cancel();
        this.isSpeaking = false;
      }
    }

    return {
      class: predictedClass,
      confidence,
      deviation,
      recommendations,
      reference_pose: reference,
      current_pose: currentPose
    };
  }

  private softmax(logits: number[]): number[] {
    const max = Math.max(...logits);
    const exps = logits.map(x => Math.exp(x - max));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map(e => e / sum);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
    const normA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
    const normB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
    return normA && normB ? dot / (normA * normB) : 0;
  }

  private generateRecommendations(current: number[], reference: number[]): string[] {
    const recommendations: string[] = [];
    const diffs: { magnitude: number, jointIdx: number }[] = [];

    for (let j = 0; j < 33; j++) {
      const idx = j * 4;
      const diffVec = [
        reference[idx] - current[idx],
        reference[idx + 1] - current[idx + 1],
        reference[idx + 2] - current[idx + 2]
      ];
      const mag = Math.sqrt(diffVec.reduce((sum, v) => sum + v * v, 0));
      diffs.push({ magnitude: mag, jointIdx: j });
    }

    diffs.sort((a, b) => b.magnitude - a.magnitude);
    const top3 = diffs.slice(0, 3);

    for (const { magnitude, jointIdx } of top3) {
      if (magnitude <= 0.05) continue;
      const name = this.jointNames[jointIdx];
      const idx = jointIdx * 4;
      const directions: string[] = [];

      if (Math.abs(reference[idx] - current[idx]) > 0.03) directions.push('horizontalement');
      if (Math.abs(reference[idx + 1] - current[idx + 1]) > 0.03)
        directions.push(reference[idx + 1] < current[idx + 1] ? 'vers le haut' : 'vers le bas');
      if (Math.abs(reference[idx + 2] - current[idx + 2]) > 0.03)
        directions.push(reference[idx + 2] > current[idx + 2] ? 'vers l\'avant' : 'vers l\'arrière');

      const text = directions.length ? ` ${directions.join(' et ')}` : '';
      recommendations.push(`Ajustez votre ${name}${text}`);
    }

    return recommendations;
  }



































  private initVoices() {
    if ('onvoiceschanged' in this.speechSynthesis) {
      this.speechSynthesis.onvoiceschanged = () => {
        console.log('Voix chargées:', this.getAvailableVoices());
      };
    }
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.isAudioEnabled ? this.speechSynthesis.getVoices() : [];
  }

  public toggleAudio(state?: boolean): void {
    this.isAudioEnabled = state !== undefined ? state : !this.isAudioEnabled;
  }

  private lastSpokenRecommendation: string | null = null;
  private isSpeaking = false;

  public async speakRecommendations(recommendations: string[]): Promise<void> {
    if (!this.isAudioEnabled || !this.speechSynthesis) return;

    const mainRecommendation = recommendations[0];

    // Si la recommandation a changé, on annule l'actuelle et on lit la nouvelle
    if (mainRecommendation !== this.lastSpokenRecommendation) {
      if (this.isSpeaking) {
        this.speechSynthesis.cancel();
        this.isSpeaking = false;
      }
      this.lastSpokenRecommendation = mainRecommendation;
      this.recommendationQueue = [...recommendations];
      await this.speakNextRecommendation();
      return;
    }

    // Si la recommandation est la même ET qu'on parle déjà, ne rien faire
    if (this.isSpeaking) return;

    // Si la recommandation est la même ET qu'on ne parle pas, relancer la lecture
    if (mainRecommendation === this.lastSpokenRecommendation && !this.isSpeaking) {
      this.recommendationQueue = [...recommendations];
      await this.speakNextRecommendation();
    }
  }
  private async speakNextRecommendation(): Promise<void> {
    if (this.recommendationQueue.length === 0) {
      this.isSpeaking = false;
      return;
    }

    const text = this.recommendationQueue.shift();
    if (!text) {
      this.isSpeaking = false;
      return;
    }

    return new Promise((resolve) => {
      this.utterance = new SpeechSynthesisUtterance(text);
      this.utterance.voice = this.getFrenchVoice();
      this.utterance.rate = 0.9;
      this.utterance.pitch = 1;
      this.utterance.volume = 1;

      this.utterance.onend = () => {
        this.currentAudioStatus = 'stopped';
        this.isSpeaking = false;
        resolve();
      };

      this.utterance.onerror = (error) => {
        console.error('Erreur de synthèse vocale:', error);
        this.isSpeaking = false;
        resolve();
      };

      this.currentAudioStatus = 'playing';
      this.isSpeaking = true;
      this.speechSynthesis.speak(this.utterance);
    });
  }

  private getFrenchVoice(): SpeechSynthesisVoice | null {
    if (this.selectedVoice) return this.selectedVoice;
    const voices = this.getAvailableVoices();
    return voices.find(v => v.lang.startsWith('fr')) || voices[0] || null;
  }

  public togglePlayback(): void {
    if (this.currentAudioStatus === 'playing') {
      this.speechSynthesis.pause();
      this.currentAudioStatus = 'paused';
    } else {
      this.speechSynthesis.resume();
      this.currentAudioStatus = 'playing';
    }
  }

  public stopPlayback(): void {
    this.speechSynthesis.cancel();
    this.currentAudioStatus = 'stopped';
    this.recommendationQueue = [];
  }

  // Dans CoachService
  public get audioEnabled(): boolean {
    return this.isAudioEnabled;
  }

  private selectedVoice: SpeechSynthesisVoice | null = null;

  // Dans CoachService
  public setVoice(voice: SpeechSynthesisVoice): void {
    this.selectedVoice = voice;
  }

}

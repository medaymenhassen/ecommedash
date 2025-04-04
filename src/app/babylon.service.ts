import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { NgZone } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class BabylonService {
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private handModel!: THREE.Group;
  private secondHandModel!: THREE.Group;
  private ring1!: THREE.Object3D | null;
  private ring2!: THREE.Object3D | null;
  private characterSpeed = 0.2;
  private videoElement!: HTMLVideoElement;
  private hands!: Hands;
  private isHoldingRing1 = false;
  private isHoldingRing2 = false;


  constructor(private ngZone: NgZone) { }

  initializeScene(canvas: HTMLCanvasElement, width: number, height: number) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    this.camera.position.set(0, 1.5, 5);

    this.renderer = new THREE.WebGLRenderer({ canvas });
    this.renderer.setSize(width, height);

    const light = new THREE.HemisphereLight(0xffffff, 0x000000, 0.7);
    this.scene.add(light);

    this.handModel = this.createHandModel(); // Main blanche
    this.secondHandModel = this.createSecondHandModel(); // Main rouge

    this.addEventListeners();
    this.setupHandTracking();
    this.animate();
  }

  loadFBX(
  fbxUrl: string, 
  xPosition: number, 
  yPosition: number, 
  zPosition: number, 
  xScale: number, 
  yScale: number, 
  zScale: number, 
  index: number,
) {
  const loader = new FBXLoader();
  loader.load(fbxUrl, (object) => {
    object.scale.set(xScale, yScale, zScale);
    object.position.set(xPosition, yPosition, zPosition);
  });
}

  loadHDR(hdrUrl: string) {
    const textureLoader = new RGBELoader();
    textureLoader.load(hdrUrl, (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      this.scene.background = texture;
      this.scene.environment = texture;
    });
  }




  private addEventListeners() {
    window.addEventListener('keydown', (event) => this.moveCharacter(event));
  }

  private moveCharacter(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowUp':
        this.handModel.position.z -= this.characterSpeed;
        this.secondHandModel.position.z -= this.characterSpeed;
        this.camera.position.z -= this.characterSpeed;
        break;
      case 'ArrowDown':
        this.handModel.position.z += this.characterSpeed;
        this.secondHandModel.position.z += this.characterSpeed;
        this.camera.position.z += this.characterSpeed;
        break;
      case 'ArrowLeft':
        this.handModel.position.x -= this.characterSpeed;
        this.secondHandModel.position.x -= this.characterSpeed;
        this.camera.position.x -= this.characterSpeed;
        break;
      case 'ArrowRight':
        this.handModel.position.x += this.characterSpeed;
        this.secondHandModel.position.x += this.characterSpeed;
        this.camera.position.x += this.characterSpeed;
        break;
    }
    this.updateGrabbedObjectsPosition();
  }

  public getCameraPosition(): THREE.Vector3 {
    return this.camera.position.clone();
  }

  private updateGrabbedObjectsPosition() {
    if (this.isHoldingRing1 && this.ring1) {
      // Utiliser les coordonnées du poignet pour ajuster la position
      const wristPosition = this.handModel.children[0].position;

      // Ajouter une distance fixe par rapport au poignet
      const distanceFromHand = 0.5;
      this.ring1.position.copy(wristPosition);
      this.ring1.position.z += distanceFromHand; // Ajuster selon vos besoins

      // Vous pouvez également ajuster x et y si nécessaire
      // this.ring1.position.x = wristPosition.x + offsetX;
      // this.ring1.position.y = wristPosition.y + offsetY;
    }

    if (this.isHoldingRing2 && this.ring2) {
      const wristPosition = this.secondHandModel.children[0].position;
      const distanceFromHand = 0.5;
      this.ring2.position.copy(wristPosition);
      this.ring2.position.z += distanceFromHand; // Ajuster selon vos besoins
    }
  }

  private createHandModelstructure(color: number): THREE.Group {
    const handModel = new THREE.Group();
    this.scene.add(handModel);
    // Poignet réaliste avec plus de détails et de relief
    const wristGeometry = new THREE.CylinderGeometry(0.35, 0.28, 1.4, 64, 32, true);
    const textureLoader = new THREE.TextureLoader();

    const wristMaterial = new THREE.MeshStandardMaterial({
      color,
      metalness: 0.3,
      roughness: 0.6,
      map: textureLoader.load('2.png'),
      normalMap: textureLoader.load('2.png'),
      displacementMap: textureLoader.load('2.png'),
      displacementScale: 0.03
    });

    const wrist = new THREE.Mesh(wristGeometry, wristMaterial);
    wrist.position.set(0, 0, 0);
    handModel.add(wrist);

    // Ajout de légères veines et plis sur la peau
    const veinGeometry = new THREE.CylinderGeometry(0.02, 0.015, 0.8, 12);
    const veinMaterial = new THREE.MeshStandardMaterial({ color: 0x6d4c41, metalness: 0.2, roughness: 0.9 });
    for (let i = -1; i <= 1; i += 2) {
      const vein = new THREE.Mesh(veinGeometry, veinMaterial);
      vein.position.set(0.15 * i, 0.4, 0);
      vein.rotation.z = Math.PI / 4;
      handModel.add(vein);
    }

    // Ajout d'une terminaison sphérique pour la liaison avec la main
    const wristCapGeometry = new THREE.SphereGeometry(0.35, 64, 64);
    const wristCapMaterial = new THREE.MeshStandardMaterial({
      color,
      metalness: 0.3,
      roughness: 0.7,
      map: textureLoader.load('2.png'),
      normalMap: textureLoader.load('2.png')
    });
    const wristCap = new THREE.Mesh(wristCapGeometry, wristCapMaterial);
    wristCap.position.set(0, 0.7, 0);
    handModel.add(wristCap);
    // Doigts
    const fingerBaseIndices = [2, 6, 10, 14, 18];
    const fingerTipIndices = [4, 8, 12, 16, 20];
    const fingerNames = ['thumb', 'index', 'middle', 'ring', 'pinky'];

    for (let i = 0; i < fingerNames.length; i++) {
      const fingerBase = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.11, 0.05, 32), new THREE.MeshStandardMaterial({ color }));
      fingerBase.position.set(0, 0, 0); // Position par défaut, sera mise à jour dans updateHandModel
      handModel.add(fingerBase);

      const fingerTip = new THREE.Mesh(new THREE.SphereGeometry(0.02, 32, 32), new THREE.MeshStandardMaterial({ color }));
      fingerTip.position.set(0, 0, 0); // Position par défaut, sera mise à jour dans updateHandModel
      handModel.add(fingerTip);
    }

    // Lignes
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array([
      wrist.position.x, wrist.position.y, wrist.position.z,
      handModel.children[1].position.x, handModel.children[1].position.y, handModel.children[1].position.z,
      handModel.children[1].position.x, handModel.children[1].position.y, handModel.children[1].position.z,
      handModel.children[2].position.x, handModel.children[2].position.y, handModel.children[2].position.z,
      wrist.position.x, wrist.position.y, wrist.position.z,
      handModel.children[3].position.x, handModel.children[3].position.y, handModel.children[3].position.z,
      handModel.children[3].position.x, handModel.children[3].position.y, handModel.children[3].position.z,
      handModel.children[4].position.x, handModel.children[4].position.y, handModel.children[4].position.z,
      wrist.position.x, wrist.position.y, wrist.position.z,
      handModel.children[5].position.x, handModel.children[5].position.y, handModel.children[5].position.z,
      handModel.children[5].position.x, handModel.children[5].position.y, handModel.children[5].position.z,
      handModel.children[6].position.x, handModel.children[6].position.y, handModel.children[6].position.z,
      wrist.position.x, wrist.position.y, wrist.position.z,
      handModel.children[7].position.x, handModel.children[7].position.y, handModel.children[7].position.z,
      handModel.children[7].position.x, handModel.children[7].position.y, handModel.children[7].position.z,
      handModel.children[8].position.x, handModel.children[8].position.y, handModel.children[8].position.z,
      wrist.position.x, wrist.position.y, wrist.position.z,
      handModel.children[9].position.x, handModel.children[9].position.y, handModel.children[9].position.z,
      handModel.children[9].position.x, handModel.children[9].position.y, handModel.children[9].position.z,
      handModel.children[10].position.x, handModel.children[10].position.y, handModel.children[10].position.z,
    ]);

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const lineMaterial = new THREE.LineBasicMaterial({ color });
    const lines = new THREE.Line(geometry, lineMaterial);
    handModel.add(lines);

    return handModel;
  }

  // Utilisation
  private createHandModel(): THREE.Group {
    return this.createHandModelstructure(0xffffff); // Main blanche
  }

  private createSecondHandModel(): THREE.Group {
    return this.createHandModelstructure(0xff0000); // Main rouge
  }


  processHandData(results: any) {
    if (!results.multiHandLandmarks.length) return;
    const scaleFactor = 5;
    // Première main
    const landmarks1 = results.multiHandLandmarks[0];
    this.updateHandModel(this.handModel, landmarks1, scaleFactor);
    const hand1Closed = this.isHandClosed(landmarks1);
    if (hand1Closed && this.ring1) {
      this.updateFBXModel(this.ring1, landmarks1, scaleFactor);
      this.isHoldingRing1 = true; // Mettre à jour l'état
    } else {
      this.isHoldingRing1 = false; // Réinitialiser l'état
    }

    // Deuxième main (si détectée)
    if (results.multiHandLandmarks.length > 1) {
      const landmarks2 = results.multiHandLandmarks[1];
      this.updateHandModel(this.secondHandModel, landmarks2, scaleFactor);
      const hand2Closed = this.isHandClosed(landmarks2);
      if (hand2Closed && this.ring2) {
        this.updateFBXModel(this.ring2, landmarks2, scaleFactor);
        this.isHoldingRing2 = true; // Mettre à jour l'état
      } else {
        this.isHoldingRing2 = false; // Réinitialiser l'état
      }
    }
  }

  private setupHandTracking() {
    this.videoElement = document.createElement('video');
    this.videoElement.style.display = 'none';
    document.body.appendChild(this.videoElement);

    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      this.videoElement.srcObject = stream;
      this.videoElement.play();
    });

    this.hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    this.hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    this.hands.onResults((results) => this.processHandData(results));

    const camera = new Camera(this.videoElement, {
      onFrame: async () => {
        await this.hands.send({ image: this.videoElement });
      },
      width: 640,
      height: 480,
    });

    camera.start();
  }

  private addMesh(parent: THREE.Group, geometry: THREE.BufferGeometry, material: THREE.Material, position: THREE.Vector3) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    parent.add(mesh);
    return mesh;
  }

  private addLine(parent: THREE.Group, geometry: THREE.BufferGeometry, material: THREE.Material) {
    const line = new THREE.Line(geometry, material);
    parent.add(line);
    return line;
  }

  private createLineGeometry(positions: number[]) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    return geometry;
  }

  
  
  private updateHandModel(handModel: THREE.Group, landmarks: any, scaleFactor: number) {
    if (!landmarks || !landmarks.length) {
      console.error("Données de repérage des mains manquantes ou incorrectes.");
      return;
    }

    const fingerBaseIndices = [2, 6, 10, 14, 18];
    const fingerTipIndices = [4, 8, 12, 16, 20];

    // Mettre à jour le poignet
    let wrist = handModel.children[0];
    if (!wrist) {
      wrist = new THREE.Mesh(new THREE.SphereGeometry(0.05, 32, 32), new THREE.MeshStandardMaterial({ color: 0xffffff }));
      handModel.add(wrist);
    }
    if (landmarks[0] && landmarks[0].x !== undefined) {
      wrist.position.set((landmarks[0].x - 0.5) * scaleFactor, -(landmarks[0].y - 0.5) * scaleFactor, 0);
    } else {
      console.error("Données de repérage du poignet manquantes ou incorrectes.");
    }

    // Mettre à jour les doigts
    for (let i = 0; i < fingerBaseIndices.length; i++) {
      let fingerBase = handModel.children[i + 1];
      if (!fingerBase) {
        fingerBase = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.05, 32), new THREE.MeshStandardMaterial({ color: 0xffffff }));
        handModel.add(fingerBase);
      }
      if (landmarks[fingerBaseIndices[i]] && landmarks[fingerBaseIndices[i]].x !== undefined) {
        fingerBase.position.set((landmarks[fingerBaseIndices[i]].x - 0.5) * scaleFactor, -(landmarks[fingerBaseIndices[i]].y - 0.5) * scaleFactor, 0);
      } else {
        console.error(`Données de repérage de la base du doigt ${i + 1} manquantes ou incorrectes.`);
      }

      let fingerTip = handModel.children[i + fingerBaseIndices.length + 1];
      if (!fingerTip) {
        fingerTip = new THREE.Mesh(new THREE.SphereGeometry(0.02, 32, 32), new THREE.MeshStandardMaterial({ color: 0xffffff }));
        handModel.add(fingerTip);
      }
      if (landmarks[fingerTipIndices[i]] && landmarks[fingerTipIndices[i]].x !== undefined) {
        fingerTip.position.set((landmarks[fingerTipIndices[i]].x - 0.5) * scaleFactor, -(landmarks[fingerTipIndices[i]].y - 0.5) * scaleFactor, 0);
      } else {
        console.error(`Données de repérage de l'extrémité du doigt ${i + 1} manquantes ou incorrectes.`);
      }
    }

    // Mettre à jour les lignes
    const positions = [];
    for (let i = 0; i < fingerBaseIndices.length; i++) {
      positions.push(wrist.position.x, wrist.position.y, wrist.position.z);
      positions.push(handModel.children[i + 1].position.x, handModel.children[i + 1].position.y, handModel.children[i + 1].position.z);
      positions.push(handModel.children[i + 1].position.x, handModel.children[i + 1].position.y, handModel.children[i + 1].position.z);
      positions.push(handModel.children[i + fingerBaseIndices.length + 1].position.x, handModel.children[i + fingerBaseIndices.length + 1].position.y, handModel.children[i + fingerBaseIndices.length + 1].position.z);
    }

    const geometry = this.createLineGeometry(positions);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
    handModel.remove(handModel.children[11]);
    this.addLine(handModel, geometry, lineMaterial);
  }


  animate = () => {
    this.ngZone.runOutsideAngular(() => {
      const loop = () => {
        requestAnimationFrame(loop);
        if (this.ring1 && this.ring2) {
          const distance1 = this.handModel.position.distanceTo(this.ring1.position);
          const distance2 = this.secondHandModel.position.distanceTo(this.ring2.position);
          if (distance1 < 1.5) {
            console.log('Vous êtes proche du modèle 1, interaction possible !');
            if (this.isHoldingRing1) {
              const scaleFactor = 5;
              this.updateFBXModel(this.ring1, this.handModel, scaleFactor);
            }
          }
          if (distance2 < 1.5) {
            console.log('Vous êtes proche du modèle 2, interaction possible !');
            if (this.isHoldingRing2) {
              const scaleFactor = 5;
              this.updateFBXModel(this.ring2, this.secondHandModel, scaleFactor);
            }
          }
        }
        this.renderer.render(this.scene, this.camera);
      };
      loop();
    });
  };


  private updateFBXRotation(fbxModel: THREE.Object3D, landmarks: any) {
    const wrist = landmarks[0];
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];

    // Calculez les vecteurs pour la rotation
    const forward = new THREE.Vector3(thumbTip.x - wrist.x, thumbTip.y - wrist.y, thumbTip.z - wrist.z).normalize();
    const up = new THREE.Vector3(indexTip.x - wrist.x, indexTip.y - wrist.y, indexTip.z - wrist.z).normalize();

    // Créez une matrice de rotation
    const matrix = new THREE.Matrix4().lookAt(new THREE.Vector3(), forward, up);

    // Mettez à jour la rotation du modèle FBX
    fbxModel.quaternion.setFromRotationMatrix(matrix);
  }

  private isHandClosed(landmarks: any): boolean {
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const distance = Math.sqrt(
      Math.pow(thumbTip.x - indexTip.x, 2) +
      Math.pow(thumbTip.y - indexTip.y, 2) +
      Math.pow(thumbTip.z - indexTip.z, 2)
    );

    return distance < 0.1; // Ajustez ce seuil selon vos besoins
  }

  private updateFBXModel(fbxModel: THREE.Object3D, landmarks: any, scaleFactor: number) {
    if (!landmarks || !landmarks.length) {
      console.error("Données de repérage des mains manquantes ou incorrectes.");
      return;
    }

    // Mettre à jour la position du modèle FBX
    if (landmarks[0] && landmarks[0].x !== undefined) {
      fbxModel.position.set((landmarks[0].x - 0.5) * scaleFactor, -(landmarks[0].y - 0.5) * scaleFactor, 0);
    } else {
      console.error("Données de repérage du poignet manquantes ou incorrectes.");
    }

    // Mettre à jour la rotation du modèle FBX
    this.updateFBXRotation(fbxModel, landmarks);
  }


}

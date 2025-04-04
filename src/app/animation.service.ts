import { Injectable, NgZone } from '@angular/core';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';
import * as CANNON from 'cannon-es';
import type { Results } from '@mediapipe/hands';

@Injectable({
  providedIn: 'root'
})
export class AnimationService {
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private videoElement!: HTMLVideoElement;
  private hands!: Hands;
  private clock = new THREE.Clock();
  private physicsWorld!: CANNON.World;
  private physicsBodies: Map<string, CANNON.Body> = new Map();
  private lastTime: number = 0;
  private debugMode = true; // Mode debug pour visualiser les points de tracking
  private debugObjects: THREE.Object3D[] = []; // Objets pour visualisation debug
  private interactiveObjects: THREE.Object3D[] = [];
  private transformationMap: { [key: string]: string } = {};
  private handPhysicsBodies: Map<string, CANNON.Body> = new Map();
  private meshesFBX: Map<number, THREE.Mesh> = new Map<number, THREE.Mesh>();
  private selectedObject: THREE.Object3D | null = null;

  selectObject(object: THREE.Object3D) {
    this.selectedObject = object;
  }

  moveSelectedObject(x: number, y: number, z: number) {
    if (this.selectedObject) {
      const newPosition = new THREE.Vector3(x, y, z);
      if (!this.checkCollision(this.selectedObject, newPosition)) {
        this.selectedObject.position.set(x, y, z);
        if (this.selectedObject.userData["physicsBody"]) {
          const body = this.selectedObject.userData["physicsBody"];
          body.position.copy(newPosition as any);
          body.velocity.set(0, 0, 0);
        }
      }
    }
  }

  constructor(private ngZone: NgZone) {
    this.addEventListeners();
  }

  initializeScene(canvas: HTMLCanvasElement, width: number, height: number) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    this.camera.position.set(0, 1.5, 5);
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setClearColor(0x303030);

    // Éclairage
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.7);
    this.scene.add(hemisphereLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 1, 1);
    this.scene.add(directionalLight);
    this.physicsWorld = new CANNON.World();
    this.physicsWorld.gravity.set(0, -9.82, 0);

    this.physicsWorld.broadphase = new CANNON.NaiveBroadphase();
    (this.physicsWorld.solver as any).iterations = 10;

    this.debugMode = true;
    this.createDebugVisualizations();
    this.setupHandTracking();
    this.initializePhysicsWorld();
    this.animate();

    //hand
    this.loadHandModels();

  }


  private characterSpeed = 0.2;
  private addEventListeners() {
    this.ngZone.runOutsideAngular(() => {
      window.addEventListener('keydown', (event) => this.ngZone.run(() => {
        this.moveCharacter(event);

        // Mise à jour de la position des mains après le mouvement de la caméra
        if (!this.trackingInitialized) {
          this.positionHandsInFrontOfCamera();
        }
      }));
    });
  }

  private moveCharacter(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowUp':
        // Déplacement en avant
        this.camera.translateZ(-this.characterSpeed);
        break;
      case 'ArrowDown':
        // Déplacement en arrière
        this.camera.translateZ(this.characterSpeed);
        break;
      case 'ArrowLeft':
        // Rotation à gauche
        this.camera.rotateY(this.characterSpeed);
        break;
      case 'ArrowRight':
        // Rotation à droite
        this.camera.rotateY(-this.characterSpeed);
        break;
      case 'z':
        this.removeBones();
        break;
      default:
        break;
    }
    this.positionHandsRelativeToCamera();
  }

  private removeBones() {
    if (this.handModelLeft && this.handModelRight) {
      // Supprimer les modèles de main avec squelette
      this.scene.remove(this.handModelLeft);
      this.scene.remove(this.handModelRight);

      // Charger un nouveau modèle sans squelette ou créer un mesh simple
      // Pour cet exemple, créons un simple cube pour remplacer la main
      const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
      const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const cube = new THREE.Mesh(geometry, material);

      // Positionner le cube à l'emplacement de la main gauche
      cube.position.copy(this.handModelLeft.position);
      this.scene.add(cube);

      // Répéter pour la main droite si nécessaire
      const cubeRight = cube.clone();
      cubeRight.position.copy(this.handModelRight.position);
      this.scene.add(cubeRight);

      // Mettre à jour les références
      this.handModelLeft = null;
      this.handModelRight = null;
    }
  }


  private initializePhysicsWorld() {
    this.physicsWorld = new CANNON.World();
    this.physicsWorld.gravity.set(0, -9.82, 0); // Gravité terrestre
    this.physicsWorld.broadphase = new CANNON.NaiveBroadphase();
    (this.physicsWorld.solver as any).iterations = 10;

    // Création d'un plan au sol pour la collision
    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({
      mass: 0, // masse 0 = objet statique
      shape: groundShape
    });

    // Rotation du plan pour qu'il soit horizontal
    groundBody.quaternion.setFromAxisAngle(
      new CANNON.Vec3(1, 0, 0),
      -Math.PI / 2
    );
    groundBody.position.set(0, -2, 0); // Position sous les objets
    this.physicsWorld.addBody(groundBody);
  }

  attachObjectToCubeFace(object3D: THREE.Object3D, cube: THREE.Mesh, faceIndex: number) {
    // Vérifier que le cube est bien un cube
    if (!(cube.geometry instanceof THREE.BoxGeometry)) {
      console.error("L'objet cible n'est pas un cube");
      return;
    }


    // Créer un renderer hors-écran pour capturer l'objet 3D en tant qu'image
    const renderTarget = new THREE.WebGLRenderTarget(512, 512);
    const tempScene = new THREE.Scene();
    const tempCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    tempCamera.position.z = 5;

    // Ajouter l'objet à la scène temporaire
    const objectClone = object3D.clone();
    tempScene.add(objectClone);

    // Ajouter une lumière pour voir l'objet correctement
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(1, 1, 1);
    tempScene.add(light);

    // Rendre l'objet dans la texture
    this.renderer.setRenderTarget(renderTarget);
    this.renderer.render(tempScene, tempCamera);
    this.renderer.setRenderTarget(null);

    // Créer une texture à partir du rendu
    const texture = new THREE.Texture(renderTarget.texture.image);
    texture.needsUpdate = true;

    // Stocker l'association dans les userData
    if (!cube.userData["attachedObjects"]) {
      cube.userData["attachedObjects"] = {};
    }

    // Stocker les informations d'association pour une dissociation ultérieure
    cube.userData["attachedObjects"][faceIndex] = {
      originalObject: object3D,
      texture: texture
    };

    // Remplacer le matériau de la face correspondante
    if (Array.isArray(cube.material)) {
      // Si le cube a plusieurs matériaux (un par face)
      cube.material[faceIndex] = new THREE.MeshBasicMaterial({ map: texture });
    } else {
      // Si le cube a un seul matériau, le convertir en tableau
      const materials = [];
      for (let i = 0; i < 6; i++) {
        if (i === faceIndex) {
          materials.push(new THREE.MeshBasicMaterial({ map: texture }));
        } else {
          materials.push(cube.material.clone());
        }
      }
      cube.material = materials;
    }

    // Retirer l'objet original de la scène
    this.scene.remove(object3D);

    // Mettre à jour la liste des objets interactifs si nécessaire
    this.interactiveObjects = this.interactiveObjects.filter(obj => obj !== object3D);

    console.log(`Objet attaché à la face ${faceIndex} du cube`);
  }

  detachObjectFromCubeFace(cube: THREE.Mesh, faceIndex: number) {
    // Vérifier que le cube a des objets attachés
    if (!cube.userData["attachedObjects"] || !cube.userData["attachedObjects"][faceIndex]) {
      console.warn(`Aucun objet trouvé sur la face ${faceIndex} du cube`);
      return;
    }

    // Récupérer l'objet original
    const { originalObject } = cube.userData["attachedObjects"][faceIndex];

    // Restaurer le matériau d'origine sur la face du cube
    if (Array.isArray(cube.material)) {
      // Restaurer avec un matériau par défaut
      cube.material[faceIndex] = new THREE.MeshBasicMaterial({ color: 0xcccccc });
    }

    // Supprimer l'association dans userData
    delete cube.userData["attachedObjects"][faceIndex];

    // Restaurer l'objet 3D dans la scène
    this.scene.add(originalObject);

    // Si l'objet original était interactif, le réajouter à la liste
    if (originalObject.userData["isInteractive"]) {
      this.interactiveObjects.push(originalObject);
      this.setupInteractiveHandlers(originalObject);
    }

    console.log(`Objet détaché de la face ${faceIndex} du cube`);
  }

  private generateUniqueId(): string {
    return 'id_' + Math.random().toString(36).substr(2, 9);
  }

  getCubeFaceIndex(cube: THREE.Mesh, intersection: THREE.Intersection): number {
    // Obtenir les coordonnées locales du point d'intersection
    const localPoint = cube.worldToLocal(intersection.point.clone());

    // Déterminer quelle face a été touchée en fonction de la position
    const absX = Math.abs(localPoint.x);
    const absY = Math.abs(localPoint.y);
    const absZ = Math.abs(localPoint.z);

    // Trouver la composante avec la valeur absolue la plus grande
    if (absX >= absY && absX >= absZ) {
      return localPoint.x > 0 ? 0 : 1; // Droite : Gauche
    } else if (absY >= absX && absY >= absZ) {
      return localPoint.y > 0 ? 2 : 3; // Haut : Bas
    } else {
      return localPoint.z > 0 ? 4 : 5; // Avant : Arrière
    }
  }
  private setupPhysicsBody(object: THREE.Object3D, objectId: string, boundingBox: THREE.Box3) {
    const dimensions = new THREE.Vector3();
    boundingBox.getSize(dimensions);

    const shape = new CANNON.Box(new CANNON.Vec3(
      dimensions.x / 2,
      dimensions.y / 2,
      dimensions.z / 2
    ));

    const body = new CANNON.Body({
      mass: 1, // Masse > 0 pour rendre l'objet dynamique
      shape: shape
    });

    // Synchronisation initiale avec Three.js
    body.position.copy(object.position as unknown as CANNON.Vec3);
    this.physicsWorld.addBody(body);
    this.physicsBodies.set(objectId, body);
  }

  private createGroundPlane() {
    // Créer le sol visuel
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x999999 });
    const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
    groundMesh.rotation.x = -Math.PI / 2;
    this.scene.add(groundMesh);

    // Créer le sol physique
    const groundBody = new CANNON.Body({
      mass: 0, // Statique
      shape: new CANNON.Plane()
    });
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    this.physicsWorld.addBody(groundBody);
  }

  setupInteractiveHandlers(object: THREE.Object3D) {
    this.interactiveObjects.push(object);
  }

  checkCollision(movingObject: THREE.Object3D, newPosition: THREE.Vector3): boolean {
    const tempBox = new THREE.Box3().setFromObject(movingObject);
    const adjustedPosition = new THREE.Vector3().copy(newPosition).sub(movingObject.position);
    tempBox.translate(adjustedPosition);

    return this.scene.children.some(child => {
      if (child !== movingObject && (child.userData["isPhysical"] || child.userData["collider"])) {
        const childBox = child.userData["isPhysical"]
          ? new THREE.Box3().setFromObject(child)
          : child.userData["collider"];
        return tempBox.intersectsBox(childBox);
      }
      return false;
    });
  }

  private addCollisionCube(size: number) {
    const geometry = new THREE.BoxGeometry(size, size, size);
    const material = new THREE.MeshStandardMaterial({ color: 0xcccccc, transparent: true, opacity: 0.5 });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(0, size / 2, 0);
    this.scene.add(cube);

    // Corps physique
    const shape = new CANNON.Box(new CANNON.Vec3(size / 2, size / 2, size / 2));
    const body = new CANNON.Body({ mass: 0, shape: shape });
    body.position.set(0, size / 2, 0);
    this.physicsWorld.addBody(body);

    return cube;
  }

  updatePhysics() {
    this.physicsWorld.step(1 / 60);
    this.physicsBodies.forEach((body, objectId) => {
      const object = this.scene.getObjectByName(objectId);
      if (object) {
        object.position.copy(body.position as unknown as THREE.Vector3);
        object.quaternion.copy(body.quaternion as unknown as THREE.Quaternion);
      }
    });
  }

  private isGripping(handSide: string, palmPosition: THREE.Vector3, objectPosition: THREE.Vector3): boolean {
    const gripThreshold = 0.15; // Définir un seuil de distance pour l'agrippement
    const distance = palmPosition.distanceTo(objectPosition);

    // Si la distance entre la main et l'objet est inférieure au seuil, on considère que la main agrippe l'objet
    return distance < gripThreshold;
  }

  private applyForceToHand(handModel: THREE.Group, palmPosition: THREE.Vector3) {
    const forceLimit = 0.5; // Limite de force pour la main
    const groundPosition = new THREE.Vector3(0, -1, 0); // Point de référence pour le sol (ou point de contrôle)

    // Calculer la distance de la main par rapport au sol (ou à un point de référence)
    const distance = palmPosition.distanceTo(groundPosition);

    // Si la main est au-dessus du point de force, on applique une force
    if (distance > forceLimit) {
      // Appliquer la force de restriction à la main (par exemple, ne pas pouvoir la déplacer au-delà de cette limite)
      const direction = palmPosition.clone().sub(groundPosition).normalize();
      handModel.position.add(direction.multiplyScalar(forceLimit));
    }
  }


  private processHandGrip(results: any) {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      results.multiHandLandmarks.forEach((landmarks: any, index: number) => {
        const isLeftHand = results.multiHandedness[index].label === 'Left';
        const handModel = isLeftHand ? this.handModelLeft : this.handModelRight;
        const handSide = isLeftHand ? 'left' : 'right';

        if (!handModel) return;

        const palmPosition = this.calculatePalmPosition(landmarks);
        const worldPalmPosition = this.convertToWorldSpace(palmPosition);

        for (const object of this.interactiveObjects) {
          if (this.isGripping(handSide, worldPalmPosition, object.position)) {
            this.attachObjectToHand(object, handModel);
            break;
          }

        }

        this.updateHandPosition(handModel, landmarks);
        this.updateHandOrientation(handModel, landmarks);
      });
    }
  }

  private attachObjectToHand(object: THREE.Object3D, handModel: THREE.Group) {
    const offsetPosition = object.position.clone().sub(handModel.position);
    handModel.add(object);
    object.position.copy(offsetPosition);

    // Mise à jour du corps physique si nécessaire
    if (object.userData["physicsBody"]) {
      const body = object.userData["physicsBody"];
      body.position.copy(handModel.position as any);
      body.quaternion.copy(handModel.quaternion as any);
    }
  }
  private convertToWorldSpace(position: THREE.Vector3): THREE.Vector3 {
    const worldPosition = position.clone();
    worldPosition.unproject(this.camera);
    return worldPosition;
  }

  /*
  private processHandGrip(results: any) {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      results.multiHandLandmarks.forEach((landmarks: any, index: number) => {
        const isLeftHand = results.multiHandedness[index].label === 'Left';
        const handModel = isLeftHand ? this.handModelLeft : this.handModelRight;
        const handSide = isLeftHand ? 'left' : 'right';

        if (!handModel) return;

        const palmPosition = this.calculatePalmPosition(landmarks);

        // Vérifier si la main agrippe un objet
        const objectPosition = this.getObjectPosition(); // Position de l'objet avec lequel on veut interagir
        if (this.isGripping(handSide, palmPosition, objectPosition)) {
          // L'objet est attrapé, attacher la main à l'objet
          //this.attachHandToObject(handModel, objectPosition);
          this.attachHandToObject(handModel, new THREE.Vector3(objectPosition.x, objectPosition.y, objectPosition.z));

        } else {
          // Appliquer la force si la main ne peut pas dépasser un certain point
          this.applyForceToHand(handModel, palmPosition);
        }
      });
    }

  }*/
  /*
  private attachHandToObject(handModel: THREE.Group, objectPosition: THREE.Vector3) {
    // On met la main à la position de l'objet et on la rend parente de l'objet
    handModel.position.copy(objectPosition);
    handModel.updateMatrixWorld(true);

    // Si vous avez une physique intégrée, appliquez-la ici également
    const handBody = this.handPhysicsBodies.get('left') || this.handPhysicsBodies.get('right');
    if (handBody) {
      handBody.position.copy(new CANNON.Vec3(handModel.position.x, handModel.position.y, handModel.position.z));
      handBody.quaternion.copy(handModel.quaternion as any);
    }
  }*/

  private attachHandToObject(handModel: THREE.Group, object: THREE.Object3D | THREE.Vector3) {
    if (object instanceof THREE.Vector3) {
      // Créer un objet 3D à partir de la position
      const dummyObject = new THREE.Object3D();
      dummyObject.position.copy(object);
      object = dummyObject;
    }

    // Le reste du code reste inchangé
    handModel.add(object);
    object.position.set(0, 0, 0);

    const handBody = this.handPhysicsBodies.get('left') || this.handPhysicsBodies.get('right');
    if (handBody && object.userData && object.userData["physicsBody"]) {
      const objectBody = object.userData["physicsBody"];
      const constraint = new CANNON.LockConstraint(handBody, objectBody);
      this.physicsWorld.addConstraint(constraint);
    }
  }


  private getObjectPosition(): THREE.Vector3 {
    // Retourner la position d'un objet que vous voulez attraper (par exemple un cube ou une sphère)
    return new THREE.Vector3(1, 0, -3); // Exemple de position
  }


  private createHandModel(object: THREE.Object3D, side: 'Left' | 'Right'): THREE.Group {
    const handModel = new THREE.Group();
    handModel.add(object.clone());
    handModel.scale.set(0.01, 0.01, 0.01); // Ajustez la taille selon vos besoins
    handModel.visible = true;
    if (side === 'Left') handModel.rotateY(Math.PI); // Rotation pour la main gauche
    this.scene.add(handModel);
    return handModel;
  }

  private trackingInitialized: boolean = false;
  private handLastValidPositions: Map<string, THREE.Vector3> = new Map();
  private transitionSpeed: number = 0.1; // Vitesse de transition (ajustable)
  private lastHandPositions: Map<string, THREE.Vector3> = new Map();
  private smoothingFactor: number = 0.5; // Valeur entre 0 et 1

  private calculatePalmPosition(landmarks: any): THREE.Vector3 {
    // Utilisez les points du poignet (0), de la base de l'index (5) et de la base de l'auriculaire (17)
    // pour calculer une position fiable du centre de la paume
    return new THREE.Vector3(
      (landmarks[0].x + landmarks[5].x + landmarks[17].x) / 3,
      (landmarks[0].y + landmarks[5].y + landmarks[17].y) / 3,
      (landmarks[0].z + landmarks[5].z + landmarks[17].z) / 3
    );
  }

  private processHandData(results: any) {
    // Mise à jour des visualisations debug
    this.updateDebugVisualizations(results);

    // Vérifier si des mains sont détectées
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      // Mains détectées - traiter normalement
      this.trackingInitialized = true;

      results.multiHandLandmarks.forEach((landmarks: any, index: number) => {
        const isLeftHand = results.multiHandedness[index].label === 'Left';
        const handModel = isLeftHand ? this.handModelLeft : this.handModelRight;
        const handSide = isLeftHand ? 'left' : 'right';

        if (!handModel) return;

        // Calculer la position de la paume
        const palmPosition = this.calculatePalmPosition(landmarks);

        // Convertir en coordonnées 3D
        const worldPosition = new THREE.Vector3(
          (palmPosition.x - 0.5) * 2,
          (0.5 - palmPosition.y) * 2 - 0.1, // Décalage vertical pour positionner sous la main
          palmPosition.z * -2
        );

        // Appliquer un lissage pour éviter les mouvements brusques
        if (this.lastHandPositions.has(handSide)) {
          const lastPos = this.lastHandPositions.get(handSide);
          if (lastPos) {
            worldPosition.lerp(lastPos, 1 - this.smoothingFactor);
          }
        }

        const handOpen = this.isHandOpen(landmarks);
        console.log(`La main (${isLeftHand ? 'gauche' : 'droite'}) est ${handOpen ? 'ouverte' : 'fermée'}.`);

        // Appliquer la position au modèle
        handModel.position.copy(worldPosition);

        // Stocker la position pour le prochain frame
        this.lastHandPositions.set(handSide, worldPosition.clone());

        // Mise à jour de l'orientation et des doigts
        this.updateHandOrientation(handModel, landmarks);
        this.updateFingerBones(handModel, landmarks);

        const isHandClosed = this.isHandClosed(landmarks);

        if (isHandClosed) {
          // Déplacer l'objet en contact avec les limites spatiales
          this.moveObjectWithHand(handModel.position, handModel.quaternion);
        }

        // Mise à jour du corps physique
        const handBody = isLeftHand ?
          this.handPhysicsBodies.get('left') :
          this.handPhysicsBodies.get('right');

        if (handBody) {
          handBody.position.copy(new CANNON.Vec3(
            handModel.position.x,
            handModel.position.y,
            handModel.position.z
          ));
          handBody.quaternion.copy(handModel.quaternion as any);
        }

        handModel.updateMatrixWorld(true);
      });
    } else {
      // Aucune main détectée - positionner les mains devant la caméra
      this.trackingInitialized = false;
      this.positionHandsInFrontOfCamera();
    }
  }
  private moveObjectWithHand(handPosition: THREE.Vector3, handQuaternion: THREE.Quaternion) {
    this.interactiveObjects.forEach(object => {
      if (object.userData["spatialLimits"] && object.userData["gripPoint"]) {
        const limits = object.userData["spatialLimits"];
        const gripPoint = object.userData["gripPoint"] as THREE.Vector3;

        // Vérifiez si la main se trouve dans les limites définies pour l'objet
        if (
          handPosition.x >= limits.xStart && handPosition.x <= limits.xEnd &&
          handPosition.y >= limits.yStart && handPosition.y <= limits.yEnd &&
          handPosition.z >= limits.zStart && handPosition.z <= limits.zEnd
        ) {
          // Calculer le vecteur de déplacement entre la position actuelle de l'objet et la nouvelle position de la main
          const displacement = new THREE.Vector3().subVectors(handPosition, object.position);

          // Appliquer la rotation de la main à l'objet
          object.quaternion.copy(handQuaternion);

          // Déplacer l'objet pour que le gripPoint coïncide avec la position de la main
          object.position.copy(handPosition).sub(gripPoint.applyQuaternion(object.quaternion));

          // Mettre à jour le corps physique de l'objet si nécessaire
          if (object.userData["physicsBody"]) {
            const body = object.userData["physicsBody"];
            body.position.copy(object.position as any);
            body.quaternion.copy(object.quaternion as any);
          }

          console.log(`Objet déplacé à la position: ${object.position.x}, ${object.position.y}, ${object.position.z}`);
        }
      }
    });
  }

  private updateHandPosition(handModel: THREE.Group, landmarks: any) {
    const palmPosition = this.calculatePalmPosition(landmarks);

    // Convertir les coordonnées normalisées en coordonnées mondiales
    const worldPosition = new THREE.Vector3(
      (palmPosition.x - 0.5) * 2,
      (0.5 - palmPosition.y) * 2,
      palmPosition.z * -2
    );

    // Mise à jour de la position (sera contrainte dans processHandData)
    handModel.position.copy(worldPosition);
  }
  private calculateHandPosition(landmarks: any): THREE.Vector3 {
    // Calculer le centre de la paume (point moyen entre points clés)
    const palmPosition = new THREE.Vector3(
      (landmarks[0].x + landmarks[5].x + landmarks[17].x) / 3,
      (landmarks[0].y + landmarks[5].y + landmarks[17].y) / 3,
      (landmarks[0].z + landmarks[5].z + landmarks[17].z) / 3
    );

    // Convertir les coordonnées normalisées en coordonnées mondiales
    return new THREE.Vector3(
      (palmPosition.x - 0.5) * 2,
      (0.5 - palmPosition.y) * 2,
      palmPosition.z * -2
    );
  }
  private initializeDefaultHandPositions() {
    if (this.handModelLeft) {
      // Position par défaut pour la main gauche (à gauche de la caméra)
      const leftDefaultPos = new THREE.Vector3(-0.3, -0.2, -0.7);
      this.handModelLeft.position.copy(
        leftDefaultPos.applyQuaternion(this.camera.quaternion).add(this.camera.position)
      );
      this.handLastValidPositions.set('left', this.handModelLeft.position.clone());
    }

    if (this.handModelRight) {
      // Position par défaut pour la main droite (à droite de la caméra)
      const rightDefaultPos = new THREE.Vector3(0.3, -0.2, -0.7);
      this.handModelRight.position.copy(
        rightDefaultPos.applyQuaternion(this.camera.quaternion).add(this.camera.position)
      );
      this.handLastValidPositions.set('right', this.handModelRight.position.clone());
    }
  }

  private positionHandsInFrontOfCamera() {
    // S'assurer que les modèles de mains existent
    if (!this.handModelLeft || !this.handModelRight) return;

    // Calculer une position devant la caméra
    const cameraDirection = new THREE.Vector3(0, 0, -1);
    cameraDirection.applyQuaternion(this.camera.quaternion);

    // Position de base à 1 mètre devant la caméra, légèrement en bas
    const basePosition = this.camera.position.clone().add(
      cameraDirection.multiplyScalar(1.0)
    );
    basePosition.y -= 0.3; // Légèrement en dessous du niveau de la caméra
    
    // Positionner la main gauche (à gauche de la caméra)
    const leftPosition = basePosition.clone();
    const rightVector = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
    leftPosition.sub(rightVector.multiplyScalar(0.25));
    this.handModelLeft.position.copy(leftPosition);

    // Positionner la main droite (à droite de la caméra)
    const rightPosition = basePosition.clone();
    const rightVector2 = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
    rightPosition.add(rightVector2.multiplyScalar(0.25));
    this.handModelRight.position.copy(rightPosition);

    // Orienter les mains pour qu'elles pointent vers l'avant
    const cameraQuaternion = this.camera.quaternion.clone();
    this.handModelLeft.quaternion.copy(cameraQuaternion);
    this.handModelRight.quaternion.copy(cameraQuaternion);

    // Rotation supplémentaire de 180 degrés pour chaque main
    this.handModelLeft.rotateY(Math.PI);
    this.handModelRight.rotateY(Math.PI);

    // Mettre à jour les corps physiques si nécessaire
    if (this.handPhysicsBodies.get('left')) {
      this.handPhysicsBodies.get('left')!.position.copy(
        new CANNON.Vec3(leftPosition.x, leftPosition.y, leftPosition.z)
      );
      this.handPhysicsBodies.get('left')!.quaternion.copy(cameraQuaternion as any);
    }

    if (this.handPhysicsBodies.get('right')) {
      this.handPhysicsBodies.get('right')!.position.copy(
        new CANNON.Vec3(rightPosition.x, rightPosition.y, rightPosition.z)
      );
      this.handPhysicsBodies.get('right')!.quaternion.copy(cameraQuaternion as any);
    }

    // Forcer la mise à jour des matrices
    this.handModelLeft.updateMatrixWorld(true);
    this.handModelRight.updateMatrixWorld(true);
  }

  private positionHandsRelativeToCamera() {
    if (!this.handModelLeft || !this.handModelRight) return;

    // Distance fixe devant la caméra (paramétrable)
    const distanceFromCamera = 1.0;

    // Direction de la caméra (avant)
    const cameraDirection = new THREE.Vector3(0, 0, -1);
    cameraDirection.applyQuaternion(this.camera.quaternion);

    // Position de base devant la caméra
    const basePosition = this.camera.position.clone().add(
      cameraDirection.multiplyScalar(distanceFromCamera)
    );
    // Ajustement vertical pour un positionnement naturel
    basePosition.y -= 0.3;

    // Espacement latéral des mains
    const handSpacing = 0.25;

    // Vecteur latéral (droite de la caméra)
    const rightVector = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);

    // Positionner la main gauche
    const leftPosition = basePosition.clone().sub(rightVector.clone().multiplyScalar(handSpacing));
    this.handModelLeft.position.copy(leftPosition);

    // Positionner la main droite
    const rightPosition = basePosition.clone().add(rightVector.clone().multiplyScalar(handSpacing));
    this.handModelRight.position.copy(rightPosition);

    // Mettre à jour les corps physiques si nécessaire
    if (this.handPhysicsBodies.get('left')) {
      this.handPhysicsBodies.get('left')!.position.copy(
        new CANNON.Vec3(leftPosition.x, leftPosition.y, leftPosition.z)
      );
    }

    if (this.handPhysicsBodies.get('right')) {
      this.handPhysicsBodies.get('right')!.position.copy(
        new CANNON.Vec3(rightPosition.x, rightPosition.y, rightPosition.z)
      );
    }
  }


  private setupHandTracking() {
    // Créer un élément vidéo pour le flux de la caméra
    this.videoElement = document.createElement('video');
    this.videoElement.style.display = 'none';
    document.body.appendChild(this.videoElement);

    // Initialiser le flux vidéo
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        this.videoElement.srcObject = stream;
        this.videoElement.play();
      })
      .catch(error => {
        console.error('Erreur d\'accès à la caméra:', error);
      });

    // Initialiser MediaPipe Hands
    this.hands = new Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      }
    });


    this.hands.onResults((results) => {
      this.processHandData(results);
    });
    // Configurer le suivi des mains
    this.hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.3,
      minTrackingConfidence: 0.3
    });


    // Démarrer le traitement de la caméra
    const camera = new Camera(this.videoElement, {
      onFrame: async () => {
        try {
          await this.hands.send({ image: this.videoElement });
        } catch (error) {
          console.error('Erreur dans le suivi des mains:', error);
        }
      },
      width: 640,
      height: 480
    });
    camera.start();
  }
  /*
  private processHandData(results: any) {
    // Mettre à jour les visualisations de débogage si nécessaire
    this.updateDebugVisualizations(results);
  }*/

  private updateDebugVisualizations(results: any) {
    if (!this.debugMode || !results || !results.multiHandLandmarks) return;

    // Cacher tous les objets de débogage d'abord
    this.debugObjects.forEach(obj => {
      obj.visible = false;
    });

    // Mettre à jour les positions pour les mains détectées
    results.multiHandLandmarks.forEach((landmarks: any, handIndex: number) => {
      const isLeftHand = results.multiHandedness[handIndex].label === 'Left';
      const offset = isLeftHand ? 0 : 21;

      // Mettre à jour les sphères
      landmarks.forEach((landmark: any, i: number) => {
        const sphereIndex = i + (isLeftHand ? 0 : 21);
        if (sphereIndex < this.debugObjects.length) {
          const sphere = this.debugObjects[sphereIndex];
          if (sphere instanceof THREE.Mesh) {
            sphere.position.set(
              (landmark.x - 0.5) * 2,
              (0.5 - landmark.y) * 2,
              landmark.z * -2
            );
            sphere.visible = true;
          }
        }
      });

      // Mettre à jour les lignes
      const fingerConnections = [
        [0, 1], [1, 2], [2, 3], [3, 4],
        [0, 5], [5, 6], [6, 7], [7, 8],
        [0, 9], [9, 10], [10, 11], [11, 12],
        [0, 13], [13, 14], [14, 15], [15, 16],
        [0, 17], [17, 18], [18, 19], [19, 20]
      ];

      fingerConnections.forEach((connection, connectionIndex) => {
        const lineIndex = 42 + connectionIndex + (isLeftHand ? 0 : fingerConnections.length);
        if (lineIndex < this.debugObjects.length) {
          const line = this.debugObjects[lineIndex];
          if (line instanceof THREE.Line) {
            const startLandmark = landmarks[connection[0]];
            const endLandmark = landmarks[connection[1]];
            const positions = new Float32Array([
              (startLandmark.x - 0.5) * 2, (0.5 - startLandmark.y) * 2, startLandmark.z * -2,
              (endLandmark.x - 0.5) * 2, (0.5 - endLandmark.y) * 2, endLandmark.z * -2
            ]);
            line.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            line.geometry.attributes.position.needsUpdate = true;
            line.visible = true;
          }
        }
      });
    });
  }

  private isHandOpen(landmarks: any): boolean {
    // Exemple avec l’index : landmark 0 est le poignet et landmark 8 est le bout de l’index
    const wrist = landmarks[0];
    const indexTip = landmarks[8];

    // Calcul de la distance euclidienne
    const distance = Math.sqrt(
      Math.pow(indexTip.x - wrist.x, 2) +
      Math.pow(indexTip.y - wrist.y, 2) +
      Math.pow(indexTip.z - wrist.z, 2)
    );

    // Vous pouvez définir un seuil expérimental pour déterminer si la main est ouverte
    const threshold = 0.1;
    return distance > threshold;
  }

  private isHandClosed(landmarks: any): boolean {
    const thumbTip = new THREE.Vector3(landmarks[4].x, landmarks[4].y, landmarks[4].z);
    const indexTip = new THREE.Vector3(landmarks[8].x, landmarks[8].y, landmarks[8].z);
    const middleTip = new THREE.Vector3(landmarks[12].x, landmarks[12].y, landmarks[12].z);
    const ringTip = new THREE.Vector3(landmarks[16].x, landmarks[16].y, landmarks[16].z);
    const pinkyTip = new THREE.Vector3(landmarks[20].x, landmarks[20].y, landmarks[20].z);

    const averageDistance = (thumbTip.distanceTo(indexTip) +
      thumbTip.distanceTo(middleTip) +
      thumbTip.distanceTo(ringTip) +
      thumbTip.distanceTo(pinkyTip)) / 4;

    return averageDistance < 0.05; // Ajustez ce seuil selon vos besoins
  }


  private checkSpatialLimitsContact(handPosition: THREE.Vector3) {
    this.interactiveObjects.forEach(object => {
      if (object.userData["spatialLimits"]) {
        const limits = object.userData["spatialLimits"];
        if (
          handPosition.x >= limits.xStart && handPosition.x <= limits.xEnd &&
          handPosition.y >= limits.yStart && handPosition.y <= limits.yEnd &&
          handPosition.z >= limits.zStart && handPosition.z <= limits.zEnd
        ) {
          console.log("controle");
          // Ici, vous pouvez ajouter d'autres actions ou logiques de contrôle
        }
      }
    });
  }
  /*
  loadFBX(
    fbxUrl: string,
    position: { x: number, y: number, z: number },
    scale: { x: number, y: number, z: number },
    isInteractive: boolean,
    isPhysical: boolean,
    assemblyGroup: string[],
    force?: { x: number, y: number, z: number },  // Force appliquée
    constraintPoint?: { x: number, y: number, z: number } // Point de contrainte
  ) {
    const loader = new FBXLoader();
    loader.load(fbxUrl, (object) => {
      object.scale.set(scale.x, scale.y, scale.z);
      object.position.set(position.x, position.y, position.z);
      const gripPoint = this.calculateGripPoint(object);
      const objectGroup = new THREE.Group();
      this.scene.add(objectGroup);

      // Ajouter l'objet au groupe
      objectGroup.add(object);

      object.position.sub(gripPoint);

      object.userData["isInteractive"] = isInteractive;
      object.userData["isPhysical"] = isPhysical;
      object.userData["assemblyGroup"] = assemblyGroup;
      objectGroup.userData["gripPoint"] = gripPoint;

      const objectId = this.generateUniqueId();
      object.userData["id"] = objectId;

      const boundingBox = new THREE.Box3().setFromObject(object);
      object.userData["boundingBox"] = boundingBox;

      object.userData["spatialLimits"] = {
        xStart: boundingBox.min.x,
        xEnd: boundingBox.max.x,
        yStart: boundingBox.min.y,
        yEnd: boundingBox.max.y,
        zStart: boundingBox.min.z,
        zEnd: boundingBox.max.z
      }
      this.scene.add(object);


      if (isPhysical) {
        // Initialiser un corps physique avec Cannon.js
        const shape = new CANNON.Box(new CANNON.Vec3(
          (boundingBox.max.x - boundingBox.min.x) / 2,
          (boundingBox.max.y - boundingBox.min.y) / 2,
          (boundingBox.max.z - boundingBox.min.z) / 2
        ));
        const body = new CANNON.Body({
          mass: 1,
          shape: shape,
          position: new CANNON.Vec3(objectGroup.position.x, objectGroup.position.y, objectGroup.position.z),
        });


        if (force) {
          // Appliquer une force sur le corps physique
          const forceVec = new CANNON.Vec3(force.x, force.y, force.z);
          if (constraintPoint) {
            const pointVec = new CANNON.Vec3(constraintPoint.x, constraintPoint.y, constraintPoint.z);
            body.applyForce(forceVec, pointVec);
          } else {
            body.applyForce(forceVec, body.position);
          }
        }

        this.physicsWorld.addBody(body);
        object.userData["physicsBody"] = body;
      }

      if (isInteractive) {
        this.setupInteractiveHandlers(object);
      }
      console.log(`Objet chargé: ${fbxUrl}, Point d'agrippement: ${JSON.stringify(gripPoint)}`);
      console.log(`Objet chargé: ${fbxUrl}, Force: ${force ? JSON.stringify(force) : 'Aucune'}, Contrainte: ${constraintPoint ? JSON.stringify(constraintPoint) : 'Aucune'}`);
    });
  }*/
  loadFBX(
    fbxUrl: string,
    position: { x: number, y: number, z: number },
    scale: { x: number, y: number, z: number },
    isInteractive: boolean,
    isPhysical: boolean,
    assemblyGroup: string[],
    force?: { x: number, y: number, z: number },
    constraintPoint?: { x: number, y: number, z: number }
  ) {
    const loader = new FBXLoader();
    loader.load(fbxUrl, (object) => {
      object.scale.set(scale.x, scale.y, scale.z);

      // Ajouter l'objet à un groupe
      const objectGroup = new THREE.Group();
      this.scene.add(objectGroup);
      objectGroup.add(object);

      // Définir la position directement sur le groupe
      objectGroup.position.set(position.x, position.y, position.z);

      // Calculer le point d'agrippement (gripPoint) et ajuster l'objet
      const gripPoint = this.calculateGripPoint(object);
      object.position.sub(gripPoint);

      // Ajouter une variable "center" pour définir le centre de rotation
      const boundingBox = new THREE.Box3().setFromObject(object);
      const center = new THREE.Vector3();
      boundingBox.getCenter(center);
      objectGroup.userData["center"] = center;

      // Stocker les métadonnées
      objectGroup.userData["gripPoint"] = gripPoint;
      objectGroup.userData["isInteractive"] = isInteractive;
      objectGroup.userData["isPhysical"] = isPhysical;
      objectGroup.userData["assemblyGroup"] = assemblyGroup;

      if (isPhysical) {
        const shape = new CANNON.Box(new CANNON.Vec3(
          (boundingBox.max.x - boundingBox.min.x) / 2,
          (boundingBox.max.y - boundingBox.min.y) / 2,
          (boundingBox.max.z - boundingBox.min.z) / 2
        ));
        const body = new CANNON.Body({
          mass: 1,
          shape: shape,
          position: new CANNON.Vec3(position.x, position.y, position.z),
        });

        if (force) {
          const forceVec = new CANNON.Vec3(force.x, force.y, force.z);
          if (constraintPoint) {
            const pointVec = new CANNON.Vec3(constraintPoint.x, constraintPoint.y, constraintPoint.z);
            body.applyForce(forceVec, pointVec);
          } else {
            body.applyForce(forceVec, body.position);
          }
        }

        this.physicsWorld.addBody(body);
        objectGroup.userData["physicsBody"] = body;
      }

      if (isInteractive) {
        this.setupInteractiveHandlers(objectGroup);
        this.interactiveObjects.push(object);
      }

      console.log(`Objet chargé: ${fbxUrl}, Position: ${position.x}, ${position.y}, ${position.z}, Centre: ${JSON.stringify(center)}`);
    });
  }


  getInteractiveObjects(): THREE.Object3D[] {
    return this.interactiveObjects;
  }

  private calculateGripPoint(object: THREE.Object3D): THREE.Vector3 {
    const boundingBox = new THREE.Box3().setFromObject(object);
    const center = new THREE.Vector3();
    boundingBox.getCenter(center);

    // Exemple simple : utiliser le point le plus bas du centre de la boîte englobante
    const gripPoint = new THREE.Vector3(
      center.x,
      boundingBox.min.y,
      center.z
    );

    return gripPoint;
  }
  // Vérifiez que votre setupPhysicsBody crée bien un corps dynamique

  loadHDR(hdrUrl: string, cubeSize: number, textureUrl: string) {
    new RGBELoader().load(
      hdrUrl,
      (hdrTexture) => {
        hdrTexture.mapping = THREE.EquirectangularReflectionMapping;
        this.scene.background = hdrTexture;
        this.scene.environment = hdrTexture;

        // Créer le cube de collision
        const collisionCube = this.addCollisionCube(cubeSize);

        // Charger la texture spécifique pour le cube
        new THREE.TextureLoader().load(
          textureUrl,
          (cubeTexture) => {
            // Appliquer la texture au cube
            collisionCube.material = new THREE.MeshStandardMaterial({
              map: cubeTexture,
              envMap: hdrTexture
            });
            collisionCube.material.needsUpdate = true;
          },
          undefined,
          (error) => {
            console.error('Erreur de chargement de la texture du cube:', error);
          }
        );
      },
      undefined,
      (error) => {
        console.error('Erreur de chargement HDR:', error);
      }
    );
  }


  loadEXR(exrUrl: string, cubeSize: number, textureUrl: string) {
    new EXRLoader().load(
      exrUrl,
      (exrTexture) => {
        exrTexture.mapping = THREE.EquirectangularReflectionMapping;
        this.scene.background = exrTexture;
        this.scene.environment = exrTexture;

        // Créer le cube de collision
        const collisionCube = this.addCollisionCube(cubeSize);

        // Charger la texture spécifique pour le cube
        new THREE.TextureLoader().load(
          textureUrl,
          (cubeTexture) => {
            // Appliquer la texture au cube
            collisionCube.material = new THREE.MeshStandardMaterial({
              map: cubeTexture,
              envMap: exrTexture
            });
            collisionCube.material.needsUpdate = true;
          },
          undefined,
          (error) => {
            console.error('Erreur de chargement de la texture du cube:', error);
          }
        );
      },
      undefined,
      (error) => {
        console.error('Erreur de chargement EXR:', error);
      }
    );
  }

  moveObject(object: THREE.Object3D, newPosition: THREE.Vector3): boolean {
    if (!this.checkCollision(object, newPosition)) {
      object.position.copy(newPosition);
      if (object.userData["isPhysical"]) {
        const body = this.physicsBodies.get(object.userData["id"]);
        if (body) {
          body.position.copy(newPosition as any);
          body.velocity.set(0, 0, 0);
        }
      }
      return true;
    }
    return false;
  }

  checkForAssembly() {
    for (let i = 0; i < this.interactiveObjects.length; i++) {
      const obj1 = this.interactiveObjects[i];
      for (let j = i + 1; j < this.interactiveObjects.length; j++) {
        const obj2 = this.interactiveObjects[j];
        if (this.canAssemble(obj1, obj2)) {
          const distance = obj1.position.distanceTo(obj2.position);
          if (distance < 2.0) {
            this.assembleObjects(obj1, obj2);
            return;
          }
        }
      }
    }
  }

  canAssemble(obj1: THREE.Object3D, obj2: THREE.Object3D): boolean {
    const group1 = obj1.userData["assemblyGroup"];
    const group2 = obj2.userData["assemblyGroup"];

    if (!group1 || !group2) return false;

    return group1.some((element: string) => group2.includes(element));
  }

  assembleObjects(obj1: THREE.Object3D, obj2: THREE.Object3D): void {
    // Déterminer quel nouvel objet créer basé sur la combinaison
    const combinationKey = this.getCombinationKey(obj1, obj2);
    const newModelUrl = this.transformationMap[combinationKey];

    if (!newModelUrl) {
      console.warn("Aucune transformation définie pour cette combinaison");
      return;
    }

    // Position moyenne pour le nouvel objet
    const midPosition = new THREE.Vector3();
    midPosition.addVectors(obj1.position, obj2.position).divideScalar(2);

    // Supprimer les objets originaux de la scène
    this.scene.remove(obj1);
    this.scene.remove(obj2);

    // Supprimer de la liste des objets interactifs
    this.interactiveObjects = this.interactiveObjects.filter(obj => obj !== obj1 && obj !== obj2);

    // Charger le nouveau modèle
    const newAssemblyGroup = this.getNewAssemblyGroup(obj1, obj2);
    this.loadFBX(
      newModelUrl,
      { x: midPosition.x, y: midPosition.y, z: midPosition.z },
      { x: 1, y: 1, z: 1 },
      true, // Le nouvel objet est interactif
      true, // Le nouvel objet est physique
      newAssemblyGroup // Groupes d'assemblage
    );
  }

  getCombinationKey(obj1: THREE.Object3D, obj2: THREE.Object3D): string {
    // Créer une clé unique pour cette combinaison d'objets
    // Par exemple, combinant les ID des groupes d'assemblage
    const groups1 = [...obj1.userData["assemblyGroup"]].sort();
    const groups2 = [...obj2.userData["assemblyGroup"]].sort();

    return `${groups1.join('x')}+${groups2.join('x')}`;
  }

  getNewAssemblyGroup(obj1: THREE.Object3D, obj2: THREE.Object3D): string[] {
    // Logique pour déterminer les nouveaux groupes d'assemblage possibles
    // Cela dépend de la logique spécifique du jeu/application
    const combinedGroups = [...new Set([...obj1.userData["assemblyGroup"], ...obj2.userData["assemblyGroup"]])];
    return combinedGroups;
  }

  private createDebugVisualizations() {
    // Effacer les objets debug existants
    this.debugObjects.forEach(obj => this.scene.remove(obj));
    this.debugObjects = [];

    // Créer une sphère de débogage pour chaque point de repère de la main
    const sphereGeometry = new THREE.SphereGeometry(0.01, 16, 16);
    const materialLeft = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const materialRight = new THREE.MeshBasicMaterial({ color: 0xff0000 });

    // Créer 21 sphères pour chaque main (MediaPipe suit 21 points par main)
    for (let i = 0; i < 21; i++) {
      // Sphères de débogage pour la main gauche
      const sphereLeft = new THREE.Mesh(sphereGeometry, materialLeft);
      sphereLeft.visible = false;
      this.scene.add(sphereLeft);
      this.debugObjects.push(sphereLeft);

      // Sphères de débogage pour la main droite
      const sphereRight = new THREE.Mesh(sphereGeometry, materialRight);
      sphereRight.visible = false;
      this.scene.add(sphereRight);
      this.debugObjects.push(sphereRight);
    }

    // Créer des lignes pour connecter les points de repère
    const fingerConnections = [
      // Pouce
      [0, 1], [1, 2], [2, 3], [3, 4],
      // Index
      [0, 5], [5, 6], [6, 7], [7, 8],
      // Majeur
      [0, 9], [9, 10], [10, 11], [11, 12],
      // Annulaire
      [0, 13], [13, 14], [14, 15], [15, 16],
      // Auriculaire
      [0, 17], [17, 18], [18, 19], [19, 20]
    ];

    // Créer des lignes de débogage pour les deux mains
    for (const [start, end] of fingerConnections) {
      // Connexions de la main gauche
      const geometryLeft = new THREE.BufferGeometry();
      const materialLineLeft = new THREE.LineBasicMaterial({ color: 0x00ff00 });
      const lineLeft = new THREE.Line(geometryLeft, materialLineLeft);
      lineLeft.visible = false;
      this.scene.add(lineLeft);
      this.debugObjects.push(lineLeft);

      // Connexions de la main droite
      const geometryRight = new THREE.BufferGeometry();
      const materialLineRight = new THREE.LineBasicMaterial({ color: 0xff0000 });
      const lineRight = new THREE.Line(geometryRight, materialLineRight);
      lineRight.visible = false;
      this.scene.add(lineRight);
      this.debugObjects.push(lineRight);
    }
  }

  /*private createHandModel(object: THREE.Object3D, side: 'Left' | 'Right'): THREE.Group {
    const handModel = new THREE.Group();
    handModel.add(object.clone());
    handModel.scale.set(0.01, 0.01, 0.01);
    handModel.visible = true;
    if (side === 'Left') handModel.rotateY(Math.PI);
    this.scene.add(handModel);
    return handModel;
  }*/

  private animate = () => {
    this.ngZone.runOutsideAngular(() => {
      requestAnimationFrame(this.animate);

      // Calcul du delta time
      const now = performance.now();
      let deltaTime = 0;
      if (this.lastTime) {
        deltaTime = (now - this.lastTime) / 1000;
        if (deltaTime > 0.1) deltaTime = 0.1;
      }
      this.lastTime = now;

      // Important: Positionner les mains devant la caméra si aucun tracking n'est actif
      if (!this.trackingInitialized) {
        this.positionHandsInFrontOfCamera();
      }
      this.positionHandsRelativeToCamera();


      // Mise à jour physique et rendu
      this.updatePhysics();
      this.checkForAssembly();
      this.renderer.render(this.scene, this.camera);
    });
  };



  public toggleDebugMode() {
    this.debugMode = !this.debugMode;
    this.debugObjects.forEach(obj => {
      obj.visible = this.debugMode;
    });
    console.log(`Mode debug ${this.debugMode ? 'activé' : 'désactivé'}`);
  }

  //hand

  private handSkeleton: THREE.Skeleton | null = null;
  private handModelLeft: THREE.Group | null = null;
  private handModelRight: THREE.Group | null = null;



  private renameHandBones(skeleton: THREE.Skeleton) {
    const fingerNames = ['thumb', 'index', 'middle', 'ring', 'pinky'];
    let fingerIndex = -1;
    let jointIndex = 0;

    skeleton.bones.forEach((bone, index) => {
      if (index === 0) {
        bone.name = 'wrist';
      } else {
        if (jointIndex === 0) {
          fingerIndex++;
          jointIndex = 1;
        } else {
          jointIndex++;
        }
        if (fingerIndex < fingerNames.length) {
          bone.name = `${fingerNames[fingerIndex]}_${jointIndex}`;
        }
      }
      if (jointIndex === 4) jointIndex = 0;
    });
  }


  private updateHandBones(handModel: THREE.Group, landmarks: any) {
    handModel.traverse((child) => {
      if (child instanceof THREE.Bone) {
        const landmarkIndex = this.boneToLandmarkMap[child.name];
        if (landmarkIndex !== undefined) {
          const landmark = landmarks[landmarkIndex];

          // Mise à jour de la position
          child.position.set(
            (landmark.x - 0.5) * 2,
            (0.5 - landmark.y) * 2,
            -landmark.z * 2
          );

          // Mise à jour de la rotation (aligner les os sur le mouvement des doigts)
          if (landmarkIndex > 0) { // Éviter le poignet
            const prevLandmark = landmarks[landmarkIndex - 1];
            const direction = new THREE.Vector3(
              landmark.x - prevLandmark.x,
              landmark.y - prevLandmark.y,
              landmark.z - prevLandmark.z
            ).normalize();

            const quaternion = new THREE.Quaternion();
            quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction);
            child.quaternion.copy(quaternion);
          }
        }
      }
    });

    handModel.updateMatrixWorld(true);
  }

  private boneToLandmarkMap: { [key: string]: number } = {
    "Bone": 0,"Bone001": 1,"Bone002": 2,"Bone003": 3,"Bone004": 4,"Bone005": 5,
    "Bone006": 6, "Bone007": 7, "Bone008": 8, "Bone009": 9, "Bone010": 10, "Bone011": 11,
    "Bone012": 12, "Bone013": 13, "Bone0014": 14, "Bone015": 15, "Bone016": 16, "Bone017": 17,
    "Bone018": 18, "Bone0019": 19, "Bone020": 20, "Bone021": 21, "Bone022": 22, "Bone023": 23,
  };



  private calculateScale(landmarks: any): number {
    // Calculer la distance entre deux points de référence (par exemple, le poignet et le bout du majeur)
    const wrist = landmarks[0];
    const fingerTip = landmarks[8];
    const distance = Math.sqrt(
      Math.pow(fingerTip.x - wrist.x, 2) +
      Math.pow(fingerTip.y - wrist.y, 2) +
      Math.pow(fingerTip.z - wrist.z, 2)
    );

    // Ajuster la taille en fonction de cette distance
    return distance * 0.1; // Valeur à ajuster selon vos besoins
  }

  // Exemple de mise à jour de la position du modèle
  private updateHandModel(results: Results) {
    if (results.multiHandLandmarks) {
      // Sélectionner une main pour suivre
      const handLandmarks = results.multiHandLandmarks[0];
      const handModel = results.multiHandedness[0].label === 'Left' ? this.handModelLeft : this.handModelRight;

      if (handModel) {
        // Mettre à jour la position du modèle 3D
        const handPosition = this.getAveragePosition(handLandmarks);
        handModel.position.copy(handPosition);

        // Mettre à jour la position du corps physique
        const handBody = results.multiHandedness[0].label === 'Left' ? this.handPhysicsBodies.get('left') : this.handPhysicsBodies.get('right');
        if (handBody) {
          handBody.position.copy(new CANNON.Vec3(handPosition.x, handPosition.y, handPosition.z));
        }
      }
    }
  }

  private loadHandModels() {
    const loader = new FBXLoader();
    loader.load('hands.fbx', (object) => {
      this.handModelLeft = this.createHandModel(object, 'Left');
      this.handModelRight = this.createHandModel(object, 'Right');
      console.log("Modèles de mains chargés:", this.handModelLeft, this.handModelRight);
      object.scale.set(0.01, 0.01, 0.01)
      
      object.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.material instanceof THREE.MeshPhongMaterial) {
            const phongMaterial = child.material as THREE.MeshPhongMaterial;
            // Convertir en MeshStandardMaterial
            const standardMaterial = new THREE.MeshStandardMaterial({
              map: phongMaterial.map,
              color: phongMaterial.color,
              roughness: 1 - (phongMaterial.shininess / 100), // Convertir la brillance en rugosité
              metalness: 0.5
            });
            child.material = standardMaterial;
          } else if (child.material instanceof THREE.MeshStandardMaterial) {
            const standardMaterial = child.material as THREE.MeshStandardMaterial;
            // Ajuster la rugosité si nécessaire
            standardMaterial.roughness = 0.5; // Exemple de valeur
            standardMaterial.metalness = 0.5;
          }
        }
      });

      object.traverse((child) => {
        object.scale.set(0.01, 0.01, 0.01);
        object.rotation.y = Math.PI;

        if (child instanceof THREE.Mesh) {
          if (child.material) {
            // Convertir en MeshStandardMaterial si nécessaire
            if (child.material instanceof THREE.MeshPhongMaterial) {
              const phongMaterial = child.material as THREE.MeshPhongMaterial;
              const standardMaterial = new THREE.MeshStandardMaterial({
                map: phongMaterial.map,
                color: phongMaterial.color,
                roughness: 1 - (phongMaterial.shininess / 100), // Convertir la brillance en rugosité
                metalness: 0.5
              });
              child.material = standardMaterial;
            } else if (child.material instanceof THREE.MeshStandardMaterial) {
              const standardMaterial = child.material as THREE.MeshStandardMaterial;
              // Ajuster la rugosité si nécessaire
              standardMaterial.roughness = 0.5; // Exemple de valeur
              standardMaterial.metalness = 0.5;
            }
          }
        }

        if (child instanceof THREE.SkinnedMesh) {
          console.log("Squelette trouvé:", child.skeleton);
          this.handSkeleton = child.skeleton;
          this.renameHandBones(this.handSkeleton);
          this.handSkeleton = child.skeleton;
          this.handModelLeft = this.createHandModel(object.clone(), 'Left');
          this.handModelRight = this.createHandModel(object.clone(), 'Right');

          // Ajouter un helper pour visualiser l'armature
          const helper = new THREE.SkeletonHelper(child);
          this.scene.add(helper);
        }
      });

      // Vérifier si les modèles existent avant de les ajouter
      if (this.handModelLeft) this.scene.add(this.handModelLeft);
      if (this.handModelRight) this.scene.add(this.handModelRight);

    });
    // Dans votre méthode loadHandModels
    // Dans votre méthode loadHandModels
    if (this.handModelLeft) {
      const leftHandBox = new THREE.Box3().setFromObject(this.handModelLeft);
      const leftHandDimensions = new THREE.Vector3();
      leftHandBox.getSize(leftHandDimensions);
      const leftHandShape = new CANNON.Box(new CANNON.Vec3(
        leftHandDimensions.x / 2,
        leftHandDimensions.y / 2,
        leftHandDimensions.z / 2
      ));
      const leftHandBody = new CANNON.Body({
        mass: 0, // Masse 0 pour un objet de collision statique
        position: new CANNON.Vec3(
          this.handModelLeft.position.x,
          this.handModelLeft.position.y,
          this.handModelLeft.position.z
        ),
        shape: leftHandShape
      });
      this.physicsWorld.addBody(leftHandBody);
      this.handPhysicsBodies.set('left', leftHandBody);
    }

    if (this.handModelRight) {
      const rightHandBox = new THREE.Box3().setFromObject(this.handModelRight);
      const rightHandDimensions = new THREE.Vector3();
      rightHandBox.getSize(rightHandDimensions);
      const rightHandShape = new CANNON.Box(new CANNON.Vec3(
        rightHandDimensions.x / 2,
        rightHandDimensions.y / 2,
        rightHandDimensions.z / 2
      ));
      const rightHandBody = new CANNON.Body({
        mass: 0, // Masse 0 pour un objet de collision
        position: new CANNON.Vec3(
          this.handModelRight.position.x,
          this.handModelRight.position.y,
          this.handModelRight.position.z
        ),
        shape: rightHandShape
      });
      this.physicsWorld.addBody(rightHandBody);
      this.handPhysicsBodies.set('right', rightHandBody);
    }

  }

  // Exemple de mise à jour des os des doigts
  private updateFingerBones(handModel: THREE.Group, landmarks: any) {
    handModel.traverse((child) => {
      if (!(child instanceof THREE.Bone)) return;

      const landmarkIndex = this.boneToLandmarkMap[child.name.toLowerCase()];

      if (!landmarkIndex) return;

      const landmark = landmarks[landmarkIndex];

      if (landmark && child.parent) {
        const parentWorldPosition = new THREE.Vector3();
        child.parent.getWorldPosition(parentWorldPosition);

        const boneWorldPosition = new THREE.Vector3(
          (landmark.x - 0.5) * 2,
          (0.5 - landmark.y) * 2,
          landmark.z * -2
        );

        child.position.copy(boneWorldPosition).sub(parentWorldPosition);
        console.log(`Mise à jour de l'os ${child.name} avec position ${landmark.x}, ${landmark.y}, ${landmark.z}`);
      }
    });
  }

/*private loadHandModels() {
    const loader = new FBXLoader();
    loader.load('hand.fbx', (object) => {
      // Exemple d'ajustement de matériau
      object.scale.set(0.00001, 0.00001, 0.00001)
      object.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.material instanceof THREE.MeshPhongMaterial) {
            const phongMaterial = child.material as THREE.MeshPhongMaterial;
            // Convertir en MeshStandardMaterial
            const standardMaterial = new THREE.MeshStandardMaterial({
              map: phongMaterial.map,
              color: phongMaterial.color,
              roughness: 1 - (phongMaterial.shininess / 100), // Convertir la brillance en rugosité
              metalness: 0.5
            });
            child.material = standardMaterial;
          } else if (child.material instanceof THREE.MeshStandardMaterial) {
            const standardMaterial = child.material as THREE.MeshStandardMaterial;
            // Ajuster la rugosité si nécessaire
            standardMaterial.roughness = 0.5; // Exemple de valeur
            standardMaterial.metalness = 0.5;
          }
        }
      });

      object.traverse((child) => {
        object.scale.set(0.01, 0.01, 0.01);
        if (child instanceof THREE.Mesh) {
          if (child.material) {
            // Convertir en MeshStandardMaterial si nécessaire
            if (child.material instanceof THREE.MeshPhongMaterial) {
              const phongMaterial = child.material as THREE.MeshPhongMaterial;
              const standardMaterial = new THREE.MeshStandardMaterial({
                map: phongMaterial.map,
                color: phongMaterial.color,
                roughness: 1 - (phongMaterial.shininess / 100), // Convertir la brillance en rugosité
                metalness: 0.5
              });
              child.material = standardMaterial;
            } else if (child.material instanceof THREE.MeshStandardMaterial) {
              const standardMaterial = child.material as THREE.MeshStandardMaterial;
              // Ajuster la rugosité si nécessaire
              standardMaterial.roughness = 0.5; // Exemple de valeur
              standardMaterial.metalness = 0.5;
            }
          }
        }

        if (child instanceof THREE.SkinnedMesh) {
          console.log("Squelette trouvé:", child.skeleton);
          this.handSkeleton = child.skeleton;
          this.handModelLeft = this.createHandModel(object.clone(), 'Left');
          this.handModelRight = this.createHandModel(object.clone(), 'Right');

          // Ajouter un helper pour visualiser l'armature
          const helper = new THREE.SkeletonHelper(child);
          this.scene.add(helper);
        }
      });

      // Vérifier si les modèles existent avant de les ajouter
      if (this.handModelLeft) this.scene.add(this.handModelLeft);
      if (this.handModelRight) this.scene.add(this.handModelRight);
    });
  }
  */

  /*private updateHandBones(handModel: THREE.Group, landmarks: any) {
    if (!this.handSkeleton) return;  // Vérification avant d'accéder aux bones

    this.handSkeleton.bones.forEach((bone) => {
      const landmarkIndex = this.boneToLandmarkMap[bone.name];
      if (landmarkIndex !== undefined) {
        const landmark = landmarks[landmarkIndex];
        bone.position.set(
          (landmark.x - 0.5) * 2,
          (0.5 - landmark.y) * 2,
          -landmark.z * 2
        );
      }
    });
  }*/
  private mapBones(handModel: THREE.Group): Record<string, THREE.Bone> {
    const bones: Record<string, THREE.Bone> = {};

    handModel.traverse((child) => {
      if (child instanceof THREE.Bone) {
        bones[child.name.toLowerCase()] = child; // Assurer la correspondance des noms
      }
    });

    return bones;
  }

  private updateHandOrientation(handModel: THREE.Group, landmarks: any) {
    const wrist = new THREE.Vector3(landmarks[0].x, landmarks[0].y, landmarks[0].z);
    const middleFinger = new THREE.Vector3(landmarks[9].x, landmarks[9].y, landmarks[9].z);
    const direction = new THREE.Vector3().subVectors(middleFinger, wrist).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(direction, up).normalize();
    up.crossVectors(right, direction);
    handModel.matrix.makeBasis(right, up, direction.negate());
    handModel.quaternion.setFromRotationMatrix(handModel.matrix);
  }


  private getLandmarkForBone(boneName: string, landmarks: any): any {
    const boneToLandmarkMap: { [key: string]: number } = {
      wrist: 0, thumb1: 1, thumb2: 2, thumb3: 3, thumb4: 4,
      index1: 5, index2: 6, index3: 7, index4: 8,
      middle1: 9, middle2: 10, middle3: 11, middle4: 12,
      ring1: 13, ring2: 14, ring3: 15, ring4: 16,
      pinky1: 17, pinky2: 18, pinky3: 19, pinky4: 20,
       pinky6: 22, pinky7: 23
    };
    return landmarks[boneToLandmarkMap[boneName]] || null;
  }


  private calculateBoneRotation(start: any, end: any): THREE.Vector3 {
    const dir = new THREE.Vector3(end.x - start.x, end.y - start.y, end.z - start.z);
    dir.normalize();

    return dir;
  }














  /*

  private processHandData(results: any) {
    // Mettre à jour les visualisations de débogage dans tous les cas
    this.updateDebugVisualizations(results);

    // Vérifier si des mains sont détectées
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      // Aucune main détectée - utiliser le code actuel (mains fixées à la caméra)
      this.updateHandsWithCameraPosition();
      return;
    }
    console.log(`Hands detected: ${results.multiHandLandmarks ? results.multiHandLandmarks.length : 0}`);

    // Des mains sont détectées - utiliser l'ancien code pour le tracking
    results.multiHandLandmarks.forEach((landmarks: any, index: number) => {
      const isLeftHand = results.multiHandedness[index].label === 'Left';
      const handModel = isLeftHand ? this.handModelLeft : this.handModelRight;

      if (!handModel) return;

      // Mise à jour du modèle visuel de la main
      this.updateHandPosition(handModel, landmarks);
      this.updateHandOrientation(handModel, landmarks);
      this.updateFingerBones(handModel, landmarks);

      // Mise à jour du corps physique associé
      const handPosition = this.getAveragePosition(landmarks);
      const handBody = isLeftHand ? this.handPhysicsBodies.get('left') : this.handPhysicsBodies.get('right');

      if (handBody) {
        handBody.position.copy(new CANNON.Vec3(
          (handPosition.x - 0.5) * 2,
          (0.5 - handPosition.y) * 2,
          handPosition.z * -2
        ));
      }

      handModel.updateMatrixWorld(true);
    });
  }

  private updateHandsWithCameraPosition() {
    if (this.handModelLeft && this.handModelRight) {
      const cameraPosition = this.camera.position;
      const cameraRotation = this.camera.rotation;

      // Positionner les mains à côté de la caméra
      this.handModelLeft.position.copy(cameraPosition).add(new THREE.Vector3(-0.5, -0.3, -1));
      this.handModelRight.position.copy(cameraPosition).add(new THREE.Vector3(0.5, -0.3, -1));

      // Convertir l'angle d'Euler en quaternion
      const euler = new THREE.Euler(cameraRotation.x, cameraRotation.y, cameraRotation.z);
      const cameraQuaternion = new THREE.Quaternion();
      cameraQuaternion.setFromEuler(euler);

      // Faire tourner les mains avec la caméra
      this.handModelLeft.quaternion.copy(cameraQuaternion);
      this.handModelRight.quaternion.copy(cameraQuaternion);

      // Ajuster l'orientation des mains
      this.handModelLeft.rotateY(Math.PI);
      this.handModelRight.rotateY(Math.PI);

      // Mettre à jour les corps physiques des mains
      const leftHandBody = this.handPhysicsBodies.get('left');
      const rightHandBody = this.handPhysicsBodies.get('right');
      console.log('Using camera-based positioning for hands (no hand detected)');

      if (leftHandBody) {
        leftHandBody.position.copy(new CANNON.Vec3(
          this.handModelLeft.position.x,
          this.handModelLeft.position.y,
          this.handModelLeft.position.z
        ));
        leftHandBody.quaternion.set(
          cameraQuaternion.x,
          cameraQuaternion.y,
          cameraQuaternion.z,
          cameraQuaternion.w
        );
      }

      if (rightHandBody) {
        rightHandBody.position.copy(new CANNON.Vec3(
          this.handModelRight.position.x,
          this.handModelRight.position.y,
          this.handModelRight.position.z
        ));
        rightHandBody.quaternion.set(
          cameraQuaternion.x,
          cameraQuaternion.y,
          cameraQuaternion.z,
          cameraQuaternion.w
        );
      }
    }
  }*/
  private getAveragePosition(landmarks: any[]): THREE.Vector3 {
    let sumX = 0, sumY = 0, sumZ = 0;

    for (const landmark of landmarks) {
      sumX += landmark.x;
      sumY += landmark.y;
      sumZ += landmark.z;
    }

    const count = landmarks.length;
    return new THREE.Vector3(
      sumX / count,
      sumY / count,
      sumZ / count
    );
  }

  
  private positionHandWithCamera(handModel: THREE.Group, handSide: string, offsetX: number) {
    const cameraPosition = this.camera.position;
    const cameraRotation = this.camera.rotation;

    // Positionner la main à côté de la caméra
    handModel.position.copy(cameraPosition).add(new THREE.Vector3(offsetX, -0.3, -1));

    // Appliquer la rotation de la caméra à la main
    const euler = new THREE.Euler(cameraRotation.x, cameraRotation.y, cameraRotation.z);
    const cameraQuaternion = new THREE.Quaternion();
    cameraQuaternion.setFromEuler(euler);
    handModel.quaternion.copy(cameraQuaternion);

    // Ajuster l'orientation de la main (retournement si nécessaire)
    handModel.rotateY(Math.PI);

    // Mettre à jour également le corps physique
    const handBody = this.handPhysicsBodies.get(handSide);
    if (handBody) {
      handBody.position.copy(new CANNON.Vec3(
        handModel.position.x,
        handModel.position.y,
        handModel.position.z
      ));
      handBody.quaternion.set(
        cameraQuaternion.x,
        cameraQuaternion.y,
        cameraQuaternion.z,
        cameraQuaternion.w
      );
    }

    handModel.updateMatrixWorld(true);
  }

  private interactionConstraints = {
    minDepth: 0.5,  // Distance minimale devant la caméra en mètres
    maxDepth: 2.0,  // Distance maximale devant la caméra en mètres
    lateralLimit: 1.2 // Limite de mouvement latéral (X,Y)
  };

  private getCameraSpacePosition(worldPos: THREE.Vector3): THREE.Vector3 {
    return worldPos.clone().sub(this.camera.position).applyQuaternion(this.camera.quaternion.invert());
  }

  private clampHandPosition(handPos: THREE.Vector3): THREE.Vector3 {
    const camSpacePos = this.getCameraSpacePosition(handPos);

    // Contraindre la profondeur (axe Z)
    const clampedZ = THREE.MathUtils.clamp(
      camSpacePos.z,
      this.interactionConstraints.minDepth,
      this.interactionConstraints.maxDepth
    );

    // Contraindre les mouvements latéraux (X,Y)
    const maxLateral = this.interactionConstraints.lateralLimit;

    const clampedPosition = new THREE.Vector3(
      THREE.MathUtils.clamp(camSpacePos.x, -maxLateral, maxLateral),
      THREE.MathUtils.clamp(camSpacePos.y, -maxLateral, maxLateral),
      clampedZ
    );

    // Reconvertir en coordonnées mondiales
    return clampedPosition
      .applyQuaternion(this.camera.quaternion)
      .add(this.camera.position);
  }
  /*
  private processHandData(results: any) {
    // Code existant pour les visualisations debug
    this.updateDebugVisualizations(results);

    // Vérifier si des mains sont détectées
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      results.multiHandLandmarks.forEach((landmarks: any, index: number) => {
        const isLeftHand = results.multiHandedness[index].label === 'Left';
        const handModel = isLeftHand ? this.handModelLeft : this.handModelRight;

        if (!handModel) return;

        // Mise à jour du modèle avec tracking
        this.updateHandPosition(handModel, landmarks);
        this.updateHandOrientation(handModel, landmarks);
        this.updateFingerBones(handModel, landmarks);

        // MODIFICATION: Appliquer la contrainte de distance
        handModel.position.copy(this.clampHandPosition(handModel.position));

        // Mise à jour du corps physique
        const handBody = isLeftHand ?
          this.handPhysicsBodies.get('left') :
          this.handPhysicsBodies.get('right');

        if (handBody) {
          handBody.position.copy(new CANNON.Vec3(
            handModel.position.x,
            handModel.position.y,
            handModel.position.z
          ));
          handBody.quaternion.copy(handModel.quaternion as any);
        }

        handModel.updateMatrixWorld(true);
      });
    }
  }*/


}

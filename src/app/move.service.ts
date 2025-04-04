import { Injectable } from '@angular/core';
import * as tf from '@tensorflow/tfjs';

@Injectable({
  providedIn: 'root'
})
export class MoveService {
  private model: tf.GraphModel | null = null;
  private expressionModel: tf.GraphModel | null = null;

  async loadModel(modelPath: string): Promise<void> {
    try {
      this.model = await tf.loadGraphModel(modelPath);
      console.log('Model loaded successfully:', this.model);
    } catch (error) {
      console.error('Error loading model:', error);
      throw error;
    }
  }

  async loadExpressionModel(expressionModelPath: string): Promise<void> {
    try {
      this.expressionModel = await tf.loadGraphModel(expressionModelPath);
      console.log('Expression model loaded successfully:', this.expressionModel);
    } catch (error) {
      console.error('Error loading expression model:', error);
      throw error;
    }
  }

  async predict(canvas: HTMLCanvasElement): Promise<string | null> {
    if (!this.model) {
      console.error('Model not loaded.');
      return null;
    }

    try {
      const tensor = tf.browser.fromPixels(canvas);
      const resizedTensor = tf.image.resizeBilinear(tensor, [224, 224]); // Ajustez la taille selon votre modèle
      const normalizedTensor = resizedTensor.div(255.0).expandDims(0);

      console.log('Input Tensor Shape:', normalizedTensor.shape);

      const predictions = await this.model.predict(normalizedTensor) as tf.Tensor;
      const values = await predictions.data();

      console.log('Predictions:', values);

      // Logique pour obtenir la classe détectée (à adapter selon la sortie de votre modèle)
      // Exemple:
      const maxIndex = values.indexOf(Math.max(...values));
      const classes = ['squat', 'kick', 'peur', 'joie', 'surprise', 'takehand']; // Remplacez par vos classes
      return classes[maxIndex];

    } catch (error) {
      console.error('Error during prediction:', error);
      return null;
    }
  }

async generateExpression(detectedClass?: string): Promise<HTMLImageElement | null> {
  if (!this.expressionModel) {
    console.error('Expression model not loaded');
    return null;
  }

  try {
    // Create noise tensor
    const noise = tf.randomNormal([1, 128, 128, 3]);
    const generatedImage = this.expressionModel.predict(noise) as tf.Tensor;

    const imageTensor = generatedImage.squeeze().reshape([128, 128, 3]) as tf.Tensor3D;

    // Scale tensor values
    const scaledTensor = imageTensor.mul(255).cast('int32');

    // Create canvas and draw image
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    await tf.browser.toPixels(scaledTensor as tf.Tensor3D, canvas);

    // Convert canvas to Image element
    const img = new Image();
    img.src = canvas.toDataURL();  // Convert canvas content to image

    // Add additional info if needed
    if (detectedClass) {
      img.alt = detectedClass;
    }

    // Return the generated image
    return img;
  } catch (error) {
    console.error('Error generating expression:', error);
    return null;
  }
}

}

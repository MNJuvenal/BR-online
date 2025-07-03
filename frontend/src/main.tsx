import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/fonts.css'

// Préchargement des modèles TensorFlow.js
import * as tf from '@tensorflow/tfjs'
import '@tensorflow/tfjs-backend-webgl'
import '@tensorflow/tfjs-backend-webgpu'
import '@tensorflow-models/face-landmarks-detection'
import '@tensorflow-models/pose-detection'

// Initialisation de TensorFlow.js
async function setupTensorFlow() {
  try {
    if (tf.findBackend('webgpu')) {
      await tf.setBackend('webgpu');
      console.log('TensorFlow.js initialized with WebGPU backend');
    } else {
      await tf.setBackend('webgl');
      console.log('TensorFlow.js initialized with WebGL backend');
    }
    await tf.ready();
  } catch (error) {
    console.error('Error initializing TensorFlow:', error);
    // Fallback to WebGL
    await tf.setBackend('webgl');
    await tf.ready();
  }
}

setupTensorFlow().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
});
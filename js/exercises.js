/**
 * Exercise data and management.
 * Each exercise has focus text displayed during breathing sessions.
 */

import { loadMantraText, saveMantraText } from './storage.js';

const BUILTIN_EXERCISES = [
  {
    id: 'body-scan',
    name: 'Body Scan',
    description: 'Notice sensations throughout your body',
    focusText: 'Bring awareness to each part of your body. Start from the top of your head and slowly move downward. Notice any tension, warmth, or tingling without trying to change it.',
  },
  {
    id: 'box-breathing',
    name: 'Box Breathing',
    description: 'Equal inhale, hold, exhale, hold',
    focusText: 'Breathe in a steady square pattern. Each phase is equal. Let the rhythm anchor your attention.',
  },
  {
    id: 'relaxed-gaze',
    name: 'Relaxed Gaze',
    description: 'Soften your eyes and facial muscles',
    focusText: 'Let your eyelids be heavy. Relax the muscles around your eyes, jaw, and forehead. Allow your face to become completely neutral.',
  },
  {
    id: 'posture-awareness',
    name: 'Posture Awareness',
    description: 'Align your spine and release tension',
    focusText: 'Sit tall but not rigid. Imagine a string pulling gently from the crown of your head. Let your shoulders drop. Feel your sit bones grounded.',
  },
  {
    id: 'gratitude',
    name: 'Gratitude',
    description: 'Reflect on things you appreciate',
    focusText: 'With each breath, bring to mind something you are grateful for. Let the feeling of appreciation fill your chest.',
  },
];

const MANTRA_EXERCISE = {
  id: 'custom-mantra',
  name: 'Custom Mantra',
  description: 'Meditate on your own words',
  isMantra: true,
};

export function getExercises() {
  const mantra = { ...MANTRA_EXERCISE, focusText: loadMantraText() || 'Enter your mantra in the exercises tab…' };
  return [...BUILTIN_EXERCISES, mantra];
}

export function getExerciseById(id) {
  return getExercises().find(e => e.id === id) || null;
}

export function getMantraText() {
  return loadMantraText() || '';
}

export function setMantraText(text) {
  saveMantraText(text);
}

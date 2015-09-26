import { Material } from 'cannon';

const defaultMaterial = new Material({ friction: 1.0, restitution: 0.6 });
export const brick = defaultMaterial;
export const box = defaultMaterial;

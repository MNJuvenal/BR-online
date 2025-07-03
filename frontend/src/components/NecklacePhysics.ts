import * as THREE from 'three';

interface Point {
    position: THREE.Vector3;
    oldPosition: THREE.Vector3;
    velocity: THREE.Vector3;
    fixed: boolean;
}

export class NecklacePhysics {
    private points: Point[] = [];
    private constraints: { p1: number; p2: number; distance: number }[] = [];
    private gravity = new THREE.Vector3(0, -9.81, 0);
    private damping = 0.98;
    private iterations = 3;

    constructor(numPoints: number, radius: number, height: number) {
        // Créer les points
        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            const position = new THREE.Vector3(x, height, z);
            this.points.push({
                position: position.clone(),
                oldPosition: position.clone(),
                velocity: new THREE.Vector3(),
                fixed: false
            });
        }

        // Créer les contraintes entre les points
        for (let i = 0; i < numPoints; i++) {
            const next = (i + 1) % numPoints;
            const p1 = this.points[i].position;
            const p2 = this.points[next].position;
            const distance = p1.distanceTo(p2);
            
            this.constraints.push({
                p1: i,
                p2: next,
                distance: distance
            });
        }
    }

    update(deltaTime: number, modelBounds: THREE.Box3) {
        const dt = Math.min(deltaTime, 1/60); // Limiter le pas de temps

        // Appliquer la gravité et la vélocité
        this.points.forEach(point => {
            if (point.fixed) return;

            // Sauvegarder l'ancienne position
            point.oldPosition.copy(point.position);

            // Appliquer la gravité
            point.velocity.add(this.gravity.clone().multiplyScalar(dt));
            
            // Appliquer la vélocité
            point.position.add(point.velocity.clone().multiplyScalar(dt));

            // Amortissement
            point.velocity.multiplyScalar(this.damping);
        });

        // Résoudre les contraintes plusieurs fois
        for (let i = 0; i < this.iterations; i++) {
            // Contraintes de distance
            this.constraints.forEach(constraint => {
                const p1 = this.points[constraint.p1];
                const p2 = this.points[constraint.p2];
                
                const diff = p1.position.clone().sub(p2.position);
                const currentDist = diff.length();
                const correction = diff.multiplyScalar((constraint.distance - currentDist) / currentDist / 2);

                if (!p1.fixed) p1.position.add(correction);
                if (!p2.fixed) p2.position.sub(correction);
            });

            // Collision avec le modèle
            this.points.forEach(point => {
                if (point.fixed) return;

                if (modelBounds.containsPoint(point.position)) {
                    // Trouver le point le plus proche sur la surface
                    const closest = new THREE.Vector3();
                    closest.copy(point.position);
                    modelBounds.clampPoint(point.position, closest);
                    
                    // Déplacer le point à l'extérieur
                    point.position.copy(closest);
                    
                    // Réduire la vélocité
                    point.velocity.multiplyScalar(0.5);
                }
            });
        }

        // Mettre à jour les vélocités
        this.points.forEach(point => {
            if (point.fixed) return;
            point.velocity.copy(point.position).sub(point.oldPosition).divideScalar(dt);
        });
    }

    getPoints(): THREE.Vector3[] {
        return this.points.map(p => p.position);
    }

    setFixed(index: number, fixed: boolean) {
        if (index >= 0 && index < this.points.length) {
            this.points[index].fixed = fixed;
        }
    }
}

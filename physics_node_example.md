# PhysicsNode para Aninode Engine

## Descripción
El PhysicsNode es un nodo avanzado de física que permite simular diversos comportamientos físicos como gravedad, rebotes, colisiones, atracción y movimientos aleatorios. Es un componente esencial para el sistema de animación física del Aninode Engine.

## Modos de Física

### 1. Gravedad (`Gravity`)
- Aplica una fuerza constante en una dirección específica
- Configurable en intensidad y dirección (abajo, arriba, izquierda, derecha o personalizada)
- Perfecto para simular caída de objetos

### 2. Rebote (`Bounce`)
- Simula el comportamiento de un objeto que rebota
- Configurable con elasticidad y decaimiento
- Incluye límites de rebote

### 3. Parábola (`Parabola`)
- Simula trayectorias balísticas
- Combina velocidad inicial con fuerzas de gravedad y resistencia al aire
- Ideal para lanzamiento de proyectiles

### 4. Colisión (`Collision`)
- Detecta y responde a colisiones con otros objetos
- Configurable con fuerzas de repulsión
- Permite simular interacciones entre objetos

### 5. Atractor (`Attractor`)
- Simula fuerzas de atracción entre objetos
- Configurable en intensidad y radio de influencia
- Útil para efectos de magnetismo

### 6. Camino Aleatorio (`RandomPath`)
- Genera movimientos impredecibles
- Configurable en aleatoriedad y velocidad
- Perfecto para simular comportamientos naturales (insectos, partículas)

## Parámetros de Configuración

### Parámetros Generales
- `mode`: El modo de física actual
- `mass`: Masa del objeto (afecta cómo las fuerzas lo impactan)
- `friction`: Resistencia al movimiento
- `positionX`, `positionY`: Posición inicial
- `velocityX`, `velocityY`: Velocidad inicial

### Parámetros Específicos por Modo

#### Gravedad
- `gravityEnabled`: Habilitar/deshabilitar gravedad
- `gravityStrength`: Intensidad de la gravedad
- `gravityDirection`: Dirección de la gravedad
- `customGravityX`, `customGravityY`: Componentes personalizados de gravedad

#### Rebote
- `bounceEnabled`: Habilitar/deshabilitar rebotes
- `bounceStrength`: Intensidad del rebote
- `bounceDecay`: Pérdida de energía por rebote
- `elasticity`: Cantidad de energía preservada

#### Parábola
- `parabolaEnabled`: Habilitar/deshabilitar parábola
- `initialVelocityX`, `initialVelocityY`: Velocidad inicial
- `airResistance`: Coeficiente de resistencia al aire

#### Colisión
- `collisionEnabled`: Habilitar/deshabilitar colisiones
- `collisionObjects`: IDs de objetos con los que colisionar
- `repulsionStrength`: Fuerza de repulsión
- `attractionStrength`: Fuerza de atracción

#### Atractor
- `attractorEnabled`: Habilitar/deshabilitar atracción
- `attractorObjects`: IDs de objetos a atraer
- `attractorStrength`: Intensidad del campo de atracción
- `attractorRadius`: Radio de influencia

#### Camino Aleatorio
- `randomPathEnabled`: Habilitar/deshabilitar camino aleatorio
- `randomness`: Cantidad de aleatoriedad en el movimiento
- `pathComplexity`: Cantidad de puntos en la trayectoria
- `movementSpeed`: Velocidad general del movimiento

## Salidas

El PhysicsNode publica las siguientes salidas:

- `positionX`, `positionY`: Posición actual del objeto físico
- `velocityX`, `velocityY`: Velocidad actual del objeto
- `accelerationX`, `accelerationY`: Aceleración actual del objeto

Estas salidas pueden conectarse a nodos de transformación para aplicar los efectos físicos a objetos visuales.

## Integración con NodeTester

El PhysicsNode está completamente integrado con el NodeTester, donde:

- Los valores de posición se aplican directamente como transformaciones CSS
- La caja de preview se mueve según las simulaciones físicas
- La información de posición se muestra en tiempo real
- Se puede combinar con otros nodos (rotación, escala, opacidad)

## Casos de Uso

1. **Animación de caída realista**: Usando el modo Gravedad
2. **Objetos que rebotan**: Usando el modo Rebote
3. **Proyectiles y trayectorias**: Usando el modo Parábola
4. **Interacciones entre objetos**: Usando los modos Colisión y Atractor
5. **Movimientos orgánicos**: Usando el modo Camino Aleatorio
6. **Sistemas de partículas**: Combinando múltiples PhysicsNodes

## Ejemplo de Uso en el Sistema de Nodos

```typescript
// Crear un PhysicsNode con gravedad
const physicsNode = new PhysicsNode({
  id: 'physics_1',
  mode: 'Gravity',
  gravityStrength: 9.8,
  gravityDirection: 'Down',
  positionX: 100,
  positionY: 0,
  outputPosition: true
})

// Los valores de posición pueden conectarse a un TransformNode
// para aplicar las transformaciones físicas a un objeto visual
```

## Notas de Implementación

- El nodo utiliza un bucle de animación con `requestAnimationFrame` para simulaciones en tiempo real
- Se implementa una lógica anti-jitter para reducir fluctuaciones innecesarias
- Se incluye detección de inactividad para prevenir saltos grandes en el cálculo
- El nodo es completamente headless, sin renderizado visual propio
- Se publica un preset de mapeo automático para facilitar la conexión con otros nodos
# CardX: Architecture

## Phase 1: Core Physics and Card State Engine

### Overview
Create a framework-agnostic, DOM-independent core engine that handles card positioning, physics, state transitions, and event management without any platform-specific dependencies.

### Core Primitives

1. **Position Management**
    - Coordinate system for cards (x, y, rotation)
    - Placement algorithms for card stacking
    - Boundary detection and constraints

2. **Physics Engine**
    - Velocity and acceleration calculations
    - Spring physics for animations
    - Decay functions for momentum
    - Threshold calculations for action triggers

3. **State Management**
    - Card states (idle, moving, releasing, exiting, entering)
    - State transition system with middleware pattern
    - History tracking for undo capabilities

4. **Event System**
    - Pub/sub event architecture
    - Lifecycle hooks (beforeSwipe, onSwipe, afterSwipe, etc.)
    - Middleware pattern for event processing

5. **Card Stack Management**
    - Virtual stack handling
    - Z-index calculations
    - Visibility optimization

### Implementation Approach

```typescript
// Pure function core with middleware pattern
function computeCardPosition(
  current: CardState,
  input: Vector,
  options: {
    constraints?: Constraint[],
    middleware?: Middleware[],
    physics?: PhysicsOptions
  } = {}
): CardState {
  // Start with initial state
  let { x, y, rotation } = current;
  
  // Apply physics calculations
  const withPhysics = applyPhysics({ x, y, rotation }, input, options.physics);
  
  // Run middleware in sequence
  const middlewareData = {};
  for (const { name, fn } of options.middleware || []) {
    const result = fn({
      state: withPhysics,
      input,
      middlewareData
    });
    
    // Update state based on middleware results
    withPhysics = { ...withPhysics, ...result.state };
    middlewareData[name] = result.data;
  }
  
  // Apply constraints
  const constrained = applyConstraints(withPhysics, options.constraints || []);
  
  return {
    ...constrained,
    middlewareData
  };
}
```

### Core Middleware Examples

```typescript
// Example middleware functions
const threshold = (options: ThresholdOptions) => ({
  name: 'threshold',
  fn: (data) => {
    const { x, y } = data.state;
    const threshold = options.threshold || 0.5;
    
    // Calculate threshold crossing
    const progress = Math.abs(x) / options.width;
    const hasTriggered = progress > threshold;
    
    return {
      state: data.state,
      data: { progress, hasTriggered }
    };
  }
});

const friction = (options: FrictionOptions) => ({
  name: 'friction',
  fn: (data) => {
    // Apply friction to movement
    const factor = options.factor || 0.9;
    
    return {
      state: {
        x: data.state.x * factor,
        y: data.state.y * factor,
        rotation: data.state.rotation * factor
      },
      data: { factor }
    };
  }
});
```

## Architecture Decisions

1. **Gesture Detection Placement**:
    - Gesture detection will be part of the DOM layer (Phase 2), not the core
    - Core handles abstract movement vectors regardless of input source
    - This maintains platform independence and separation of concerns

2. **State vs Classes**:
    - Use pure functions with state objects rather than classes
    - Promotes immutability and functional composition
    - Simplifies testing and state management

3. **Middleware Pattern**:
    - Adopt middleware pattern from Floating UI
    - Allows for composition and extension
    - Makes features like threshold detection, friction, or spring physics optional

4. **Configuration**:
    - Use default parameter objects with destructuring for configuration
    - Create sensible defaults for all options
    - Allow deep customization through options objects

## Next Steps

- Phase 2: DOM Layer & Framework Adapters
    - Gesture detection implementation (touch/mouse events)
    - DOM-specific positioning
    - Framework-specific hooks/composables

- Phase 3: Queue Management
    - Virtual list implementation
    - Efficient rendering of large card sets
    - Recycling strategies

This architecture provides a solid foundation closely aligned with Floating UI's successful approach while addressing the specific needs of a card swiping interface.
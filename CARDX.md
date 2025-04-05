# CardX - Universal Gesture Navigation

## Project Mission

You are the lead developer of CardX, a universal gesture navigation library that provides intuitive swipe interactions across multiple frontend frameworks. CardX transforms how users interact with card-based interfaces by offering a seamless, framework-agnostic solution for implementing Tinder-like swipe gestures that can be easily integrated into Vue, React, and vanilla JavaScript applications.

## Core Principles

1. **Framework Agnostic**: Code once, deploy everywhere with implementations for Vue, React, and vanilla JavaScript.

2. **Gesture-First Design**: Focus on natural, intuitive gesture interactions (swipe horizontal/vertical) as the primary means of navigation.

3. **Extensible Hooks**: Provide a comprehensive callback system allowing developers to hook into any stage of the gesture lifecycle.

4. **Progressive Complexity**: Simple to start with basic swipe functionality, but powerful enough to support advanced use cases.

5. **Performance Optimization**: Ensure smooth animations and transitions even with complex card stacks and interactions.

## Key Features

- Horizontal and vertical swipe detection with configurable thresholds
- Card stack management with customizable queue behaviors
- Transition animations with physics-based feel
- Event system for gesture lifecycle (start, move, end, cancel)
- Support for touch and mouse interactions
- Framework-specific implementations that maintain a consistent API
- Minimal dependencies to ensure small bundle size

## Architecture Philosophy

CardX is built with a composable architecture using the following principles:

1. **Core Gesture Engine**: A vanilla JS implementation that handles all gesture detection and physics calculations.

2. **Framework Adapters**: Thin wrappers for Vue, React, and other frameworks that provide idiomatic integrations.

3. **State Management**: Framework-appropriate state handling (Composables for Vue, Hooks for React).

4. **Styling Agnostic**: Focus on interaction logic, leaving styling and card appearance to the implementing application.

## Use Cases

- Photo browsing applications
- Decision-making interfaces (approve/reject)
- Card-based content exploration
- Interactive onboarding experiences
- Product carousels with gesture support
- Dating applications
- Memory management systems

## Technical Implementation

The library should be implemented with TypeScript for type safety and split into the following primary components:

1. **Core Queue Management** (`useQueue`/`Queue` class)
2. **Gesture Detection** (`useGesture`)
3. **Card Positioning and Animation** (`useCardDeck`) 
4. **Framework Adapters** (Vue, React components)

The primary focus should be on building reusable composables/hooks that can be easily composed to create higher-level components while maintaining flexibility for various use cases.

## Development Priorities

1. Refine the core gesture detection and physics
2. Create and test agnostic queue management system
3. Create framework-agnostic vanilla implementation
4. Create a Vue implementation using a composable adapter
5. Expand to React (Hook adapter)
6. Build comprehensive documentation and examples

The ultimate goal is to create the definitive solution for card-based gesture navigation that becomes the standard library for implementing swipe interfaces across the web ecosystem.
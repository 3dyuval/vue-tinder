# Upgrade to Vue3 and TypeScript Roadmap


1. diff

`queue-handle.js` has `diff` function which mutates a list.
This is the entry point which gets activated once a list of images are provided.
Solution: convert to a composable that returns a new list,  a queue handle mechanism and a combine it with open-methods.js.

It should also return a ref to a `rewindKeys` list and all of the other reactive data in a single object.




# Jibo Programming Challenge Implementations

This repo contains interpretations of the Jibo 2017 Programming Challenge, each highlighting particular concepts.  Because this is intended as a conversation starter, none of these examples are intended either as production-ready code or as tutorials to learn from.  All examples share the following characteristics:

* Minimal error checking, if present at all
* User input is not sanitized
* Source code is not properly commented
* No sophisticated module loading or dependency management
* No abstractions (i.e. an agnostic scene-graph)
* No proper test coverage
* Functional UX only and no aesthetics or use of widget libraries

Futhermore, the algorithm used in "solving" the checkerboard is the same and is a single-pass algorithm.

## jiboex1
**Status**: Complete

This is a minimal self contained Electron app.  To run on OSX:

1. Open up a command line inside `jiboex1` folder
1. `npm install`
1. `./node_modules/.bin/electron .`

Notes:

* The code is written to encourage the discussion of OOP concepts in JavaScript such as Singletons and Composition vs. Inheritance.


## jiboex2
**Status**: In Progress

This is a minimal self contained Electron app written in TypeScript.  To run on OSX:

1. Open up a command line inside `jiboex2` folder
1. `npm install`
1. `./node_modules/.bin/tsc`
1. `./node_modules/.bin/electron .`

Notes:

* This example is actually an attempt to refactor vanilla JavaScript into TypeScript to encourage a discussion of writing TypeScript as well as pros and cons of using TypeScript.
* It is currently incomplete as I've discovered TypeScript appears to be more opinionated that I originally thought.

## jiboex3
**Status**: Complete

This is an Electron app communicating with a server over a REST API.  To run on OSX:

1. Confirm you have nothing running on port 8080 on your machine.
1. Open up a command line inside `jiboex3` folder
1. `npm install`
1. Start the web server in the background `node server.js &`
1. Confirm server is running by opening up `localhost:8080` in a web browser
1. `./node_modules/.bin/electron .`

Notes:

* This example moves the code to construct the board onto a server instead of inside the Electron app.  The board is serialized as JSON and sent to the Electron app to be rendered in Pixi


## jiboex4
**Status**: Not Started

This was intended to be an example of either Electron or the server in example 3 calling out to C++.

<img src="https://raw.githubusercontent.com/drifting-in-space/y-sweet/main/logo.svg" />

# y-sweet: a Yjs server with persistence and auth

[![GitHub Repo stars](https://img.shields.io/github/stars/drifting-in-space/y-sweet?style=social)](https://github.com/drifting-in-space/y-sweet)
[![Chat on Discord](https://img.shields.io/static/v1?label=chat&message=discord&color=404eed)](https://discord.gg/N5sEpsuhh9)

**y-sweet** is an open-source server for building realtime applications on top of the [Yjs](https://github.com/yjs/yjs) CRDT library.

## Features

- Persists document data to a network filesystem or S3-compatible storage, [inspired by Figma’s infrastructure](https://digest.browsertech.com/archive/browsertech-digest-figma-is-a-file-editor/).
- Scales horizontally with a [session backend](https://driftingin.space/posts/session-lived-application-backends) model.
- Deploys as a native Linux process, or as a WebAssembly module on Cloudflare's edge.
- Provides document-level access control via client tokens.
- Written in Rust with a focus on stability and performance, building on the [blazing fast](https://github.com/dmonad/crdt-benchmarks) [y-crdt](https://github.com/y-crdt/y-crdt/) library.

## y-sweet stack

The y-sweet server can be used by any Yjs app, or you can use our opinionated stack to integrate Yjs and y-sweet into a Next.js app.

- `@y-sweet/sdk`, a TypeScript library for interacting with `y-sweet-server` from your application backend.
- `@y-sweet/react`, a React hooks library for building Yjs applications.
- A debugger for exploring Yjs document and presence state (WIP).

The goal of the y-sweet stack is to give developers the end-to-end developer ergonomics they would expect from a proprietary state-sync platform, **without the lock-in**.

y-sweet is MIT-licensed, and was created by [Drifting in Space](https://driftingin.space).

## Docs

- [API docs](https://docs.y-sweet.dev/index.html)
    - [Vanilla JS client](https://docs.y-sweet.dev/modules/_y_sweet_client.html)
    - [React hooks](https://docs.y-sweet.dev/modules/_y_sweet_react.html)
    - [Document management SDK](https://docs.y-sweet.dev/modules/_y_sweet_sdk.html)
- [Y-Sweet Cloud (managed service) docs](https://y-sweet.cloud/quickstart)

## Packages

### Server

| Package Manager | Name | Version | Path |
| --- | ---- | ---- | ---- |
| npm | `y-sweet` | [![npm](https://img.shields.io/npm/v/y-sweet)](https://www.npmjs.com/package/y-sweet) | `js-pkg/server`
| crates.io | `y-sweet` | [![crates.io](https://img.shields.io/crates/v/y-sweet.svg)](https://crates.io/crates/y-sweet) | `crates/y-sweet` |
| crates.io | `y-sweet-core` | [![crates.io](https://img.shields.io/crates/v/y-sweet-core.svg)](https://crates.io/crates/y-sweet-core) | `crates/y-sweet-core` |

### Client

| Package Manager | Name | Version | Path |
| --- | ---- | ---- | ---- |
| npm | `@y-sweet/sdk` | [![npm](https://img.shields.io/npm/v/@y-sweet/sdk)](https://www.npmjs.com/package/@y-sweet/sdk) | `js-pkg/sdk` |
| npm | `@y-sweet/react` | [![npm](https://img.shields.io/npm/v/@y-sweet/react)](https://www.npmjs.com/package/@y-sweet/react) | `js-pkg/react` |

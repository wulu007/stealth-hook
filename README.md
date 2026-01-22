
# StealthHook

A lightweight JavaScript hook library for intercepting and modifying function behavior in the browser. Designed for stealth modifications with automatic iframe detection and recursive hooking.

[![npm version](https://img.shields.io/npm/v/stealth-hook)](https://www.npmjs.com/package/stealth-hook)
[![MIT license](https://img.shields.io/npm/l/stealth-hook)](https://github.com/wulu007/StealthHook/blob/main/LICENSE)

## Features

- 🎯 **Stealth Hooking** - Modify functions while passing `toString()` checks
- 🔄 **Auto iframe Detection** - Automatically detect and hook functions in iframes
- 🛡️ **Type Safe** - Full TypeScript support

## Installation

### npm

```bash
npm install stealth-hook
```

### pnpm

```bash
pnpm add stealth-hook
```

### In Userscripts

```javascript
// @require      https://unpkg.com/stealth-hook@latest/dist/index.js
// @grant        unsafeWindow
// @run-at       document-start
```

## Usage

### Basic Example

```javascript
import { hookScope } from 'stealth-hook'

hookScope(({ hookMethod }, win) => {
  // Note: use the win parameter
  hookMethod(win.console, 'log', (target, args, thisArg) => {
    console.log('[Hooked]', ...args)
    return target(...args)
  })
}, rootWindow)
```

### Userscript Example

```javascript
// ==UserScript==
// @name         StealthHook Example
// @namespace    https://example.com/
// @version      0.1.0
// @description  Hook Example
// @author       You
// @match        *://*/*
// @require      https://unpkg.com/stealth-hook@latest/dist/index.js
// @grant        unsafeWindow
// @run-at       document-start
// ==/UserScript==

(function () {
  StealthHook.hookScope(({ hookMethod }, win) => {
    // Note: use the win parameter
    hookMethod(win.console, 'log', (target, args, thisArg) => {
      console.log('[Custom Log]', ...args)
      return target(...args)
    })

    hookMethod(win.console, 'table', (target, args, thisArg) => {
      console.log('[Custom Table]', args)
      return target(...args)
    })
  }, unsafeWindow)
})()
```

#### Parameters

| Parameter | Type         | Description                                    |
| --------- | ------------ | ---------------------------------------------- |
| `target`  | Function     | Original function with `this` auto-bound       |
| `args`    | Array        | Arguments array of the original function       |
| `thisArg` | this type    | Current `this` context (caller)                |

## License

MIT © [wulu007](https://github.com/wulu007)

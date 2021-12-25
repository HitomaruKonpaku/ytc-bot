# ytc-bot

## Description

Discord bot to download & relay chat

## Requirements

- [Node 14](https://nodejs.org/)

## Installation

```
npm install
```

```
npm run build
```

## Usage

  1. Clone `.env.example` and rename to `.env`
  2. Clone `config.example.json` and rename to `config.json`
  3. Create `cookies.txt` at main folder or run app with `--cookies <FILE_PATH>` ([How to get cookies](https://chrome.google.com/webstore/detail/get-cookiestxt/bgaddhkoddajcdgocldbbfleckgcbcid))
  4. Start normally or with `pm2`

  ```
  npm start
  ```

  ```
  pm2 start ecosystem.config.js
  ```

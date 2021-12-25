# ytc-bot

## Description

Discord bot to download & relay YouTube live chat

Work with ***members only*** chat but cookies are requried

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
  3. (Optional) Create `cookies.txt` at main folder or run app with `--cookies <FILE_PATH>` ([How to get cookies](https://chrome.google.com/webstore/detail/get-cookiestxt/bgaddhkoddajcdgocldbbfleckgcbcid))
  4. Start normally or with `pm2`

  ```
  npm start
  ```

  ```
  node dist/index
  ```

  ```
  pm2 start ecosystem.config.js
  ```

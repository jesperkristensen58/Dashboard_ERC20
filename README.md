# Ethereum Client Dashboard

How to run:

For the full list of commands see `./package.json`. The main command to fire up the dashboard is:

```bash
> npx next dev
```

Assuming your port `3000` is free it will spin up here: http://localhost:3000.
If not, it will pick the next available port like `3001` etc.

## How to Deploy to Production?

Run the following commands:

```bash
> npx next build
> npx next export
> now
```
Now is Vercel.com and will require you to create and account.

The app is live in Production at: https://dashy-sable.vercel.app/.

## What is shown?

The dashboard shows, with an initia lookback of 20 blocks, for any valid Ethereum ERC20 contract:

+ Plot 1 (left-most): The transfer volume in each block (block number on the x-axis)
+ Plot 2: the basefee in that block per unit of gas.
+ Plot 3: the gas used as percent of the gas limit in the block.

Notice the relation between Plots 2 and 3. The basefee increases as the gas usage increases to discourage filling the blocks. In other words, if the block space runs out, the fee to participate in the block increases automatically via basefee.

## Follow me on Twitter!

[![Twitter URL](https://img.shields.io/twitter/url/https/twitter.com/cryptojesperk.svg?style=social&label=Follow%20%40cryptojesperk)](https://twitter.com/cryptojesperk)

## License
This project uses the following license: [MIT](https://github.com/bisguzar/twitter-scraper/blob/master/LICENSE).

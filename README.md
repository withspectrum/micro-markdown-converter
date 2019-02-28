# `micro-markdown-converter`

A tiny Node.js microservice to convert markdown to raw DraftJS content state and back.

## Deployment

Your own `micro-markdown-converter` is one click away:

[![Deploy to now](https://deploy.now.sh/static/button.svg)](https://deploy.now.sh/?repo=https://github.com/withspectrum/micro-markdown-converter)

You can also deploy with a single command from the terminal (assuming you have [`now`](https://now.sh) installed):

```sh
now withspectrum/micro-markdown-converter
```

## Usage

Ping `/to` with raw DraftJS content state as the body, or `/from` with markdown as the body, and it will be converted to the other.

## Development

```sh
git clone git@github.com:withspectrum/micro-markdown-converter.git
npm run dev
```

The server will then be listening at `localhost:3000`.

## Updating

The `master` branch of this repository is what you will be deploying. To update to a new version with potential bugfixes, all you have to do is run the `now` command again and change the URL you call in your app! 👌

## License

Copyright (c) 2019 Maximilian Stoiber, licensed under the MIT license. See [LICENSE.md](LICENSE.md) for more information.

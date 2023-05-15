# Rif Rollup DApp Nuxt Module

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]

[📖 **Release Notes**](./CHANGELOG.md)

## Setup

1. Add `@matterlabs/zksync-nuxt-core` dependency to your project

```bash
yarn add @matterlabs/zksync-nuxt-core
# or
npm install @matterlabs/zksync-nuxt-core
```

2. Add `@matterlabs/zksync-nuxt-core` to the `buildModules` section of `nuxt.config.js`

#### JS[types](types)
[tailwind.config.js](tailwind.config.js)
[nuxt.config.ts](nuxt.config.ts)
[LICENSE](LICENSE)
[.eslintrc.js](.eslintrc.js)
[index.d.ts](index.d.ts)
[tests](tests)
[.husky](.husky)
[.babelrc](.babelrc)
[plugins](plugins)
[index.js](index.js)
[.prettierrc](.prettierrc)
[store](store)
[utils](utils)
[package.json](package.json)
[.yarnrc.yml](.yarnrc.yml)
[CHANGELOG.md](CHANGELOG.md)
[.github](.github)
[.yarn](.yarn)
[tsconfig.json](tsconfig.json)
[stylelint.config.js](stylelint.config.js)
[jest.config.js](jest.config.js)
[.editorconfig](.editorconfig)
[jsconfig.json](jsconfig.json)

```js
{
    buildModules: [
        [
            "matter-dapp-ui",
            {
                // module options (ref. types/index.ts ModuleOptions)
            },
        ]
    ],
}
```

#### TS

```ts
import { ModuleOptions } from "matter-dapp-ui/types";
{
    buildModules: [
        [
            "matter-dapp-ui",
            <ModuleOptions>{
                // module options (ref. types/index.ts ModuleOptions)
            },
        ]
    ],
}
```

## Development

1. Clone this repository
2. Go to the package and [link](https://classic.yarnpkg.com/en/docs/cli/link/) it with `yarn link`
3. Go to your nuxt project where you want to use the module
4. Install link dependency with `yarn link @matterlabs/zksync-nuxt-core`
5. Import the module into your project as shown [above](#setup)
6. Done ✅

## License

[MIT License](./LICENSE)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/@matterlabs/zksync-nuxt-core/latest.svg
[npm-version-href]: https://npmjs.com/package/@matterlabs/zksync-nuxt-core
[npm-downloads-src]: https://img.shields.io/npm/dm/@matterlabs/zksync-nuxt-core.svg
[npm-downloads-href]: https://npmjs.com/package/@matterlabs/zksync-nuxt-core
[license-src]: https://img.shields.io/npm/l/@matterlabs/zksync-nuxt-core.svg
[license-href]: https://npmjs.com/package/@matterlabs/zksync-nuxt-core

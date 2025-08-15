<a name="1.3.2"></a>
# [1.3.2](https://github.com/ts-stack/chain-error/releases/tag/1.3.2) (2025-08-15)

### Bug fix

| Commit | Type | Description |
| -- | -- | -- |
| [f89b71abac](https://github.com/ts-stack/chain-error/commit/f89b71abac) | fix | init `err.cause` only if it exists. |

<a name="1.3.1"></a>
## [1.3.1](https://github.com/ts-stack/chain-error/releases/tag/1.3.1) (2024-10-18)

### Bug fix

| Commit | Type | Description |
| -- | -- | -- |
| [a62b8a6103](https://github.com/ts-stack/chain-error/commit/a62b8a6103616ea8) | fix | fixed type for `chainErrorOptions.constructorOpt`. |

<a name="1.3.0"></a>
## [1.3.0](https://github.com/ts-stack/chain-error/releases/tag/1.3.0) (2024-09-30)

### Features

- Migration to ESM.

<a name="1.2.0"></a>
## [1.2.0](https://github.com/ts-stack/chain-error/releases/tag/1.2.0) (2020-04-16)

### Features

- Added generic for `ChainError.getInfo<T>()`. Also, the following properties of `ChainError` are made public:
  - `cause`
  - `info`
  - `currentMessage`
  - `skipCauseMessage`

<a name="1.1.0"></a>
## [1.1.0](https://github.com/ts-stack/chain-error/releases/tag/1.1.0) (2020-04-16)

### Features

- Added generic for `ChainError<T>`, by default it `ObjectAny`;

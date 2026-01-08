# vue-cli-plugin-sass-compat

[![npm](https://img.shields.io/badge/npm-not%20published-lightgrey?style=flat-square&logo=npm&logoColor=white)](https://www.npmjs.com/package/vue-cli-plugin-sass-compat)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue?style=flat-square)](./LICENSE)
[![GitHub](https://img.shields.io/badge/GitHub-myltx%2Fvue--cli--plugin--sass--compat-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/myltx/vue-cli-plugin-sass-compat)

用于 Vue CLI（webpack4/5）项目从 `node-sass(libsass)` 迁移到 `sass(dart-sass)` 时的“老写法兼容”插件（自动生效，无需改代码）：

- 将旧写法 `/deep/`、`>>>` 转成 `::v-deep`
- 修复 `calc(100%-16px)` 这类运算符空格问题（dart-sass 更严格）

## 目录

- [为什么会写这个插件](#为什么会写这个插件)
- [适用范围](#适用范围)
- [安装](#安装)
- [迁移检查（可选）](#迁移检查可选)
- [配置（可选）](#配置可选)
- [示例](#示例)
- [工作原理（简述）](#工作原理简述)
- [node-sass 迁移到 sass(dart-sass) 步骤（必做）](#node-sass-迁移到-sassdart-sass-步骤必做)
- [常见问题（速查）](#常见问题速查)
- [发布到 npm（维护者）](#发布到-npm维护者)
- [License](#license)

## 为什么会写这个插件

很多老项目升级 Node / 依赖后，会被迫从 `node-sass(libsass)` 迁移到 `sass(dart-sass)`。但迁移过程中经常会遇到两类“历史遗留写法”：

- 深度选择器：`/deep/`、`>>>` 在新链路里更容易触发语法/选择器解析问题
- `calc()` 运算：`calc(100%-16px)` 这类写法在 dart-sass 下更严格，要求运算符两侧空格

如果项目体量很大，手工全量替换既耗时也容易引入 diff。这个插件的目的就是：在不大改代码的前提下，把迁移过程中最常见的兼容问题自动抹平，让你先把构建跑起来，再逐步做更彻底的样式治理。

## 适用范围

- Vue CLI 3/4/5（webpack4/5）
- 处理你项目内的 `.scss/.sass` 文件（默认跳过 `node_modules`）
- `calc()` 修复目前只处理 `+` / `-` 的二元运算空格

## 安装

在目标项目执行（推荐）：

```bash
npm i -D vue-cli-plugin-sass-compat
```

## 安装（本地 file: 方式）

```bash
npm i -D file:/absolute/path/to/tools/vue-cli-plugin-sass-compat
```

> 使用前请先完成 `node-sass` -> `sass(dart-sass)` 迁移（见下方“迁移步骤”）。

## 迁移检查（可选）

安装插件后，在你运行 `npm run serve/dev/build` 时会自动做一次轻量检查：如果检测到项目里仍存在 `node-sass` 或尚未安装 `sass`，会在控制台给出提示（插件不会在 `npm install` 阶段自动改你的依赖）。

也可以手动执行检查命令：

```bash
vue-cli-service sass-compat:doctor
```

## 配置（可选）

在目标项目 `vue.config.js` 中：

```js
module.exports = {
  pluginOptions: {
    sassCompat: {
      fixDeep: true,
      fixCalc: true
    }
  }
}
```

字段说明（默认都为 `true`）：

- `fixDeep`：是否将 `/deep/`、`>>>` 等旧写法转换为 `::v-deep`；设为 `false` 可禁用该转换
- `fixCalc`：是否修复 `calc(100%-16px)` 等运算符两侧缺少空格的写法；设为 `false` 可禁用该修复

## 示例

### 1) 深度选择器

```scss
.a /deep/ .b {}
.a >>> .b {}
```

会被转换为类似：

```scss
.a ::v-deep .b {}
.a ::v-deep .b {}
```

### 2) calc 运算符空格

```scss
.a { width: calc(100%-16px); }
```

会被转换为：

```scss
.a { width: calc(100% - 16px); }
```

## 工作原理（简述）

作为 Vue CLI Service 插件，通过 `chainWebpack` 在 `sass-loader` 后插入一个轻量 loader，对源码做字符串级别的兼容性替换。

## node-sass 迁移到 sass(dart-sass) 步骤（必做）

本插件只负责“老 SCSS 写法兼容”，不负责替你替换依赖；使用前请先把项目从 `node-sass(libsass)` 迁移到 `sass(dart-sass)`，否则高版本 Node 下通常会卡在 `node-sass` 的原生编译/下载。

1. 移除 `node-sass`

```bash
npm rm node-sass
```

2. 安装 `sass(dart-sass)`

```bash
npm i -D sass
```

3. 确认 `sass-loader` 版本可用

- Vue CLI 3/webpack4 项目通常使用 `sass-loader@7.x`（与本仓库一致）即可。
- 不建议在老项目里盲目升级 `sass-loader` 大版本（可能引入 breaking changes）。

4. 清理并重装（推荐）

```bash
rm -rf node_modules
npm i
```

5. 验证编译

```bash
npm run dev
# 或
npm run build:prod
```

## 常见问题（速查）

| 问题 | 典型报错 | 快速处理 |
| --- | --- | --- |
| [OpenSSL/webpack4（Node 17+）构建失败](#openssl-webpack4) | `ERR_OSSL_EVP_UNSUPPORTED` | `NODE_OPTIONS=--openssl-legacy-provider` |
| [node-gyp / distutils（Python 3.12+）](#python-distutils) | `No module named 'distutils'` | 固定 Python 到 `3.10/3.11` |
| [node-sass 不兼容（高版本 Node）](#node-sass-incompatible) | `node-sass` 安装/编译失败 | 迁移到 `sass(dart-sass)` |
| [Apple Silicon chromedriver 安装失败](#apple-silicon-chromedriver) | `Only Mac 64 bits supported.` | 升级/移除或设为 `optionalDependencies` |

## 常见问题（详情）

<a id="openssl-webpack4"></a>
<details>
<summary><strong>1) Node 17+/18/20 构建报 OpenSSL 错误（webpack4）</strong></summary>

常见报错：

- `Error: error:0308010C:digital envelope routines::unsupported`
- `ERR_OSSL_EVP_UNSUPPORTED`

常见环境：

- Node.js 17+（例如 Node.js v18.12.0）
- Vue CLI 3/4（webpack4）

原因（简述）：

- Node 17+ 使用 OpenSSL 3，webpack4 里某些 hash 算法默认不可用，导致构建时创建 hash 失败

解决：

- 临时兼容（推荐用于老项目快速跑起来）：在 `package.json` 的 `vue-cli-service serve/build` 前加：`NODE_OPTIONS=--openssl-legacy-provider`
  - Windows 建议使用：`cross-env NODE_OPTIONS=--openssl-legacy-provider vue-cli-service serve`
  - 例如：`cross-env NODE_OPTIONS=--openssl-legacy-provider vue-cli-service build`
- 长期方案（更推荐）：升级到 Vue CLI 5 / webpack5，或将 Node 降级到 16.x（与老 webpack4 生态更兼容）
</details>

<a id="python-distutils"></a>
<details>
<summary><strong>2) 安装依赖报 node-gyp / distutils（Python 3.12+）</strong></summary>

常见报错：

- `ModuleNotFoundError: No module named 'distutils'`

原因：

- Python 3.12+ 移除了 `distutils`，而部分 `node-gyp` 依赖仍会引用它（例如项目里有 `deasync` 这类原生模块时）。

解决：

- 固定 Python 到 `3.10.x/3.11.x`（推荐 3.10）
- 示例：
  - `npm config set python "$(mise which python)"`
  - 或一次性：`PYTHON="$(mise which python)" npm i`
- macOS 可能还需要：`xcode-select --install`
</details>

<a id="node-sass-incompatible"></a>
<details>
<summary><strong>3) 安装依赖报 node-sass 不兼容（高版本 Node）</strong></summary>

常见现象：

- `node-sass` 安装失败/编译失败

解决：

- 按上方“node-sass 迁移到 sass(dart-sass) 步骤（必做）”完成迁移。
</details>

<a id="apple-silicon-chromedriver"></a>
<details>
<summary><strong>4) Apple Silicon（M1/M2）chromedriver 安装失败</strong></summary>

常见报错：

- `Only Mac 64 bits supported.`

解决：

- 这通常来自目标项目自身的测试依赖（例如 `chromedriver@79` 等老版本不支持 `darwin arm64`），不是本插件引入的依赖；即使你只是 `npm i -D vue-cli-plugin-sass-compat`，npm 也可能在重建依赖树时触发它的安装脚本而失败
- 建议升级 `chromedriver` 到支持 `darwin arm64` 的版本，并尽量与本机 Chrome 主版本对齐
- 如果业务不依赖 E2E/selenium 测试，可将其移到 `optionalDependencies`，避免阻断正常安装：
  - `"optionalDependencies": { "chromedriver": "..." }`
- 临时绕过（仅救急）：`CHROMEDRIVER_SKIP_DOWNLOAD=1 npm i` 或 `npm i --ignore-scripts`（相关测试能力可能不可用）
</details>

## 发布到 npm（维护者）

在本目录执行：

```bash
npm publish
```

如果包名改成 scope（例如 `@org/vue-cli-plugin-sass-compat`）且需要公开发布：

```bash
npm publish --access public
```

> 插件本身不依赖 Python/node-gyp；如果安装时出现 Python 相关报错，通常来自项目里的原生依赖（如 `deasync`）。

## License

[Apache-2.0](./LICENSE)

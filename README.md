# vue-cli-plugin-sass-compat

[![npm](https://img.shields.io/badge/npm-not%20published-lightgrey?style=flat-square&logo=npm&logoColor=white)](https://www.npmjs.com/package/vue-cli-plugin-sass-compat)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue?style=flat-square)](./LICENSE)
[![GitHub](https://img.shields.io/badge/GitHub-myltx%2Fvue--cli--plugin--sass--compat-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/myltx/vue-cli-plugin-sass-compat)

用于 Vue CLI（webpack4/5）项目从 `node-sass(libsass)` 迁移到 `sass(dart-sass)` 时的“老写法兼容”插件（自动生效，无需改代码）：

- 将旧写法 `/deep/`、`>>>` 转成 `::v-deep`
- 修复 `calc(100%-16px)` 这类运算符空格问题（dart-sass 更严格）

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

## 常见错误与解决方案

### 1) Node 17+/18/20 构建报 OpenSSL 错误（webpack4）

常见报错：

- `Error: error:0308010C:digital envelope routines::unsupported`
- `ERR_OSSL_EVP_UNSUPPORTED`

解决：

- 在 `package.json` 的 `vue-cli-service serve/build` 前加：`NODE_OPTIONS=--openssl-legacy-provider`
- Windows 建议使用：`cross-env NODE_OPTIONS=--openssl-legacy-provider vue-cli-service build`

### 2) 安装依赖报 node-gyp / distutils（Python 3.12+）

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

### 3) 安装依赖报 node-sass 不兼容（高版本 Node）

常见现象：

- `node-sass` 安装失败/编译失败

解决：

- 按上方“node-sass 迁移到 sass(dart-sass) 步骤（必做）”完成迁移。

### 4) Apple Silicon（M1/M2）chromedriver 安装失败

常见报错：

- `Only Mac 64 bits supported.`

解决：

- 这是 `chromedriver@79` 等老版本不支持 `darwin arm64` 导致的
- 建议升级 `chromedriver` 到支持 `darwin arm64` 的版本，并与本机 Chrome 主版本对齐；或将其设为可选依赖避免阻断安装

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

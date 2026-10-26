# Docker 镜像构建与使用

> 目标：一条 `git push` 触发 GitHub Actions，生成 `linux/amd64 + linux/arm64` 双架构 Docker 镜像，预装 11 个通信插件，推送到 `ghcr.io/jingshui127/fuxa` 供其他机器直接拉取。

## 1. 前置准备

- Registry：`ghcr.io/jingshui127/fuxa`
- Token：需 `read:packages` + `write:packages` scope（个人 `gh_...` token）

```bash
docker login ghcr.io
# Username: <github-user>
# Password: <gh_...token>
```

## 2. Dockerfile 结构

见仓库根目录 [Dockerfile](../Dockerfile)。四个 stage：

| Stage | 作用 |
|---|---|
| `client-builder` | 构建 Angular 前端 |
| `server-builder` | 构建 Node server + 下载 ODBC 驱动 |
| `plugins-builder` | **预装 11 个通信插件** |
| `runner` | 精简运行镜像，`COPY --from=plugins-builder` |

`plugins-builder` 关键内容：

```dockerfile
FROM ${NODE_IMAGE} AS plugins-builder
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential python3 pkg-config \
    unixodbc-dev \
    libcairo2-dev libpango1.0-dev \
    libjpeg62-turbo-dev libgif-dev librsvg2-dev libvips-dev \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /plugins_pkg/runtime
WORKDIR /plugins_pkg/runtime
RUN npm init -y >/dev/null && npm install --no-audit --no-fund --omit=dev \
        node-opcua@2.149.0 st-ethernet-ip@2.7.5 omron-ethernet-ip@0.0.2 \
        ads-client@2.1.0 mcprotocol@0.1.2 node-bacnet@0.2.4 \
        nodepccc@0.1.17 redis@5.8.2 odbc@2.4.9 \
        chartjs-node-canvas@3.2.0 node-webcam@0.8.2
```

### 为什么需要这么多系统依赖

`chartjs-node-canvas` 依赖原生 `canvas` 模块。arm64 + node 18 没有预编译二进制，必须源码编译，源码编译依赖 `pangocairo`（对应 `libcairo2-dev` + `libpango1.0-dev`）。

runner stage 也要装对应的运行期动态库（`libcairo2`、`libpango-*`、`libjpeg62-turbo` 等），否则容器启动后加载 `canvas.node` 时会崩。

## 3. 生成流程

### 3.1 修改 Dockerfile 或插件清单

编辑仓库根目录的 `Dockerfile`，在 `plugins-builder` stage 增删 npm 包。

**权威插件清单**：`server/_pkg/runtime/package.json` 的 `dependencies` 字段（即用户已通过 FUXA UI `http://localhost:1882/plugins` 安装过的包）。

### 3.2 提交并推送

```bash
git add Dockerfile
git commit -m "fix(docker): <简述>"
git push origin 1.3.6-2918
```

> 若受网络限制 `git push` 连接重置，可加 `git -c http.lowSpeedLimit=1000 -c http.lowSpeedTime=60 push ...` 重试。

### 3.3 GitHub Actions 自动触发

Push 到 `1.3.6-2918` 会触发 [.github/workflows/docker_image.yml](../.github/workflows/docker_image.yml)：

- 双架构：`platforms: linux/amd64,linux/arm64`
- 使用 `docker/setup-buildx-action` + `docker/setup-qemu-action` 模拟 arm64
- 推送到 `ghcr.io/jingshui127/fuxa`，tag = 版本号 + `latest`

典型耗时：**10–18 分钟**（arm64 需源码编译 `canvas`，是最慢的 stage）。

### 3.4 手动触发（不推代码时）

```bash
gh workflow run docker_image.yml -R jingshui127/FUXA-Tecon -f version=<tag>
```

### 3.5 查看构建状态

```bash
gh run list -R jingshui127/FUXA-Tecon --limit 5
gh run view <run-id> -R jingshui127/FUXA-Tecon
gh run view <run-id> -R jingshui127/FUXA-Tecon --log | grep -E "error|ERR|failed"
```

## 4. 使用镜像

### 4.1 从 GHCR 拉取

```bash
docker pull ghcr.io/jingshui127/fuxa:latest
docker run -d --name fuxa --restart=unless-stopped -p 1881:1881 \
    ghcr.io/jingshui127/fuxa:latest
# 访问 http://localhost:1881
```

### 4.2 指定架构

```bash
docker pull --platform linux/arm64 ghcr.io/jingshui127/fuxa:latest   # ARM 设备（如树莓派）
docker pull --platform linux/amd64 ghcr.io/jingshui127/fuxa:latest   # x86 服务器
```

### 4.3 离线分发（保留用户数据）

GHCR 镜像已内置 11 个通信插件，但用户运行时数据（项目、账号、连接配置）保存在卷里。若需要连数据一起离线分发：

```bash
docker commit <container> ghcr.io/jingshui127/fuxa:<tag>
docker save ghcr.io/jingshui127/fuxa:<tag> -o fuxa-<tag>.tar
# 目标机器：
docker load -i fuxa-<tag>.tar
```

## 5. 常见失败与修复

| 症状 | 根因 | 修复 |
|---|---|---|
| `Package pangocairo was not found` | arm64 编译 canvas 缺 pango/cairo | plugins-builder 装 `libcairo2-dev` + `libpango1.0-dev` |
| `Failed to execute 'node-pre-gyp'` | 缺 build 工具 | 装 `build-essential python3 pkg-config` |
| `Cannot find module 'canvas'` 在容器运行时 | runner 缺动态库 | runner stage 装 `libcairo2 libpango-1.0-0 libpangocairo-1.0-0 libpangoft2-1.0-0 libjpeg62-turbo libgif7 libglib2.0-0` |
| `npm ERR! code 1` 但无具体信息 | 日志被截断 | `gh run view --log` 看完整日志 |
| GHCR push `unauthorized` | token 缺 `write:packages` | 重发带 `read:packages,write:packages` 的 token |

## 6. 变更记录

- `791d1fa8` build(docker): pre-install 11 communication plugins in image — 首次引入 `plugins-builder`
- `b906066e` fix(docker): add canvas/pango build deps and runtime libs — 修复 arm64 `canvas` 编译失败

Run `40293090647`（commit `b906066e`）：✅ 15m55s，双架构推送成功。

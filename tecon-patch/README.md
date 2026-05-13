# FUXA 科控物联定制化补丁包

## 补丁内容

此补丁包包含以下定制化修改：

### 1. Stardust APM 集成
- `server/runtime/stardust.js` - Stardust APM 追踪器实现
- `server/runtime/stardust-middleware.js` - Express 中间件
- `server/main.js` - 集成入口

### 2. 地图源修改
- `client/src/app/maps/maps-view/maps-view.component.ts` - 更换为法国 OpenStreetMap 热区服务器

### 3. S7 通讯插件集成
- `server/package.json` - 添加 node-snap7 依赖

### 4. GitHub Actions 配置
- `.github/workflows/fuxa-single.yml` - 科控物联定制构建配置

### 5. 品牌标识替换
- 需要用户提供：
  - `logo.svg` - 科控物联 Logo
  - `favicon.ico` - 科控物联图标

### 6. FUXA 自动化技能
- `.trae/skills/fuxa-automation/SKILL.md` - FUXA 自动化配置技能

## 使用方法

### Windows 系统
1. 将此补丁包复制到 FUXA 根目录
2. 双击运行 `tecon-patch\apply-patch.bat`
3. 按照提示执行构建命令

### Linux/Mac 系统
1. 将此补丁包复制到 FUXA 根目录
2. 执行 `chmod +x tecon-patch/apply-patch.sh`
3. 运行 `./tecon-patch/apply-patch.sh`
4. 按照提示执行构建命令

## 构建步骤

1. 安装服务端依赖：
   ```bash
   cd ./server
   npm install
   ```

2. 安装前端依赖并构建：
   ```bash
   cd ../client
   npm install
   npx ng build --configuration=production
   ```

3. 运行方式：
   - 开发模式：`cd ./server && npm start`
   - Headless 模式：使用 GitHub Actions 构建的 `FUXA-single-windows-x64.exe`

## 注意事项

1. **S7 插件兼容性**：必须使用 Node 18 环境
2. **Headless 打包**：必须使用 `--public-packages` 参数
3. **构建流程**：推荐使用 GitHub Actions 自动构建
4. **数据存储**：首次运行会自动创建数据目录
5. **Stardust APM**：默认每 60 秒上报一次性能数据

## 星尘控制台访问

- 服务地址：`http://47.113.219.65:6600`
- 应用名称：`fuxaScada`
- 查看性能数据：在星尘控制台的 "追踪" 标签页

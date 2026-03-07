<h1 align="center">
  <img src="./src-tauri/icons/icon.png" alt="悦通" width="128" />
  <br>
  悦通
  <br>
</h1>

<h3 align="center">
基于 <a href="https://github.com/tauri-apps/tauri">Tauri 2</a> 构建的代理客户端，深度集成 <a href="https://github.com/cedar2025/Xboard">XBoard</a> 面板
</h3>

---

## 功能特性

- 基于 Rust + Tauri 2，性能优秀、资源占用低
- 内置 [mihomo (Clash.Meta)](https://github.com/MetaCubeX/mihomo) 内核，支持切换 Alpha 版本
- **原生 XBoard 面板集成**：登录、注册、找回密码、套餐购买、订单管理、公告查看
- 订阅链接自动同步（购买后一键导入）
- 简洁美观的界面，支持自定义主题和 CSS 注入
- 配置文件管理与增强（Merge / Script）
- 系统代理守卫 + TUN 虚拟网卡模式
- 可视化节点和规则编辑
- WebDAV 配置备份与同步
- 支持 Windows / macOS / Linux

## 下载安装

前往 [Releases](https://github.com/onesyue/clash-verge-rev/releases) 页面下载对应平台的安装包：

| 平台 | 文件 |
| :--- | :--- |
| Windows 64位 | `Clash Verge_x.x.x_x64-setup.exe` |
| Windows ARM64 | `Clash Verge_x.x.x_arm64-setup.exe` |
| macOS Apple Silicon | `Clash Verge_x.x.x_aarch64.dmg` |
| Linux (Debian/Ubuntu) | `Clash Verge_x.x.x_amd64.deb` |

## XBoard 面板集成

悦通内置了完整的 XBoard 面板客户端，无需打开浏览器即可完成所有操作：

1. **登录 / 注册**：在账户页面填写面板地址和邮箱密码
2. **套餐购买**：浏览套餐列表，选择周期，填写优惠码，选择支付方式，完成支付
3. **订阅同步**：购买后点击「立即同步」，自动将订阅链接导入代理配置
4. **订单管理**：查看历史订单，对待支付订单进行补款
5. **公告查看**：实时获取服务商公告，新公告有角标提示

## 开发构建

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 生产构建
pnpm build
```

推送 `v*.*.*` 格式的 tag 将自动触发 GitHub Actions 构建并发布 Release。

## 许可证

[GPL-3.0](./LICENSE)

---

> 本项目基于 [clash-verge-rev](https://github.com/clash-verge-rev/clash-verge-rev) 二次开发，感谢上游项目的贡献。

<h1 align="center">
  <img src="./src-tauri/icons/icon.png" alt="YueTong" width="128" />
  <br>
  YueTong
  <br>
</h1>

<h3 align="center">
A proxy client built with <a href="https://github.com/tauri-apps/tauri">Tauri 2</a>, with deep <a href="https://github.com/cedar2025/Xboard">XBoard</a> panel integration
</h3>

---

## Features

- Built with Rust + Tauri 2 for high performance and low resource usage
- Powered by [mihomo (Clash.Meta)](https://github.com/MetaCubeX/mihomo) core, with Alpha version switching support
- **Native XBoard panel integration**: login, register, password recovery, plan purchase, order management, announcements
- Automatic subscription sync (one-click import after purchase)
- Clean and modern UI with custom themes and CSS injection
- Profile management and enhancement (Merge / Script)
- System proxy guard + TUN virtual NIC mode
- Visual node and rule editing
- WebDAV configuration backup and sync
- Supports Windows / macOS / Linux

## Download

Go to the [Releases](https://github.com/onesyue/clash-verge-rev/releases) page to download the installer for your platform:

| Platform              | File                            |
| :-------------------- | :------------------------------ |
| Windows x64           | `YueTong_x.x.x_x64-setup.exe`   |
| Windows ARM64         | `YueTong_x.x.x_arm64-setup.exe` |
| macOS Apple Silicon   | `YueTong_x.x.x_aarch64.dmg`     |
| Linux (Debian/Ubuntu) | `YueTong_x.x.x_amd64.deb`       |

## XBoard Panel Integration

YueTong includes a full XBoard panel client — no browser needed:

1. **Login / Register**: Enter your panel URL, email and password on the Account page
2. **Plan Purchase**: Browse plans, select billing cycle, apply coupon code, choose payment method
3. **Subscription Sync**: After purchase, click "Sync Now" to automatically import the subscription into proxy config
4. **Order Management**: View order history, make payments on pending orders
5. **Announcements**: Real-time provider announcements with badge notifications

## Development

```bash
# Install dependencies
pnpm install

# Development mode
pnpm dev

# Production build
pnpm build
```

Pushing a tag in `v*.*.*` format will automatically trigger GitHub Actions to build and publish a Release.

## License

[GPL-3.0](./LICENSE)

---

> This project is based on [clash-verge-rev](https://github.com/clash-verge-rev/clash-verge-rev). Thanks to the upstream project for their contributions.

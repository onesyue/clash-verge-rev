<h1 align="center">
  <img src="./src-tauri/icons/icon.png" alt="YueTong" width="128" />
  <br>
  YueTong
  <br>
</h1>

<h3 align="center">
A high-performance proxy client built with <a href="https://github.com/tauri-apps/tauri">Tauri 2</a> and powered by <a href="https://github.com/MetaCubeX/mihomo">mihomo</a>, with native <a href="https://github.com/cedar2025/Xboard">XBoard</a> panel integration.
</h3>

<p align="center">
  <a href="https://github.com/onesyue/clash-verge-rev/releases">
    <img src="https://img.shields.io/github/v/release/onesyue/clash-verge-rev?style=flat-square" alt="Release" />
  </a>
  <a href="https://github.com/onesyue/clash-verge-rev/blob/dev/LICENSE">
    <img src="https://img.shields.io/github/license/onesyue/clash-verge-rev?style=flat-square" alt="License" />
  </a>
</p>

---

## Features

- **Rust + Tauri 2** — native performance, low memory footprint, small binary size
- **mihomo (Clash.Meta) core** with Alpha version switching support
- **XBoard panel integration** — login, register, plan purchase, order management, and announcements without leaving the app
- **One-click subscription sync** — automatically imports subscriptions after purchase
- **Modern UI** — sidebar navigation, dark/light themes, custom CSS injection, responsive proxy grid
- **Profile management** — merge, JavaScript scripting, chain enhancement
- **Network modes** — system proxy guard, TUN virtual NIC, rule/global/direct switching
- **WebDAV backup** — sync configurations across devices
- **Cross-platform** — Windows, macOS, and Linux

## Download

Download the latest installer from the [Releases](https://github.com/onesyue/clash-verge-rev/releases) page.

| Platform              | File                            |
| :-------------------- | :------------------------------ |
| Windows x64           | `YueTong_x.x.x_x64-setup.exe`   |
| Windows ARM64         | `YueTong_x.x.x_arm64-setup.exe` |
| macOS (Apple Silicon) | `YueTong_x.x.x_aarch64.dmg`     |
| macOS (Intel)         | `YueTong_x.x.x_x64.dmg`         |
| Linux (deb)           | `YueTong_x.x.x_amd64.deb`       |
| Linux (AppImage)      | `YueTong_x.x.x_amd64.AppImage`  |

## XBoard Panel Integration

YueTong includes a built-in XBoard panel client — no browser needed:

1. **Account** — Sign in or register directly from the Account page
2. **Plans** — Browse available plans, select billing cycle, apply coupon codes
3. **Payment** — Choose a payment method and complete checkout in-app
4. **Subscription Sync** — After purchase, tap "Sync Now" to import the subscription into your proxy configuration
5. **Orders** — View order history, retry pending payments, cancel orders
6. **Notices** — Real-time provider announcements with unread badge

## Development

```bash
# Install dependencies
pnpm install

# Download mihomo core binary
pnpm run prebuild

# Start development server
pnpm dev

# Production build
pnpm build
```

For more details, see [CONTRIBUTING.md](./CONTRIBUTING.md).

## Tech Stack

| Layer      | Technology                                       |
| :--------- | :----------------------------------------------- |
| Frontend   | React 19, TypeScript, MUI v7, Vite               |
| Backend    | Rust, Tauri 2                                    |
| Proxy Core | mihomo (Clash.Meta)                              |
| State      | SWR, Jotai                                       |
| i18n       | react-i18next (English, Chinese, + 10 languages) |

## License

[GPL-3.0](./LICENSE)

---

> Based on [clash-verge-rev](https://github.com/clash-verge-rev/clash-verge-rev). Thanks to the upstream project and all contributors.

<h1 align="center">
  <img src="./src-tauri/icons/icon.png" alt="YueTong" width="128" />
  <br>
  YueTong
  <br>
</h1>

<h3 align="center">
A proxy client for AI & streaming, built with <a href="https://github.com/tauri-apps/tauri">Tauri 2</a> and powered by <a href="https://github.com/MetaCubeX/mihomo">mihomo</a>.
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

- **iOS 26 Liquid Glass UI** — translucent glass cards, blur effects, Apple system colors, dark/light themes
- **VPN Dashboard** — one-tap connect, real-time speed stats, connection timer, speed test
- **XBoard Panel** — login, register, browse plans, purchase, manage orders, and read announcements — all in-app
- **One-click Subscription Sync** — automatically imports proxy configs after login or purchase
- **Proxy Management** — rule/global/direct modes, group selection, latency testing, auto-fit card grid
- **TUN & System Proxy** — TUN virtual NIC mode, system proxy toggle with auto-launch
- **Profile Enhancement** — merge profiles, JavaScript scripting, chain sequencing
- **WebDAV Backup** — sync configurations across devices
- **Cross-platform** — Windows, macOS, and Linux
- **Rust + Tauri 2** — native performance, low memory, small binary

## Download

Grab the latest installer from [Releases](https://github.com/onesyue/clash-verge-rev/releases).

| Platform              | File                            |
| :-------------------- | :------------------------------ |
| Windows x64           | `YueTong_x.x.x_x64-setup.exe`   |
| Windows ARM64         | `YueTong_x.x.x_arm64-setup.exe` |
| macOS (Apple Silicon) | `YueTong_x.x.x_aarch64.dmg`     |
| macOS (Intel)         | `YueTong_x.x.x_x64.dmg`         |
| Linux (deb)           | `YueTong_x.x.x_amd64.deb`       |
| Linux (AppImage)      | `YueTong_x.x.x_amd64.AppImage`  |

## Pages

| Page     | Description                                                             |
| :------- | :---------------------------------------------------------------------- |
| Home     | VPN dashboard — connect button, speed cards, proxy info, expiry warning |
| Proxies  | Node list with group selector, latency test, sorting                    |
| Shop     | Browse plans, apply coupons, checkout with multiple payment methods     |
| Account  | Login / register / forgot password, user info, traffic usage            |
| Orders   | Order history, retry pending payments, cancel orders                    |
| Notices  | Provider announcements with unread badges                               |
| Settings | System proxy, TUN, DNS, theme, port config, backup, updates             |

## Development

```bash
pnpm install            # Install dependencies
pnpm run prebuild       # Download mihomo core binary
pnpm dev                # Start dev server (Tauri + Vite)
pnpm build              # Production build
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for more details.

## Tech Stack

| Layer      | Technology                         |
| :--------- | :--------------------------------- |
| Frontend   | React 19, TypeScript, MUI v7, Vite |
| Backend    | Rust, Tauri 2                      |
| Proxy Core | mihomo (Clash.Meta)                |
| State      | SWR, Zustand                       |
| i18n       | react-i18next (English, Chinese)   |

## License

[GPL-3.0](./LICENSE)

---

> Based on [clash-verge-rev](https://github.com/clash-verge-rev/clash-verge-rev).

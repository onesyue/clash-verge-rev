//! Some config file template

/// template for new a profile item
pub const ITEM_LOCAL: &str = "# Profile Template for 悦通

proxies: []

proxy-groups: []

rules: []
";

/// Default merge template — network tuning optimized for yuetoto (hysteria2/vless/ss2022)
pub const ITEM_MERGE: &str = "# 悦通 默认增强配置
# 针对 yuetoto 机场优化：hysteria2 + VLESS Reality + SS 2022

geodata-mode: true
geox-url:
  geoip: \"https://cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/geoip.dat\"
  geosite: \"https://cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/geosite.dat\"
  mmdb: \"https://cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/country.mmdb\"
  asn: \"https://cdn.jsdelivr.net/gh/xishang0128/geoip@release/GeoLite2-ASN.mmdb\"
geo-auto-update: true
geo-update-interval: 24

mixed-port: 7890
allow-lan: true
bind-address: \"*\"
ipv6: false
log-level: warning

tcp-concurrent: true
unified-delay: true
keep-alive-interval: 15
global-client-fingerprint: chrome
find-process-mode: strict
global-ua: \"clash.meta\"

profile:
  store-selected: true
  store-fake-ip: true

sniffer:
  enable: true
  parse-pure-ip: true
  force-dns-mapping: false
  override-destination: false
  sniff:
    HTTP:
      ports: [80, 8080-8880]
      override-destination: false
    TLS:
      ports: [443, 8443]
      override-destination: false
    QUIC:
      ports: [443, 8443]
      override-destination: false
  skip-domain:
    - \"*.lan\"
    - \"*.local\"
    - \"*.arpa\"
    - \"localhost\"
    - \"localhost.localdomain\"
    - \"router.asus.com\"
    - \"routerlogin.net\"
    - \"captive.apple.com\"
    - \"+.push.apple.com\"
    - \"+.icloud.com\"
    - \"+.apple.com\"
    - \"msftconnecttest.com\"
    - \"www.msftconnecttest.com\"
    - \"+.msftncsi.com\"
    - \"connectivitycheck.gstatic.com\"
    - \"connectivitycheck.android.com\"
    - \"clients3.google.com\"
    - \"clients4.google.com\"
    - \"android.clients.google.com\"
    - \"time.*\"
    - \"ntp.*\"
    - \"+.market.xiaomi.com\"
    - \"localhost.ptlogin2.qq.com\"
    - \"Mijia Cloud\"
    - \"+._dns-sd._udp.*\"
    - \"+._services._dns-sd._udp.*\"

dns:
  enable: true
  listen: \":1053\"
  enhanced-mode: fake-ip
  fake-ip-range: \"198.18.0.1/16\"
  fake-ip-filter-mode: blacklist
  prefer-h3: true
  respect-rules: true
  use-hosts: true
  use-system-hosts: true
  ipv6: false
  fake-ip-filter:
    - \"*.lan\"
    - \"*.local\"
    - \"*.arpa\"
    - \"localhost\"
    - \"localhost.localdomain\"
    - \"router.asus.com\"
    - \"routerlogin.net\"
    - \"captive.apple.com\"
    - \"+.push.apple.com\"
    - \"+.icloud.com\"
    - \"+.apple.com\"
    - \"msftconnecttest.com\"
    - \"www.msftconnecttest.com\"
    - \"+.msftncsi.com\"
    - \"connectivitycheck.gstatic.com\"
    - \"connectivitycheck.android.com\"
    - \"clients3.google.com\"
    - \"clients4.google.com\"
    - \"android.clients.google.com\"
    - \"time.*\"
    - \"ntp.*\"
    - \"+.market.xiaomi.com\"
    - \"localhost.ptlogin2.qq.com\"
    - \"Mijia Cloud\"
    - \"+._dns-sd._udp.*\"
    - \"+._services._dns-sd._udp.*\"

  default-nameserver:
    - 223.5.5.5
    - 119.29.29.29

  nameserver:
    - \"https://doh.pub/dns-query\"
    - \"https://dns.alidns.com/dns-query\"

  direct-nameserver-follow-policy: true
  direct-nameserver:
    - 223.5.5.5
    - 223.6.6.6
    - 119.29.29.29

  proxy-server-nameserver:
    - \"https://dns.alidns.com/dns-query\"
    - \"https://doh.pub/dns-query\"

  fallback:
    - \"https://cloudflare-dns.com/dns-query\"
    - \"https://dns.google/dns-query\"
    - \"https://dns.quad9.net/dns-query\"

  fallback-filter:
    geoip: true
    geoip-code: CN
    ipcidr:
      - \"240.0.0.0/4\"
      - \"0.0.0.0/32\"
      - \"10.0.0.0/8\"
      - \"172.16.0.0/12\"
      - \"192.168.0.0/16\"
      - \"127.0.0.0/8\"
    domain:
      - \"+.google.com\"
      - \"+.gstatic.com\"
      - \"+.googleapis.com\"
      - \"+.ggpht.com\"
      - \"+.youtube.com\"
      - \"+.ytimg.com\"
      - \"+.facebook.com\"
      - \"+.fbcdn.net\"
      - \"+.instagram.com\"
      - \"+.cdninstagram.com\"
      - \"+.twitter.com\"
      - \"+.x.com\"
      - \"+.t.co\"
      - \"+.github.com\"
      - \"+.githubusercontent.com\"
      - \"+.telegram.org\"
      - \"+.telegram.me\"
      - \"+.t.me\"
      - \"+.discord.com\"
      - \"+.discord.gg\"
      - \"+.discordapp.com\"
      - \"+.cloudflare.com\"
      - \"+.wikipedia.org\"
      - \"+.reddit.com\"
      - \"+.openai.com\"
      - \"+.chatgpt.com\"
      - \"+.cdn.openai.com\"
      - \"+.anthropic.com\"
      - \"+.claude.ai\"
      - \"+.linkedin.com\"
      - \"+.licdn.com\"
";

pub const ITEM_MERGE_EMPTY: &str = "# Profile Enhancement Merge Template for 悦通

";

/// enhanced profile
pub const ITEM_SCRIPT: &str = "// Define main function (script entry)

function main(config, profileName) {
  return config;
}
";

/// enhanced profile
pub const ITEM_RULES: &str = "# Profile Enhancement Rules Template for 悦通

prepend: []

append: []

delete: []
";

/// enhanced profile
pub const ITEM_PROXIES: &str = "# Profile Enhancement Proxies Template for 悦通

prepend: []

append: []

delete: []
";

/// enhanced profile
pub const ITEM_GROUPS: &str = "# Profile Enhancement Groups Template for 悦通

prepend: []

append: []

delete: []
";

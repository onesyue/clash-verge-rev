//! 订阅内容格式转换
//!
//! 处理非标准订阅响应（Base64 编码的代理 URI 列表），
//! 将其转换为 mihomo (Clash Meta) 可解析的标准 YAML 配置。
//!
//! 支持的协议：hysteria2, vless, ss (2022), trojan, vmess

use anyhow::{Result, bail};
use base64::{Engine as _, engine::general_purpose};
use serde_yaml_ng::{Mapping, Value};
use tauri::Url;

/// 自动追加 `flag=meta` 查询参数（如果 URL 中尚未包含 `flag`）。
///
/// 许多面板（XBoard / V2Board）根据此参数决定返回 Clash YAML 还是通用 Base64 订阅。
pub fn ensure_meta_flag(url: &mut Url) {
    let has_flag = url.query_pairs().any(|(k, _)| k.eq_ignore_ascii_case("flag"));
    if !has_flag {
        url.query_pairs_mut().append_pair("flag", "meta");
    }
}

/// 尝试将 Base64 编码的代理 URI 列表转换为 Clash YAML 字符串。
///
/// 返回 `Ok(Some(yaml_string))` 表示成功转换；
/// 返回 `Ok(None)` 表示内容不是 Base64 编码的代理列表；
/// 返回 `Err(_)` 表示检测到 Base64 但解码/转换失败。
pub fn try_decode_subscription(data: &str) -> Result<Option<std::string::String>> {
    let trimmed = data.trim();

    // 如果已经是 YAML（包含常见 Clash 配置键），直接返回
    if looks_like_yaml(trimmed) {
        return Ok(None);
    }

    // 尝试 Base64 解码
    let decoded = match general_purpose::STANDARD.decode(trimmed) {
        Ok(d) => d,
        Err(_) => {
            // 尝试 URL-safe Base64
            match general_purpose::URL_SAFE_NO_PAD.decode(trimmed) {
                Ok(d) => d,
                Err(_) => return Ok(None), // 不是 Base64
            }
        }
    };

    let decoded_str = match std::string::String::from_utf8(decoded) {
        Ok(s) => s,
        Err(_) => return Ok(None), // 解码后不是有效 UTF-8
    };

    // 检查解码后是否是 YAML
    if looks_like_yaml(&decoded_str) {
        return Ok(Some(decoded_str));
    }

    // 检查是否包含代理 URI（每行一个）
    let lines: Vec<&str> = decoded_str
        .lines()
        .map(|l| l.trim())
        .filter(|l| !l.is_empty())
        .collect();

    if lines.is_empty() {
        return Ok(None);
    }

    // 检查是否有已知协议前缀
    let has_proxy_uris = lines.iter().any(|l| is_proxy_uri(l));

    if !has_proxy_uris {
        return Ok(None);
    }

    // 转换代理 URI 列表为 Clash YAML
    convert_uris_to_yaml(&lines)
}

fn looks_like_yaml(data: &str) -> bool {
    let first_lines: Vec<&str> = data.lines().take(10).collect();
    first_lines.iter().any(|l| {
        let l = l.trim();
        l.starts_with("proxies:")
            || l.starts_with("proxy-providers:")
            || l.starts_with("proxy-groups:")
            || l.starts_with("rules:")
            || l.starts_with("port:")
            || l.starts_with("mixed-port:")
    })
}

fn is_proxy_uri(line: &str) -> bool {
    line.starts_with("hysteria2://")
        || line.starts_with("hy2://")
        || line.starts_with("vless://")
        || line.starts_with("ss://")
        || line.starts_with("trojan://")
        || line.starts_with("vmess://")
}

fn convert_uris_to_yaml(lines: &[&str]) -> Result<Option<std::string::String>> {
    let mut proxies: Vec<Value> = Vec::new();

    for line in lines {
        let line = line.trim();
        if line.is_empty() {
            continue;
        }
        match parse_proxy_uri(line) {
            Ok(Some(proxy)) => proxies.push(Value::Mapping(proxy)),
            Ok(None) => {}
            Err(e) => {
                log::warn!("解析代理 URI 失败: {line} - {e}");
            }
        }
    }

    if proxies.is_empty() {
        bail!("没有成功解析任何代理节点");
    }

    let mut root = Mapping::new();
    root.insert(Value::String("proxies".into()), Value::Sequence(proxies));

    let yaml = serde_yaml_ng::to_string(&root)?;
    Ok(Some(yaml))
}

fn parse_proxy_uri(uri: &str) -> Result<Option<Mapping>> {
    if uri.starts_with("hysteria2://") || uri.starts_with("hy2://") {
        parse_hysteria2(uri).map(Some)
    } else if uri.starts_with("vless://") {
        parse_vless(uri).map(Some)
    } else if uri.starts_with("ss://") {
        parse_shadowsocks(uri).map(Some)
    } else if uri.starts_with("trojan://") {
        parse_trojan(uri).map(Some)
    } else if uri.starts_with("vmess://") {
        parse_vmess(uri).map(Some)
    } else {
        Ok(None)
    }
}

// ────────────────────────────────────────────────────────────────
// Hysteria2
// Format: hysteria2://auth@host:port?key=val#name
// ────────────────────────────────────────────────────────────────
fn parse_hysteria2(uri: &str) -> Result<Mapping> {
    let url = Url::parse(uri)?;
    let name = url_fragment_or_host(&url);
    let password = url.username().to_string();
    let host = url.host_str().unwrap_or_default().to_string();
    let port = url.port().unwrap_or(443);

    let mut m = Mapping::new();
    m.insert(y("name"), Value::String(name));
    m.insert(y("type"), Value::String("hysteria2".into()));
    m.insert(y("server"), Value::String(host));
    m.insert(y("port"), Value::Number(port.into()));
    m.insert(y("password"), Value::String(password));

    let params = query_params(&url);
    if let Some(sni) = params.get("sni") {
        m.insert(y("sni"), Value::String(sni.clone()));
    }
    if let Some(obfs) = params.get("obfs") {
        m.insert(y("obfs"), Value::String(obfs.clone()));
        if let Some(obfs_pw) = params.get("obfs-password") {
            m.insert(y("obfs-password"), Value::String(obfs_pw.clone()));
        }
    }
    if params.get("insecure").is_some_and(|v| v == "1" || v == "true") {
        m.insert(y("skip-cert-verify"), Value::Bool(true));
    }
    if let Some(alpn) = params.get("alpn") {
        let alpn_list: Vec<Value> = alpn.split(',').map(|s| Value::String(s.to_string())).collect();
        m.insert(y("alpn"), Value::Sequence(alpn_list));
    }

    Ok(m)
}

// ────────────────────────────────────────────────────────────────
// VLESS (with XTLS-Reality support)
// Format: vless://uuid@host:port?type=tcp&security=reality&...#name
// ────────────────────────────────────────────────────────────────
fn parse_vless(uri: &str) -> Result<Mapping> {
    let url = Url::parse(uri)?;
    let name = url_fragment_or_host(&url);
    let uuid = url.username().to_string();
    let host = url.host_str().unwrap_or_default().to_string();
    let port = url.port().unwrap_or(443);

    let mut m = Mapping::new();
    m.insert(y("name"), Value::String(name));
    m.insert(y("type"), Value::String("vless".into()));
    m.insert(y("server"), Value::String(host));
    m.insert(y("port"), Value::Number(port.into()));
    m.insert(y("uuid"), Value::String(uuid));

    let params = query_params(&url);

    // network / transport
    let network = params.get("type").cloned().unwrap_or_else(|| "tcp".into());
    m.insert(y("network"), Value::String(network.clone()));

    // flow (xtls-rprx-vision etc)
    if let Some(flow) = params.get("flow") {
        m.insert(y("flow"), Value::String(flow.clone()));
    }

    // security
    let security = params.get("security").cloned().unwrap_or_default();
    if security == "reality" {
        let mut reality = Mapping::new();
        if let Some(pbk) = params.get("pbk") {
            reality.insert(y("public-key"), Value::String(pbk.clone()));
        }
        if let Some(sid) = params.get("sid") {
            reality.insert(y("short-id"), Value::String(sid.clone()));
        }
        m.insert(y("reality-opts"), Value::Mapping(reality));
        m.insert(y("tls"), Value::Bool(true));
        m.insert(
            y("client-fingerprint"),
            Value::String(params.get("fp").cloned().unwrap_or_else(|| "chrome".into())),
        );
        if let Some(sni) = params.get("sni") {
            m.insert(y("servername"), Value::String(sni.clone()));
        }
    } else if security == "tls" {
        m.insert(y("tls"), Value::Bool(true));
        if let Some(sni) = params.get("sni") {
            m.insert(y("servername"), Value::String(sni.clone()));
        }
        if let Some(alpn) = params.get("alpn") {
            let alpn_list: Vec<Value> = alpn.split(',').map(|s| Value::String(s.to_string())).collect();
            m.insert(y("alpn"), Value::Sequence(alpn_list));
        }
        if let Some(fp) = params.get("fp") {
            m.insert(y("client-fingerprint"), Value::String(fp.clone()));
        }
    }

    // transport options
    match network.as_str() {
        "ws" => {
            let mut ws = Mapping::new();
            if let Some(path) = params.get("path") {
                ws.insert(y("path"), Value::String(path.clone()));
            }
            if let Some(host_header) = params.get("host") {
                let mut headers = Mapping::new();
                headers.insert(y("Host"), Value::String(host_header.clone()));
                ws.insert(y("headers"), Value::Mapping(headers));
            }
            if !ws.is_empty() {
                m.insert(y("ws-opts"), Value::Mapping(ws));
            }
        }
        "grpc" => {
            let mut grpc = Mapping::new();
            if let Some(sn) = params.get("serviceName") {
                grpc.insert(y("grpc-service-name"), Value::String(sn.clone()));
            }
            if !grpc.is_empty() {
                m.insert(y("grpc-opts"), Value::Mapping(grpc));
            }
        }
        "h2" => {
            let mut h2 = Mapping::new();
            if let Some(path) = params.get("path") {
                h2.insert(y("path"), Value::String(path.clone()));
            }
            if let Some(host_header) = params.get("host") {
                h2.insert(y("host"), Value::Sequence(vec![Value::String(host_header.clone())]));
            }
            if !h2.is_empty() {
                m.insert(y("h2-opts"), Value::Mapping(h2));
            }
        }
        _ => {}
    }

    Ok(m)
}

// ────────────────────────────────────────────────────────────────
// Shadowsocks (including 2022-blake3)
// Format: ss://method:password@host:port#name
//    OR   ss://BASE64(method:password)@host:port#name
// ────────────────────────────────────────────────────────────────
fn parse_shadowsocks(uri: &str) -> Result<Mapping> {
    let url_str = &uri[5..]; // strip "ss://"

    // 有两种格式: 1) base64(method:pass)@host:port 2) method:pass@host:port
    let (method, password, host, port, name) = if let Some(at_pos) = url_str.rfind('@') {
        let user_info = &url_str[..at_pos];
        let server_part = &url_str[at_pos + 1..];

        // 尝试解码 userinfo 部分
        let decoded_info = try_base64_decode(user_info).unwrap_or_else(|| percent_decode(user_info));

        let (method, password) = decoded_info.split_once(':').unwrap_or(("", &decoded_info));

        // 解析 host:port#name
        let (host_port, name) = server_part.split_once('#').unwrap_or((server_part, ""));
        let name = percent_decode(name);

        let (host, port) = parse_host_port(host_port)?;
        (method.to_string(), password.to_string(), host, port, name)
    } else {
        // 整个都是 base64 编码
        let (main, name) = url_str.split_once('#').unwrap_or((url_str, ""));
        let name = percent_decode(name);
        let decoded = try_base64_decode(main).ok_or_else(|| anyhow::anyhow!("无法解码 SS URI"))?;

        let (method_pass, host_port) = decoded
            .rsplit_once('@')
            .ok_or_else(|| anyhow::anyhow!("SS URI 格式错误"))?;
        let (method, password) = method_pass.split_once(':').unwrap_or(("", method_pass));
        let (host, port) = parse_host_port(host_port)?;
        (method.to_string(), password.to_string(), host, port, name)
    };

    let display_name = if name.is_empty() {
        format!("{host}:{port}")
    } else {
        name
    };

    let mut m = Mapping::new();
    m.insert(y("name"), Value::String(display_name));
    m.insert(y("type"), Value::String("ss".into()));
    m.insert(y("server"), Value::String(host));
    m.insert(y("port"), Value::Number(port.into()));
    m.insert(y("cipher"), Value::String(method));
    m.insert(y("password"), Value::String(password));
    m.insert(y("udp"), Value::Bool(true));

    Ok(m)
}

// ────────────────────────────────────────────────────────────────
// Trojan
// Format: trojan://password@host:port?key=val#name
// ────────────────────────────────────────────────────────────────
fn parse_trojan(uri: &str) -> Result<Mapping> {
    let url = Url::parse(uri)?;
    let name = url_fragment_or_host(&url);
    let password = url.username().to_string();
    let host = url.host_str().unwrap_or_default().to_string();
    let port = url.port().unwrap_or(443);

    let mut m = Mapping::new();
    m.insert(y("name"), Value::String(name));
    m.insert(y("type"), Value::String("trojan".into()));
    m.insert(y("server"), Value::String(host));
    m.insert(y("port"), Value::Number(port.into()));
    m.insert(y("password"), Value::String(password));

    let params = query_params(&url);
    if let Some(sni) = params.get("sni") {
        m.insert(y("sni"), Value::String(sni.clone()));
    }
    if params.get("allowInsecure").is_some_and(|v| v == "1" || v == "true") {
        m.insert(y("skip-cert-verify"), Value::Bool(true));
    }

    let network = params.get("type").cloned().unwrap_or_else(|| "tcp".into());
    if network == "ws" {
        m.insert(y("network"), Value::String("ws".into()));
        let mut ws = Mapping::new();
        if let Some(path) = params.get("path") {
            ws.insert(y("path"), Value::String(path.clone()));
        }
        if let Some(h) = params.get("host") {
            let mut headers = Mapping::new();
            headers.insert(y("Host"), Value::String(h.clone()));
            ws.insert(y("headers"), Value::Mapping(headers));
        }
        if !ws.is_empty() {
            m.insert(y("ws-opts"), Value::Mapping(ws));
        }
    } else if network == "grpc" {
        m.insert(y("network"), Value::String("grpc".into()));
        let mut grpc = Mapping::new();
        if let Some(sn) = params.get("serviceName") {
            grpc.insert(y("grpc-service-name"), Value::String(sn.clone()));
        }
        if !grpc.is_empty() {
            m.insert(y("grpc-opts"), Value::Mapping(grpc));
        }
    }

    if let Some(fp) = params.get("fp") {
        m.insert(y("client-fingerprint"), Value::String(fp.clone()));
    }

    Ok(m)
}

// ────────────────────────────────────────────────────────────────
// VMess
// Format: vmess://BASE64_JSON
// JSON: {"v":"2","ps":"name","add":"host","port":443,"id":"uuid",...}
// ────────────────────────────────────────────────────────────────
fn parse_vmess(uri: &str) -> Result<Mapping> {
    let encoded = &uri[8..]; // strip "vmess://"
    let decoded = try_base64_decode(encoded).ok_or_else(|| anyhow::anyhow!("无法解码 VMess Base64"))?;
    let json: serde_json::Value = serde_json::from_str(&decoded)?;

    let name = json_str(&json, "ps")
        .or_else(|| json_str(&json, "remarks"))
        .unwrap_or_else(|| "vmess".into());
    let host = json_str(&json, "add").unwrap_or_default();
    let port = json_num(&json, "port").unwrap_or(443);
    let uuid = json_str(&json, "id").unwrap_or_default();
    let alter_id = json_num(&json, "aid").unwrap_or(0);

    let mut m = Mapping::new();
    m.insert(y("name"), Value::String(name));
    m.insert(y("type"), Value::String("vmess".into()));
    m.insert(y("server"), Value::String(host));
    m.insert(y("port"), Value::Number(port.into()));
    m.insert(y("uuid"), Value::String(uuid));
    m.insert(y("alterId"), Value::Number(alter_id.into()));
    m.insert(
        y("cipher"),
        Value::String(json_str(&json, "scy").unwrap_or_else(|| "auto".into())),
    );

    let tls = json_str(&json, "tls").unwrap_or_default();
    if tls == "tls" {
        m.insert(y("tls"), Value::Bool(true));
        if let Some(sni) = json_str(&json, "sni") {
            m.insert(y("servername"), Value::String(sni));
        }
    }

    let net = json_str(&json, "net").unwrap_or_else(|| "tcp".into());
    m.insert(y("network"), Value::String(net.clone()));

    match net.as_str() {
        "ws" => {
            let mut ws = Mapping::new();
            if let Some(path) = json_str(&json, "path") {
                ws.insert(y("path"), Value::String(path));
            }
            if let Some(h) = json_str(&json, "host") {
                let mut headers = Mapping::new();
                headers.insert(y("Host"), Value::String(h));
                ws.insert(y("headers"), Value::Mapping(headers));
            }
            if !ws.is_empty() {
                m.insert(y("ws-opts"), Value::Mapping(ws));
            }
        }
        "grpc" => {
            let mut grpc = Mapping::new();
            if let Some(path) = json_str(&json, "path") {
                grpc.insert(y("grpc-service-name"), Value::String(path));
            }
            if !grpc.is_empty() {
                m.insert(y("grpc-opts"), Value::Mapping(grpc));
            }
        }
        "h2" => {
            let mut h2 = Mapping::new();
            if let Some(path) = json_str(&json, "path") {
                h2.insert(y("path"), Value::String(path));
            }
            if let Some(h) = json_str(&json, "host") {
                h2.insert(y("host"), Value::Sequence(vec![Value::String(h)]));
            }
            if !h2.is_empty() {
                m.insert(y("h2-opts"), Value::Mapping(h2));
            }
        }
        _ => {}
    }

    if let Some(fp) = json_str(&json, "fp") {
        m.insert(y("client-fingerprint"), Value::String(fp));
    }

    Ok(m)
}

// ────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────

fn y(s: &str) -> Value {
    Value::String(s.into())
}

fn url_fragment_or_host(url: &Url) -> std::string::String {
    let fragment = url.fragment().unwrap_or_default();
    let decoded = percent_decode(fragment);
    if decoded.is_empty() {
        format!("{}:{}", url.host_str().unwrap_or("unknown"), url.port().unwrap_or(0))
    } else {
        decoded
    }
}

fn query_params(url: &Url) -> std::collections::HashMap<std::string::String, std::string::String> {
    url.query_pairs()
        .map(|(k, v)| (k.into_owned(), v.into_owned()))
        .collect()
}

fn percent_decode(s: &str) -> std::string::String {
    percent_encoding::percent_decode_str(s).decode_utf8_lossy().into_owned()
}

fn try_base64_decode(s: &str) -> Option<std::string::String> {
    // 先去掉可能的填充问题
    let s = s.trim();
    general_purpose::STANDARD
        .decode(s)
        .or_else(|_| general_purpose::URL_SAFE.decode(s))
        .or_else(|_| general_purpose::URL_SAFE_NO_PAD.decode(s))
        .or_else(|_| general_purpose::STANDARD_NO_PAD.decode(s))
        .ok()
        .and_then(|bytes| std::string::String::from_utf8(bytes).ok())
}

fn parse_host_port(s: &str) -> Result<(std::string::String, u16)> {
    // 处理 IPv6: [::1]:443
    if let Some(stripped) = s.strip_prefix('[') {
        let (host, rest) = stripped
            .split_once(']')
            .ok_or_else(|| anyhow::anyhow!("无效的 IPv6 地址"))?;
        let port = rest.strip_prefix(':').and_then(|p| p.parse().ok()).unwrap_or(443);
        Ok((host.to_string(), port))
    } else if let Some((host, port)) = s.rsplit_once(':') {
        let port = port.parse().unwrap_or(443);
        Ok((host.to_string(), port))
    } else {
        Ok((s.to_string(), 443))
    }
}

fn json_str(json: &serde_json::Value, key: &str) -> Option<std::string::String> {
    json.get(key).and_then(|v| match v {
        serde_json::Value::String(s) => Some(s.clone()),
        serde_json::Value::Number(n) => Some(n.to_string()),
        _ => None,
    })
}

fn json_num(json: &serde_json::Value, key: &str) -> Option<u64> {
    json.get(key).and_then(|v| match v {
        serde_json::Value::Number(n) => n.as_u64(),
        serde_json::Value::String(s) => s.parse().ok(),
        _ => None,
    })
}

#[cfg(test)]
#[allow(clippy::unwrap_used, clippy::expect_used)]
mod tests {
    use super::*;

    #[test]
    fn test_ensure_meta_flag() {
        let mut url = Url::parse("https://example.com/api/v2/sub?token=abc").unwrap();
        ensure_meta_flag(&mut url);
        assert!(url.as_str().contains("flag=meta"));

        // 已有 flag 不重复添加
        let mut url2 = Url::parse("https://example.com/api?flag=clash").unwrap();
        ensure_meta_flag(&mut url2);
        assert!(!url2.as_str().contains("flag=meta"));
    }

    #[test]
    fn test_base64_subscription_detection() {
        let yaml = "proxies:\n  - name: test\n    type: ss";
        assert!(try_decode_subscription(yaml).unwrap().is_none());
    }

    #[test]
    fn test_parse_hysteria2() {
        let uri = "hysteria2://letmein@example.com:443?sni=example.com#MyNode";
        let m = parse_hysteria2(uri).unwrap();
        assert_eq!(m.get(y("type")).unwrap(), &Value::String("hysteria2".into()));
        assert_eq!(m.get(y("password")).unwrap(), &Value::String("letmein".into()));
        assert_eq!(m.get(y("name")).unwrap(), &Value::String("MyNode".into()));
    }

    #[test]
    fn test_parse_vless_reality() {
        let uri = "vless://uuid-here@1.2.3.4:443?type=tcp&security=reality&pbk=pubkey123&sid=ab&fp=chrome&sni=www.example.com&flow=xtls-rprx-vision#VlessNode";
        let m = parse_vless(uri).unwrap();
        assert_eq!(m.get(y("type")).unwrap(), &Value::String("vless".into()));
        assert_eq!(m.get(y("uuid")).unwrap(), &Value::String("uuid-here".into()));
        assert!(m.contains_key(y("reality-opts")));
    }

    #[test]
    fn test_parse_ss_2022() {
        let uri = "ss://2022-blake3-aes-256-gcm:base64pass@1.2.3.4:8388#SSNode";
        let m = parse_shadowsocks(uri).unwrap();
        assert_eq!(m.get(y("type")).unwrap(), &Value::String("ss".into()));
        assert_eq!(
            m.get(y("cipher")).unwrap(),
            &Value::String("2022-blake3-aes-256-gcm".into())
        );
    }

    #[test]
    fn test_parse_vmess() {
        let json = serde_json::json!({
            "v": "2", "ps": "TestVmess", "add": "1.2.3.4",
            "port": 443, "id": "uuid-test", "aid": 0,
            "net": "ws", "type": "none", "tls": "tls",
            "path": "/ws", "host": "example.com"
        });
        let encoded = general_purpose::STANDARD.encode(json.to_string());
        let uri = format!("vmess://{encoded}");
        let m = parse_vmess(&uri).unwrap();
        assert_eq!(m.get(y("type")).unwrap(), &Value::String("vmess".into()));
        assert_eq!(m.get(y("name")).unwrap(), &Value::String("TestVmess".into()));
    }

    #[test]
    fn test_base64_uris_conversion() {
        let uris = "ss://2022-blake3-aes-256-gcm:pass@1.2.3.4:8388#Node1\nhysteria2://pw@5.6.7.8:443#Node2";
        let encoded = general_purpose::STANDARD.encode(uris);
        let result = try_decode_subscription(&encoded).unwrap();
        assert!(result.is_some());
        let yaml = result.unwrap();
        assert!(yaml.contains("proxies"));
    }
}

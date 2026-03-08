#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
fn main() {
    // Capture panics to a crash log file so silent crashes on Windows are diagnosable
    std::panic::set_hook(Box::new(|info| {
        let payload = if let Some(s) = info.payload().downcast_ref::<&str>() {
            s.to_string()
        } else if let Some(s) = info.payload().downcast_ref::<String>() {
            s.clone()
        } else {
            "unknown panic".to_string()
        };
        let location = info
            .location()
            .map(|l| format!("{}:{}:{}", l.file(), l.line(), l.column()))
            .unwrap_or_else(|| "unknown location".to_string());
        let backtrace = std::backtrace::Backtrace::force_capture();
        let crash_msg = format!(
            "PANIC at {}\n{}\n\nBacktrace:\n{}",
            location, payload, backtrace
        );

        // Write crash log next to the executable
        if let Ok(exe) = std::env::current_exe() {
            if let Some(dir) = exe.parent() {
                let crash_path = dir.join("crash.log");
                let _ = std::fs::write(&crash_path, &crash_msg);
            }
        }

        // On Windows, also show a message box
        #[cfg(target_os = "windows")]
        {
            use windows::core::HSTRING;
            use windows::Win32::UI::WindowsAndMessaging::{MB_ICONERROR, MessageBoxW};
            let msg = HSTRING::from(format!(
                "YueTong crashed unexpectedly.\n\n{}\nat {}\n\nA crash log has been saved next to the executable.",
                payload, location
            ));
            let title = HSTRING::from("YueTong Crash");
            unsafe {
                MessageBoxW(None, &msg, &title, MB_ICONERROR);
            }
        }
    }));

    #[cfg(feature = "tokio-trace")]
    console_subscriber::init();

    app_lib::run();
}

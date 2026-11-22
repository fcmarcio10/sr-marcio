// BR Night Drive — janela do jogo no computador. Roda 100% offline.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;

#[tauri::command]
fn quit_game(app: tauri::AppHandle) {
    app.exit(0);
}

#[tauri::command]
fn toggle_fullscreen(window: tauri::WebviewWindow) {
    let full = window.is_fullscreen().unwrap_or(false);
    let _ = window.set_fullscreen(!full);
}

// abre o Instagram do criador no navegador do computador (só esse endereço é aceito)
#[tauri::command]
fn abrir_link(url: String) {
    if !url.starts_with("https://www.instagram.com/") {
        return;
    }
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        let _ = std::process::Command::new("explorer")
            .arg(&url)
            .creation_flags(0x0800_0000)
            .spawn();
    }
    #[cfg(not(windows))]
    {
        let _ = std::process::Command::new("xdg-open").arg(&url).spawn();
    }
}

// deixa a pasta de dados do jogo (salvamentos e configurações) escondida
fn esconde_pasta(app: &tauri::AppHandle) {
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        for dir in [app.path().app_local_data_dir(), app.path().app_data_dir()] {
            if let Ok(d) = dir {
                let _ = std::fs::create_dir_all(&d);
                let _ = std::process::Command::new("attrib")
                    .args(["+h", "+s"])
                    .arg(&d)
                    .creation_flags(0x0800_0000)
                    .spawn();
            }
        }
    }
    #[cfg(not(windows))]
    {
        let _ = app;
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![quit_game, toggle_fullscreen, abrir_link])
        .setup(|app| {
            esconde_pasta(app.handle());
            if let Some(w) = app.get_webview_window("main") {
                let _ = w.set_focus();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("erro ao abrir o jogo");
}

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

#[tauri::command]
fn open_link(url: String) {
    if !url.starts_with("https://") { return; }
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        let _ = std::process::Command::new("cmd").args(["/C", "start", "", &url]).creation_flags(0x08000000).spawn();
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![quit_game, toggle_fullscreen, open_link])
        .setup(|app| {
            if let Some(w) = app.get_webview_window("main") {
                let _ = w.set_focus();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("erro ao abrir o jogo");
}

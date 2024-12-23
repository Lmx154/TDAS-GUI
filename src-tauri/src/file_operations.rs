//here we will make functions to write and read files

use std::fs::File;
use std::path::Path;

#[tauri::command]
pub fn create_text_file(file_name: &str) -> Result<(), String> {
    // Use relative path to the data directory
    let test_dir = "./data";
    
    // Create full path by combining directory and filename
    let file_path = Path::new(test_dir).join(file_name);
    
    // Create the test directory if it doesn't exist
    std::fs::create_dir_all(test_dir).map_err(|e| e.to_string())?;
    
    // Create the file
    File::create(file_path).map_err(|e| e.to_string())?;
    
    Ok(())
}
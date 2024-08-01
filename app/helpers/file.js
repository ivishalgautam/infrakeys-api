import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

export const deleteFile = async (file_path) => {
  try {
    if (!file_path) {
      throw Error("file_path not found!");
    }

    const currentFilePath = fileURLToPath(import.meta.url);
    const currentDirPath = dirname(currentFilePath);
    const publicPath = path.join(currentDirPath, "../../", file_path);

    if (fs.existsSync(publicPath)) {
      fs.unlinkSync(publicPath);
    } else {
      throw Error("File not found!");
    }
  } catch (error) {
    console.error(error);
    throw Error(error.message ?? "Error deleting file!");
  }
};

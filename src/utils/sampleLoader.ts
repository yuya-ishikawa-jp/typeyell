import { Task } from "../types";

interface ManifestItem {
  id: string | number;
  title: string;
  file: string;
}

export async function fetchSampleTasks(): Promise<Task[]> {
  try {
    const manifestRes = await fetch("/text-samples/index.json");
    if (!manifestRes.ok) {
      throw new Error(`Failed to load index.json: ${manifestRes.status}`);
    }
    const manifestList: ManifestItem[] = await manifestRes.json();

    const tasks: Task[] = await Promise.all(
      manifestList.map(async (item) => {
        try {
          const fileRes = await fetch(item.file);
          if (!fileRes.ok) throw new Error(`HTTP error ${fileRes.status}`);

          let text = await fileRes.text();

          // UTF-8 BOM の除去
          if (text.charCodeAt(0) === 0xfeff) {
            text = text.slice(1);
          }

          // SPA フォールバック (HTML応答) が返ってきた場合のガード
          const trimmed = text.trim();
          if (trimmed.startsWith("<!") || trimmed.startsWith("<html")) {
            console.warn(
              `File ${item.file} returned HTML fallback instead of text file.`
            );
            return {
              id: item.id,
              title: item.title,
              content: `（ファイルの読み込みに失敗しました: ${item.file}）`,
            };
          }

          return {
            id: item.id,
            title: item.title,
            content: trimmed,
          };
        } catch (err) {
          console.warn(`Failed to fetch file ${item.file}`, err);
          return {
            id: item.id,
            title: item.title,
            content: `（ファイルの読み込みに失敗しました: ${item.file}）`,
          };
        }
      })
    );

    return tasks;
  } catch (error) {
    console.warn("Could not fetch dynamic text samples", error);
    return [];
  }
}

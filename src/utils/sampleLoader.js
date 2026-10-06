/**
 * public/text-samples/ からサンプル一覧とテキストコンテンツを動的に読み込む
 */

export async function fetchSampleTasks() {
  try {
    const manifestRes = await fetch('/text-samples/index.json');
    if (!manifestRes.ok) {
      throw new Error(`Failed to load index.json: ${manifestRes.status}`);
    }
    const manifestList = await manifestRes.json();

    const tasks = await Promise.all(
      manifestList.map(async (item) => {
        try {
          // キャッシュバスティング用クエリ追加
          const fileRes = await fetch(item.file);
          if (!fileRes.ok) throw new Error(`HTTP error ${fileRes.status}`);
          
          let text = await fileRes.text();
          
          // UTF-8 BOM の除去
          if (text.charCodeAt(0) === 0xFEFF) {
            text = text.slice(1);
          }
          
          // SPA フォールバック (HTML応答) が返ってきた場合のガード
          const trimmed = text.trim();
          if (trimmed.startsWith('<!') || trimmed.startsWith('<html')) {
            console.warn(`File ${item.file} returned HTML fallback instead of text file.`);
            return {
              id: item.id,
              title: item.title,
              content: `（ファイルの読み込みに失敗しました: ${item.file}）`
            };
          }

          return {
            id: item.id,
            title: item.title,
            content: trimmed
          };
        } catch (err) {
          console.warn(`Failed to fetch file ${item.file}`, err);
          return {
            id: item.id,
            title: item.title,
            content: `（ファイルの読み込みに失敗しました: ${item.file}）`
          };
        }
      })
    );

    return tasks;
  } catch (error) {
    console.warn('Could not fetch dynamic text samples', error);
    return [];
  }
}

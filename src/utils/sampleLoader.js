/**
 * public/text-samples/ からサンプル一覧とテキストコンテンツを動的に読み込む
 */

const FALLBACK_TASKS = [
  {
    id: '01_business_mail',
    title: '【社内メール】日程調整のお願い',
    content: `件名：来週のプロジェクト会議の日程調整について

営業部の皆様

お疲れ様です。総務部の山田です。
来週のプロジェクト進捗会議の日程について調整させていただけますでしょうか。

候補日時：
1. 10月12日（月） 14:00〜15:00
2. 10月13日（火） 10:00〜11:00

ご都合の悪い時間帯がございましたら、明日17時までにご連絡ください。
よろしくお願いいたします。`
  },
  {
    id: '02_daily_report',
    title: '【業務報告】日次作業報告書',
    content: `本日業務報告

日付：2026年10月5日
担当者：鈴木 一郎

1. 本日の業務内容
・顧客データ入力作業（200件完了）
・提出書類の印刷およびファイル整理
・館内清掃および備品チェック

2. 所感・申し送り事項
データ入力作業は目標件数を達成することができました。
明日は午前中に書類チェックを行い、午後から新規案件のデータ登録を進めます。`
  }
];

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
          const fileRes = await fetch(item.file);
          if (!fileRes.ok) throw new Error(`HTTP error ${fileRes.status}`);
          const text = await fileRes.text();
          return {
            id: item.id,
            title: item.title,
            content: text.trim()
          };
        } catch (err) {
          console.warn(`Failed to fetch file ${item.file}, using empty content`, err);
          return {
            id: item.id,
            title: item.title,
            content: ''
          };
        }
      })
    );

    return tasks.length > 0 ? tasks : FALLBACK_TASKS;
  } catch (error) {
    console.warn('Could not fetch dynamic text samples, using fallback.', error);
    return FALLBACK_TASKS;
  }
}

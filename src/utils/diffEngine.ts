import { AlignmentItem, DiffResult } from "../types";

/**
 * 文字単位の差分解析 (Levenshtein / Dynamic Programming)
 */
export function computeTextDiff(target: string, typed: string): DiffResult {
  const m = target.length;
  const n = typed.length;

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (target[i - 1] === typed[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] =
          1 +
          Math.min(
            dp[i - 1][j], // 脱字 (Missing)
            dp[i][j - 1], // 余分 (Extra)
            dp[i - 1][j - 1] // 誤字 (Typo)
          );
      }
    }
  }

  let i = m;
  let j = n;
  const alignment: AlignmentItem[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && target[i - 1] === typed[j - 1]) {
      alignment.unshift({ type: "correct", char: target[i - 1], targetIdx: i - 1 });
      i--;
      j--;
    } else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) {
      alignment.unshift({
        type: "typo",
        charTarget: target[i - 1],
        charTyped: typed[j - 1],
        targetIdx: i - 1,
      });
      i--;
      j--;
    } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      alignment.unshift({ type: "missing", char: target[i - 1], targetIdx: i - 1 });
      i--;
    } else if (j > 0 && dp[i][j] === dp[i][j - 1] + 1) {
      alignment.unshift({ type: "extra", char: typed[j - 1], targetIdx: i });
      j--;
    } else {
      if (i > 0) {
        alignment.unshift({ type: "missing", char: target[i - 1], targetIdx: i - 1 });
        i--;
      } else {
        alignment.unshift({ type: "extra", char: typed[j - 1], targetIdx: i });
        j--;
      }
    }
  }

  let correctCount = 0;
  let typoCount = 0;
  let missingCount = 0;
  alignment.forEach((item) => {
    if (item.type === "correct") correctCount++;
    if (item.type === "typo" || item.type === "extra") typoCount++;
    if (item.type === "missing") missingCount++;
  });

  const accuracy =
    target.length > 0
      ? Math.max(0, Math.round((correctCount / target.length) * 100))
      : 0;

  return {
    alignment,
    correctCount,
    typoCount,
    missingCount,
    accuracy,
  };
}

/**
 * 文字単位の差分解析 (Levenshtein / Dynamic Programming)
 */
export function computeTextDiff(target, typed) {
  const m = target.length;
  const n = typed.length;

  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (target[i - 1] === typed[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],    // 脱字 (Missing)
          dp[i][j - 1],    // 余分 (Extra)
          dp[i - 1][j - 1] // 誤字 (Typo)
        );
      }
    }
  }

  let i = m, j = n;
  const alignment = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && target[i - 1] === typed[j - 1]) {
      alignment.unshift({ type: 'correct', char: target[i - 1], targetIdx: i - 1 });
      i--; j--;
    } else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) {
      alignment.unshift({ type: 'typo', charTarget: target[i - 1], charTyped: typed[j - 1], targetIdx: i - 1 });
      i--; j--;
    } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      alignment.unshift({ type: 'missing', char: target[i - 1], targetIdx: i - 1 });
      i--;
    } else if (j > 0 && dp[i][j] === dp[i][j - 1] + 1) {
      alignment.unshift({ type: 'extra', char: typed[j - 1], targetIdx: i });
      j--;
    } else {
      if (i > 0) {
        alignment.unshift({ type: 'missing', char: target[i - 1], targetIdx: i - 1 });
        i--;
      } else {
        alignment.unshift({ type: 'extra', char: typed[j - 1], targetIdx: i });
        j--;
      }
    }
  }

  let correctCount = 0, typoCount = 0, missingCount = 0;
  alignment.forEach(item => {
    if (item.type === 'correct') correctCount++;
    if (item.type === 'typo' || item.type === 'extra') typoCount++;
    if (item.type === 'missing') missingCount++;
  });

  const accuracy = target.length > 0 ? Math.max(0, Math.round((correctCount / target.length) * 100)) : 0;

  return {
    alignment,
    correctCount,
    typoCount,
    missingCount,
    accuracy
  };
}

export function generateInsights(diff, targetText, typedText, cpm, bsRate, backspaceCount) {
  const insights = [];

  // 1. 正確性
  if (diff.accuracy >= 95) {
    insights.push(`極めて高い正確率（${diff.accuracy}%）です。誤字脱字が少なく実務で即戦力となるタイピング精度です。`);
  } else if (diff.accuracy >= 85) {
    insights.push(`実用レベルの正確率（${diff.accuracy}%）です。誤り箇所を見直すことでさらに精度向上が期待できます。`);
  } else {
    insights.push(`正確率は${diff.accuracy}%でした。まずはスピードよりも正確にキーを打つことを意識してみましょう。`);
  }

  // 2. ミス発生位置
  const targetLen = targetText.length;
  let errStart = 0, errMid = 0, errEnd = 0;
  diff.alignment.forEach(item => {
    if (item.type !== 'correct') {
      const idx = item.targetIdx || 0;
      const ratio = targetLen > 0 ? idx / targetLen : 0;
      if (ratio < 0.33) errStart++;
      else if (ratio < 0.66) errMid++;
      else errEnd++;
    }
  });

  const totalErrors = errStart + errMid + errEnd;
  if (totalErrors > 0) {
    if (errStart / totalErrors >= 0.5) {
      insights.push(`【序盤に誤りが集中】誤りの半数以上（${errStart}箇所）が書き出し部分で発生しています。打ち始める前に落ち着いて見本を確認する習慣が効果的です。`);
    } else if (errEnd / totalErrors >= 0.5) {
      insights.push(`【終盤に誤りが集中】作業の後半（${errEnd}箇所）でミスが増えています。長文入力時の集中力の維持や、こまめな画面確認がポイントです。`);
    } else {
      insights.push(`文章全体を通してバランスよく入力できています。特定のパートでの大きな崩れは見られません。`);
    }
  }

  // 3. Backspace修正
  if (backspaceCount > 0) {
    if (bsRate > 15) {
      insights.push(`【打鍵修正の頻度が高め】100文字あたり${bsRate}回のBackspaceが押されています。入力時の迷いや打ち直しが多いため、ホームポジションを再確認すると速度向上に繋がります。`);
    } else {
      insights.push(`【適度な自己修正能力】Backspaceによる修正（${backspaceCount}回）を行いながら着実に正確な文章を入力できています。`);
    }
  }

  // 4. 入力速度
  if (cpm >= 120) {
    insights.push(`入力速度は【${cpm}文字/分】と良好です（一般事務目安の100文字/分をクリアしています）。`);
  } else {
    insights.push(`現在の入力速度は【${cpm}文字/分】です。正確性を保ったまま焦らず練習を継続しましょう。`);
  }

  return { insights, errStart, errMid, errEnd };
}

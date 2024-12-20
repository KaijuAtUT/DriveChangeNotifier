function notifyRecentFiles() {
  const webhookUrl = ""; // Slack Webhook URL を入力
  const now = new Date(); // 日時の取得
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 時間前

  const folderId = ""; // 指定したいフォルダの ID を入力
  const rootFolder = DriveApp.getFolderById(folderId); // 指定フォルダを取得

  const updatedFiles = [];
  const createdFiles = [];

  // 再帰的にフォルダを走査
  function scanFolder(folder) {
    // ファイルをチェック
    const files = folder.getFiles();
    while (files.hasNext()) {
      const file = files.next();
      const lastUpdated = file.getLastUpdated();
      const createdDate = file.getDateCreated();

      if (lastUpdated > oneDayAgo) {
        updatedFiles.push({
          name: file.getName(),
          url: file.getUrl(),
          lastUpdated: lastUpdated.toLocaleDateString("ja-JP", {year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit"}),
        });
      }

      if (createdDate > oneDayAgo) {
        createdFiles.push({
          name: file.getName(),
          url: file.getUrl(),
          createdDate: createdDate.toLocaleDateString("ja-JP", {year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit"}),
        });
      }
    }

    // 子フォルダをチェック
    const subFolders = folder.getFolders();
    while (subFolders.hasNext()) {
      scanFolder(subFolders.next());
    }
  }

  // 指定フォルダからスキャン開始
  scanFolder(rootFolder);

  // Slack に通知
  const payload = {
    text: "最近更新されたファイル・新規ファイルの一覧",
    attachments: [],
  };

  if (updatedFiles.length > 0) {
    payload.attachments.push({
      title: "最近更新されたファイル",
      text: updatedFiles
        .map(file => `<${file.url}|${file.name}> (最終更新: ${file.lastUpdated})`)
        .join("\n"),
      color: "#36a64f",
    });
  }

  if (createdFiles.length > 0) {
    payload.attachments.push({
      title: "最近作成されたファイル",
      text: createdFiles
        .map(file => `<${file.url}|${file.name}> (作成日: ${file.createdDate})`)
        .join("\n"),
      color: "#3b83f6",
    });
  }

  if (payload.attachments.length > 0) {
    UrlFetchApp.fetch(webhookUrl, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
    });
  } else {
    Logger.log("更新されたファイルや新規ファイルはありませんでした。");
  }
}

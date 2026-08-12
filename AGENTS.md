# AGENTS.md

本文件適用於整個倉庫，供 AI 在修改、提交與推送時遵循。文章語法與網站操作細節請參閱 `user.md`。

## 1. 語言與檔案規範

- 與使用者對話、撰寫文件、程式註解、操作說明、錯誤訊息及測試描述時，一律使用繁體中文。
- 程式識別符沿用專案既有英文命名方式。
- Git 提交訊息必須使用英文。
- 所有文字檔案必須使用 UTF-8 無 BOM。
- 註解只說明意圖、限制或非直觀設計，不得重述程式碼或記錄修改歷史。

## 2. 修改前的必要檢查

執行任何提交前，必須先確認工作區與差異：

```powershell
git status --short --branch
git diff -- <target>
git diff --cached -- <target>
```

- 工作區可能包含使用者尚未完成的文章或設定，不得擅自修改、還原、暫存或提交。
- 不得使用 `git reset --hard`、`git checkout --` 或其他會丟失使用者變更的命令。
- 工作區混有不同任務時，不得使用 `git add -A` 或 `git add .`；必須明確列出要暫存的檔案。
- 顯示為已修改但 `git diff` 為空、工作檔雜湊與索引相同的檔案，不得提交。
- `.obsidian/plugins/`、工作區狀態與快取屬於本機資料，不得提交。

## 3. 文章提交原則

文章位於 `src/content/posts/`。文章頁會使用該 Markdown 檔案的 `git log --follow` 產生修訂歷史，因此提交邊界與提交訊息會直接顯示給讀者。

### 3.1 一篇文章一個提交

- 新文章應以文章目錄為單位提交，包含 `index.md` 與該文章實際使用的圖片等資產。
- 同時修改多篇文章時，每篇文章必須分開提交。
- 文章內容、網站程式碼、全域設定與 Obsidian 設定不得混在同一提交。
- 只暫存使用者明確要求提交的文章；其他文章即使已修改，也必須保留在工作區。
- 實質內容更新應同步檢查 frontmatter 的 `updated` 日期是否需要更新；純排版或錯字修正通常不必改動日期。

### 3.2 新提交訊息標準

所有新提交必須使用下列標準前綴，不得再使用 `posts:` 或沒有前綴的 `Add`、`Remove`、`Refine` 等舊格式。

| 類型 | 用途 | 格式 |
| --- | --- | --- |
| `content:` | 發布文章、增加段落、刪除內容、調整結構、更新 Metadata 或參考資料 | `content: <specific change>` |
| `fix:` | 修正錯字、錯誤事實、計算、失效連結或會誤導讀者的內容 | `fix: <specific correction>` |
| `feat:` | 新增網站或文章頁功能，不用於一般文章內容更新 | `feat: <new capability>` |
| `chore:` | 純維護且不應出現在文章歷史中的變更 | `chore: <maintenance task>` |

推薦範例：

```text
content: publish China Post parcel saving guide
content: add postage regulation references
content: remove redundant references heading
content: refine parcel guide metadata
fix: correct parcel postage calculation
fix: replace outdated carrier link
feat: add article revision history panel
```

禁止使用：

```text
Update article
Misc changes
posts: update "Title"
Remove heading
fix stuff
```

提交訊息必須：

- 精確描述本次對讀者可見的變更，不得只寫籠統的 `update` 或 `changes`。
- 保持單行、簡潔且可獨立理解。
- 使用英文祈使語意，通常以小寫動詞接在類型前綴後。
- 與實際差異一致，不得直接複製可能為中文或過時內容的 frontmatter `description`。

### 3.3 既有歷史相容性

文章歷史分類器仍相容下列舊訊息，但這些格式只用於讀取歷史，不得用於新提交：

- `post:`、`posts:`、`article:`、`update:`
- `Fix ...`
- 以 `Add`、`Remove`、`Refine`、`Clarify`、`Expand`、`Polish`、`Refresh`、`Update`、`Publish` 開頭的訊息

`style:`、`ci:`、`build:`、`test:`、`lint`、`format` 與符合規則的 `chore:` 不會出現在文章歷史中。不得為了隱藏實質文章更新而使用這些類型。

## 4. 文章提交工作流程

### 4.1 提交前

1. 讀取完整文章差異，確認沒有夾帶其他文章或本機設定。
2. 檢查 frontmatter；空字串必須明確寫成 `""`，不得留下會解析為 `null` 的空值。
3. 確認腳註、圖片路徑、標題層級與文章頁顯示正常。
4. 執行：

```powershell
pnpm check
git diff --check -- <article-path>
```

5. 根據實際差異自行撰寫英文提交訊息，不得只依檔名猜測。

### 4.2 暫存與複核

只暫存目標文章及其必要資產：

```powershell
git add -- <article-path> <required-assets>
git diff --cached --name-status
git diff --cached --check
git diff --cached -- <article-path>
```

提交前必須確認暫存區沒有其他文章、程式碼、`.obsidian` 資料或使用者未授權的檔案。

### 4.3 簽名提交

所有提交必須簽名：

```powershell
git commit -S -m "content: describe the specific article change"
```

- 不得在簽名失敗後改成未簽名提交。
- 若 1Password／SSH 簽章代理要求確認，應等待使用者完成授權後重試。
- 提交完成後確認提交包含簽章，且檔案範圍正確。

### 4.4 推送

推送前再次確認目前分支、最新提交與剩餘未提交內容。使用本機 HTTP 代理：

```powershell
$env:http_proxy = "http://127.0.0.1:7890"
$env:https_proxy = "http://127.0.0.1:7890"
git push origin <branch>
```

- 只有使用者明確要求提交或推送時才可執行。
- 不得擅自強制推送；`--force` 或 `--force-with-lease` 必須另行取得明確授權。
- 推送成功後回報分支、提交雜湊、提交訊息、驗證結果及仍留在工作區的檔案。

## 5. 程式碼與設定提交

- 程式碼或設定變更不得使用 `content:`，應依實際性質使用 `feat:`、`fix:`、`refactor:`、`docs:` 或 `chore:`。
- 修改文章歷史分類器或自動提交腳本時，必須同步更新 `user.md` 與本文件中的提交規則。
- JavaScript、TypeScript、Astro 或 Svelte 變更至少執行相關 Biome 檢查與 `pnpm check`。
- 文件變更必須執行 `git diff --check`，並確認 UTF-8 無 BOM。
- 不得為了讓檢查通過而修改與任務無關的文章內容。
